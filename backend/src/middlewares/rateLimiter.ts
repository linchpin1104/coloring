import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

// 기본 Rate Limiter
export const defaultRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
      },
    });
  },
});

// 인증 관련 엄격한 Rate Limiter
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 5 attempts per windowMs
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
});

// 결제 관련 엄격한 Rate Limiter
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 3, // 3 attempts per minute
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Too many payment attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API 키워드 수집 Rate Limiter (더 관대함)
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'API rate limit exceeded, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 다운로드 Rate Limiter
export const downloadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 10 downloads per minute
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Too many download requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// IP별 Rate Limiter (더 엄격함)
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 20, // 20 requests per minute
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: 'Rate limit exceeded for this IP address',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
