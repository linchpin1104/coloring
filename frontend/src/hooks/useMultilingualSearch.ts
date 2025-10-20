import { useState, useCallback } from 'react';
import { 
  detectLanguage, 
  translateSearchQuery, 
  generateMultilingualSearchTerms,
  expandSearchTerms 
} from '../utils/translation';
import { logger } from '../utils/logger';

interface SearchResult {
  id: string;
  title: string;
  characterName: string;
  theme: string;
  difficulty: string;
  ageGroup: string;
  imageUrl: string;
  metadata: Record<string, unknown>;
}

interface SearchOptions {
  query: string;
  filters?: {
    character?: string;
    theme?: string;
    difficulty?: string;
    ageGroup?: string;
  };
  page?: number;
  limit?: number;
}

export const useMultilingualSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 다국어 검색 실행
  const search = useCallback(async (options: SearchOptions) => {
    setIsSearching(true);

    try {
      const { query, filters = {}, page = 1, limit = 20 } = options;
      
      // 언어 감지 및 검색어 변환
      const detectedLang = detectLanguage(query);
      const translatedQuery = translateSearchQuery(query);
      
      // 다국어 검색어 생성
      const multilingualTerms = generateMultilingualSearchTerms(translatedQuery);
      const expandedTerms = expandSearchTerms(translatedQuery);
      
      // 모든 검색어를 하나의 배열로 합치기
      const allSearchTerms = [...new Set([...multilingualTerms, ...expandedTerms])];
      
      logger.info('다국어 검색어 생성:', {
        original: query,
        detectedLang,
        translated: translatedQuery,
        multilingualTerms,
        expandedTerms,
        allTerms: allSearchTerms
      });

      // 서버에 검색 요청
      const response = await fetch('/api/search/multilingual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: translatedQuery,
          searchTerms: allSearchTerms,
          filters,
          page,
          limit,
          detectedLanguage: detectedLang,
        }),
      });

      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }

      const data = await response.json();
      
      setSearchResults(data.results || []);
      setTotalResults(data.total || 0);
      
      // 검색 히스토리에 추가
      if (query.trim()) {
        setSearchHistory(prev => {
          const newHistory = [query, ...prev.filter(item => item !== query)];
          return newHistory.slice(0, 10); // 최대 10개만 유지
        });
      }

      logger.info('검색 완료:', {
        query,
        resultsCount: data.results?.length || 0,
        totalResults: data.total || 0
      });

      return {
        results: data.results || [],
        total: data.total || 0,
        page: data.page || 1,
        hasMore: data.hasMore || false,
      };

    } catch (error) {
      logger.error('다국어 검색 실패:', error);
      setSearchResults([]);
      setTotalResults(0);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 자동완성 검색
  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    try {
      const detectedLang = detectLanguage(query);
      const translatedQuery = translateSearchQuery(query);
      
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(translatedQuery)}&lang=${detectedLang}`);
      
      if (!response.ok) {
        throw new Error('자동완성 요청 실패');
      }

      const data = await response.json();
      return data.suggestions || [];

    } catch (error) {
      logger.error('자동완성 검색 실패:', error);
      return [];
    }
  }, []);

  // 인기 검색어 가져오기
  const getPopularSearches = useCallback(async () => {
    try {
      const response = await fetch('/api/search/popular');
      
      if (!response.ok) {
        throw new Error('인기 검색어 요청 실패');
      }

      const data = await response.json();
      return data.popularSearches || [];

    } catch (error) {
      logger.error('인기 검색어 조회 실패:', error);
      return [];
    }
  }, []);

  // 검색 히스토리 초기화
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    search,
    getSuggestions,
    getPopularSearches,
    clearSearchHistory,
    isSearching,
    searchResults,
    totalResults,
    searchHistory,
  };
};

