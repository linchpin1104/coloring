import { Router } from 'express';
import {
  recommendationController,
  validateRecommendationRequest,
  validatePersonalizedRecommendation,
  validateRecommendationFeedback,
} from '@/controllers/recommendationController';
import { verifyToken, optionalAuth } from '@/middlewares/auth';
import { defaultRateLimit } from '@/middlewares/rateLimiter';

const router = Router();

// 추천 관련 라우트
router.get('/', defaultRateLimit, optionalAuth, validateRecommendationRequest, recommendationController.getRecommendations);
router.get('/age/:ageGroup', defaultRateLimit, optionalAuth, recommendationController.getAgeBasedRecommendations);
router.get('/personalized', defaultRateLimit, verifyToken, validatePersonalizedRecommendation, recommendationController.getPersonalizedRecommendations);
router.get('/analytics', defaultRateLimit, verifyToken, recommendationController.getRecommendationAnalytics);
router.post('/feedback', defaultRateLimit, verifyToken, validateRecommendationFeedback, recommendationController.submitRecommendationFeedback);

export default router;
