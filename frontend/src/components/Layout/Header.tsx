import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../Auth/LoginModal';
import SignUpModal from '../Auth/SignUpModal';
import UserProfile from '../Auth/UserProfile';

const Header: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setShowSignUpModal(false);
  };

  const handleSignUpClick = () => {
    setShowSignUpModal(true);
    setShowLoginModal(false);
  };

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  const handleCloseModals = () => {
    setShowLoginModal(false);
    setShowSignUpModal(false);
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎨 색칠놀이 도안</h1>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎨 색칠놀이 도안</h1>
              <p className="text-gray-600 mt-1">전세계 인기 캐릭터 색칠놀이 도안을 자동으로 생성합니다</p>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {userProfile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {userProfile?.displayName || user.email}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4">
                        <UserProfile />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleLoginClick}
                    className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    onClick={handleSignUpClick}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          </div>

          {user && userProfile && (
            <div className="pb-4">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">포인트:</span>
                  <span className="text-blue-600 font-semibold">{userProfile.points}포인트</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">오늘 무료:</span>
                  <span className="text-green-600 font-semibold">{userProfile.dailyFreeCount}개</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">연령대:</span>
                  <span className="text-purple-600 font-semibold">
                    {userProfile.ageGroup === 'child' && '어린이'}
                    {userProfile.ageGroup === 'teen' && '청소년'}
                    {userProfile.ageGroup === 'adult' && '성인'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseModals}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      <SignUpModal
        isOpen={showSignUpModal}
        onClose={handleCloseModals}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default Header;