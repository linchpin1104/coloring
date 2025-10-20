import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ColoringPage {
  id: string;
  characterName: string;
  characterType: string;
  originCountry: string;
  ageGroup: string;
  difficulty: string;
  theme: string;
  activity: string;
  emotion: string;
  imageUrl: string;
  thumbnailUrl: string;
  downloads: number;
  createdAt: string;
  metadata: {
    prompt: string;
    generationTime: number;
    qualityScore: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    pages: ColoringPage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

const HomePage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [coloringPages, setColoringPages] = useState<ColoringPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    ageGroup: userProfile?.ageGroup || '',
    difficulty: '',
    characterName: '',
  });

  const fetchColoringPages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.ageGroup) {
        params.append('ageGroup', filters.ageGroup);
      }
      if (filters.difficulty) {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.characterName) {
        params.append('characterName', filters.characterName);
      }

      const response = await fetch(`http://localhost:3001/api/coloring-pages?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setColoringPages(data.data.pages);
      } else {
        setError('Failed to fetch coloring pages');
      }
    } catch (err) {
      setError('Network error occurred');
      // console.error('Error fetching coloring pages:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchColoringPages();
  }, [fetchColoringPages]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateNewColoringPage = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/coloring-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterName: 'Pikachu',
          characterType: 'anime',
          originCountry: 'japan',
          ageGroup: 'child',
          difficulty: 'easy',
          theme: 'default',
          activity: 'jumping',
          emotion: 'happy',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 새로 생성된 도안을 목록에 추가
        setColoringPages(prev => [data.data, ...prev]);
        // alert('새로운 색칠놀이 도안이 생성되었습니다!');
      }
    } catch (err) {
      // console.error('Error generating coloring page:', err);
      // alert('색칠놀이 도안 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">색칠놀이 도안을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchColoringPages}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎨 색칠놀이 도안</h1>
            <p className="text-gray-600 mt-1">전세계 인기 캐릭터 색칠놀이 도안을 자동으로 생성합니다</p>
          </div>
          {user && (
            <button
              onClick={generateNewColoringPage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              새 도안 생성
            </button>
          )}
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연령대</label>
                <select
                  value={filters.ageGroup}
                  onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="child">어린이 (3-8세)</option>
                  <option value="teen">청소년 (9-14세)</option>
                  <option value="adult">성인 (15세+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">캐릭터명</label>
                <input
                  type="text"
                  value={filters.characterName}
                  onChange={(e) => handleFilterChange('characterName', e.target.value)}
                  placeholder="캐릭터명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 색칠놀이 도안 그리드 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coloringPages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={page.thumbnailUrl}
                    alt={page.characterName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{page.characterName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>타입: {page.characterType}</p>
                    <p>연령대: {page.ageGroup}</p>
                    <p>난이도: {page.difficulty}</p>
                    <p>다운로드: {page.downloads}회</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      다운로드
                    </button>
                    <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {coloringPages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">색칠놀이 도안이 없습니다</h3>
              <p className="text-gray-600 mb-4">필터를 조정하거나 새 도안을 생성해보세요.</p>
              <button
                onClick={generateNewColoringPage}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                새 도안 생성하기
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;