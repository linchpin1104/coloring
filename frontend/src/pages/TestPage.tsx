import React, { useState } from 'react';
import { useDownloadLimits } from '../hooks/useDownloadLimits';
import DownloadButton from '../components/Download/DownloadButton';
import AdModal from '../components/Ads/AdModal';
import EmailCollectionModal from '../components/Newsletter/EmailCollectionModal';

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
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

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDownloadLimits = () => {
    addTestResult('🧪 다운로드 제한 시스템 테스트 시작');
    
    // 현재 상태 출력
    addTestResult(`현재 상태: 총 다운로드 ${limits.totalDownloads}개, 무료 ${limits.freeDownloads}개, 광고 시청 ${limits.adsWatched}개, 이메일 수집 ${limits.emailCollected ? '완료' : '미완료'}`);
    
    // 다음 광고까지 남은 다운로드 수
    const downloadsUntilAd = getDownloadsUntilNextAd();
    addTestResult(`다음 광고까지: ${downloadsUntilAd}개 다운로드 남음`);
    
    // 다음 이메일 수집까지 남은 다운로드 수
    const downloadsUntilEmail = getDownloadsUntilEmailRequired();
    addTestResult(`이메일 수집까지: ${downloadsUntilEmail === Infinity ? '무제한' : downloadsUntilEmail}개 다운로드 남음`);
  };

  const testDownloadAttempt = () => {
    addTestResult('🎯 다운로드 시도 테스트');
    
    const result = attemptDownload();
    addTestResult(`다운로드 결과: ${result}`);
    
    if (result === 'ad_required') {
      addTestResult('광고 시청 모달이 표시되어야 합니다');
    } else if (result === 'email_required') {
      addTestResult('이메일 수집 모달이 표시되어야 합니다');
    } else if (result === 'success') {
      addTestResult('다운로드가 성공적으로 시작되었습니다');
    }
  };

  const testAdWatched = () => {
    addTestResult('📺 광고 시청 완료 테스트');
    markAdWatched();
    addTestResult('광고 시청이 완료되었습니다');
  };

  const testEmailCollected = () => {
    addTestResult('📧 이메일 수집 완료 테스트');
    markEmailCollected('test@example.com');
    addTestResult('이메일 수집이 완료되었습니다');
  };

  const testMultilingualSearch = () => {
    addTestResult('🌍 다국어 검색 테스트');
    
    const testQueries = [
      { query: '도라에몽', language: '한국어' },
      { query: 'Mickey Mouse', language: '영어' },
      { query: 'ピカチュウ', language: '일본어' },
      { query: '皮卡丘', language: '중국어' },
      { query: 'colorear', language: '스페인어' }
    ];
    
    testQueries.forEach(({ query, language }) => {
      addTestResult(`${language}: "${query}" 검색 테스트`);
    });
  };

  const testAdSystem = () => {
    addTestResult('📺 광고 시스템 테스트');
    addTestResult('광고 모달 표시 테스트');
    setIsAdModalOpen(true);
  };

  const testEmailSystem = () => {
    addTestResult('📧 이메일 수집 시스템 테스트');
    addTestResult('이메일 수집 모달 표시 테스트');
    setIsEmailModalOpen(true);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const resetLimits = () => {
    localStorage.removeItem('coloring_download_limits');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 QA 테스트 페이지</h1>
        
        {/* 현재 상태 표시 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 현재 상태</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{limits.totalDownloads}</div>
              <div className="text-sm text-gray-600">총 다운로드</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{limits.freeDownloads}</div>
              <div className="text-sm text-gray-600">무료 다운로드</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{limits.adsWatched}</div>
              <div className="text-sm text-gray-600">광고 시청</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{limits.emailCollected ? '✓' : '✗'}</div>
              <div className="text-sm text-gray-600">이메일 수집</div>
            </div>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 테스트 도구</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={testDownloadLimits}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              다운로드 제한 테스트
            </button>
            <button
              onClick={testDownloadAttempt}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              다운로드 시도
            </button>
            <button
              onClick={testAdWatched}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
              광고 시청 완료
            </button>
            <button
              onClick={testEmailCollected}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              이메일 수집 완료
            </button>
            <button
              onClick={testMultilingualSearch}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              다국어 검색 테스트
            </button>
            <button
              onClick={testAdSystem}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
            >
              광고 모달 테스트
            </button>
            <button
              onClick={testEmailSystem}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
            >
              이메일 모달 테스트
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              결과 초기화
            </button>
            <button
              onClick={resetLimits}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              제한 초기화
            </button>
          </div>
        </div>

        {/* 다운로드 버튼 테스트 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎨 다운로드 버튼 테스트</h2>
          <div className="flex gap-4">
            <DownloadButton
              coloringPageId="test-1"
              filename="test-coloring-page"
              onDownload={async (id: string) => {
                addTestResult(`다운로드 버튼 클릭: ${id}`);
                // console.log(`다운로드: ${id}`);
              }}
              className="px-6 py-3"
            >
              테스트 다운로드
            </DownloadButton>
          </div>
        </div>

        {/* 테스트 결과 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📋 테스트 결과</h2>
          <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-center">테스트를 실행해보세요</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 모달들 */}
        <AdModal
          isOpen={isAdModalOpen}
          onClose={() => setIsAdModalOpen(false)}
          onAdWatched={() => {
            addTestResult('광고 시청 완료');
            markAdWatched();
          }}
        />

        <EmailCollectionModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onEmailCollected={(email: string) => {
            addTestResult(`이메일 수집 완료: ${email}`);
            markEmailCollected(email);
          }}
        />
      </div>
    </div>
  );
};

export default TestPage;
