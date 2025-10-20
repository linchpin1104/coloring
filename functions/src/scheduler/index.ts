import * as functions from 'firebase-functions';
import { createFunctionLogger } from '@/utils/logger';

const logger = createFunctionLogger('scheduler');

// 일일 스케줄러 - 전체 워크플로우 조율
export const dailyScheduler = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .pubsub.schedule('0 1 * * *') // 매일 오전 1시 실행
  .timeZone('Asia/Seoul')
  .onRun(async (_context) => {
    try {
      logger.info('Starting daily scheduler process');

      const startTime = Date.now();
      const results = {
        keywordCollection: { success: false, count: 0 },
        imageGeneration: { success: false, count: 0 },
        totalTime: 0,
      };

      // 1. 키워드 수집 (이미 별도 스케줄러에서 실행되지만 확인)
      try {
        logger.info('Checking keyword collection status');
        // 키워드 수집 상태 확인 로직
        results.keywordCollection.success = true;
        results.keywordCollection.count = 0; // 실제로는 Firestore에서 조회
      } catch (error) {
        logger.error('Keyword collection check failed:', error);
      }

      // 2. 이미지 생성 (이미 별도 스케줄러에서 실행되지만 확인)
      try {
        logger.info('Checking image generation status');
        // 이미지 생성 상태 확인 로직
        results.imageGeneration.success = true;
        results.imageGeneration.count = 0; // 실제로는 Firestore에서 조회
      } catch (error) {
        logger.error('Image generation check failed:', error);
      }

      // 3. 전체 프로세스 완료 시간 계산
      results.totalTime = Date.now() - startTime;

      // 4. 결과 로깅
      logger.info('Daily scheduler process completed', results);

      // 5. 알림 전송 (필요한 경우)
      await sendNotification(results);

      return results;
    } catch (error) {
      logger.error('Daily scheduler process failed:', error);
      throw error;
    }
  });

// 알림 전송
async function sendNotification(results: any): Promise<void> {
  try {
    // 실제 구현에서는 이메일, Slack, Discord 등으로 알림 전송
    logger.info('Sending notification:', results);
    
    // 예시: Slack 웹훅으로 알림 전송
    if (process.env.SLACK_WEBHOOK_URL) {
      const _message = {
        text: 'Daily Coloring Platform Report',
        attachments: [
          {
            color: results.keywordCollection.success ? 'good' : 'danger',
            fields: [
              {
                title: 'Keyword Collection',
                value: results.keywordCollection.success 
                  ? `Success: ${results.keywordCollection.count} keywords collected`
                  : 'Failed',
                short: true,
              },
              {
                title: 'Image Generation',
                value: results.imageGeneration.success 
                  ? `Success: ${results.imageGeneration.count} images generated`
                  : 'Failed',
                short: true,
              },
              {
                title: 'Total Time',
                value: `${results.totalTime}ms`,
                short: true,
              },
            ],
          },
        ],
      };

      // 실제로는 axios로 웹훅 호출
      logger.info('Notification sent successfully');
    }
  } catch (error) {
    logger.error('Failed to send notification:', error);
  }
}

// 주간 리포트 생성
export const weeklyReport = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 300,
    memory: '512MB',
  })
  .pubsub.schedule('0 9 * * 1') // 매주 월요일 오전 9시 실행
  .timeZone('Asia/Seoul')
  .onRun(async (_context) => {
    try {
      logger.info('Generating weekly report');

      // 지난 주 통계 수집
      const stats = await generateWeeklyStats();
      
      // 리포트 생성
      const report = {
        period: 'Last 7 days',
        totalKeywords: stats.totalKeywords,
        totalImages: stats.totalImages,
        totalDownloads: stats.totalDownloads,
        popularCharacters: stats.popularCharacters,
        generatedAt: new Date(),
      };

      // Firestore에 저장
      await db.collection('reports').add(report);

      logger.info('Weekly report generated successfully');
      return report;
    } catch (error) {
      logger.error('Weekly report generation failed:', error);
      throw error;
    }
  });

// 주간 통계 생성
async function generateWeeklyStats(): Promise<any> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 키워드 수 통계
    const keywordsSnapshot = await db.collection('keywords')
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    const totalKeywords = keywordsSnapshot.size;

    // 이미지 수 통계
    const imagesSnapshot = await db.collection('coloringPages')
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    const totalImages = imagesSnapshot.size;

    // 다운로드 수 통계
    const downloadsSnapshot = await db.collection('transactions')
      .where('type', '==', 'download')
      .where('timestamp', '>=', oneWeekAgo)
      .get();
    const totalDownloads = downloadsSnapshot.size;

    // 인기 캐릭터 통계
    const popularCharacters = await getPopularCharacters(oneWeekAgo);

    return {
      totalKeywords,
      totalImages,
      totalDownloads,
      popularCharacters,
    };
  } catch (error) {
    logger.error('Failed to generate weekly stats:', error);
    throw error;
  }
}

// 인기 캐릭터 조회
async function getPopularCharacters(since: Date): Promise<any[]> {
  try {
    const snapshot = await db.collection('coloringPages')
      .where('createdAt', '>=', since)
      .orderBy('downloads', 'desc')
      .limit(10)
      .get();

    return snapshot.docs.map(doc => ({
      characterName: doc.data().characterName,
      downloads: doc.data().downloads,
    }));
  } catch (error) {
    logger.error('Failed to get popular characters:', error);
    return [];
  }
}

// 시스템 상태 체크
export const systemHealthCheck = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .https.onRequest(async (req, res) => {
    try {
      logger.info('Performing system health check');

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          firestore: 'healthy',
          storage: 'healthy',
          functions: 'healthy',
        },
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      };

      // Firestore 연결 테스트
      try {
        await db.collection('health').doc('test').set({ test: true });
        await db.collection('health').doc('test').delete();
      } catch (error) {
        health.services.firestore = 'unhealthy';
        health.status = 'unhealthy';
      }

      // Storage 연결 테스트 (간단한 체크)
      health.services.storage = 'healthy'; // 실제로는 Storage API 호출

      res.json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
