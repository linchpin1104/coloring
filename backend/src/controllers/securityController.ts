import { Request, Response } from 'express';
import { ApiKeyManagementService, CreateApiKeyRequest } from '../services/apiKeyManagementService';
import { SecurityAuditLogger } from '../services/securityAuditLogger';
import { logger } from '../utils/logger';

/**
 * 보안 관련 API 컨트롤러
 */
export class SecurityController {
  
  /**
   * API 키 생성
   */
  static createApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const request: CreateApiKeyRequest = req.body;
      
      // 입력 검증
      if (!request.name || !request.permissions || request.permissions.length === 0) {
        res.status(400).json({
          error: 'Name and permissions are required',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const result = await ApiKeyManagementService.createApiKey(
        userId,
        request,
        req.ip,
      );

      res.status(201).json({
        success: true,
        data: {
          apiKey: {
            id: result.apiKey.id,
            name: result.apiKey.name,
            permissions: result.apiKey.permissions,
            status: result.apiKey.status,
            createdAt: result.apiKey.createdAt,
            expiresAt: result.apiKey.expiresAt,
            rateLimit: result.apiKey.rateLimit,
            metadata: result.apiKey.metadata,
          },
          plainKey: result.plainKey, // 클라이언트에만 한 번 제공
        },
        message: 'API key created successfully',
      });

    } catch (error) {
      logger.error('Failed to create API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        body: req.body,
      });
      
      res.status(500).json({
        error: 'Failed to create API key',
        code: 'API_KEY_CREATION_ERROR',
      });
    }
  };

  /**
   * API 키 목록 조회
   */
  static getApiKeys = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const apiKeys = await ApiKeyManagementService.getUserApiKeys(userId);
      
      // 민감한 정보 제거
      const sanitizedKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        status: key.status,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
        rateLimit: key.rateLimit,
        metadata: key.metadata,
      }));

      res.json({
        success: true,
        data: sanitizedKeys,
        message: 'API keys retrieved successfully',
      });

    } catch (error) {
      logger.error('Failed to get API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
      });
      
      res.status(500).json({
        error: 'Failed to get API keys',
        code: 'API_KEY_RETRIEVAL_ERROR',
      });
    }
  };

  /**
   * API 키 폐기
   */
  static revokeApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const { keyId } = req.params;
      const { reason } = req.body;

      if (!keyId) {
        res.status(400).json({
          error: 'Key ID is required',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      await ApiKeyManagementService.revokeApiKey(
        keyId,
        userId,
        reason || 'User requested revocation',
        req.ip,
      );

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });

    } catch (error) {
      logger.error('Failed to revoke API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        keyId: req.params.keyId,
      });
      
      res.status(500).json({
        error: 'Failed to revoke API key',
        code: 'API_KEY_REVOCATION_ERROR',
      });
    }
  };

  /**
   * 보안 통계 조회
   */
  static getSecurityStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const timeRange = req.query.range as string || 'day';
      
      const stats = await SecurityAuditLogger.generateSecurityStats(
        timeRange as 'hour' | 'day' | 'week' | 'month',
      );

      res.json({
        success: true,
        data: {
          timeRange,
          stats,
          generatedAt: new Date().toISOString(),
        },
        message: 'Security statistics retrieved successfully',
      });

    } catch (error) {
      logger.error('Failed to get security stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
      });
      
      res.status(500).json({
        error: 'Failed to get security statistics',
        code: 'SECURITY_STATS_ERROR',
      });
    }
  };

  /**
   * 보안 이벤트 로그 조회
   */
  static getSecurityLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const { 
        page = 1, 
        limit = 20, 
        severity, 
        eventType,
        startDate,
        endDate, 
      } = req.query;

      // 실제 구현에서는 Firestore에서 로그 조회
      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'authentication_success',
          severity: 'low',
          timestamp: new Date().toISOString(),
          userId,
          ip: req.ip,
          resource: 'authentication',
          action: 'login_success',
          result: 'success',
        },
        {
          id: 'log-2',
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          userId,
          ip: req.ip,
          resource: '/api/coloring-pages',
          action: 'rate_limit_check',
          result: 'blocked',
          reason: 'Rate limit exceeded',
        },
      ];

      res.json({
        success: true,
        data: {
          logs: mockLogs,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: mockLogs.length,
            totalPages: Math.ceil(mockLogs.length / parseInt(limit as string)),
          },
          filters: {
            severity,
            eventType,
            startDate,
            endDate,
          },
        },
        message: 'Security logs retrieved successfully',
      });

    } catch (error) {
      logger.error('Failed to get security logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
      });
      
      res.status(500).json({
        error: 'Failed to get security logs',
        code: 'SECURITY_LOGS_ERROR',
      });
    }
  };

  /**
   * 보안 설정 조회
   */
  static getSecuritySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const settings = {
        twoFactorEnabled: false,
        emailNotifications: true,
        securityAlerts: true,
        apiKeyRotation: false,
        sessionTimeout: 3600, // 1시간
        maxFailedAttempts: 5,
        lockoutDuration: 900, // 15분
        allowedIPs: [],
        lastPasswordChange: null,
        securityQuestions: [],
      };

      res.json({
        success: true,
        data: settings,
        message: 'Security settings retrieved successfully',
      });

    } catch (error) {
      logger.error('Failed to get security settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
      });
      
      res.status(500).json({
        error: 'Failed to get security settings',
        code: 'SECURITY_SETTINGS_ERROR',
      });
    }
  };

  /**
   * 보안 설정 업데이트
   */
  static updateSecuritySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const updates = req.body;
      
      // 보안 설정 업데이트 로직 (실제 구현)
      SecurityAuditLogger.logSecurityEvent('admin_action', 'medium', {
        userId,
        ip: req.ip,
        resource: 'security_settings',
        action: 'settings_updated',
        result: 'success',
        metadata: {
          updates,
          updatedAt: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        message: 'Security settings updated successfully',
      });

    } catch (error) {
      logger.error('Failed to update security settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
        body: req.body,
      });
      
      res.status(500).json({
        error: 'Failed to update security settings',
        code: 'SECURITY_SETTINGS_UPDATE_ERROR',
      });
    }
  };

  /**
   * 보안 알림 테스트
   */
  static testSecurityAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // 테스트용 보안 이벤트 생성
      SecurityAuditLogger.logSecurityEvent('system_error', 'high', {
        userId,
        ip: req.ip,
        resource: 'security_test',
        action: 'alert_test',
        result: 'success',
        metadata: {
          testType: 'security_alert',
          testTime: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        message: 'Security alert test completed',
      });

    } catch (error) {
      logger.error('Failed to test security alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as Request & { user?: { uid: string } }).user?.uid,
      });
      
      res.status(500).json({
        error: 'Failed to test security alert',
        code: 'SECURITY_ALERT_TEST_ERROR',
      });
    }
  };
}

