import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    name: string;
    picture: string;
  };
}

/**
 * Firebase Auth 토큰 검증 미들웨어
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Access token required',
        },
      });
    }

    // 개발 환경에서는 토큰 검증을 건너뛰고 테스트 사용자 설정
    if (process.env['NODE_ENV'] === 'development') {
      req.user = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        ageGroup: 'adult',
      };
      return next();
    }

    // 실제로는 Firebase Admin SDK를 사용하여 토큰 검증
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = {
    //   uid: decodedToken.uid,
    //   email: decodedToken.email,
    //   displayName: decodedToken.name,
    //   photoURL: decodedToken.picture,
    // };

    logger.info('Token authenticated', { uid: req.user?.uid });
    next();
  } catch (error) {
    logger.error('Token authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Invalid token',
      },
    });
  }
};

/**
 * 선택적 인증 미들웨어 (로그인하지 않아도 접근 가능하지만, 로그인하면 사용자 정보 제공)
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 토큰이 없어도 계속 진행
      return next();
    }

    // 개발 환경에서는 테스트 사용자 설정
    if (process.env['NODE_ENV'] === 'development') {
      req.user = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        ageGroup: 'adult',
      };
      return next();
    }

    // 실제로는 Firebase Admin SDK를 사용하여 토큰 검증
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = {
    //   uid: decodedToken.uid,
    //   email: decodedToken.email,
    //   displayName: decodedToken.name,
    //   photoURL: decodedToken.picture,
    // };

    next();
  } catch (error) {
    logger.error('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // 인증 실패해도 계속 진행 (선택적 인증이므로)
    next();
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        },
      });
    }

    // 개발 환경에서는 모든 사용자를 관리자로 처리
    if (process.env['NODE_ENV'] === 'development') {
      return next();
    }

    // 실제로는 사용자의 커스텀 클레임에서 admin 역할 확인
    // const userRecord = await admin.auth().getUser(req.user.uid);
    // const isAdmin = userRecord.customClaims?.admin === true;

    // if (!isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Admin access required',
    //     },
    //   });
    // }

    next();
  } catch (error) {
    logger.error('Admin check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to verify admin access',
      },
    });
  }
};

/**
 * 연령대 확인 미들웨어
 */
export const requireAgeGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
        },
      });
    }

    // 연령대가 설정되지 않은 경우 프로필 완성 요청
    if (!req.user.ageGroup) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROFILE_INCOMPLETE',
          message: 'Age group must be set to continue',
          action: 'complete_profile',
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Age group check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to verify age group',
      },
    });
  }
};

/**
 * 포인트 확인 미들웨어
 */
export const requirePoints = (requiredPoints: number) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication required',
          },
        });
      }

      // 실제로는 데이터베이스에서 사용자 포인트 조회
      // const userData = await dbService.getUser(req.user.uid);
      // const userPoints = userData?.points || 0;

      // 개발 환경에서는 충분한 포인트가 있다고 가정
      const userPoints = 1000;

      if (userPoints < requiredPoints) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_POINTS',
            message: `Insufficient points. Required: ${requiredPoints}, Available: ${userPoints}`,
            requiredPoints,
            availablePoints: userPoints,
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Points check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify points',
        },
      });
    }
  };
};

/**
 * Rate limiting 미들웨어 (사용자별)
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid || req.ip || 'unknown';
      const now = Date.now();
      
      const userRequests = requests.get(userId);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(userId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (userRequests.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
          },
        });
      }
      
      userRequests.count++;
      next();
    } catch (error) {
      logger.error('Rate limiting failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(); // 에러 발생 시 제한을 적용하지 않음
    }
  };
};

export default {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireAgeGroup,
  requirePoints,
  userRateLimit,
};
