import { Router } from 'express';
import {
  searchController,
  validateSearchRequest,
  validateAutocompleteRequest,
  validateSearchHistoryRequest,
} from '@/controllers/searchController';
import { verifyToken, optionalAuth } from '@/middlewares/auth';
import { defaultRateLimit } from '@/middlewares/rateLimiter';

const router = Router();

// 검색 관련 라우트
router.get('/', defaultRateLimit, optionalAuth, validateSearchRequest, searchController.search);
router.get('/advanced', defaultRateLimit, optionalAuth, validateSearchRequest, searchController.advancedSearch);
router.get('/autocomplete', defaultRateLimit, optionalAuth, validateAutocompleteRequest, searchController.autocomplete);
router.get('/stats', defaultRateLimit, verifyToken, searchController.getSearchStats);
router.get('/popular', defaultRateLimit, optionalAuth, searchController.getPopularSearches);
router.post('/history', defaultRateLimit, verifyToken, validateSearchHistoryRequest, searchController.saveSearchHistory);

export default router;
