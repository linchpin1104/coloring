import { Router } from 'express';
import {
  coloringPageController,
  validateGetColoringPages,
  validateSearchByKeywords,
  validateSearchByCharacterName,
} from '@/controllers/coloringPageController';
import { verifyToken, optionalAuth } from '@/middlewares/auth';
import { defaultRateLimit, downloadRateLimit } from '@/middlewares/rateLimiter';

const router = Router();

// 색칠놀이 도안 관련 라우트
router.get('/', defaultRateLimit, optionalAuth, validateGetColoringPages, coloringPageController.getColoringPages);
router.get('/popular', defaultRateLimit, optionalAuth, coloringPageController.getPopularColoringPages);
router.get('/recent', defaultRateLimit, optionalAuth, coloringPageController.getRecentColoringPages);
router.get('/recommended/:ageGroup', defaultRateLimit, optionalAuth, coloringPageController.getRecommendedColoringPages);
router.get('/search/keywords', defaultRateLimit, optionalAuth, validateSearchByKeywords, coloringPageController.searchByKeywords);
router.get('/search/character', defaultRateLimit, optionalAuth, validateSearchByCharacterName, coloringPageController.searchByCharacterName);
router.get('/:id', defaultRateLimit, optionalAuth, coloringPageController.getColoringPageById);
router.post('/:id/download', downloadRateLimit, verifyToken, coloringPageController.downloadColoringPage);

export default router;
