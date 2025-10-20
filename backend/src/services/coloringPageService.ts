import { db } from '@/config/firebase';
import { ApiError, ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

export interface ColoringPage {
  id: string;
  characterName: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: 'child' | 'teen' | 'adult';
  imageURL: string;
  thumbnailURL: string;
  downloads: number;
  createdAt: Date;
  metadata: {
    source: 'auto-generated' | 'manual';
    prompt?: string;
  };
}

export interface CreateColoringPageData {
  characterName: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: 'child' | 'teen' | 'adult';
  imageURL: string;
  thumbnailURL: string;
  metadata: {
    source: 'auto-generated' | 'manual';
    prompt?: string;
  };
}

export interface SearchFilters {
  characterName?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  ageGroup?: 'child' | 'teen' | 'adult';
  keywords?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'downloads' | 'characterName';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ColoringPageService {
  private readonly collection = db.collection('coloringPages');

  // 색칠놀이 도안 생성
  async createColoringPage(pageData: CreateColoringPageData): Promise<ColoringPage> {
    try {
      const now = new Date();
      const docRef = this.collection.doc();
      
      const page: Omit<ColoringPage, 'id'> = {
        characterName: pageData.characterName,
        keywords: pageData.keywords,
        difficulty: pageData.difficulty,
        ageGroup: pageData.ageGroup,
        imageURL: pageData.imageURL,
        thumbnailURL: pageData.thumbnailURL,
        downloads: 0,
        createdAt: now,
        metadata: pageData.metadata,
      };

      await docRef.set(page);

      logger.info(`Coloring page created: ${docRef.id}`);
      return { id: docRef.id, ...page };
    } catch (error) {
      logger.error('Failed to create coloring page:', error);
      throw new ApiError(
        'Failed to create coloring page',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 색칠놀이 도안 조회
  async getColoringPageById(id: string): Promise<ColoringPage | null> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as Omit<ColoringPage, 'id'>;
      return { id, ...data };
    } catch (error) {
      logger.error('Failed to get coloring page:', error);
      throw new ApiError(
        'Failed to get coloring page',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 색칠놀이 도안 검색
  async searchColoringPages(filters: SearchFilters): Promise<PaginatedResult<ColoringPage>> {
    try {
      let query = this.collection;

      // 필터 적용
      if (filters.characterName) {
        query = query.where('characterName', '>=', filters.characterName)
          .where('characterName', '<=', `${filters.characterName  }\uf8ff`);
      }

      if (filters.difficulty) {
        query = query.where('difficulty', '==', filters.difficulty);
      }

      if (filters.ageGroup) {
        query = query.where('ageGroup', '==', filters.ageGroup);
      }

      if (filters.keywords && filters.keywords.length > 0) {
        query = query.where('keywords', 'array-contains-any', filters.keywords);
      }

      // 정렬
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.orderBy(sortBy, sortOrder);

      // 페이지네이션
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;

      // 총 개수 조회
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // 페이지네이션 적용
      query = query.limit(limit);
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get();
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      const totalPages = Math.ceil(total / limit);

      logger.info(`Coloring pages search completed: ${data.length} results`);
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to search coloring pages:', error);
      throw new ApiError(
        'Failed to search coloring pages',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 인기 도안 조회
  async getPopularColoringPages(limit: number = 20): Promise<ColoringPage[]> {
    try {
      const snapshot = await this.collection
        .orderBy('downloads', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      logger.info(`Popular coloring pages retrieved: ${data.length} results`);
      return data;
    } catch (error) {
      logger.error('Failed to get popular coloring pages:', error);
      throw new ApiError(
        'Failed to get popular coloring pages',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 최신 도안 조회
  async getRecentColoringPages(limit: number = 20): Promise<ColoringPage[]> {
    try {
      const snapshot = await this.collection
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      logger.info(`Recent coloring pages retrieved: ${data.length} results`);
      return data;
    } catch (error) {
      logger.error('Failed to get recent coloring pages:', error);
      throw new ApiError(
        'Failed to get recent coloring pages',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 연령대별 추천 도안
  async getRecommendedColoringPages(
    ageGroup: 'child' | 'teen' | 'adult',
    limit: number = 20,
  ): Promise<ColoringPage[]> {
    try {
      const snapshot = await this.collection
        .where('ageGroup', '==', ageGroup)
        .orderBy('downloads', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      logger.info(`Recommended coloring pages for ${ageGroup}: ${data.length} results`);
      return data;
    } catch (error) {
      logger.error('Failed to get recommended coloring pages:', error);
      throw new ApiError(
        'Failed to get recommended coloring pages',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 다운로드 수 증가
  async incrementDownloads(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      await docRef.update({
        downloads: db.FieldValue.increment(1),
      });

      logger.info(`Download count incremented for coloring page: ${id}`);
    } catch (error) {
      logger.error('Failed to increment downloads:', error);
      throw new ApiError(
        'Failed to increment downloads',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 키워드로 검색
  async searchByKeywords(keywords: string[], limit: number = 20): Promise<ColoringPage[]> {
    try {
      const snapshot = await this.collection
        .where('keywords', 'array-contains-any', keywords)
        .orderBy('downloads', 'desc')
        .limit(limit)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      logger.info(`Coloring pages found by keywords: ${data.length} results`);
      return data;
    } catch (error) {
      logger.error('Failed to search by keywords:', error);
      throw new ApiError(
        'Failed to search by keywords',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 캐릭터명으로 검색
  async searchByCharacterName(characterName: string, limit: number = 20): Promise<ColoringPage[]> {
    try {
      const snapshot = await this.collection
        .where('characterName', '>=', characterName)
        .where('characterName', '<=', `${characterName  }\uf8ff`)
        .orderBy('characterName')
        .orderBy('downloads', 'desc')
        .limit(limit)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ColoringPage[];

      logger.info(`Coloring pages found by character name: ${data.length} results`);
      return data;
    } catch (error) {
      logger.error('Failed to search by character name:', error);
      throw new ApiError(
        'Failed to search by character name',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }
}

export const coloringPageService = new ColoringPageService();
