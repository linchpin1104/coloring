import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env['PORT'] || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Coloring Platform API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 헬스 체크
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 색칠공부 도안 목록 (모의 데이터)
app.get('/api/coloring-pages', (_req, res) => {
  const mockPages = [
    {
      id: '1',
      characterName: '도라에몽',
      characterType: 'anime',
      originCountry: 'japan',
      ageGroup: 'child',
      difficulty: 'easy',
      theme: '만화',
      activity: 'standing',
      emotion: 'happy',
      imageUrl: 'https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Doraemon',
      thumbnailUrl: 'https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=Doraemon',
      downloads: 0,
      metadata: {
        prompt: 'A cute blue robot cat character for children\'s coloring',
        generationTime: 2.5,
        qualityScore: 0.95
      }
    },
    {
      id: '2',
      characterName: 'Mickey Mouse',
      characterType: 'cartoon',
      originCountry: 'usa',
      ageGroup: 'child',
      difficulty: 'easy',
      theme: '만화',
      activity: 'waving',
      emotion: 'happy',
      imageUrl: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Mickey',
      thumbnailUrl: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Mickey',
      downloads: 0,
      metadata: {
        prompt: 'Classic Disney Mickey Mouse character for coloring',
        generationTime: 2.1,
        qualityScore: 0.92
      }
    },
    {
      id: '3',
      characterName: '피카츄',
      characterType: 'anime',
      originCountry: 'japan',
      ageGroup: 'child',
      difficulty: 'medium',
      theme: '게임',
      activity: 'jumping',
      emotion: 'excited',
      imageUrl: 'https://via.placeholder.com/400x400/FFD93D/FFFFFF?text=Pikachu',
      thumbnailUrl: 'https://via.placeholder.com/200x200/FFD93D/FFFFFF?text=Pikachu',
      downloads: 0,
      metadata: {
        prompt: 'Pokemon Pikachu character for children\'s coloring',
        generationTime: 3.2,
        qualityScore: 0.88
      }
    }
  ];

  res.json({
    success: true,
    data: {
      pages: mockPages,
      pagination: {
        page: 1,
        limit: 20,
        total: mockPages.length,
        totalPages: 1
      }
    },
    message: 'Coloring pages retrieved successfully'
  });
});

// 색칠공부 도안 생성 (모의)
app.post('/api/coloring-pages/generate', (req, res) => {
  const { characterName } = req.body;
  
  const newPage = {
    id: Date.now().toString(),
    characterName: characterName || '새 캐릭터',
    characterType: 'anime',
    originCountry: 'japan',
    ageGroup: 'child',
    difficulty: 'easy',
    theme: '만화',
    activity: 'standing',
    emotion: 'happy',
    imageUrl: 'https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=New+Character',
    thumbnailUrl: 'https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=New+Character',
    downloads: 0,
    metadata: {
      prompt: 'A new character for children\'s coloring',
      generationTime: 2.0,
      qualityScore: 0.90
    }
  };

  res.json({
    success: true,
    data: newPage,
    message: 'Coloring page generated successfully'
  });
});

// 다국어 검색 (모의)
app.post('/api/search/multilingual', (req, res) => {
  const { query, searchTerms, filters = {}, page = 1, limit = 20 } = req.body;
  
  logger.info('Multilingual search request:', { query, searchTerms, filters });
  
  // 모의 검색 결과
  const mockResults = [
    {
      id: '1',
      title: '도라에몽 색칠공부',
      characterName: '도라에몽',
      theme: '만화',
      difficulty: 'easy',
      ageGroup: 'child',
      imageUrl: 'https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Doraemon',
      thumbnailUrl: 'https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=Doraemon',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  res.json({
    success: true,
    results: mockResults,
    total: mockResults.length,
    page,
    limit,
    hasMore: false,
    detectedLanguage: 'ko',
    searchTerms: searchTerms?.slice(0, 10) || []
  });
});

// 뉴스레터 구독 (모의)
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email, language = 'ko', source = 'website' } = req.body;
  
  logger.info('Newsletter subscription request:', { email, language, source });
  
  res.json({
    success: true,
    message: '뉴스레터 구독이 완료되었습니다.',
    subscriptionId: Date.now().toString()
  });
});

// 다운로드 (모의)
app.post('/api/coloring-pages/:id/download', (req, res) => {
  const { id } = req.params;
  
  logger.info('Download request:', { pageId: id });
  
  // 모의 이미지 다운로드
  const mockImageBuffer = Buffer.from('mock-image-data');
  
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="coloring-page-${id}.png"`);
  res.send(mockImageBuffer);
});

// 404 핸들러
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// 서버 시작
app.listen(PORT, () => {
  logger.info(`Simple test server running on port ${PORT}`);
});

export default app;
