import express from 'express';
import { 
  searchMultilingual, 
  getSuggestions, 
  getPopularSearches,
  searchValidation,
  suggestionsValidation 
} from '../controllers/multilingualSearchController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = express.Router();

// 다국어 검색
router.post('/search/multilingual', searchValidation, asyncHandler(searchMultilingual));

// 자동완성 제안
router.get('/search/suggestions', suggestionsValidation, asyncHandler(getSuggestions));

// 인기 검색어
router.get('/search/popular', asyncHandler(getPopularSearches));

export default router;

