import { db } from '@/config/firebase';
import { ApiError, ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

export interface RecommendationRequest {
  userId?: string;
  ageGroup?: 'child' | 'teen' | 'adult';
  limit?: number;
  excludeDownloaded?: boolean;
  preferences?: {
    characters?: string[];
    difficulties?: ('easy' | 'medium' | 'hard')[];
    keywords?: string[];
  };
}

export interface RecommendationResult {
  coloringPages: any[];
  algorithm: string;
  confidence: number;
  metadata: {
    totalCandidates: number;
    filteredCount: number;
    processingTime: number;
  };
}

export class RecommendationService {
  private readonly collection = db.collection('coloringPages');
  private readonly usersCollection = db.collection('users');
  private readonly transactionsCollection = db.collection('transactions');

  // 메인 추천 함수
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Generating recommendations for user: ${request.userId || 'anonymous'}`);

      let recommendations: any[] = [];
      let algorithm = 'fallback';
      let confidence = 0.5;

      if (request.userId) {
        // 사용자 기반 추천
        const { recommendations: userRecommendations, algorithm: userAlgorithm, confidence: userConfidence } = await this.getUserBasedRecommendations(request);
        recommendations = userRecommendations;
        algorithm = userAlgorithm;
        confidence = userConfidence;
      } else {
        // 연령대 기반 추천
        const { recommendations: ageRecommendations, algorithm: ageAlgorithm, confidence: ageConfidence } = await this.getAgeBasedRecommendations(request);
        recommendations = ageRecommendations;
        algorithm = ageAlgorithm;
        confidence = ageConfidence;
      }

      // 필터링 적용
      if (request.excludeDownloaded && request.userId) {
        recommendations = await this.excludeDownloadedPages(recommendations, request.userId);
      }

      // 사용자 선호도 필터링
      if (request.preferences) {
        recommendations = this.applyPreferenceFilters(recommendations, request.preferences);
      }

      // 최종 정렬 및 제한
      recommendations = this.finalizeRecommendations(recommendations, request.limit || 20);

      const processingTime = Date.now() - startTime;

      logger.info(`Generated ${recommendations.length} recommendations using ${algorithm} algorithm`);

      return {
        coloringPages: recommendations,
        algorithm,
        confidence,
        metadata: {
          totalCandidates: recommendations.length,
          filteredCount: recommendations.length,
          processingTime,
        },
      };
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      throw new ApiError(
        'Failed to generate recommendations',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 사용자 기반 추천
  private async getUserBasedRecommendations(request: RecommendationRequest): Promise<{
    recommendations: any[];
    algorithm: string;
    confidence: number;
  }> {
    try {
      const user = await this.usersCollection.doc(request.userId!).get();
      if (!user.exists) {
        throw new ApiError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
      }

      const userData = user.data()!;
      const userAgeGroup = userData.ageGroup || request.ageGroup;

      // 1. 협업 필터링 시도
      const collaborativeResult = await this.collaborativeFiltering(request.userId!, userAgeGroup);
      if (collaborativeResult.recommendations.length > 0) {
        return {
          recommendations: collaborativeResult.recommendations,
          algorithm: 'collaborative_filtering',
          confidence: collaborativeResult.confidence,
        };
      }

      // 2. 콘텐츠 기반 필터링
      const contentBasedResult = await this.contentBasedFiltering(userData, userAgeGroup);
      if (contentBasedResult.recommendations.length > 0) {
        return {
          recommendations: contentBasedResult.recommendations,
          algorithm: 'content_based',
          confidence: contentBasedResult.confidence,
        };
      }

      // 3. 하이브리드 추천
      const hybridResult = await this.hybridRecommendation(userData, userAgeGroup);
      return {
        recommendations: hybridResult.recommendations,
        algorithm: 'hybrid',
        confidence: hybridResult.confidence,
      };
    } catch (error) {
      logger.error('User-based recommendation failed:', error);
      throw error;
    }
  }

  // 연령대 기반 추천
  private async getAgeBasedRecommendations(request: RecommendationRequest): Promise<{
    recommendations: any[];
    algorithm: string;
    confidence: number;
  }> {
    try {
      const ageGroup = request.ageGroup || 'child';
      
      // 연령대별 인기 도안 조회
      const snapshot = await this.collection
        .where('ageGroup', '==', ageGroup)
        .orderBy('downloads', 'desc')
        .limit(50)
        .get();

      const recommendations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        recommendations,
        algorithm: 'age_based_popularity',
        confidence: 0.7,
      };
    } catch (error) {
      logger.error('Age-based recommendation failed:', error);
      throw error;
    }
  }

  // 협업 필터링
  private async collaborativeFiltering(
    userId: string,
    ageGroup: string,
  ): Promise<{ recommendations: any[]; confidence: number }> {
    try {
      // 사용자의 다운로드 이력 조회
      const userDownloads = await this.transactionsCollection
        .where('uid', '==', userId)
        .where('type', '==', 'download')
        .get();

      if (userDownloads.empty) {
        return { recommendations: [], confidence: 0 };
      }

      const downloadedPageIds = userDownloads.docs.map(doc => doc.data().pageId).filter(Boolean);

      // 유사한 사용자 찾기 (같은 도안을 다운로드한 사용자들)
      const similarUsers = await this.findSimilarUsers(downloadedPageIds, userId);

      if (similarUsers.length === 0) {
        return { recommendations: [], confidence: 0 };
      }

      // 유사한 사용자들이 다운로드한 도안 중 사용자가 아직 다운로드하지 않은 것들
      const recommendations = await this.getRecommendationsFromSimilarUsers(
        similarUsers,
        downloadedPageIds,
        ageGroup,
      );

      return {
        recommendations,
        confidence: Math.min(similarUsers.length / 10, 0.9), // 유사 사용자 수에 따른 신뢰도
      };
    } catch (error) {
      logger.error('Collaborative filtering failed:', error);
      return { recommendations: [], confidence: 0 };
    }
  }

  // 콘텐츠 기반 필터링
  private async contentBasedFiltering(
    userData: any,
    ageGroup: string,
  ): Promise<{ recommendations: any[]; confidence: number }> {
    try {
      // 사용자의 다운로드 이력에서 선호하는 키워드 추출
      const userDownloads = await this.transactionsCollection
        .where('uid', '==', userData.uid)
        .where('type', '==', 'download')
        .get();

      if (userDownloads.empty) {
        return { recommendations: [], confidence: 0 };
      }

      const downloadedPageIds = userDownloads.docs.map(doc => doc.data().pageId).filter(Boolean);
      const downloadedPages = await this.getColoringPagesByIds(downloadedPageIds);

      // 사용자 선호 키워드 추출
      const preferredKeywords = this.extractPreferredKeywords(downloadedPages);
      const preferredDifficulties = this.extractPreferredDifficulties(downloadedPages);

      // 유사한 콘텐츠 찾기
      const recommendations = await this.findSimilarContent(
        preferredKeywords,
        preferredDifficulties,
        ageGroup,
        downloadedPageIds,
      );

      return {
        recommendations,
        confidence: 0.8,
      };
    } catch (error) {
      logger.error('Content-based filtering failed:', error);
      return { recommendations: [], confidence: 0 };
    }
  }

  // 하이브리드 추천
  private async hybridRecommendation(
    userData: any,
    ageGroup: string,
  ): Promise<{ recommendations: any[]; confidence: number }> {
    try {
      // 연령대별 인기도 + 사용자 선호도 조합
      const ageBasedPages = await this.collection
        .where('ageGroup', '==', ageGroup)
        .orderBy('downloads', 'desc')
        .limit(30)
        .get();

      const recommendations = ageBasedPages.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        score: doc.data().downloads * 0.7 + Math.random() * 0.3, // 인기도 + 랜덤 요소
      }));

      return {
        recommendations: recommendations.sort((a, b) => b.score - a.score),
        confidence: 0.6,
      };
    } catch (error) {
      logger.error('Hybrid recommendation failed:', error);
      return { recommendations: [], confidence: 0 };
    }
  }

  // 유사한 사용자 찾기
  private async findSimilarUsers(downloadedPageIds: string[], userId: string): Promise<string[]> {
    try {
      const similarUsers = new Map<string, number>();

      for (const pageId of downloadedPageIds) {
        const downloads = await this.transactionsCollection
          .where('pageId', '==', pageId)
          .where('type', '==', 'download')
          .get();

        for (const doc of downloads.docs) {
          const downloaderId = doc.data().uid;
          if (downloaderId !== userId) {
            similarUsers.set(downloaderId, (similarUsers.get(downloaderId) || 0) + 1);
          }
        }
      }

      // 공통 다운로드가 2개 이상인 사용자들
      return Array.from(similarUsers.entries())
        .filter(([_userId, count]) => count >= 2)
        .sort(([_userId1, a], [_userId2, b]) => b - a)
        .slice(0, 10)
        .map(([userId, _count]) => userId);
    } catch (error) {
      logger.error('Failed to find similar users:', error);
      return [];
    }
  }

  // 유사한 사용자들의 추천 도안 조회
  private async getRecommendationsFromSimilarUsers(
    similarUsers: string[],
    downloadedPageIds: string[],
    ageGroup: string,
  ): Promise<any[]> {
    try {
      const recommendations = new Map<string, any>();

      for (const userId of similarUsers) {
        const downloads = await this.transactionsCollection
          .where('uid', '==', userId)
          .where('type', '==', 'download')
          .get();

        for (const doc of downloads.docs) {
          const { pageId } = doc.data();
          if (pageId && !downloadedPageIds.includes(pageId)) {
            recommendations.set(pageId, { pageId, score: 1 });
          }
        }
      }

      // 도안 상세 정보 조회
      const pageIds = Array.from(recommendations.keys());
      const pages = await this.getColoringPagesByIds(pageIds);

      return pages.filter(page => page.ageGroup === ageGroup);
    } catch (error) {
      logger.error('Failed to get recommendations from similar users:', error);
      return [];
    }
  }

  // 선호 키워드 추출
  private extractPreferredKeywords(pages: any[]): string[] {
    const keywordCount = new Map<string, number>();

    for (const page of pages) {
      if (page.keywords) {
        for (const keyword of page.keywords) {
          keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
        }
      }
    }

    return Array.from(keywordCount.entries())
      .sort(([_keyword1, a], [_keyword2, b]) => b - a)
      .slice(0, 5)
      .map(([keyword, _count]) => keyword);
  }

  // 선호 난이도 추출
  private extractPreferredDifficulties(pages: any[]): string[] {
    const difficultyCount = new Map<string, number>();

    for (const page of pages) {
      if (page.difficulty) {
        difficultyCount.set(page.difficulty, (difficultyCount.get(page.difficulty) || 0) + 1);
      }
    }

    return Array.from(difficultyCount.entries())
      .sort(([_difficulty1, a], [_difficulty2, b]) => b - a)
      .slice(0, 2)
      .map(([difficulty, _count]) => difficulty);
  }

  // 유사한 콘텐츠 찾기
  private async findSimilarContent(
    preferredKeywords: string[],
    preferredDifficulties: string[],
    ageGroup: string,
    excludePageIds: string[],
  ): Promise<any[]> {
    try {
      let query = this.collection.where('ageGroup', '==', ageGroup);

      if (preferredKeywords.length > 0) {
        query = query.where('keywords', 'array-contains-any', preferredKeywords);
      }

      const snapshot = await query.get();
      const pages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(page => !excludePageIds.includes(page.id));

      // 키워드 매칭 점수 계산
      const scoredPages = pages.map(page => {
        let score = 0;
        
        // 키워드 매칭 점수
        if (page.keywords) {
          const matchingKeywords = page.keywords.filter((keyword: string) => 
            preferredKeywords.includes(keyword),
          ).length;
          score += matchingKeywords * 0.5;
        }

        // 난이도 매칭 점수
        if (preferredDifficulties.includes(page.difficulty)) {
          score += 0.3;
        }

        // 인기도 점수
        score += Math.log10(page.downloads + 1) * 0.2;

        return { ...page, score };
      });

      return scoredPages
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    } catch (error) {
      logger.error('Failed to find similar content:', error);
      return [];
    }
  }

  // 다운로드한 도안 제외
  private async excludeDownloadedPages(pages: any[], userId: string): Promise<any[]> {
    try {
      const downloads = await this.transactionsCollection
        .where('uid', '==', userId)
        .where('type', '==', 'download')
        .get();

      const downloadedPageIds = new Set(
        downloads.docs.map(doc => doc.data().pageId).filter(Boolean),
      );

      return pages.filter(page => !downloadedPageIds.has(page.id));
    } catch (error) {
      logger.error('Failed to exclude downloaded pages:', error);
      return pages;
    }
  }

  // 선호도 필터 적용
  private applyPreferenceFilters(pages: any[], preferences: any): any[] {
    let filtered = pages;

    if (preferences.characters && preferences.characters.length > 0) {
      filtered = filtered.filter(page => 
        preferences.characters.some((char: string) => 
          page.characterName.toLowerCase().includes(char.toLowerCase()),
        ),
      );
    }

    if (preferences.difficulties && preferences.difficulties.length > 0) {
      filtered = filtered.filter(page => 
        preferences.difficulties.includes(page.difficulty),
      );
    }

    if (preferences.keywords && preferences.keywords.length > 0) {
      filtered = filtered.filter(page => 
        page.keywords && page.keywords.some((keyword: string) => 
          preferences.keywords.some((prefKeyword: string) => 
            keyword.toLowerCase().includes(prefKeyword.toLowerCase()),
          ),
        ),
      );
    }

    return filtered;
  }

  // 최종 추천 정리
  private finalizeRecommendations(pages: any[], limit: number): any[] {
    return pages
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)
      .map(({ score: _score, ...page }) => page); // score 필드 제거
  }

  // 도안 ID로 도안 조회
  private async getColoringPagesByIds(pageIds: string[]): Promise<any[]> {
    try {
      if (pageIds.length === 0) {return [];}

      const pages = await Promise.all(
        pageIds.map(async (id) => {
          const doc = await this.collection.doc(id).get();
          return doc.exists ? { id, ...doc.data() } : null;
        }),
      );

      return pages.filter(Boolean);
    } catch (error) {
      logger.error('Failed to get coloring pages by IDs:', error);
      return [];
    }
  }
}

export const recommendationService = new RecommendationService();
