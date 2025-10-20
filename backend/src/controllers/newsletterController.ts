import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';
import admin from 'firebase-admin';

interface NewsletterSubscription {
  email: string;
  language: string;
  subscribedAt: Date;
  isActive: boolean;
  source: string;
  userAgent?: string;
  ipAddress?: string;
}

// 이메일 구독
export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '이메일 주소가 올바르지 않습니다.',
        errors: errors.array(),
      });
    }

    const { email, language = 'ko', source = 'website' } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    logger.info('뉴스레터 구독 요청:', { email, language, source });

    const db = req.app.locals.db;

    // 중복 구독 확인
    const existingSubscription = await db.collection('newsletter_subscriptions')
      .where('email', '==', email.toLowerCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!existingSubscription.empty) {
      return res.status(409).json({
        success: false,
        message: '이미 구독된 이메일 주소입니다.',
      });
    }

    // 구독 정보 저장
    const subscriptionData: NewsletterSubscription = {
      email: email.toLowerCase(),
      language,
      subscribedAt: new Date(),
      isActive: true,
      source,
      userAgent,
      ipAddress,
    };

    const docRef = await db.collection('newsletter_subscriptions').add(subscriptionData);

    // 구독 통계 업데이트
    await updateSubscriptionStats(language, 'subscribe');

    // 환영 이메일 발송 (실제 환경에서는 이메일 서비스 사용)
    await sendWelcomeEmail(email, language);

    logger.info('뉴스레터 구독 완료:', { email, subscriptionId: docRef.id });

    res.json({
      success: true,
      message: '뉴스레터 구독이 완료되었습니다.',
      subscriptionId: docRef.id,
    });

  } catch (error) {
    logger.error('뉴스레터 구독 실패:', error);
    res.status(500).json({
      success: false,
      message: '구독 처리 중 오류가 발생했습니다.',
    });
  }
};

// 구독 해지
export const unsubscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '이메일 주소가 필요합니다.',
      });
    }

    const db = req.app.locals.db;

    // 구독 정보 찾기
    const subscriptionQuery = db.collection('newsletter_subscriptions')
      .where('email', '==', email.toLowerCase())
      .where('isActive', '==', true);

    const snapshot = await subscriptionQuery.get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: '구독 정보를 찾을 수 없습니다.',
      });
    }

    // 구독 해지 처리
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isActive: false,
        unsubscribedAt: new Date(),
      });
    });

    await batch.commit();

    // 구독 통계 업데이트
    const firstDoc = snapshot.docs[0];
    const subscriptionData = firstDoc.data();
    await updateSubscriptionStats(subscriptionData.language, 'unsubscribe');

    logger.info('뉴스레터 구독 해지 완료:', { email });

    res.json({
      success: true,
      message: '구독이 해지되었습니다.',
    });

  } catch (error) {
    logger.error('뉴스레터 구독 해지 실패:', error);
    res.status(500).json({
      success: false,
      message: '구독 해지 처리 중 오류가 발생했습니다.',
    });
  }
};

// 구독 상태 확인
export const checkSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: '이메일 주소가 필요합니다.',
      });
    }

    const db = req.app.locals.db;

    const snapshot = await db.collection('newsletter_subscriptions')
      .where('email', '==', email.toLowerCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    const isSubscribed = !snapshot.empty;
    const subscriptionData = isSubscribed ? snapshot.docs[0].data() : null;

    res.json({
      success: true,
      isSubscribed,
      subscription: subscriptionData ? {
        email: subscriptionData.email,
        language: subscriptionData.language,
        subscribedAt: subscriptionData.subscribedAt,
        source: subscriptionData.source,
      } : null,
    });

  } catch (error) {
    logger.error('구독 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      message: '구독 상태 확인 중 오류가 발생했습니다.',
    });
  }
};

// 구독자 목록 조회 (관리자용)
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, language, isActive = true } = req.query;

    const db = req.app.locals.db;
    let query = db.collection('newsletter_subscriptions');

    if (language) {
      query = query.where('language', '==', language);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const offset = (Number(page) - 1) * Number(limit);
    const snapshot = await query
      .orderBy('subscribedAt', 'desc')
      .offset(offset)
      .limit(Number(limit))
      .get();

    const subscribers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        language: data.language,
        subscribedAt: data.subscribedAt?.toDate?.() || new Date(),
        isActive: data.isActive,
        source: data.source,
      };
    });

    // 총 구독자 수 조회
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    res.json({
      success: true,
      subscribers,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: offset + subscribers.length < total,
    });

  } catch (error) {
    logger.error('구독자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '구독자 목록을 가져오는 중 오류가 발생했습니다.',
    });
  }
};

// 구독 통계 업데이트
const updateSubscriptionStats = async (language: string, action: 'subscribe' | 'unsubscribe') => {
  try {
    const statsRef = db.collection('newsletter_stats').doc(language);

    const increment = action === 'subscribe' ? 1 : -1;
    
    await statsRef.set({
      language,
      totalSubscribers: admin.firestore.FieldValue.increment(increment),
      lastUpdated: new Date(),
    }, { merge: true });

  } catch (error) {
    logger.error('구독 통계 업데이트 실패:', error);
  }
};

// 환영 이메일 발송 (모의 구현)
const sendWelcomeEmail = async (email: string, language: string) => {
  try {
    // 실제 환경에서는 SendGrid, AWS SES 등을 사용
    logger.info('환영 이메일 발송:', { email, language });
    
    // 이메일 발송 로그 저장
    await db.collection('email_logs').add({
      email,
      type: 'welcome',
      language,
      sentAt: new Date(),
      status: 'sent',
    });

  } catch (error) {
    logger.error('환영 이메일 발송 실패:', error);
  }
};

// 유효성 검사 규칙
export const subscribeValidation = [
  body('email').isEmail().withMessage('올바른 이메일 주소를 입력해주세요.'),
  body('language').optional().isString().withMessage('언어 코드는 문자열이어야 합니다.'),
  body('source').optional().isString().withMessage('소스는 문자열이어야 합니다.'),
];

export const unsubscribeValidation = [
  body('email').isEmail().withMessage('올바른 이메일 주소를 입력해주세요.'),
  body('token').optional().isString().withMessage('토큰은 문자열이어야 합니다.'),
];

