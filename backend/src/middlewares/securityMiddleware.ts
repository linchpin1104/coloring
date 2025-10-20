import { Request, Response, NextFunction } from 'express';
import { SecurityAuditLogger } from '../services/securityAuditLogger';
import { ApiKeyManagementService } from '../services/apiKeyManagementService';
import { EncryptionService } from '../services/encryptionService';
import { logger } from '../utils/logger';

/**
 * 보안 미들웨어 통합 서비스
 */
export class SecurityMiddleware {
  
  /**
   * API 키 인증 미들웨어
   */
  static apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        SecurityAuditLogger.logSecurityEvent('authorization_failed', 'medium', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          resource: req.path,
          action: 'api_key_auth',
          result: 'failure',
          reason: 'API key not provided',
        });
        
        res.status(401).json({
          error: 'API key required',
          code: 'API_KEY_REQUIRED',
        });
        return;
      }

      const validation = await ApiKeyManagementService.validateApiKey(
        apiKey,
        this.getRequiredPermission(req.path, req.method),
        req.ip,
        req.get('User-Agent'),
      );

      if (!validation.isValid) {
        res.status(403).json({
          error: 'Invalid API key',
          code: 'INVALID_API_KEY',
          reason: validation.reason,
        });
        return;
      }

      // API 키 정보를 요청 객체에 추가
      (req as any).apiKey = validation.apiKeyData;
      next();
    } catch (error) {
      logger.error('API key authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        path: req.path,
      });
      
      res.status(500).json({
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR',
      });
    }
  };

  /**
   * 보안 헤더 미들웨어
   */
  static securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // 보안 헤더 설정
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', 'default-src \'self\'');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // 개발 환경에서는 일부 헤더 완화
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    }
    
    next();
  };

  /**
   * 요청 로깅 미들웨어
   */
  static requestLogging = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // 응답 완료 시 로깅
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = (req as any).user?.uid || (req as any).apiKey?.userId;
      
      SecurityAuditLogger.logDataAccess(
        userId,
        req.path,
        req.method,
        'api_request',
        req.ip,
      );
      
      logger.info('API request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    });
    
    next();
  };

  /**
   * 민감한 데이터 마스킹 미들웨어
   */
  static maskSensitiveData = (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          const masked = SecurityMiddleware.maskSensitiveFields(parsed);
          return originalSend.call(this, JSON.stringify(masked));
        } catch {
          return originalSend.call(this, data);
        }
      }
      return originalSend.call(this, data);
    };
    
    next();
  };

  /**
   * 의심스러운 활동 탐지 미들웨어
   */
  static suspiciousActivityDetection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.uid || (req as any).apiKey?.userId;
      const { ip } = req;
      const userAgent = req.get('User-Agent');
      
      // 의심스러운 패턴 검사
      const suspiciousPatterns = [
        this.checkUnusualAccessPattern(req),
        this.checkSuspiciousUserAgent(userAgent),
        this.checkSuspiciousIP(ip),
        this.checkBulkRequestPattern(req),
      ];
      
      const suspiciousScore = suspiciousPatterns.reduce((sum, pattern) => sum + pattern, 0);
      
      if (suspiciousScore > 0.7) {
        SecurityAuditLogger.logSuspiciousActivity(
          userId,
          'suspicious_request_pattern',
          {
            suspiciousScore,
            patterns: suspiciousPatterns,
            request: {
              method: req.method,
              path: req.path,
              ip,
              userAgent,
            },
          },
          ip,
        );
        
        res.status(429).json({
          error: 'Suspicious activity detected',
          code: 'SUSPICIOUS_ACTIVITY',
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Suspicious activity detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        path: req.path,
      });
      next();
    }
  };

  /**
   * 데이터 무결성 검증 미들웨어
   */
  static dataIntegrityCheck = (req: Request, res: Response, next: NextFunction): void => {
    // 요청 데이터 무결성 검증
    if (req.body && typeof req.body === 'object') {
      const dataHash = EncryptionService.hash(JSON.stringify(req.body));
      (req as any).dataHash = dataHash;
    }
    
    next();
  };

  /**
   * 필요한 권한 결정
   */
  private static getRequiredPermission(path: string, method: string): any {
    // 경로와 메서드에 따른 권한 매핑
    const permissionMap: Record<string, Record<string, any>> = {
      '/api/coloring-pages': {
        'GET': 'read:coloring-pages',
        'POST': 'write:coloring-pages',
        'PUT': 'write:coloring-pages',
        'DELETE': 'write:coloring-pages',
      },
      '/api/users': {
        'GET': 'read:users',
        'POST': 'write:users',
        'PUT': 'write:users',
        'DELETE': 'write:users',
      },
      '/api/transactions': {
        'GET': 'read:transactions',
        'POST': 'write:transactions',
        'PUT': 'write:transactions',
        'DELETE': 'write:transactions',
      },
    };
    
    return permissionMap[path]?.[method] || 'read:coloring-pages';
  }

  /**
   * 민감한 필드 마스킹
   */
  private static maskSensitiveFields(data: any): any {
    if (!data || typeof data !== 'object') {return data;}
    
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'phone'];
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        if (field === 'email') {
          masked[field] = EncryptionService.maskEmail(masked[field]);
        } else if (field === 'phone') {
          masked[field] = EncryptionService.maskPhoneNumber(masked[field]);
        } else {
          masked[field] = '***';
        }
      }
    }
    
    return masked;
  }

  /**
   * 비정상적인 접근 패턴 검사
   */
  private static checkUnusualAccessPattern(req: Request): number {
    // 시간대 검사 (새벽 시간 접근)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {return 0.3;}
    
    // 빠른 연속 요청 검사
    const requestCount = (req as any).requestCount || 0;
    if (requestCount > 10) {return 0.4;}
    
    return 0;
  }

  /**
   * 의심스러운 User-Agent 검사
   */
  private static checkSuspiciousUserAgent(userAgent?: string): number {
    if (!userAgent) {return 0.2;}
    
    const suspiciousPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'curl', 'wget', 'python', 'java',
    ];
    
    const lowerUA = userAgent.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (lowerUA.includes(pattern)) {return 0.3;}
    }
    
    return 0;
  }

  /**
   * 의심스러운 IP 검사
   */
  private static checkSuspiciousIP(ip?: string): number {
    if (!ip) {return 0.1;}
    
    // 프라이빗 IP 대역 검사
    const privateIPs = [
      '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
      '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    ];
    
    for (const privateIP of privateIPs) {
      if (ip.startsWith(privateIP)) {return 0.2;}
    }
    
    return 0;
  }

  /**
   * 대량 요청 패턴 검사
   */
  private static checkBulkRequestPattern(req: Request): number {
    // 대량 데이터 요청 검사
    const { limit } = req.query;
    if (limit && parseInt(limit as string) > 1000) {return 0.4;}
    
    // 대량 삭제 요청 검사
    if (req.method === 'DELETE' && req.path.includes('bulk')) {return 0.5;}
    
    return 0;
  }
}

/**
 * 보안 미들웨어 조합
 */
export const securityMiddlewares = {
  apiKeyAuth: SecurityMiddleware.apiKeyAuth,
  securityHeaders: SecurityMiddleware.securityHeaders,
  requestLogging: SecurityMiddleware.requestLogging,
  maskSensitiveData: SecurityMiddleware.maskSensitiveData,
  suspiciousActivityDetection: SecurityMiddleware.suspiciousActivityDetection,
  dataIntegrityCheck: SecurityMiddleware.dataIntegrityCheck,
};

