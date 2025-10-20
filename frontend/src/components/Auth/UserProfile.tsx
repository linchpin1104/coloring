import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

const UserProfile: React.FC = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: userProfile?.displayName || '',
    age: userProfile?.age || 0,
  });

  const handleSave = async () => {
    try {
      const ageGroup = editData.age <= 8 ? 'child' : editData.age <= 14 ? 'teen' : 'adult';
      await updateUserProfile({
        displayName: editData.displayName,
        age: editData.age,
        ageGroup,
      });
      setIsEditing(false);
    } catch (error) {
      logger.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      displayName: userProfile?.displayName || '',
      age: userProfile?.age || 0,
    });
    setIsEditing(false);
  };

  if (!user || !userProfile) {return null;}

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">프로필</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            편집
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            닉네임
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editData.displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900">{userProfile.displayName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            나이
          </label>
          {isEditing ? (
            <input
              type="number"
              value={editData.age}
              onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) || 0 })}
              min="3"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900">{userProfile.age}세</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연령대
          </label>
          <p className="text-gray-900">
            {userProfile.ageGroup === 'child' && '어린이 (3-8세)'}
            {userProfile.ageGroup === 'teen' && '청소년 (9-14세)'}
            {userProfile.ageGroup === 'adult' && '성인 (15세+)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            포인트
          </label>
          <p className="text-gray-900 font-semibold">{userProfile.points}포인트</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            오늘 무료 다운로드
          </label>
          <p className="text-gray-900">{userProfile.dailyFreeCount}개 남음</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <p className="text-gray-900">{userProfile.email}</p>
        </div>

        {isEditing && (
          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default UserProfile;

