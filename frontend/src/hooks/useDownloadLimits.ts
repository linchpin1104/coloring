import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface DownloadLimits {
  freeDownloads: number;
  totalDownloads: number;
  adsWatched: number;
  emailCollected: boolean;
  lastResetDate: string;
}

const STORAGE_KEY = 'coloring_download_limits';
const FREE_LIMIT = 2;
const ADS_INTERVAL = 3;
const EMAIL_REQUIRED_AFTER = 5;

export const useDownloadLimits = () => {
  const [limits, setLimits] = useState<DownloadLimits>({
    freeDownloads: 0,
    totalDownloads: 0,
    adsWatched: 0,
    emailCollected: false,
    lastResetDate: new Date().toDateString(),
  });

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // 로컬 스토리지에서 제한 정보 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim() !== '') {
        const parsed = JSON.parse(stored);
        
        // 데이터 유효성 검사
        if (isValidDownloadLimits(parsed)) {
          // 날짜가 바뀌었으면 리셋
          if (parsed.lastResetDate !== new Date().toDateString()) {
            setLimits({
              freeDownloads: 0,
              totalDownloads: 0,
              adsWatched: 0,
              emailCollected: false,
              lastResetDate: new Date().toDateString(),
            });
          } else {
            setLimits(parsed);
          }
        } else {
          // 유효하지 않은 데이터는 기본값으로 초기화
          logger.warn('유효하지 않은 다운로드 제한 데이터 발견, 기본값으로 초기화');
          setLimits({
            freeDownloads: 0,
            totalDownloads: 0,
            adsWatched: 0,
            emailCollected: false,
            lastResetDate: new Date().toDateString(),
          });
        }
      }
    } catch (error) {
      logger.error('다운로드 제한 정보 로드 실패:', error);
      // 오류 발생 시 기본값으로 초기화
      setLimits({
        freeDownloads: 0,
        totalDownloads: 0,
        adsWatched: 0,
        emailCollected: false,
        lastResetDate: new Date().toDateString(),
      });
    }
  }, []);

  // 다운로드 제한 데이터 유효성 검사
  const isValidDownloadLimits = (data: unknown): data is DownloadLimits => {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['freeDownloads', 'totalDownloads', 'adsWatched', 'emailCollected', 'lastResetDate'];
    return requiredFields.every(field => 
      Object.prototype.hasOwnProperty.call(data, field) && 
      typeof (data as Record<string, unknown>)[field] === (field === 'emailCollected' ? 'boolean' : 'number')
    );
  };

  // 제한 정보 저장
  const saveLimits = (newLimits: DownloadLimits) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLimits));
      setLimits(newLimits);
    } catch (error) {
      logger.error('다운로드 제한 정보 저장 실패:', error);
    }
  };

  // 다운로드 가능 여부 확인
  const canDownload = (): boolean => {
    if (limits.totalDownloads < FREE_LIMIT) {
      return true; // 무료 다운로드
    }

    if (limits.totalDownloads >= EMAIL_REQUIRED_AFTER && !limits.emailCollected) {
      return false; // 이메일 수집 필요
    }

    // 광고 시청 필요 여부 확인
    const adsNeeded = Math.ceil((limits.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
    return limits.adsWatched >= adsNeeded;
  };

  // 다운로드 시도
  const attemptDownload = (): 'success' | 'ad_required' | 'email_required' => {
    // 무료 다운로드 (0, 1회) - 2회까지 무료
    if (limits.totalDownloads < FREE_LIMIT) {
      const newLimits = {
        ...limits,
        freeDownloads: limits.freeDownloads + 1,
        totalDownloads: limits.totalDownloads + 1,
      };
      saveLimits(newLimits);
      return 'success';
    }

    // 이메일 수집 필요 (5회 이상)
    if (limits.totalDownloads >= EMAIL_REQUIRED_AFTER && !limits.emailCollected) {
      setIsEmailModalOpen(true);
      return 'email_required';
    }

    // 광고 시청 필요 (3, 6, 9, 12... 회)
    // 3회부터 광고가 필요하므로 (3-2)/3 = 0.33... -> 0, 하지만 3회는 광고 필요
    const adsNeeded = Math.ceil((limits.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
    if (limits.adsWatched < adsNeeded) {
      setIsAdModalOpen(true);
      return 'ad_required';
    }

    // 다운로드 허용
    const newLimits = {
      ...limits,
      totalDownloads: limits.totalDownloads + 1,
    };
    saveLimits(newLimits);
    return 'success';
  };

  // 광고 시청 완료
  const markAdWatched = () => {
    const newLimits = {
      ...limits,
      adsWatched: limits.adsWatched + 1,
    };
    saveLimits(newLimits);
    setIsAdModalOpen(false);
  };

  // 이메일 수집 완료
  const markEmailCollected = (email: string) => {
    const newLimits = {
      ...limits,
      emailCollected: true,
    };
    saveLimits(newLimits);
    setIsEmailModalOpen(false);
    
    // 이메일을 서버에 저장
    saveEmailToServer(email);
  };

  // 서버에 이메일 저장
  const saveEmailToServer = async (email: string) => {
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('이메일 저장 실패');
      }

      logger.info('이메일 구독 완료:', email);
    } catch (error) {
      logger.error('이메일 구독 실패:', error);
    }
  };

  // 다음 광고까지 남은 다운로드 수
  const getDownloadsUntilNextAd = (): number => {
    if (limits.totalDownloads < FREE_LIMIT) {
      return FREE_LIMIT - limits.totalDownloads;
    }

    // 현재 필요한 광고 수
    const adsNeeded = Math.ceil((limits.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
    
    // 이미 충분한 광고를 시청했으면 다음 광고까지의 거리 계산
    if (limits.adsWatched >= adsNeeded) {
      const nextAdThreshold = FREE_LIMIT + adsNeeded * ADS_INTERVAL;
      return nextAdThreshold - limits.totalDownloads;
    }
    
    // 아직 광고를 시청하지 않았으면 0 반환
    return 0;
  };

  // 다음 이메일 수집까지 남은 다운로드 수
  const getDownloadsUntilEmailRequired = (): number => {
    if (limits.emailCollected) {
      return Infinity;
    }
    return Math.max(0, EMAIL_REQUIRED_AFTER - limits.totalDownloads);
  };

  return {
    limits,
    canDownload,
    attemptDownload,
    markAdWatched,
    markEmailCollected,
    getDownloadsUntilNextAd,
    getDownloadsUntilEmailRequired,
    isAdModalOpen,
    setIsAdModalOpen,
    isEmailModalOpen,
    setIsEmailModalOpen,
  };
};
