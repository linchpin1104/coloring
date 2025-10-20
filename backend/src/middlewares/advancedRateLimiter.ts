import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * 고급 Rate Limiting 서비스
 * API별 세분화된 요청 제한 관리
 */
export class AdvancedRateLimitService {
  
  /**
   * 인증 관련 API - 매우 제한적
   */
  static authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 5회 시도
    message: {
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
      });
    },
    skip: (_req: Request) => {
      // 개발 환경에서는 스킵
      return process.env.NODE_ENV === 'development';
    },
  });

  /**
   * 결제 관련 API - 제한적
   */
  static paymentRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 3, // 3회 시도
    message: {
      error: 'Too many payment attempts',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Payment rate limit exceeded', {
        ip: req.ip,
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too many payment attempts',
        code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute',
      });
    },
  });

  /**
   * 검색 API - 중간 제한
   */
  static searchRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 20, // 20회 검색
    message: {
      error: 'Too many search requests',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Search rate limit exceeded', {
        ip: req.ip,
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        query: req.query.q,
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too many search requests',
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute',
      });
    },
  });

  /**
   * 다운로드 API - 제한적
   */
  static downloadRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 10, // 10회 다운로드
    message: {
      error: 'Too many download requests',
      code: 'DOWNLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Download rate limit exceeded', {
        ip: req.ip,
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        pageId: req.params.pageId,
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too many download requests',
        code: 'DOWNLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute',
      });
    },
  });

  /**
   * 일반 API - 관대함
   */
  static generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 100회 요청
    message: {
      error: 'Too many requests',
      code: 'GENERAL_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('General rate limit exceeded', {
        ip: req.ip,
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too many requests',
        code: 'GENERAL_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
      });
    },
  });

  /**
   * API 키 생성 요청 - 매우 제한적
   */
  static apiKeyRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 1, // 1회만 허용
    message: {
      error: 'API key generation limit exceeded',
      code: 'API_KEY_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.error('API key generation rate limit exceeded', {
        ip: req.ip,
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'API key generation limit exceeded',
        code: 'API_KEY_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 hour',
      });
    },
  });

  /**
   * IP 기반 글로벌 제한
   */
  static globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 1000, // IP당 1000회 요청
    message: {
      error: 'Global rate limit exceeded',
      code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.error('Global rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Global rate limit exceeded',
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
      });
    },
  });

  /**
   * 동적 Rate Limiting
   * 사용자별 맞춤 제한 설정
   */
  static createDynamicRateLimit(options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (_req: Request) => string;
    message?: any;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.maxRequests,
      keyGenerator: options.keyGenerator || ((_req: Request) => _req.ip || 'unknown'),
      message: options.message || {
        error: 'Rate limit exceeded',
        code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn('Dynamic rate limit exceeded', {
          ip: req.ip,
          userId: (req as Request & { user?: { uid: string } }).user?.uid,
          key: options.keyGenerator ? options.keyGenerator(req) : req.ip,
          timestamp: new Date().toISOString(),
        });
        
        res.status(429).json(options.message || {
          error: 'Rate limit exceeded',
          code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
        });
      },
    });
  }

  /**
   * Rate Limit 상태 조회
   */
  static getRateLimitStatus(req: Request): {
    remaining: number;
    resetTime: Date;
    limit: number;
  } {
    const remaining = parseInt(req.get('X-RateLimit-Remaining') || '0');
    const resetTime = new Date(parseInt(req.get('X-RateLimit-Reset') || '0') * 1000);
    const limit = parseInt(req.get('X-RateLimit-Limit') || '0');
    
    return {
      remaining,
      resetTime,
      limit,
    };
  }
}

/**
 * Rate Limiting 미들웨어 조합
 */
export const rateLimiters = {
  auth: AdvancedRateLimitService.authRateLimit,
  payment: AdvancedRateLimitService.paymentRateLimit,
  search: AdvancedRateLimitService.searchRateLimit,
  download: AdvancedRateLimitService.downloadRateLimit,
  general: AdvancedRateLimitService.generalRateLimit,
  apiKey: AdvancedRateLimitService.apiKeyRateLimit,
  global: AdvancedRateLimitService.globalRateLimit,
};

