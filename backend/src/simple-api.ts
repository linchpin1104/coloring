import express from 'express';
import cors from 'cors';
import * as path from 'path';

const app = express();
const PORT = process.env['PORT'] || 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// Mock 데이터
const mockColoringPages = [
  {
    id: '1',
    characterName: '도라에몽',
    characterType: 'anime',
    originCountry: '일본',
    ageGroup: 'child',
    difficulty: 'easy',
    theme: '모험',
    activity: '날아다니기',
    emotion: '행복',
    imageUrl: '/images/doraemon.png',
    thumbnailUrl: '/images/doraemon-thumb.png',
    downloads: 150,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '도라에몽 색칠 도안',
      generationTime: 5,
      qualityScore: 0.95,
    },
  },
  {
    id: '2',
    characterName: '피카츄',
    characterType: 'game',
    originCountry: '일본',
    ageGroup: 'child',
    difficulty: 'easy',
    theme: '전투',
    activity: '전기 공격',
    emotion: '귀여움',
    imageUrl: '/images/pikachu.png',
    thumbnailUrl: '/images/pikachu-thumb.png',
    downloads: 200,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '피카츄 색칠 도안',
      generationTime: 5,
      qualityScore: 0.93,
    },
  },
  {
    id: '3',
    characterName: '하츄핑',
    characterType: 'cartoon',
    originCountry: '한국',
    ageGroup: 'child',
    difficulty: 'easy',
    theme: '일상',
    activity: '춤추기',
    emotion: '즐거움',
    imageUrl: '/images/hacheuping.png',
    thumbnailUrl: '/images/hacheuping-thumb.png',
    downloads: 180,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '하츄핑 색칠 도안',
      generationTime: 5,
      qualityScore: 0.94,
    },
  },
  {
    id: '4',
    characterName: '아이언미야옹',
    characterType: 'cartoon',
    originCountry: '한국',
    ageGroup: 'child',
    difficulty: 'medium',
    theme: '액션',
    activity: '전투',
    emotion: '용감함',
    imageUrl: '/images/iron-miyaong.png',
    thumbnailUrl: '/images/iron-miyaong-thumb.png',
    downloads: 120,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '아이언미야옹 색칠 도안',
      generationTime: 5,
      qualityScore: 0.92,
    },
  },
  {
    id: '5',
    characterName: '미키마우스',
    characterType: 'cartoon',
    originCountry: '미국',
    ageGroup: 'child',
    difficulty: 'easy',
    theme: '모험',
    activity: '여행',
    emotion: '즐거움',
    imageUrl: '/images/mickey.png',
    thumbnailUrl: '/images/mickey-thumb.png',
    downloads: 250,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '미키마우스 색칠 도안',
      generationTime: 5,
      qualityScore: 0.96,
    },
  },
  {
    id: '6',
    characterName: '배트맨',
    characterType: 'comic',
    originCountry: '미국',
    ageGroup: 'teen',
    difficulty: 'hard',
    theme: '액션',
    activity: '전투',
    emotion: '정의',
    imageUrl: '/images/batman.png',
    thumbnailUrl: '/images/batman-thumb.png',
    downloads: 190,
    createdAt: new Date().toISOString(),
    metadata: {
      prompt: '배트맨 색칠 도안',
      generationTime: 5,
      qualityScore: 0.91,
    },
  },
];

// API 라우트
app.get('/api/coloring-pages', (req, res) => {
  const { ageGroup, difficulty, characterName } = req.query;
  
  let filtered = [...mockColoringPages];
  
  if (ageGroup) {
    filtered = filtered.filter(page => page.ageGroup === ageGroup);
  }
  if (difficulty) {
    filtered = filtered.filter(page => page.difficulty === difficulty);
  }
  if (characterName) {
    filtered = filtered.filter(page => 
      page.characterName.toLowerCase().includes((characterName as string).toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: {
      pages: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: 1,
      },
    },
    message: 'Coloring pages fetched successfully',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// 프론트엔드 정적 파일 제공
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA fallback - 모든 라우트를 index.html로
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🎨 Coloring Platform Server Started     ║
╚════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
📁 Frontend: ${frontendDistPath}
🔧 Environment: development
⏰ Started at: ${new Date().toLocaleString('ko-KR')}

Available endpoints:
  - GET  /                     → Frontend
  - GET  /api/health          → Health check
  - GET  /api/coloring-pages  → Get coloring pages

Mock data loaded: ${mockColoringPages.length} coloring pages
  `);
});

export default app;

