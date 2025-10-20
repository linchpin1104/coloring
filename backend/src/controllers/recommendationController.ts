import { Request, Response, NextFunction } from 'express';
import { query, body } from 'express-validator';
import { recommendationService, RecommendationRequest } from '@/services/recommendationService';
import { ApiError, ErrorCodes, sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/utils/logger';
import { validateRequest, commonValidations } from '@/utils/validation';

export class RecommendationController {
  // 추천 도안 조회
  getRecommendations = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user || {};
      const {
        ageGroup,
        limit = 20,
        excludeDownloaded = false,
        preferences,
      } = req.query;

      const request: RecommendationRequest = {
        userId: uid,
        ageGroup: ageGroup as 'child' | 'teen' | 'adult',
        limit: parseInt(limit as string),
        excludeDownloaded: excludeDownloaded === 'true',
        preferences: preferences ? JSON.parse(preferences as string) : undefined,
      };

      const result = await recommendationService.getRecommendations(request);

      logger.info(`Generated ${result.coloringPages.length} recommendations using ${result.algorithm} algorithm`);
      sendSuccess(res, {
        recommendations: result.coloringPages,
        algorithm: result.algorithm,
        confidence: result.confidence,
        metadata: result.metadata,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get recommendations:', error);
        sendError(res, new ApiError(
          'Failed to get recommendations',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 연령대별 추천 도안
  getAgeBasedRecommendations = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { ageGroup } = req.params;
      const { limit = 20 } = req.query;

      if (!['child', 'teen', 'adult'].includes(ageGroup)) {
        throw new ApiError(
          'Invalid age group',
          400,
          ErrorCodes.INVALID_AGE_GROUP,
        );
      }

      const request: RecommendationRequest = {
        ageGroup: ageGroup as 'child' | 'teen' | 'adult',
        limit: parseInt(limit as string),
      };

      const result = await recommendationService.getRecommendations(request);

      logger.info(`Generated ${result.coloringPages.length} age-based recommendations for ${ageGroup}`);
      sendSuccess(res, {
        recommendations: result.coloringPages,
        ageGroup,
        algorithm: result.algorithm,
        confidence: result.confidence,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get age-based recommendations:', error);
        sendError(res, new ApiError(
          'Failed to get age-based recommendations',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 사용자 맞춤 추천
  getPersonalizedRecommendations = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
      }
      const {
        limit = 20,
        excludeDownloaded = true,
        preferences,
      } = req.query;

      const request: RecommendationRequest = {
        userId: uid,
        limit: parseInt(limit as string),
        excludeDownloaded: excludeDownloaded === 'true',
        preferences: preferences ? JSON.parse(preferences as string) : undefined,
      };

      const result = await recommendationService.getRecommendations(request);

      logger.info(`Generated ${result.coloringPages.length} personalized recommendations for user ${uid}`);
      sendSuccess(res, {
        recommendations: result.coloringPages,
        algorithm: result.algorithm,
        confidence: result.confidence,
        metadata: result.metadata,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get personalized recommendations:', error);
        sendError(res, new ApiError(
          'Failed to get personalized recommendations',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 추천 알고리즘 성능 분석
  getRecommendationAnalytics = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
      }
      const { days = 30 } = req.query;

      // 사용자의 다운로드 이력 분석
      const analytics = await this.analyzeUserRecommendations(uid, parseInt(days as string));

      logger.info(`Generated recommendation analytics for user ${uid}`);
      sendSuccess(res, { analytics });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get recommendation analytics:', error);
        sendError(res, new ApiError(
          'Failed to get recommendation analytics',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 추천 피드백 수집
  submitRecommendationFeedback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
      }
      const { pageId, feedback, rating } = req.body;

      if (!pageId || !feedback) {
        throw new ApiError(
          'Page ID and feedback are required',
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // 피드백 저장
      await this.saveRecommendationFeedback(uid, pageId, feedback, rating);

      logger.info(`Saved recommendation feedback for user ${uid}, page ${pageId}`);
      sendSuccess(res, { message: 'Feedback submitted successfully' });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to submit recommendation feedback:', error);
        sendError(res, new ApiError(
          'Failed to submit recommendation feedback',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 사용자 추천 분석
  private async analyzeUserRecommendations(userId: string, days: number): Promise<{
    downloadHistory: Array<{ pageId: string; downloadedAt: Date; character: string; difficulty: string; ageGroup: string }>;
    preferences: { characters: string[]; difficulties: string[]; ageGroups: string[] };
    patterns: { timeOfDay: string; dayOfWeek: string; frequency: number };
  }> {
    try {
      const { db } = await import('@/config/firebase');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 사용자의 다운로드 이력 조회
      const downloads = await db.collection('transactions')
        .where('uid', '==', userId)
        .where('type', '==', 'download')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const downloadCount = downloads.size;
      const downloadedPageIds = downloads.docs.map(doc => doc.data().pageId);

      // 다운로드한 도안의 상세 정보 조회
      const pages = await Promise.all(
        downloadedPageIds.map(async (pageId) => {
          const doc = await db.collection('coloringPages').doc(pageId).get();
          return doc.exists ? { id: doc.id, ...doc.data() } : null;
        }),
      );

      const validPages = pages.filter(Boolean);

      // 통계 계산
      const ageGroupStats = this.calculateAgeGroupStats(validPages);
      const difficultyStats = this.calculateDifficultyStats(validPages);
      const characterStats = this.calculateCharacterStats(validPages);
      const keywordStats = this.calculateKeywordStats(validPages);

      return {
        period: `${days} days`,
        totalDownloads: downloadCount,
        ageGroupDistribution: ageGroupStats,
        difficultyDistribution: difficultyStats,
        topCharacters: characterStats,
        topKeywords: keywordStats,
        averageDownloadsPerDay: downloadCount / days,
      };
    } catch (error) {
      logger.error('Failed to analyze user recommendations:', error);
      throw error;
    }
  }

  // 연령대별 통계 계산
  private calculateAgeGroupStats(pages: Array<{ ageGroup: string; downloads: number }>): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    pages.forEach(page => {
      if (page.ageGroup) {
        stats[page.ageGroup] = (stats[page.ageGroup] || 0) + 1;
      }
    });

    return stats;
  }

  // 난이도별 통계 계산
  private calculateDifficultyStats(pages: Array<{ difficulty: string; downloads: number }>): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    pages.forEach(page => {
      if (page.difficulty) {
        stats[page.difficulty] = (stats[page.difficulty] || 0) + 1;
      }
    });

    return stats;
  }

  // 캐릭터별 통계 계산
  private calculateCharacterStats(pages: Array<{ characterName: string; downloads: number }>): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    pages.forEach(page => {
      if (page.characterName) {
        stats[page.characterName] = (stats[page.characterName] || 0) + 1;
      }
    });

    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  // 키워드별 통계 계산
  private calculateKeywordStats(pages: Array<{ keywords: string[]; downloads: number }>): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    pages.forEach(page => {
      if (page.keywords) {
        page.keywords.forEach((keyword: string) => {
          stats[keyword] = (stats[keyword] || 0) + 1;
        });
      }
    });

    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  // 추천 피드백 저장
  private async saveRecommendationFeedback(
    userId: string,
    pageId: string,
    feedback: string,
    rating?: number,
  ): Promise<void> {
    try {
      const { db } = await import('@/config/firebase');
      
      await db.collection('recommendationFeedback').add({
        userId,
        pageId,
        feedback,
        rating: rating || null,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to save recommendation feedback:', error);
      throw error;
    }
  }
}

export const recommendationController = new RecommendationController();

// 유효성 검사 미들웨어
export const validateRecommendationRequest = validateRequest([
  commonValidations.ageGroup('ageGroup'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('excludeDownloaded')
    .optional()
    .isBoolean()
    .withMessage('excludeDownloaded must be a boolean'),
]);

export const validatePersonalizedRecommendation = validateRequest([
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('excludeDownloaded')
    .optional()
    .isBoolean()
    .withMessage('excludeDownloaded must be a boolean'),
]);

export const validateRecommendationFeedback = validateRequest([
  body('pageId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Page ID is required'),
  body('feedback')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Feedback must be between 1 and 500 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
]);
