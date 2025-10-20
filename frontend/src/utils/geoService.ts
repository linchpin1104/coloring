// GEO 위치 기반 서비스 유틸리티
import { useState, useEffect } from 'react';
import { logger } from './logger';

export interface LocationData {
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  language: string;
}

export interface GeoAnalytics {
  location: LocationData;
  userAgent: string;
  referrer: string;
  timestamp: string;
}

class GeoService {
  private locationData: LocationData | null = null;
  // private isLocationEnabled: boolean = false;

  /**
   * 사용자 위치 정보 요청
   */
  async requestUserLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        logger.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding을 통해 주소 정보 획득
            const locationData = await this.reverseGeocode(latitude, longitude);
            this.locationData = locationData;
            // this.isLocationEnabled = true;
            resolve(locationData);
          } catch (error) {
            logger.error('Failed to get location data:', error);
            resolve(null);
          }
        },
        (error) => {
          logger.warn('Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5분
        },
      );
    });
  }

  /**
   * IP 기반 위치 정보 획득
   */
  async getLocationByIP(): Promise<LocationData | null> {
    try {
      // 실제로는 IP geolocation API 사용 (예: ipapi.co, ipinfo.io)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        language: data.languages?.split(',')[0] || 'en',
      };
    } catch (error) {
      logger.error('Failed to get IP location:', error);
      return null;
    }
  }

  /**
   * Reverse geocoding (좌표 → 주소)
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      // 실제로는 Google Maps Geocoding API 또는 다른 서비스 사용
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      );
      const data = await response.json();
      
      return {
        latitude,
        longitude,
        country: data.countryName || 'Unknown',
        countryCode: data.countryCode || 'XX',
        region: data.principalSubdivision || 'Unknown',
        city: data.city || 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language.split('-')[0],
      };
    } catch (error) {
      // console.error('Reverse geocoding failed:', error);
      // 기본값 반환
      return {
        latitude,
        longitude,
        country: 'Unknown',
        countryCode: 'XX',
        region: 'Unknown',
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language.split('-')[0],
      };
    }
  }

  /**
   * 현재 위치 정보 반환
   */
  getCurrentLocation(): LocationData | null {
    return this.locationData;
  }

  /**
   * 위치 기반 콘텐츠 추천
   */
  getLocationBasedRecommendations(location: LocationData): {
    characters: string[];
    themes: string[];
    language: string;
  } {
    const recommendations: Record<string, { characters: string[]; themes: string[] }> = {
      KR: {
        characters: ['피카추', '포켓몬', '뽀로로', '뽀롱뽀롱 뽀로로', '타요'],
        themes: ['한국 전통', 'K-팝', '한국 애니메이션'],
      },
      JP: {
        characters: ['나루토', '원피스', '드래곤볼', '포켓몬', '헬로키티'],
        themes: ['일본 애니메이션', '만화', '일본 전통'],
      },
      US: {
        characters: ['스폰지밥', '미키마우스', '엘사', '토르', '스파이더맨'],
        themes: ['디즈니', '마블', 'DC', '미국 애니메이션'],
      },
      CN: {
        characters: ['판다', '용', '중국 전통 캐릭터'],
        themes: ['중국 전통', '중국 애니메이션', '중국 문화'],
      },
      GB: {
        characters: ['해리포터', '토마스', '피터팬'],
        themes: ['영국 전통', '영국 애니메이션'],
      },
    };

    const countryRecommendations = recommendations[location.countryCode] || recommendations.US;
    
    return {
      characters: countryRecommendations.characters,
      themes: countryRecommendations.themes,
      language: location.language,
    };
  }

  /**
   * 위치 기반 SEO 메타데이터 생성
   */
  generateLocationBasedSEO(location: LocationData): {
    title: string;
    description: string;
    keywords: string[];
  } {
    const countryNames: Record<string, string> = {
      KR: '한국',
      JP: '일본',
      US: '미국',
      CN: '중국',
      GB: '영국',
    };

    const countryName = countryNames[location.countryCode] || location.country;
    const recommendations = this.getLocationBasedRecommendations(location);

    return {
      title: `${countryName} 인기 캐릭터 색칠놀이 | ${location.city} 색칠놀이 플랫폼`,
      description: `${location.city}, ${countryName}에서 인기 있는 캐릭터들의 색칠놀이 도안을 제공합니다. ${recommendations.characters.slice(0, 3).join(', ')} 등 다양한 캐릭터를 만나보세요.`,
      keywords: [
        `${location.city} 색칠놀이`,
        `${countryName} 캐릭터`,
        ...recommendations.characters,
        ...recommendations.themes,
        '색칠놀이',
        '컬러링북',
      ],
    };
  }

  /**
   * 위치 기반 분석 데이터 수집
   */
  collectGeoAnalytics(): GeoAnalytics {
    const location = this.getCurrentLocation();
    
    return {
      location: location || {
        latitude: 0,
        longitude: 0,
        country: 'Unknown',
        countryCode: 'XX',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC',
        language: 'en',
      },
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 위치 기반 콘텐츠 필터링
   */
  filterContentByLocation(content: Array<{ characterName: string; theme: string; tags: string[] }>, location: LocationData): Array<{ characterName: string; theme: string; tags: string[] }> {
    const recommendations = this.getLocationBasedRecommendations(location);
    
    return content.filter(item => {
      // 위치 기반 캐릭터 우선순위
      const characterMatch = recommendations.characters.some(char => 
        item.characterName?.toLowerCase().includes(char.toLowerCase()),
      );
      
      // 위치 기반 테마 우선순위
      const themeMatch = recommendations.themes.some(theme => 
        item.theme?.toLowerCase().includes(theme.toLowerCase()),
      );
      
      return characterMatch || themeMatch;
    });
  }
}

// GeoService 인스턴스 생성
export const geoService = new GeoService();

/**
 * 위치 기반 서비스를 위한 React Hook
 */
export const useGeoLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 먼저 IP 기반 위치 시도
      let locationData = await geoService.getLocationByIP();
      
      // 사용자 위치 권한이 있으면 더 정확한 위치 사용
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          const userLocation = await geoService.requestUserLocation();
          if (userLocation) {
            locationData = userLocation;
          }
        }
      }
      
      setLocation(locationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    refreshLocation: getLocation,
  };
};

