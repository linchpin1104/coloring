import { db } from '@/config/firebase';
import { ApiError, ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

export interface SearchRequest {
  query: string;
  filters?: {
    ageGroup?: 'child' | 'teen' | 'adult';
    difficulty?: 'easy' | 'medium' | 'hard';
    characterName?: string;
    keywords?: string[];
  };
  sortBy?: 'relevance' | 'popularity' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  results: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  suggestions?: string[];
  filters?: {
    availableAgeGroups: string[];
    availableDifficulties: string[];
    availableCharacters: string[];
  };
}

export class SearchService {
  private readonly collection = db.collection('coloringPages');

  // 메인 검색 함수
  async search(request: SearchRequest): Promise<SearchResult> {
    try {
      logger.info(`Searching for: "${request.query}"`);

      const startTime = Date.now();

      // 1. 검색 쿼리 분석
      const searchTerms = this.analyzeQuery(request.query);
      
      // 2. 기본 쿼리 구성
      let query = this.collection;

      // 3. 필터 적용
      if (request.filters?.ageGroup) {
        query = query.where('ageGroup', '==', request.filters.ageGroup);
      }

      if (request.filters?.difficulty) {
        query = query.where('difficulty', '==', request.filters.difficulty);
      }

      if (request.filters?.characterName) {
        query = query.where('characterName', '>=', request.filters.characterName)
          .where('characterName', '<=', `${request.filters.characterName  }\uf8ff`);
      }

      if (request.filters?.keywords && request.filters.keywords.length > 0) {
        query = query.where('keywords', 'array-contains-any', request.filters.keywords);
      }

      // 4. 정렬 적용
      query = this.applySorting(query, request.sortBy || 'relevance');

      // 5. 페이지네이션
      const page = request.page || 1;
      const limit = Math.min(request.limit || 20, 100);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _offset = (page - 1) * limit;

      // 6. 쿼리 실행
      const snapshot = await query.limit(limit).get();
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 7. 관련도 점수 계산 (검색어가 있는 경우)
      let scoredResults = results;
      if (searchTerms.length > 0) {
        scoredResults = this.calculateRelevanceScores(results, searchTerms);
      }

      // 8. 검색 제안 생성
      const suggestions = await this.generateSuggestions(request.query, searchTerms);

      // 9. 사용 가능한 필터 정보 생성
      const availableFilters = await this.getAvailableFilters();

      const processingTime = Date.now() - startTime;
      logger.info(`Search completed in ${processingTime}ms, found ${results.length} results`);

      return {
        results: scoredResults,
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
        suggestions,
        filters: availableFilters,
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw new ApiError(
        'Search failed',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 고급 검색 (복합 조건)
  async advancedSearch(request: SearchRequest): Promise<SearchResult> {
    try {
      logger.info(`Advanced search for: "${request.query}"`);

      // 1. 검색어 분석 및 확장
      const expandedTerms = await this.expandSearchTerms(request.query);
      
      // 2. 다중 쿼리 실행
      const queries = this.buildMultipleQueries(expandedTerms, request.filters);
      
      // 3. 병렬 쿼리 실행
      const results = await Promise.all(
        queries.map(async (query) => {
          const snapshot = await query.get();
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            queryType: query.queryType,
          }));
        }),
      );

      // 4. 결과 통합 및 중복 제거
      const mergedResults = this.mergeSearchResults(results.flat());

      // 5. 관련도 점수 계산
      const scoredResults = this.calculateAdvancedRelevanceScores(
        mergedResults,
        expandedTerms,
      );

      // 6. 최종 정렬 및 제한
      const finalResults = scoredResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, request.limit || 20);

      return {
        results: finalResults,
        total: finalResults.length,
        page: request.page || 1,
        limit: request.limit || 20,
        totalPages: Math.ceil(finalResults.length / (request.limit || 20)),
      };
    } catch (error) {
      logger.error('Advanced search failed:', error);
      throw new ApiError(
        'Advanced search failed',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 자동완성 검색
  async autocomplete(query: string, limit: number = 10): Promise<string[]> {
    try {
      logger.info(`Autocomplete for: "${query}"`);

      if (query.length < 2) {
        return [];
      }

      // 1. 캐릭터명 자동완성
      const characterSuggestions = await this.getCharacterSuggestions(query, limit);
      
      // 2. 키워드 자동완성
      const keywordSuggestions = await this.getKeywordSuggestions(query, limit);
      
      // 3. 결과 통합 및 정렬
      const suggestions = [...characterSuggestions, ...keywordSuggestions]
        .filter((suggestion, index, self) => self.indexOf(suggestion) === index)
        .slice(0, limit);

      return suggestions;
    } catch (error) {
      logger.error('Autocomplete failed:', error);
      return [];
    }
  }

  // 검색 쿼리 분석
  private analyzeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  // 검색어 확장
  private async expandSearchTerms(query: string): Promise<string[]> {
    const terms = this.analyzeQuery(query);
    const expandedTerms = new Set(terms);

    // 동의어 및 관련어 추가
    const synonyms: { [key: string]: string[] } = {
      'pokemon': ['pikachu', 'pokemon', 'pokemon go'],
      'anime': ['anime', 'manga', 'japanese'],
      'cartoon': ['cartoon', 'animation', 'animated'],
      'cute': ['cute', 'kawaii', 'adorable'],
      'easy': ['easy', 'simple', 'beginner'],
      'hard': ['hard', 'difficult', 'advanced'],
    };

    for (const term of terms) {
      if (synonyms[term]) {
        synonyms[term].forEach(synonym => expandedTerms.add(synonym));
      }
    }

    return Array.from(expandedTerms);
  }

  // 정렬 적용
  private applySorting(query: any, sortBy: string): any {
    switch (sortBy) {
    case 'popularity':
      return query.orderBy('downloads', 'desc');
    case 'newest':
      return query.orderBy('createdAt', 'desc');
    case 'oldest':
      return query.orderBy('createdAt', 'asc');
    case 'relevance':
    default:
      return query.orderBy('downloads', 'desc'); // 기본적으로 인기도순
    }
  }

  // 관련도 점수 계산
  private calculateRelevanceScores(results: any[], searchTerms: string[]): any[] {
    return results.map(result => {
      let score = 0;

      // 캐릭터명 매칭 (가장 높은 가중치)
      const characterMatch = searchTerms.some(term => 
        result.characterName.toLowerCase().includes(term),
      );
      if (characterMatch) {score += 10;}

      // 키워드 매칭
      if (result.keywords) {
        const keywordMatches = result.keywords.filter((keyword: string) =>
          searchTerms.some(term => keyword.toLowerCase().includes(term)),
        ).length;
        score += keywordMatches * 3;
      }

      // 인기도 점수
      score += Math.log10(result.downloads + 1);

      return { ...result, relevanceScore: score };
    });
  }

  // 고급 관련도 점수 계산
  private calculateAdvancedRelevanceScores(results: any[], searchTerms: string[]): any[] {
    return results.map(result => {
      let score = 0;

      // 정확한 매칭 (가장 높은 점수)
      const exactMatch = searchTerms.some(term => 
        result.characterName.toLowerCase() === term.toLowerCase(),
      );
      if (exactMatch) {score += 20;}

      // 부분 매칭
      const partialMatch = searchTerms.some(term => 
        result.characterName.toLowerCase().includes(term),
      );
      if (partialMatch) {score += 10;}

      // 키워드 매칭
      if (result.keywords) {
        const keywordMatches = result.keywords.filter((keyword: string) =>
          searchTerms.some(term => keyword.toLowerCase().includes(term)),
        ).length;
        score += keywordMatches * 5;
      }

      // 쿼리 타입별 가중치
      if (result.queryType === 'character') {score += 5;}
      if (result.queryType === 'keyword') {score += 3;}

      // 인기도 점수
      score += Math.log10(result.downloads + 1) * 0.5;

      return { ...result, relevanceScore: score };
    });
  }

  // 다중 쿼리 구성
  private buildMultipleQueries(terms: string[], filters?: any): any[] {
    const queries: any[] = [];

    // 캐릭터명 검색 쿼리
    for (const term of terms) {
      let query = this.collection.where('characterName', '>=', term)
        .where('characterName', '<=', `${term  }\uf8ff`);
      
      if (filters?.ageGroup) {
        query = query.where('ageGroup', '==', filters.ageGroup);
      }
      
      queries.push({ query, queryType: 'character' });
    }

    // 키워드 검색 쿼리
    if (terms.length > 0) {
      let query = this.collection.where('keywords', 'array-contains-any', terms);
      
      if (filters?.ageGroup) {
        query = query.where('ageGroup', '==', filters.ageGroup);
      }
      
      queries.push({ query, queryType: 'keyword' });
    }

    return queries;
  }

  // 검색 결과 통합
  private mergeSearchResults(results: any[]): any[] {
    const merged = new Map<string, any>();

    for (const result of results) {
      const existing = merged.get(result.id);
      if (existing) {
        // 중복된 결과의 점수를 합산
        existing.relevanceScore = (existing.relevanceScore || 0) + (result.relevanceScore || 0);
      } else {
        merged.set(result.id, result);
      }
    }

    return Array.from(merged.values());
  }

  // 검색 제안 생성
  private async generateSuggestions(query: string, _searchTerms: string[]): Promise<string[]> {
    try {
      const suggestions = new Set<string>();

      // 캐릭터명 제안
      const characterSuggestions = await this.getCharacterSuggestions(query, 5);
      characterSuggestions.forEach(suggestion => suggestions.add(suggestion));

      // 키워드 제안
      const keywordSuggestions = await this.getKeywordSuggestions(query, 5);
      keywordSuggestions.forEach(suggestion => suggestions.add(suggestion));

      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      logger.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  // 캐릭터명 제안
  private async getCharacterSuggestions(query: string, limit: number): Promise<string[]> {
    try {
      const snapshot = await this.collection
        .where('characterName', '>=', query)
        .where('characterName', '<=', `${query  }\uf8ff`)
        .orderBy('characterName')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data().characterName);
    } catch (error) {
      logger.error('Failed to get character suggestions:', error);
      return [];
    }
  }

  // 키워드 제안
  private async getKeywordSuggestions(query: string, limit: number): Promise<string[]> {
    try {
      // 실제 구현에서는 별도의 키워드 인덱스를 사용
      // 여기서는 간단히 색칠놀이 도안의 키워드에서 검색
      const snapshot = await this.collection
        .where('keywords', 'array-contains', query)
        .limit(limit * 2)
        .get();

      const keywords = new Set<string>();
      snapshot.docs.forEach(doc => {
        const pageKeywords = doc.data().keywords || [];
        pageKeywords.forEach((keyword: string) => {
          if (keyword.toLowerCase().includes(query.toLowerCase())) {
            keywords.add(keyword);
          }
        });
      });

      return Array.from(keywords).slice(0, limit);
    } catch (error) {
      logger.error('Failed to get keyword suggestions:', error);
      return [];
    }
  }

  // 사용 가능한 필터 정보 조회
  private   async getAvailableFilters(): Promise<{
    availableAgeGroups: string[];
    availableDifficulties: string[];
    availableCharacters: string[];
  }> {
    // 실제 구현에서는 별도의 집계 쿼리를 사용
    // 여기서는 간단히 하드코딩된 값 반환
    return {
      availableAgeGroups: ['child', 'teen', 'adult'],
      availableDifficulties: ['easy', 'medium', 'hard'],
      availableCharacters: ['Pikachu', 'Naruto', 'SpongeBob', 'Mario', 'Elsa'],
    };
  }
}

export const searchService = new SearchService();
