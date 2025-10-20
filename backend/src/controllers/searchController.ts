import { Request, Response, NextFunction } from 'express';
import { query, body } from 'express-validator';
import { searchService, SearchRequest } from '@/services/searchService';
import { ApiError, ErrorCodes, sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/utils/logger';
import { validateRequest, commonValidations } from '@/utils/validation';

export class SearchController {
  // 기본 검색
  search = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const {
        q: query,
        ageGroup,
        difficulty,
        characterName,
        keywords,
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          'Search query is required',
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      const searchRequest: SearchRequest = {
        query,
        filters: {
          ageGroup: ageGroup as 'child' | 'teen' | 'adult',
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          characterName: characterName as string,
          keywords: keywords ? (keywords as string).split(',') : undefined,
        },
        sortBy: sortBy as 'relevance' | 'popularity' | 'newest' | 'oldest',
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await searchService.search(searchRequest);

      logger.info(`Search completed: "${query}" - ${result.results.length} results`);
      sendSuccess(res, {
        results: result.results,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        suggestions: result.suggestions,
        filters: result.filters,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Search failed:', error);
        sendError(res, new ApiError(
          'Search failed',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 고급 검색
  advancedSearch = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const {
        q: query,
        ageGroup,
        difficulty,
        characterName,
        keywords,
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          'Search query is required',
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      const searchRequest: SearchRequest = {
        query,
        filters: {
          ageGroup: ageGroup as 'child' | 'teen' | 'adult',
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          characterName: characterName as string,
          keywords: keywords ? (keywords as string).split(',') : undefined,
        },
        sortBy: sortBy as 'relevance' | 'popularity' | 'newest' | 'oldest',
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await searchService.advancedSearch(searchRequest);

      logger.info(`Advanced search completed: "${query}" - ${result.results.length} results`);
      sendSuccess(res, {
        results: result.results,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Advanced search failed:', error);
        sendError(res, new ApiError(
          'Advanced search failed',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 자동완성 검색
  autocomplete = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          'Search query is required',
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      if (query.length < 2) {
        sendSuccess(res, { suggestions: [] });
        return;
      }

      const suggestions = await searchService.autocomplete(
        query,
        parseInt(limit as string),
      );

      logger.info(`Autocomplete completed: "${query}" - ${suggestions.length} suggestions`);
      sendSuccess(res, { suggestions });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Autocomplete failed:', error);
        sendError(res, new ApiError(
          'Autocomplete failed',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 검색 통계 조회
  getSearchStats = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { days = 7 } = req.query;

      const stats = await this.getSearchAnalytics(parseInt(days as string));

      logger.info(`Retrieved search stats for last ${days} days`);
      sendSuccess(res, { stats });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get search stats:', error);
        sendError(res, new ApiError(
          'Failed to get search stats',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 인기 검색어 조회
  getPopularSearches = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { limit = 20, days = 7 } = req.query;

      const popularSearches = await this.getPopularSearchTerms(
        parseInt(limit as string),
        parseInt(days as string),
      );

      logger.info(`Retrieved ${popularSearches.length} popular search terms`);
      sendSuccess(res, { popularSearches });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to get popular searches:', error);
        sendError(res, new ApiError(
          'Failed to get popular searches',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 검색 이력 저장
  saveSearchHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
      }
      const { query, filters, resultsCount } = req.body;

      if (!query || typeof query !== 'string') {
        throw new ApiError(
          'Search query is required',
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      await this.saveSearchToHistory(uid, query, filters, resultsCount);

      logger.info(`Saved search history for user ${uid}: "${query}"`);
      sendSuccess(res, { message: 'Search history saved successfully' });
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error);
      } else {
        logger.error('Failed to save search history:', error);
        sendError(res, new ApiError(
          'Failed to save search history',
          500,
          ErrorCodes.INTERNAL_ERROR,
        ));
      }
    }
  };

  // 검색 분석 데이터 조회
  private async getSearchAnalytics(days: number): Promise<{
    totalSearches: number;
    uniqueUsers: number;
    popularQueries: Array<{ query: string; count: number }>;
    searchTrends: Array<{ date: string; searches: number }>;
    topResults: Array<{ pageId: string; clicks: number; title: string }>;
  }> {
    try {
      const { db } = await import('@/config/firebase');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 검색 이력 조회
      const searchHistory = await db.collection('searchHistory')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const searches = searchHistory.docs.map(doc => doc.data());
      const totalSearches = searches.length;
      const uniqueQueries = new Set(searches.map(s => s.query)).size;
      const averageResultsPerSearch = searches.reduce((sum, s) => sum + (s.resultsCount || 0), 0) / totalSearches;

      // 인기 검색어
      const queryCounts: { [key: string]: number } = {};
      searches.forEach(search => {
        queryCounts[search.query] = (queryCounts[search.query] || 0) + 1;
      });

      const popularQueries = Object.entries(queryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      // 필터 사용 통계
      const filterStats = this.calculateFilterStats(searches);

      return {
        period: `${days} days`,
        totalSearches,
        uniqueQueries,
        averageResultsPerSearch: Math.round(averageResultsPerSearch),
        popularQueries,
        filterStats,
      };
    } catch (error) {
      logger.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  // 인기 검색어 조회
  private async getPopularSearchTerms(limit: number, days: number): Promise<Array<{ query: string; count: number; lastSearched: Date }>> {
    try {
      const { db } = await import('@/config/firebase');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const searchHistory = await db.collection('searchHistory')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const queryCounts: { [key: string]: number } = {};
      searchHistory.docs.forEach(doc => {
        const { query } = doc.data();
        queryCounts[query] = (queryCounts[query] || 0) + 1;
      });

      return Object.entries(queryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      logger.error('Failed to get popular search terms:', error);
      return [];
    }
  }

  // 필터 사용 통계 계산
  private calculateFilterStats(searches: Array<{ filters?: Record<string, unknown> }>): {
    ageGroup: { child: number; teen: number; adult: number };
    difficulty: { easy: number; medium: number; hard: number };
    withFilters: number;
    withoutFilters: number;
  } {
    const stats = {
      ageGroup: { child: 0, teen: 0, adult: 0 },
      difficulty: { easy: 0, medium: 0, hard: 0 },
      withFilters: 0,
      withoutFilters: 0,
    };

    searches.forEach(search => {
      if (search.filters) {
        stats.withFilters++;
        
        if (search.filters.ageGroup) {
          stats.ageGroup[search.filters.ageGroup]++;
        }
        
        if (search.filters.difficulty) {
          stats.difficulty[search.filters.difficulty]++;
        }
      } else {
        stats.withoutFilters++;
      }
    });

    return stats;
  }

  // 검색 이력 저장
  private async saveSearchToHistory(
    userId: string,
    query: string,
    filters: Record<string, unknown>,
    resultsCount: number,
  ): Promise<void> {
    try {
      const { db } = await import('@/config/firebase');
      
      await db.collection('searchHistory').add({
        userId,
        query,
        filters: filters || {},
        resultsCount: resultsCount || 0,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to save search to history:', error);
      throw error;
    }
  }
}

export const searchController = new SearchController();

// 유효성 검사 미들웨어
export const validateSearchRequest = validateRequest([
  commonValidations.searchQuery('q'),
  commonValidations.ageGroup('ageGroup'),
  commonValidations.difficulty('difficulty'),
  commonValidations.searchQuery('characterName'),
  commonValidations.searchQuery('keywords'),
  query('sortBy')
    .optional()
    .isIn(['relevance', 'popularity', 'newest', 'oldest'])
    .withMessage('Sort by must be one of: relevance, popularity, newest, oldest'),
  commonValidations.pagination(),
]);

export const validateAutocompleteRequest = validateRequest([
  commonValidations.searchQuery('q'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
]);

export const validateSearchHistoryRequest = validateRequest([
  body('query')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query must be between 1 and 100 characters'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('resultsCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Results count must be a non-negative integer'),
]);
