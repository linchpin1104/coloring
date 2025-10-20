import React, { useState } from 'react';
import { useDownloadLimits } from '../../hooks/useDownloadLimits';
import AdModal from '../Ads/AdModal';
import EmailCollectionModal from '../Newsletter/EmailCollectionModal';
import { logger } from '../../utils/logger';

interface DownloadButtonProps {
  coloringPageId: string;
  filename: string;
  onDownload: (id: string) => Promise<void>;
  className?: string;
  children?: React.ReactNode;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  coloringPageId,
  filename,
  onDownload,
  className = '',
  children,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    limits,
    attemptDownload,
    markAdWatched,
    markEmailCollected,
    getDownloadsUntilNextAd,
    getDownloadsUntilEmailRequired,
    isAdModalOpen,
    setIsAdModalOpen,
    isEmailModalOpen,
    setIsEmailModalOpen,
  } = useDownloadLimits();

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const result = attemptDownload();

      switch (result) {
        case 'success':
          await onDownload(coloringPageId);
          logger.info('다운로드 완료:', filename);
          break;
        case 'ad_required':
          logger.info('광고 시청 필요');
          break;
        case 'email_required':
          logger.info('이메일 수집 필요');
          break;
      }
    } catch (error) {
      logger.error('다운로드 실패:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAdWatched = () => {
    markAdWatched();
    // 광고 시청 후 자동으로 다운로드 실행
    setTimeout(() => {
      onDownload(coloringPageId);
    }, 500);
  };

  const handleEmailCollected = (email: string) => {
    markEmailCollected(email);
    // 이메일 수집 후 자동으로 다운로드 실행
    setTimeout(() => {
      onDownload(coloringPageId);
    }, 500);
  };

  const getButtonText = () => {
    if (isDownloading) return '다운로드 중...';
    
    const downloadsUntilAd = getDownloadsUntilNextAd();
    const downloadsUntilEmail = getDownloadsUntilEmailRequired();

    if (downloadsUntilEmail <= 0) {
      return '이메일 입력 후 다운로드';
    }

    if (downloadsUntilAd <= 0) {
      return '광고 시청 후 다운로드';
    }

    return children || '다운로드';
  };

  const getButtonStyle = () => {
    const downloadsUntilAd = getDownloadsUntilNextAd();
    const downloadsUntilEmail = getDownloadsUntilEmailRequired();

    if (downloadsUntilEmail <= 0) {
      return 'bg-purple-600 hover:bg-purple-700 text-white';
    }

    if (downloadsUntilAd <= 0) {
      return 'bg-orange-600 hover:bg-orange-700 text-white';
    }

    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${getButtonStyle()} ${className}`}
      >
        {getButtonText()}
      </button>

      {/* 다운로드 상태 표시 */}
      <div className="mt-2 text-xs text-gray-600">
        {limits.totalDownloads < 2 && (
          <span className="text-green-600">
            무료 다운로드 {2 - limits.totalDownloads}개 남음
          </span>
        )}
        {limits.totalDownloads >= 2 && limits.totalDownloads < 5 && (
          <span className="text-orange-600">
            다음 광고까지 {getDownloadsUntilNextAd()}개 남음
          </span>
        )}
        {limits.totalDownloads >= 5 && !limits.emailCollected && (
          <span className="text-purple-600">
            이메일 입력 후 다운로드 가능
          </span>
        )}
        {limits.emailCollected && (
          <span className="text-blue-600">
            광고 시청 후 다운로드 가능
          </span>
        )}
      </div>

      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onAdWatched={handleAdWatched}
      />

      <EmailCollectionModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onEmailCollected={handleEmailCollected}
      />
    </>
  );
};

export default DownloadButton;

