import React, { useEffect, useState } from 'react';
import { logger } from '../../utils/logger';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdWatched: () => void;
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, onAdWatched }) => {
  const [countdown, setCountdown] = useState(30);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30);
      setIsAdLoaded(false);
      
      // 실제 환경에서는 Google AdSense 광고를 로드
      const timer = setTimeout(() => {
        setIsAdLoaded(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAdLoaded) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, isAdLoaded]);

  const handleAdWatched = () => {
    logger.info('광고 시청 완료');
    onAdWatched();
  };

  const handleSkip = () => {
    logger.warn('광고 건너뛰기 시도');
    // 실제 환경에서는 건너뛰기를 제한할 수 있음
    onAdWatched();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">광고를 시청해주세요</h2>
          
          <div className="mb-4">
            {!isAdLoaded ? (
              <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">광고 로딩 중...</div>
              </div>
            ) : (
              <div className="bg-blue-100 h-48 rounded-lg flex items-center justify-center">
                <div className="text-blue-600 font-bold">
                  🎯 Google AdSense 광고 영역
                  <br />
                  <small className="text-sm">실제 환경에서는 광고가 표시됩니다</small>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {countdown > 0 ? (
                <>광고 시청 후 {countdown}초 후에 다운로드할 수 있습니다</>
              ) : (
                <>광고 시청이 완료되었습니다!</>
              )}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={countdown > 0}
            >
              건너뛰기
            </button>
            <button
              onClick={handleAdWatched}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={countdown > 0}
            >
              다운로드 계속하기
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;

