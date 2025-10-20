import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  memoryUsage?: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // 최대 1000개 메트릭 저장

  /**
   * 성능 모니터링 미들웨어
   */
  monitor() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      // 응답 완료 시 메트릭 수집
      res.on('finish', () => {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const responseTime = endTime - startTime;

        const metric: PerformanceMetrics = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
          },
        };

        this.addMetric(metric);
        this.logSlowRequests(metric);
      });

      next();
    };
  }

  /**
   * 메트릭 추가
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // 최대 개수 초과 시 오래된 메트릭 제거
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 느린 요청 로깅
   */
  private logSlowRequests(metric: PerformanceMetrics): void {
    const slowThreshold = 2000; // 2초 이상
    const verySlowThreshold = 5000; // 5초 이상

    if (metric.responseTime >= verySlowThreshold) {
      logger.warn('Very slow request detected', {
        method: metric.method,
        url: metric.url,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
        memoryDelta: metric.memoryUsage,
      });
    } else if (metric.responseTime >= slowThreshold) {
      logger.info('Slow request detected', {
        method: metric.method,
        url: metric.url,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      });
    }
  }

  /**
   * 성능 통계 조회
   */
  getStats(timeWindow?: number): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    topSlowEndpoints: Array<{ endpoint: string; avgResponseTime: number; count: number }>;
    memoryUsage: {
      average: number;
      peak: number;
    };
  } {
    let filteredMetrics = this.metrics;

    // 시간 윈도우 필터링
    if (timeWindow) {
      const cutoffTime = Date.now() - timeWindow;
      filteredMetrics = this.metrics.filter(
        metric => new Date(metric.timestamp).getTime() > cutoffTime,
      );
    }

    const totalRequests = filteredMetrics.length;
    const averageResponseTime = totalRequests > 0
      ? filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / totalRequests
      : 0;

    const slowRequests = filteredMetrics.filter(metric => metric.responseTime > 2000).length;
    const errorRequests = filteredMetrics.filter(metric => metric.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // 상위 느린 엔드포인트
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    filteredMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.url}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1,
      });
    });

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // 메모리 사용량 통계
    const memoryDeltas = filteredMetrics
      .filter(metric => metric.memoryUsage)
      .map(metric => metric.memoryUsage!.heapUsed);
    
    const averageMemory = memoryDeltas.length > 0
      ? memoryDeltas.reduce((sum, delta) => sum + delta, 0) / memoryDeltas.length
      : 0;
    
    const peakMemory = memoryDeltas.length > 0 ? Math.max(...memoryDeltas) : 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      topSlowEndpoints,
      memoryUsage: {
        average: Math.round(averageMemory / 1024 / 1024), // MB
        peak: Math.round(peakMemory / 1024 / 1024), // MB
      },
    };
  }

  /**
   * 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }

  /**
   * 헬스 체크용 메트릭
   */
  getHealthMetrics(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    metrics: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    } {
    const stats = this.getStats(5 * 60 * 1000); // 최근 5분
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // 상태 판단
    if (stats.averageResponseTime > 5000 || stats.errorRate > 10) {
      status = 'critical';
    } else if (stats.averageResponseTime > 2000 || stats.errorRate > 5) {
      status = 'warning';
    }

    return {
      status,
      uptime,
      memoryUsage,
      metrics: {
        totalRequests: stats.totalRequests,
        averageResponseTime: stats.averageResponseTime,
        errorRate: stats.errorRate,
      },
    };
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

