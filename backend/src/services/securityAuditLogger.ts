import { logger } from '../utils/logger';
import { EncryptionService } from '../services/encryptionService';

/**
 * 보안 이벤트 심각도 레벨
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * 보안 이벤트 타입
 */
export type SecurityEventType = 
  | 'authentication_failed'
  | 'authentication_success'
  | 'authorization_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'data_access'
  | 'data_modification'
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failed'
  | 'api_key_generated'
  | 'api_key_revoked'
  | 'admin_action'
  | 'system_error'
  | 'data_breach_attempt';

/**
 * 보안 감사 로그 서비스
 */
export class SecurityAuditLogger {
  
  /**
   * 보안 이벤트 로깅
   */
  static logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    details: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      sessionId?: string;
      resource?: string;
      action?: string;
      result?: 'success' | 'failure' | 'blocked';
      reason?: string;
      metadata?: any;
    },
  ): void {
    const logData = {
      eventType,
      severity,
      timestamp: new Date().toISOString(),
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
      resource: details.resource,
      action: details.action,
      result: details.result,
      reason: details.reason,
      metadata: this.sanitizeMetadata(details.metadata),
    };

    // 심각도에 따른 로그 레벨 결정
    const logLevel = this.getLogLevel(severity);
    logger[logLevel]('Security event detected', logData);

    // Critical 이벤트는 별도 알림
    if (severity === 'critical') {
      this.sendCriticalAlert(logData);
    }
  }

  /**
   * 인증 실패 로깅
   */
  static logFailedAuthAttempt(
    email: string,
    ip: string,
    reason: string,
    userAgent?: string,
  ): void {
    this.logSecurityEvent('authentication_failed', 'high', {
      ip,
      userAgent,
      resource: 'authentication',
      action: 'login_attempt',
      result: 'failure',
      reason,
      metadata: {
        email: EncryptionService.maskEmail(email),
        attemptTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 인증 성공 로깅
   */
  static logSuccessfulAuth(
    userId: string,
    email: string,
    ip: string,
    userAgent?: string,
  ): void {
    this.logSecurityEvent('authentication_success', 'low', {
      userId,
      ip,
      userAgent,
      resource: 'authentication',
      action: 'login_success',
      result: 'success',
      metadata: {
        email: EncryptionService.maskEmail(email),
        loginTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 권한 부족 로깅
   */
  static logAuthorizationFailed(
    userId: string,
    resource: string,
    action: string,
    ip?: string,
  ): void {
    this.logSecurityEvent('authorization_failed', 'medium', {
      userId,
      ip,
      resource,
      action,
      result: 'failure',
      reason: 'Insufficient permissions',
      metadata: {
        attemptTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Rate Limit 초과 로깅
   */
  static logRateLimitExceeded(
    ip: string,
    endpoint: string,
    limitType: string,
    userAgent?: string,
  ): void {
    this.logSecurityEvent('rate_limit_exceeded', 'medium', {
      ip,
      userAgent,
      resource: endpoint,
      action: 'rate_limit_check',
      result: 'blocked',
      reason: `${limitType} rate limit exceeded`,
      metadata: {
        endpoint,
        limitType,
        blockedTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 의심스러운 활동 로깅
   */
  static logSuspiciousActivity(
    userId: string,
    activity: string,
    details: any,
    ip?: string,
  ): void {
    this.logSecurityEvent('suspicious_activity', 'high', {
      userId,
      ip,
      resource: 'user_activity',
      action: activity,
      result: 'blocked',
      reason: 'Suspicious activity detected',
      metadata: {
        activity,
        details: this.sanitizeMetadata(details),
        detectedTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 데이터 접근 로깅
   */
  static logDataAccess(
    userId: string,
    resource: string,
    action: string,
    dataType: string,
    ip?: string,
  ): void {
    this.logSecurityEvent('data_access', 'low', {
      userId,
      ip,
      resource,
      action,
      result: 'success',
      metadata: {
        dataType,
        accessTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 데이터 수정 로깅
   */
  static logDataModification(
    userId: string,
    resource: string,
    action: string,
    changes: any,
    ip?: string,
  ): void {
    this.logSecurityEvent('data_modification', 'medium', {
      userId,
      ip,
      resource,
      action,
      result: 'success',
      metadata: {
        changes: this.sanitizeMetadata(changes),
        modificationTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 결제 시도 로깅
   */
  static logPaymentAttempt(
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    ip?: string,
  ): void {
    this.logSecurityEvent('payment_attempt', 'medium', {
      userId,
      ip,
      resource: 'payment',
      action: 'payment_initiated',
      result: 'success',
      metadata: {
        amount: EncryptionService.maskCardNumber(amount.toString()),
        currency,
        paymentMethod,
        attemptTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 결제 성공 로깅
   */
  static logPaymentSuccess(
    userId: string,
    transactionId: string,
    amount: number,
    ip?: string,
  ): void {
    this.logSecurityEvent('payment_success', 'low', {
      userId,
      ip,
      resource: 'payment',
      action: 'payment_completed',
      result: 'success',
      metadata: {
        transactionId,
        amount: EncryptionService.maskCardNumber(amount.toString()),
        completionTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 결제 실패 로깅
   */
  static logPaymentFailure(
    userId: string,
    reason: string,
    amount: number,
    ip?: string,
  ): void {
    this.logSecurityEvent('payment_failed', 'high', {
      userId,
      ip,
      resource: 'payment',
      action: 'payment_failed',
      result: 'failure',
      reason,
      metadata: {
        amount: EncryptionService.maskCardNumber(amount.toString()),
        failureTime: new Date().toISOString(),
      },
    });
  }

  /**
   * API 키 생성 로깅
   */
  static logApiKeyGenerated(
    userId: string,
    keyName: string,
    permissions: string[],
    ip?: string,
  ): void {
    this.logSecurityEvent('api_key_generated', 'medium', {
      userId,
      ip,
      resource: 'api_key',
      action: 'key_generated',
      result: 'success',
      metadata: {
        keyName,
        permissions,
        generationTime: new Date().toISOString(),
      },
    });
  }

  /**
   * API 키 폐기 로깅
   */
  static logApiKeyRevoked(
    userId: string,
    keyId: string,
    reason: string,
    ip?: string,
  ): void {
    this.logSecurityEvent('api_key_revoked', 'medium', {
      userId,
      ip,
      resource: 'api_key',
      action: 'key_revoked',
      result: 'success',
      reason,
      metadata: {
        keyId,
        revocationTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 관리자 작업 로깅
   */
  static logAdminAction(
    adminUserId: string,
    action: string,
    targetResource: string,
    details: any,
    ip?: string,
  ): void {
    this.logSecurityEvent('admin_action', 'high', {
      userId: adminUserId,
      ip,
      resource: targetResource,
      action,
      result: 'success',
      metadata: {
        adminAction: action,
        targetResource,
        details: this.sanitizeMetadata(details),
        actionTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 시스템 에러 로깅
   */
  static logSystemError(
    error: Error,
    context: string,
    userId?: string,
    ip?: string,
  ): void {
    this.logSecurityEvent('system_error', 'high', {
      userId,
      ip,
      resource: 'system',
      action: 'error_occurred',
      result: 'failure',
      reason: error.message,
      metadata: {
        errorType: error.name,
        context,
        stack: error.stack,
        errorTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 데이터 유출 시도 로깅
   */
  static logDataBreachAttempt(
    userId: string,
    resource: string,
    attemptDetails: any,
    ip?: string,
  ): void {
    this.logSecurityEvent('data_breach_attempt', 'critical', {
      userId,
      ip,
      resource,
      action: 'breach_attempt',
      result: 'blocked',
      reason: 'Data breach attempt detected',
      metadata: {
        attemptDetails: this.sanitizeMetadata(attemptDetails),
        detectionTime: new Date().toISOString(),
      },
    });
  }

  /**
   * 민감한 정보 제거 (메타데이터 정리)
   */
  private static sanitizeMetadata(metadata: any): any {
    if (!metadata) {return metadata;}

    const sanitized = { ...metadata };
    
    // 민감한 필드 제거
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'cardNumber',
      'cvv',
      'ssn',
      'personalInfo',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  /**
   * 심각도에 따른 로그 레벨 결정
   */
  private static getLogLevel(severity: SecuritySeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warn';
    case 'low':
    default:
      return 'info';
    }
  }

  /**
   * Critical 이벤트 알림 전송
   */
  private static sendCriticalAlert(logData: any): void {
    // 실제 구현에서는 Slack, 이메일, SMS 등으로 알림
    logger.error('CRITICAL SECURITY ALERT', {
      ...logData,
      alertSent: true,
      alertTime: new Date().toISOString(),
    });
  }

  /**
   * 보안 통계 생성
   */
  static async generateSecurityStats(_timeRange: 'hour' | 'day' | 'week' | 'month'): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    topIPs: Array<{ ip: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    // 실제 구현에서는 Firestore에서 통계 조회
    return {
      totalEvents: 0,
      eventsByType: {} as Record<SecurityEventType, number>,
      eventsBySeverity: {} as Record<SecuritySeverity, number>,
      topIPs: [],
      topUsers: [],
    };
  }
}

