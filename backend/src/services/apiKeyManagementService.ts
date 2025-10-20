import crypto from 'crypto';
import { logger } from '../utils/logger';
import { SecurityAuditLogger } from './securityAuditLogger';
import { EncryptionService } from './encryptionService';

/**
 * API 키 권한 타입
 */
export type ApiKeyPermission = 
  | 'read:coloring-pages'
  | 'write:coloring-pages'
  | 'read:users'
  | 'write:users'
  | 'read:transactions'
  | 'write:transactions'
  | 'admin:all';

/**
 * API 키 상태
 */
export type ApiKeyStatus = 'active' | 'inactive' | 'revoked' | 'expired';

/**
 * API 키 인터페이스
 */
export interface ApiKey {
  id: string;
  name: string;
  keyHash: string; // 암호화된 키
  permissions: ApiKeyPermission[];
  status: ApiKeyStatus;
  userId: string;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  metadata: {
    description?: string;
    ipWhitelist?: string[];
    userAgentWhitelist?: string[];
  };
}

/**
 * API 키 생성 요청
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: string;
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  metadata?: {
    description?: string;
    ipWhitelist?: string[];
    userAgentWhitelist?: string[];
  };
}

/**
 * API 키 관리 서비스
 */
export class ApiKeyManagementService {
  private static readonly KEY_PREFIX = 'ck_'; // Coloring Key
  private static readonly KEY_LENGTH = 32;
  private static readonly DEFAULT_RATE_LIMITS = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  };

  /**
   * API 키 생성
   */
  static async createApiKey(
    userId: string,
    request: CreateApiKeyRequest,
    ip?: string,
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    try {
      // 권한 검증
      this.validatePermissions(request.permissions);

      // API 키 생성
      const plainKey = this.generateApiKey();
      const keyHash = EncryptionService.hash(plainKey);

      // API 키 객체 생성
      const apiKey: ApiKey = {
        id: crypto.randomUUID(),
        name: request.name,
        keyHash,
        permissions: request.permissions,
        status: 'active',
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: request.expiresAt,
        usageCount: 0,
        rateLimit: {
          requestsPerMinute: request.rateLimit?.requestsPerMinute || this.DEFAULT_RATE_LIMITS.requestsPerMinute,
          requestsPerHour: request.rateLimit?.requestsPerHour || this.DEFAULT_RATE_LIMITS.requestsPerHour,
          requestsPerDay: request.rateLimit?.requestsPerDay || this.DEFAULT_RATE_LIMITS.requestsPerDay,
        },
        metadata: request.metadata || {},
      };

      // Firestore에 저장 (실제 구현)
      // await this.saveApiKey(apiKey);

      // 보안 로그 기록
      SecurityAuditLogger.logApiKeyGenerated(
        userId,
        request.name,
        request.permissions,
        ip,
      );

      logger.info('API key created successfully', {
        keyId: apiKey.id,
        userId,
        permissions: request.permissions,
        createdAt: apiKey.createdAt,
      });

      return { apiKey, plainKey };
    } catch (error) {
      logger.error('Failed to create API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        request,
      });
      throw error;
    }
  }

  /**
   * API 키 검증
   */
  static async validateApiKey(
    apiKey: string,
    requiredPermission: ApiKeyPermission,
    ip?: string,
    userAgent?: string,
  ): Promise<{ isValid: boolean; apiKeyData?: ApiKey; reason?: string }> {
    try {
      const keyHash = EncryptionService.hash(apiKey);
      
      // Firestore에서 API 키 조회 (실제 구현)
      // const apiKeyData = await this.getApiKeyByHash(keyHash);
      const apiKeyData = await this.getMockApiKey(keyHash);

      if (!apiKeyData) {
        SecurityAuditLogger.logSecurityEvent('authorization_failed', 'medium', {
          ip,
          userAgent,
          resource: 'api_key',
          action: 'key_validation',
          result: 'failure',
          reason: 'API key not found',
        });
        return { isValid: false, reason: 'API key not found' };
      }

      // 상태 검증
      if (apiKeyData.status !== 'active') {
        SecurityAuditLogger.logSecurityEvent('authorization_failed', 'medium', {
          userId: apiKeyData.userId,
          ip,
          userAgent,
          resource: 'api_key',
          action: 'key_validation',
          result: 'failure',
          reason: `API key status: ${apiKeyData.status}`,
        });
        return { isValid: false, reason: `API key is ${apiKeyData.status}` };
      }

      // 만료 검증
      if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
        SecurityAuditLogger.logSecurityEvent('authorization_failed', 'medium', {
          userId: apiKeyData.userId,
          ip,
          userAgent,
          resource: 'api_key',
          action: 'key_validation',
          result: 'failure',
          reason: 'API key expired',
        });
        return { isValid: false, reason: 'API key expired' };
      }

      // 권한 검증
      if (!this.hasPermission(apiKeyData.permissions, requiredPermission)) {
        SecurityAuditLogger.logSecurityEvent('authorization_failed', 'medium', {
          userId: apiKeyData.userId,
          ip,
          userAgent,
          resource: 'api_key',
          action: 'permission_check',
          result: 'failure',
          reason: `Missing permission: ${requiredPermission}`,
        });
        return { isValid: false, reason: `Missing permission: ${requiredPermission}` };
      }

      // IP 화이트리스트 검증
      if (apiKeyData.metadata.ipWhitelist && ip) {
        if (!apiKeyData.metadata.ipWhitelist.includes(ip)) {
          SecurityAuditLogger.logSecurityEvent('authorization_failed', 'high', {
            userId: apiKeyData.userId,
            ip,
            userAgent,
            resource: 'api_key',
            action: 'ip_validation',
            result: 'failure',
            reason: 'IP not in whitelist',
          });
          return { isValid: false, reason: 'IP not in whitelist' };
        }
      }

      // 사용량 업데이트
      await this.updateApiKeyUsage(apiKeyData.id);

      return { isValid: true, apiKeyData };
    } catch (error) {
      logger.error('API key validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKey: EncryptionService.maskEmail(apiKey),
        ip,
        userAgent,
      });
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * API 키 폐기
   */
  static async revokeApiKey(
    keyId: string,
    userId: string,
    reason: string,
    ip?: string,
  ): Promise<void> {
    try {
      // Firestore에서 API 키 상태 업데이트 (실제 구현)
      // await this.updateApiKeyStatus(keyId, 'revoked');

      // 보안 로그 기록
      SecurityAuditLogger.logApiKeyRevoked(userId, keyId, reason, ip);

      logger.info('API key revoked successfully', {
        keyId,
        userId,
        reason,
        revokedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to revoke API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId,
        userId,
        reason,
      });
      throw error;
    }
  }

  /**
   * 사용자의 API 키 목록 조회
   */
  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      // Firestore에서 사용자의 API 키 목록 조회 (실제 구현)
      // return await this.getApiKeysByUserId(userId);
      return await this.getMockUserApiKeys(userId);
    } catch (error) {
      logger.error('Failed to get user API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * API 키 생성
   */
  private static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    return this.KEY_PREFIX + randomBytes.toString('hex');
  }

  /**
   * 권한 검증
   */
  private static validatePermissions(permissions: ApiKeyPermission[]): void {
    if (!permissions || permissions.length === 0) {
      throw new Error('At least one permission is required');
    }

    const validPermissions: ApiKeyPermission[] = [
      'read:coloring-pages',
      'write:coloring-pages',
      'read:users',
      'write:users',
      'read:transactions',
      'write:transactions',
      'admin:all',
    ];

    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
  }

  /**
   * 권한 확인
   */
  private static hasPermission(
    userPermissions: ApiKeyPermission[],
    requiredPermission: ApiKeyPermission,
  ): boolean {
    // admin:all 권한이 있으면 모든 권한 허용
    if (userPermissions.includes('admin:all')) {
      return true;
    }

    return userPermissions.includes(requiredPermission);
  }

  /**
   * API 키 사용량 업데이트
   */
  private static async updateApiKeyUsage(keyId: string): Promise<void> {
    try {
      // Firestore에서 사용량 업데이트 (실제 구현)
      // await this.incrementApiKeyUsage(keyId);
      
      logger.debug('API key usage updated', { keyId });
    } catch (error) {
      logger.error('Failed to update API key usage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId,
      });
    }
  }

  /**
   * Mock API 키 데이터 (개발용)
   */
  private static async getMockApiKey(keyHash: string): Promise<ApiKey | null> {
    // 개발 환경에서만 사용
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const mockApiKey: ApiKey = {
      id: 'mock-key-id',
      name: 'Development API Key',
      keyHash,
      permissions: ['read:coloring-pages', 'write:coloring-pages'],
      status: 'active',
      userId: 'mock-user-id',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
      metadata: {
        description: 'Mock API key for development',
      },
    };

    return mockApiKey;
  }

  /**
   * Mock 사용자 API 키 목록 (개발용)
   */
  private static async getMockUserApiKeys(userId: string): Promise<ApiKey[]> {
    // 개발 환경에서만 사용
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    return [
      {
        id: 'mock-key-1',
        name: 'Development API Key 1',
        keyHash: 'mock-hash-1',
        permissions: ['read:coloring-pages'],
        status: 'active',
        userId,
        createdAt: new Date().toISOString(),
        usageCount: 150,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
        },
        metadata: {
          description: 'Mock API key for development',
        },
      },
    ];
  }
}

