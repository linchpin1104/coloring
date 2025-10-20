import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { securityMiddlewares } from './middlewares/securityMiddleware';
import { rateLimiters } from './middlewares/advancedRateLimiter';

// 환경 변수 설정
const PORT = process.env['PORT'] || 3001;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const CORS_ORIGIN = process.env['CORS_ORIGIN'] || 'http://localhost:3000';

// Express 앱 생성
const app = express();

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 고급 보안 미들웨어 적용
app.use(securityMiddlewares.securityHeaders);
app.use(securityMiddlewares.requestLogging);
app.use(securityMiddlewares.maskSensitiveData);
app.use(securityMiddlewares.dataIntegrityCheck);
app.use(securityMiddlewares.suspiciousActivityDetection);

// CORS 설정
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 고급 Rate limiting 적용
app.use('/api/', rateLimiters.global);
app.use('/api/auth/', rateLimiters.auth);
app.use('/api/payments/', rateLimiters.payment);
app.use('/api/search/', rateLimiters.search);
app.use('/api/download/', rateLimiters.download);
app.use('/api/security/', rateLimiters.general);

// JSON 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Coloring Platform API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 기존 auth 라우트 제거됨 - 실제 인증 API로 대체

// 색칠놀이 도안 API 라우트
import { 
  generateColoringPage, 
  getColoringPages, 
  getColoringPageById, 
  searchColoringPages, 
  downloadColoringPage, 
} from './controllers/coloringPageController';

// 포인트 API 라우트
import {
  getUserPoints,
  createChargeSession,
  chargePoints,
  downloadWithPoints,
  getUserTransactions,
  checkPointAvailability,
} from './controllers/pointController';

// 마스터 프롬프트 API 라우트
import {
  generateOptimalPrompt,
  collectUserFeedback,
  validateImageQuality,
  startABTest,
  getLearningInsights,
  updateMasterRules,
  updateQualityThreshold,
  updateAgeGroupRequirements,
} from './controllers/masterPromptController';

// 인증 API 라우트
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginWithApple,
  logout,
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  requestEmailVerification,
  deleteAccount,
} from './controllers/authController';

// 인증 미들웨어
import { authenticateToken, requireAdmin } from './middlewares/authMiddleware';

// SEO 관련 API 라우트
import {
  generateSitemap,
  generateRobotsTxt,
  generateStructuredData,
  getLocationBasedContent,
  generateSEOMetadata,
} from './controllers/seoController';

app.post('/api/coloring-pages/generate', generateColoringPage);
app.get('/api/coloring-pages', getColoringPages);
app.get('/api/coloring-pages/:id', getColoringPageById);
app.get('/api/coloring-pages/search', searchColoringPages);
app.post('/api/coloring-pages/:id/download', downloadColoringPage);

// 인증 관련 API
app.post('/api/auth/register', registerWithEmail);
app.post('/api/auth/login', loginWithEmail);
app.post('/api/auth/google', loginWithGoogle);
app.post('/api/auth/apple', loginWithApple);
app.post('/api/auth/logout', authenticateToken, logout);
app.get('/api/auth/profile', authenticateToken, getUserProfile);
app.put('/api/auth/profile', authenticateToken, updateUserProfile);
app.post('/api/auth/password-reset', requestPasswordReset);
app.post('/api/auth/verify-email', authenticateToken, requestEmailVerification);
app.delete('/api/auth/account', authenticateToken, deleteAccount);

// 포인트 관련 API (인증 필요)
app.get('/api/points/balance', authenticateToken, getUserPoints);
app.post('/api/points/charge-session', authenticateToken, createChargeSession);
app.post('/api/points/charge', authenticateToken, chargePoints);
app.post('/api/points/download/:pageId', authenticateToken, downloadWithPoints);
app.get('/api/points/transactions', authenticateToken, getUserTransactions);
app.get('/api/points/check/:pageId', authenticateToken, checkPointAvailability);

// 마스터 프롬프트 관련 API
app.post('/api/prompts/generate', generateOptimalPrompt);
app.post('/api/feedback/collect', authenticateToken, collectUserFeedback);
app.post('/api/quality/validate', validateImageQuality);
app.post('/api/ab-test/start', authenticateToken, startABTest);
app.get('/api/insights/learning', getLearningInsights);
app.put('/api/rules/master', authenticateToken, requireAdmin, updateMasterRules);
app.put('/api/quality/threshold', authenticateToken, requireAdmin, updateQualityThreshold);
app.put('/api/requirements/age-group', authenticateToken, requireAdmin, updateAgeGroupRequirements);

// SEO 관련 API
app.get('/sitemap.xml', generateSitemap);
app.get('/robots.txt', generateRobotsTxt);
app.get('/api/seo/structured-data/:pageId', generateStructuredData);
app.get('/api/seo/location-content', getLocationBasedContent);
app.get('/api/seo/metadata', generateSEOMetadata);

// 보안 관련 API
import securityRoutes from './routes/security';
app.use('/api/security', securityRoutes);

// 캐릭터 관련 API
import characterRoutes from './routes/characters';
app.use('/api/characters', characterRoutes);

// 다국어 검색 API
import multilingualSearchRoutes from './routes/multilingualSearch';
app.use('/api', multilingualSearchRoutes);

// 뉴스레터 API
import newsletterRoutes from './routes/newsletter';
app.use('/api', newsletterRoutes);

app.use('/api/recommendations', (_req, res) => {
  res.json({
    success: true,
    message: 'Recommendation endpoints - Coming soon',
    endpoints: [
      'GET /api/recommendations/user/:userId',
      'GET /api/recommendations/age-group/:ageGroup',
      'GET /api/recommendations/trending',
    ],
  });
});

app.use('/api/search', (_req, res) => {
  res.json({
    success: true,
    message: 'Search endpoints - Coming soon',
    endpoints: [
      'GET /api/search',
      'GET /api/search/suggestions',
      'GET /api/search/trending',
    ],
  });
});

app.use('/api/payments', (_req, res) => {
  res.json({
    success: true,
    message: 'Payment endpoints - Coming soon',
    endpoints: [
      'POST /api/payments/charge-points',
      'POST /api/payments/create-session',
      'GET /api/payments/history',
    ],
  });
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

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: NODE_ENV,
    corsOrigin: CORS_ORIGIN,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;