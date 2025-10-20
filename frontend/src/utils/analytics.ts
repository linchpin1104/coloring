import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 설정
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

interface AnalyticsConfig {
  measurementId: string;
  debugMode?: boolean;
}

class GoogleAnalytics {
  private measurementId: string;
  private debugMode: boolean;
  private isInitialized: boolean = false;

  constructor(config: AnalyticsConfig) {
    this.measurementId = config.measurementId;
    this.debugMode = config.debugMode || false;
  }

  /**
   * Google Analytics 초기화
   */
  initialize(): void {
    if (this.isInitialized) {return;}

    // Google Analytics 스크립트 로드
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script1);

    // gtag 초기화
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args: unknown[]) {
      window.dataLayer.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      debug_mode: this.debugMode,
      send_page_view: false, // 수동으로 페이지뷰 전송
    });

    this.isInitialized = true;
    console.log('Google Analytics 4 initialized');
  }

  /**
   * 페이지뷰 추적
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isInitialized) {return;}

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle,
    });

    if (this.debugMode) {
      console.log('Page view tracked:', { pagePath, pageTitle });
    }
  }

  /**
   * 이벤트 추적
   */
  trackEvent(eventName: string, parameters?: Record<string, unknown>): void {
    if (!this.isInitialized) {return;}

    window.gtag('event', eventName, {
      ...parameters,
      event_category: parameters?.event_category || 'engagement',
    });

    if (this.debugMode) {
      console.log('Event tracked:', { eventName, parameters });
    }
  }

  /**
   * 사용자 속성 설정
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) {return;}

    window.gtag('config', this.measurementId, {
      user_properties: properties,
    });

    if (this.debugMode) {
      console.log('User properties set:', properties);
    }
  }

  /**
   * 색칠놀이 다운로드 추적
   */
  trackColoringPageDownload(pageId: string, characterName: string, ageGroup: string, difficulty: string): void {
    this.trackEvent('coloring_page_download', {
      event_category: 'engagement',
      event_label: characterName,
      page_id: pageId,
      character_name: characterName,
      age_group: ageGroup,
      difficulty,
      value: 5, // 포인트 값
    });
  }

  /**
   * 사용자 등록 추적
   */
  trackUserRegistration(method: 'email' | 'google' | 'apple', ageGroup: string): void {
    this.trackEvent('user_registration', {
      event_category: 'user_engagement',
      registration_method: method,
      age_group: ageGroup,
    });
  }

  /**
   * 포인트 충전 추적
   */
  trackPointPurchase(amount: number, currency: string = 'KRW'): void {
    this.trackEvent('purchase', {
      event_category: 'ecommerce',
      currency,
      value: amount,
      transaction_id: `txn_${Date.now()}`,
    });
  }

  /**
   * 검색 추적
   */
  trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent('search', {
      event_category: 'engagement',
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  /**
   * 에러 추적
   */
  trackError(errorMessage: string, errorCode?: string): void {
    this.trackEvent('exception', {
      event_category: 'error',
      description: errorMessage,
      fatal: false,
      error_code: errorCode,
    });
  }

  /**
   * 성능 추적
   */
  trackPerformance(metricName: string, value: number): void {
    this.trackEvent('timing_complete', {
      event_category: 'performance',
      name: metricName,
      value: Math.round(value),
    });
  }
}

// Analytics 인스턴스 생성
const analytics = new GoogleAnalytics({
  measurementId: process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  debugMode: process.env.NODE_ENV === 'development',
});

export default analytics;

/**
 * 페이지뷰 추적을 위한 React Hook
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search);
  }, [location]);
};

/**
 * 사용자 행동 추적을 위한 커스텀 훅
 */
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackColoringPageDownload: analytics.trackColoringPageDownload.bind(analytics),
    trackUserRegistration: analytics.trackUserRegistration.bind(analytics),
    trackPointPurchase: analytics.trackPointPurchase.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  };
};

