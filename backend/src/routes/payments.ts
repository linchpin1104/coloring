import { Router, Request, Response, NextFunction } from 'express';
import { createPaymentIntent, confirmPaymentIntent, verifyStripeWebhook } from '@/config/stripe';
import { userService } from '@/services/userService';
import { ApiError, ErrorCodes, sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/utils/logger';
import { verifyToken } from '@/middlewares/auth';
import { paymentRateLimit } from '@/middlewares/rateLimiter';

const router = Router();

// 결제 의도 생성
router.post('/create-intent', paymentRateLimit, verifyToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const { uid } = req.user!;

    if (!amount || amount < 50) { // 최소 50센트 (0.5달러)
      throw new ApiError(
        'Minimum amount is 50 cents',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // 포인트로 변환 (1달러 = 100포인트)
    const points = Math.floor(amount / 100);

    const paymentIntent = await createPaymentIntent(amount, currency, {
      userId: uid,
      points: points.toString(),
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for user ${uid}`);
    sendSuccess(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      points,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error);
    } else {
      logger.error('Failed to create payment intent:', error);
      sendError(res, new ApiError(
        'Failed to create payment intent',
        500,
        ErrorCodes.PAYMENT_FAILED,
      ));
    }
  }
});

// 결제 확인
router.post('/confirm', paymentRateLimit, verifyToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { paymentIntentId } = req.body;
    const { uid } = req.user!;

    if (!paymentIntentId) {
      throw new ApiError(
        'Payment intent ID is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const paymentIntent = await confirmPaymentIntent(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new ApiError(
        'Payment not succeeded',
        400,
        ErrorCodes.PAYMENT_FAILED,
      );
    }

    // 포인트 추가
    const points = parseInt(paymentIntent.metadata.points || '0');
    if (points > 0) {
      await userService.addPoints(uid, points);
    }

    logger.info(`Payment confirmed: ${paymentIntentId} for user ${uid}, points added: ${points}`);
    sendSuccess(res, {
      paymentIntent,
      pointsAdded: points,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error);
    } else {
      logger.error('Failed to confirm payment:', error);
      sendError(res, new ApiError(
        'Failed to confirm payment',
        500,
        ErrorCodes.PAYMENT_FAILED,
      ));
    }
  }
});

// Stripe 웹훅
router.post('/webhook', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);

    const event = verifyStripeWebhook(payload, signature);

    logger.info(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as any;
      const { userId } = paymentIntent.metadata;
      const points = parseInt(paymentIntent.metadata.points || '0');

      if (userId && points > 0) {
        await userService.addPoints(userId, points);
        logger.info(`Points added via webhook: ${userId} +${points} points`);
      }
      break;
    }

    case 'payment_intent.payment_failed':
      logger.warn(`Payment failed: ${event.data.object.id}`);
      break;

    default:
      logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).send('Webhook signature verification failed');
  }
});

// 사용자 포인트 조회
router.get('/points', verifyToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { uid } = req.user!;

    const user = await userService.getUserById(uid);
    if (!user) {
      throw new ApiError(
        'User not found',
        404,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    sendSuccess(res, {
      points: user.points,
      dailyFreeCount: user.dailyFreeCount,
      lastFreeDate: user.lastFreeDate,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error);
    } else {
      logger.error('Failed to get points:', error);
      sendError(res, new ApiError(
        'Failed to get points',
        500,
        ErrorCodes.INTERNAL_ERROR,
      ));
    }
  }
});

// 결제 이력 조회
router.get('/history', verifyToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid: _uid } = req.user!;
    const { page = 1, limit = 20 } = req.query;

    // TODO: 결제 이력 조회 로직 구현
    // transactions 컬렉션에서 사용자의 결제 이력 조회

    sendSuccess(res, {
      transactions: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error);
    } else {
      logger.error('Failed to get payment history:', error);
      sendError(res, new ApiError(
        'Failed to get payment history',
        500,
        ErrorCodes.INTERNAL_ERROR,
      ));
    }
  }
});

export default router;
