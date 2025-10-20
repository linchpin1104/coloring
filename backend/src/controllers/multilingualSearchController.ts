import { Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';
import admin from 'firebase-admin';

interface MultilingualSearchRequest {
  query: string;
  searchTerms: string[];
  filters?: {
    character?: string;
    theme?: string;
    difficulty?: string;
    ageGroup?: string;
  };
  page?: number;
  limit?: number;
  detectedLanguage?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'character' | 'theme' | 'keyword';
  count: number;
  language: string;
}

// 다국어 검색 실행
export const searchMultilingual = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '검색 요청 데이터가 올바르지 않습니다.',
        errors: errors.array(),
      });
    }

    const {
      query,
      searchTerms,
      filters = {},
      page = 1,
      limit = 20,
      detectedLanguage = 'ko'
    }: MultilingualSearchRequest = req.body;

    logger.info('다국어 검색 요청:', {
      query,
      searchTerms,
      filters,
      page,
      limit,
      detectedLanguage
    });

    // Firestore에서 검색 실행
    const db = req.app.locals.db;
    let searchQuery = db.collection('coloring_pages');

    // 다국어 검색어로 OR 조건 생성
    if (searchTerms.length > 0) {
      searchQuery = searchQuery.where('searchableText', 'array-contains-any', searchTerms);
    }

    // 필터 적용
    if (filters.character) {
      searchQuery = searchQuery.where('characterName', '==', filters.character);
    }
    if (filters.theme) {
      searchQuery = searchQuery.where('theme', '==', filters.theme);
    }
    if (filters.difficulty) {
      searchQuery = searchQuery.where('difficulty', '==', filters.difficulty);
    }
    if (filters.ageGroup) {
      searchQuery = searchQuery.where('ageGroup', '==', filters.ageGroup);
    }

    // 페이지네이션
    const offset = (page - 1) * limit;
    const snapshot = await searchQuery
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    // 총 개수 조회 (필터만 적용)
    let countQuery = db.collection('coloring_pages');
    if (searchTerms.length > 0) {
      countQuery = countQuery.where('searchableText', 'array-contains-any', searchTerms);
    }
    if (filters.character) {
      countQuery = countQuery.where('characterName', '==', filters.character);
    }
    if (filters.theme) {
      countQuery = countQuery.where('theme', '==', filters.theme);
    }
    if (filters.difficulty) {
      countQuery = countQuery.where('difficulty', '==', filters.difficulty);
    }
    if (filters.ageGroup) {
      countQuery = countQuery.where('ageGroup', '==', filters.ageGroup);
    }

    const countSnapshot = await countQuery.get();
    const total = countSnapshot.size;

    // 결과 변환
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        characterName: data.characterName || '',
        theme: data.theme || '',
        difficulty: data.difficulty || '',
        ageGroup: data.ageGroup || '',
        imageUrl: data.imageUrl || '',
        thumbnailUrl: data.thumbnailUrl || '',
        metadata: data.metadata || {},
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    });

    // 검색 로그 저장
    await logSearchQuery(query, searchTerms, detectedLanguage, results.length, total);

    res.json({
      success: true,
      results,
      total,
      page,
      limit,
      hasMore: offset + results.length < total,
      detectedLanguage,
      searchTerms: searchTerms.slice(0, 10), // 처음 10개만 반환
    });

  } catch (error) {
    logger.error('다국어 검색 실패:', error);
    res.status(500).json({
      success: false,
      message: '검색 중 오류가 발생했습니다.',
    });
  }
};

// 자동완성 제안 가져오기
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { q, lang = 'ko' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: '검색어가 필요합니다.',
      });
    }

    const db = req.app.locals.db;
    const suggestions: SearchSuggestion[] = [];

    // 캐릭터 이름 검색
    const characterQuery = db.collection('characters')
      .where('searchableNames', 'array-contains', q.toLowerCase())
      .limit(5);

    const characterSnapshot = await characterQuery.get();
    characterSnapshot.docs.forEach(doc => {
      const data = doc.data();
      suggestions.push({
        text: data.name,
        type: 'character',
        count: data.popularity || 0,
        language: lang as string,
      });
    });

    // 테마 검색
    const themeQuery = db.collection('themes')
      .where('searchableNames', 'array-contains', q.toLowerCase())
      .limit(3);

    const themeSnapshot = await themeQuery.get();
    themeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      suggestions.push({
        text: data.name,
        type: 'theme',
        count: data.popularity || 0,
        language: lang as string,
      });
    });

    // 인기 키워드 검색
    const keywordQuery = db.collection('popular_keywords')
      .where('keyword', '>=', q.toLowerCase())
      .where('keyword', '<=', q.toLowerCase() + '\uf8ff')
      .orderBy('keyword')
      .limit(5);

    const keywordSnapshot = await keywordQuery.get();
    keywordSnapshot.docs.forEach(doc => {
      const data = doc.data();
      suggestions.push({
        text: data.keyword,
        type: 'keyword',
        count: data.searchCount || 0,
        language: lang as string,
      });
    });

    // 인기도순으로 정렬
    suggestions.sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10),
    });

  } catch (error) {
    logger.error('자동완성 제안 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '자동완성 제안을 가져오는 중 오류가 발생했습니다.',
    });
  }
};

// 인기 검색어 가져오기
export const getPopularSearches = async (req: Request, res: Response) => {
  try {
    const { limit = 20, lang = 'ko' } = req.query;

    const db = req.app.locals.db;
    const snapshot = await db.collection('popular_keywords')
      .orderBy('searchCount', 'desc')
      .limit(Number(limit))
      .get();

    const popularSearches = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        keyword: data.keyword,
        searchCount: data.searchCount || 0,
        language: data.language || lang,
        lastSearched: data.lastSearched?.toDate?.() || new Date(),
      };
    });

    res.json({
      success: true,
      popularSearches,
    });

  } catch (error) {
    logger.error('인기 검색어 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '인기 검색어를 가져오는 중 오류가 발생했습니다.',
    });
  }
};

// 검색 쿼리 로깅
const logSearchQuery = async (
  query: string,
  searchTerms: string[],
  language: string,
  resultCount: number,
  totalCount: number
) => {
  try {
    await db.collection('search_logs').add({
      query,
      searchTerms,
      language,
      resultCount,
      totalCount,
      timestamp: new Date(),
      userAgent: 'multilingual-search',
    });

    // 인기 키워드 업데이트
    const keywordRef = db.collection('popular_keywords').doc(query.toLowerCase());
    await keywordRef.set({
      keyword: query.toLowerCase(),
      searchCount: admin.firestore.FieldValue.increment(1),
      language,
      lastSearched: new Date(),
    }, { merge: true });

  } catch (error) {
    logger.error('검색 로그 저장 실패:', error);
  }
};

// 검색 유효성 검사 규칙
export const searchValidation = [
  body('query').notEmpty().withMessage('검색어가 필요합니다.'),
  body('searchTerms').isArray().withMessage('검색어 배열이 필요합니다.'),
  body('filters').optional().isObject().withMessage('필터는 객체여야 합니다.'),
  body('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 정수여야 합니다.'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('제한은 1-100 사이의 정수여야 합니다.'),
];

export const suggestionsValidation = [
  query('q').notEmpty().withMessage('검색어가 필요합니다.'),
  query('lang').optional().isString().withMessage('언어 코드는 문자열이어야 합니다.'),
];

