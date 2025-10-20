import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import ImageGenerationService from '../services/imageGenerationService';

// 색칠놀이 도안 생성 API
export const generateColoringPage = async (req: Request, res: Response) => {
  try {
    const { characterName, characterType, originCountry, ageGroup, difficulty, theme, activity, emotion } = req.body;

    // 입력 검증
    if (!characterName || !characterType || !originCountry || !ageGroup || !difficulty) {
      return res.status(400).json(errorResponse('Missing required parameters', 'VALIDATION_ERROR'));
    }

    logger.info('Generating coloring page', {
      characterName,
      characterType,
      originCountry,
      ageGroup,
      difficulty,
      theme,
      activity,
      emotion,
    });

    // 실제 이미지 생성 서비스 사용
    const imageService = new ImageGenerationService();
    const generatedImage = await imageService.generateColoringPage({
      characterName,
      characterType,
      originCountry,
      ageGroup,
      difficulty,
      theme,
      activity,
      emotion,
    });

    // 색칠놀이 도안 데이터 구성
    const coloringPage = {
      id: generatedImage.id,
      characterName: generatedImage.characterName,
      characterType,
      originCountry,
      ageGroup,
      difficulty,
      theme: theme || 'default',
      activity: activity || 'standing',
      emotion: emotion || 'happy',
      imageUrl: generatedImage.imageUrl,
      thumbnailUrl: generatedImage.thumbnailUrl,
      downloads: 0,
      createdAt: new Date().toISOString(),
      metadata: {
        prompt: generatedImage.prompt,
        generation: generatedImage.metadata,
      },
    };

    res.json(successResponse(coloringPage, 'Coloring page generated successfully'));

  } catch (error) {
    logger.error('Failed to generate coloring page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to generate coloring page', 'GENERATION_ERROR'));
  }
};

// 색칠놀이 도안 목록 조회
export const getColoringPages = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, ageGroup, difficulty, characterName } = req.query;

    logger.info('Fetching coloring pages', {
      page,
      limit,
      ageGroup,
      difficulty,
      characterName,
    });

    // 목업 데이터 생성
    const mockPages = generateMockColoringPages(Number(limit));

    res.json(successResponse({
      pages: mockPages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 100,
        totalPages: Math.ceil(100 / Number(limit)),
      },
    }, 'Coloring pages fetched successfully'));

  } catch (error) {
    logger.error('Failed to fetch coloring pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json(errorResponse('Failed to fetch coloring pages', 'FETCH_ERROR'));
  }
};

// 특정 색칠놀이 도안 조회
export const getColoringPageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Fetching coloring page by ID', { id });

    // 목업 데이터 생성
    const mockPage = {
      id,
      characterName: 'Pikachu',
      characterType: 'anime',
      originCountry: 'japan',
      ageGroup: 'child',
      difficulty: 'easy',
      theme: 'default',
      activity: 'jumping',
      emotion: 'happy',
      imageUrl: 'https://via.placeholder.com/1024x1024/ffffff/000000?text=Pikachu',
      thumbnailUrl: 'https://via.placeholder.com/300x300/ffffff/000000?text=Pikachu',
      downloads: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      metadata: {
        prompt: 'Generate a coloring page of Pikachu in anime style for child age group with easy difficulty',
        generationTime: 1500,
        qualityScore: 0.92,
      },
    };

    res.json(successResponse(mockPage, 'Coloring page fetched successfully'));

  } catch (error) {
    logger.error('Failed to fetch coloring page by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });
    res.status(500).json(errorResponse('Failed to fetch coloring page', 'FETCH_ERROR'));
  }
};

// 색칠놀이 도안 검색
export const searchColoringPages = async (req: Request, res: Response) => {
  try {
    const { q, ageGroup, difficulty, characterName, page = 1, limit = 20 } = req.query;

    logger.info('Searching coloring pages', {
      q,
      ageGroup,
      difficulty,
      characterName,
      page,
      limit,
    });

    // 목업 데이터 생성
    const mockPages = generateMockColoringPages(Number(limit));

    res.json(successResponse({
      pages: mockPages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 50,
        totalPages: Math.ceil(50 / Number(limit)),
      },
      query: q,
      filters: {
        ageGroup,
        difficulty,
        characterName,
      },
    }, 'Coloring pages searched successfully'));

  } catch (error) {
    logger.error('Failed to search coloring pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json(errorResponse('Failed to search coloring pages', 'SEARCH_ERROR'));
  }
};

// 색칠놀이 도안 다운로드
export const downloadColoringPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;

    logger.info('Downloading coloring page', { id, userId });

    // 목업 다운로드 응답
    const downloadResult = {
      downloadUrl: `https://via.placeholder.com/1024x1024/ffffff/000000?text=Download+${id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후 만료
      downloadId: `download_${Date.now()}`,
    };

    res.json(successResponse(downloadResult, 'Download successful'));

  } catch (error) {
    logger.error('Failed to download coloring page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });
    res.status(500).json(errorResponse('Failed to download coloring page', 'DOWNLOAD_ERROR'));
  }
};

// 목업 색칠놀이 도안 생성
function generateMockColoringPages(count: number) {
  const characters = ['Pikachu', 'Naruto', 'SpongeBob', 'Mickey Mouse', 'Elsa', 'Goku', '뽀로로', '핑크퐁'];
  const types = ['anime', 'cartoon', 'game', 'mascot'];
  const countries = ['japan', 'usa', 'korea', 'global'];
  const ageGroups = ['child', 'teen', 'adult'];
  const difficulties = ['easy', 'medium', 'hard'];
  const themes = ['default', 'halloween', 'christmas', 'birthday'];
  const activities = ['standing', 'jumping', 'running', 'sitting', 'dancing'];
  const emotions = ['happy', 'excited', 'peaceful', 'confident'];

  return Array.from({ length: count }, (_, index) => ({
    id: `page_${Date.now()}_${index}`,
    characterName: characters[Math.floor(Math.random() * characters.length)],
    characterType: types[Math.floor(Math.random() * types.length)],
    originCountry: countries[Math.floor(Math.random() * countries.length)],
    ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    theme: themes[Math.floor(Math.random() * themes.length)],
    activity: activities[Math.floor(Math.random() * activities.length)],
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    imageUrl: `https://via.placeholder.com/1024x1024/ffffff/000000?text=Character+${index + 1}`,
    thumbnailUrl: `https://via.placeholder.com/300x300/ffffff/000000?text=Character+${index + 1}`,
    downloads: Math.floor(Math.random() * 1000),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 최근 30일 내
    metadata: {
      prompt: `Generated coloring page ${index + 1}`,
      generationTime: Math.random() * 2000 + 1000,
      qualityScore: 0.8 + Math.random() * 0.2,
    },
  }));
}