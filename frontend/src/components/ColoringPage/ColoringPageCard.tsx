import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ColoringPage {
  id: string;
  characterName: string;
  characterType: string;
  originCountry: string;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
  activity: string;
  emotion: string;
  imageUrl: string;
  thumbnailUrl: string;
  downloads: number;
  likes: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface ColoringPageCardProps {
  page: ColoringPage;
  onDownload: (pageId: string) => void;
  onLike: (pageId: string) => void;
  onShare: (page: ColoringPage) => void;
}

const ColoringPageCard: React.FC<ColoringPageCardProps> = ({
  page,
  onDownload,
  onLike,
  onShare,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(page.id);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(page.id);
  };

  const handleShare = () => {
    onShare(page);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'hard':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgeGroupColor = (ageGroup: string) => {
    switch (ageGroup) {
    case 'child':
      return 'bg-pink-100 text-pink-800';
    case 'teen':
      return 'bg-blue-100 text-blue-800';
    case 'adult':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* 이미지 영역 */}
      <div className="relative">
        <img
          src={page.thumbnailUrl}
          alt={page.characterName}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* 오버레이 버튼들 */}
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleLike}
            className={`p-2 rounded-full ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
            } shadow-md hover:shadow-lg transition-all duration-200`}
            title={isLiked ? '좋아요 취소' : '좋아요'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 bg-white text-gray-600 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            title="공유하기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>

        {/* 난이도 배지 */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(page.difficulty)}`}>
            {page.difficulty === 'easy' && '쉬움'}
            {page.difficulty === 'medium' && '보통'}
            {page.difficulty === 'hard' && '어려움'}
          </span>
        </div>
      </div>

      {/* 내용 영역 */}
      <div className="p-4">
        {/* 캐릭터 이름과 타입 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {page.characterName}
          </h3>
          <span className="text-xs text-gray-500 capitalize">
            {page.characterType}
          </span>
        </div>

        {/* 태그들 */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className={`px-2 py-1 text-xs rounded-full ${getAgeGroupColor(page.ageGroup)}`}>
            {page.ageGroup === 'child' && '어린이'}
            {page.ageGroup === 'teen' && '청소년'}
            {page.ageGroup === 'adult' && '성인'}
          </span>
          
          {page.theme !== 'default' && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {page.theme}
            </span>
          )}
          
          {page.activity && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {page.activity}
            </span>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {page.downloads.toLocaleString()}
            </span>
            
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {page.likes.toLocaleString()}
            </span>
          </div>
          
          <span className="text-xs">
            {new Date(page.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || !user}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
            user
              ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isDownloading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              다운로드 중...
            </div>
          ) : user ? (
            '다운로드'
          ) : (
            '로그인 후 다운로드'
          )}
        </button>
      </div>
    </div>
  );
};

export default ColoringPageCard;

