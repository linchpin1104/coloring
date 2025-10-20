import { Request, Response, NextFunction } from 'express';
import { auth } from '@/config/firebase';
import { ApiError, ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

// Firebase Auth 토큰 검증
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        'Authorization header missing or invalid',
        401,
        ErrorCodes.UNAUTHORIZED,
      );
    }

    const [, token] = authHeader.split('Bearer ');
    
    if (!token) {
      throw new ApiError(
        'Token not provided',
        401,
        ErrorCodes.UNAUTHORIZED,
      );
    }

    // Firebase Admin SDK로 토큰 검증
    const decodedToken = await auth.verifyIdToken(token);
    
    // 요청 객체에 사용자 정보 추가
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    logger.info(`User authenticated: ${req.user.uid}`);
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(
        'Invalid or expired token',
        401,
        ErrorCodes.INVALID_TOKEN,
      ));
    }
  }
};

// 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 토큰이 없으면 그냥 통과
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next();
    }

    // 토큰이 있으면 검증
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    logger.info(`User authenticated (optional): ${req.user.uid}`);
    next();
  } catch (error) {
    logger.warn('Optional token verification failed:', error);
    // 선택적 인증이므로 에러를 무시하고 통과
    next();
  }
};

// 사용자 정보를 Request 타입에 추가
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        emailVerified: boolean;
        name: string;
        picture: string;
      };
    }
  }
}
