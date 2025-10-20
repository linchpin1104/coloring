import { Router } from 'express';
import { SecurityController } from '../controllers/securityController';
import { securityMiddlewares } from '../middlewares/securityMiddleware';
import { rateLimiters } from '../middlewares/advancedRateLimiter';
import { verifyToken } from '../middlewares/auth';

const router = Router();

// 보안 헤더 적용
router.use(securityMiddlewares.securityHeaders);

// 요청 로깅
router.use(securityMiddlewares.requestLogging);

// 민감한 데이터 마스킹
router.use(securityMiddlewares.maskSensitiveData);

// 데이터 무결성 검증
router.use(securityMiddlewares.dataIntegrityCheck);

// 의심스러운 활동 탐지
router.use(securityMiddlewares.suspiciousActivityDetection);

// API 키 관리 라우트
router.post('/api-keys', 
  rateLimiters.apiKey,
  verifyToken,
  SecurityController.createApiKey,
);

router.get('/api-keys',
  rateLimiters.general,
  verifyToken,
  SecurityController.getApiKeys,
);

router.delete('/api-keys/:keyId',
  rateLimiters.general,
  verifyToken,
  SecurityController.revokeApiKey,
);

// 보안 통계 및 로그 라우트
router.get('/stats',
  rateLimiters.general,
  verifyToken,
  SecurityController.getSecurityStats,
);

router.get('/logs',
  rateLimiters.general,
  verifyToken,
  SecurityController.getSecurityLogs,
);

// 보안 설정 라우트
router.get('/settings',
  rateLimiters.general,
  verifyToken,
  SecurityController.getSecuritySettings,
);

router.put('/settings',
  rateLimiters.general,
  verifyToken,
  SecurityController.updateSecuritySettings,
);

// 보안 알림 테스트
router.post('/test-alert',
  rateLimiters.general,
  verifyToken,
  SecurityController.testSecurityAlert,
);

export default router;

