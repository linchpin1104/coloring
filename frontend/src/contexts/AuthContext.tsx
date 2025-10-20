import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
/* eslint-disable react-refresh/only-export-components */
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logger } from '../utils/logger';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  age: number;
  ageGroup: 'child' | 'teen' | 'adult';
  points: number;
  dailyFreeCount: number;
  lastFreeDate: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, age: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 가져오기
  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
      } else {
        // 새 사용자 프로필 생성
        const newProfile: UserProfile = {
          uid,
          email: user?.email || '',
          displayName: user?.displayName || '',
          age: 0,
          ageGroup: 'child',
          points: 100, // 신규 가입 시 100포인트 지급
          dailyFreeCount: 3, // 하루 3개 무료
          lastFreeDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', uid), newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      logger.error('Error fetching user profile:', error);
    }
  }, [user?.displayName, user?.email]);

  // 이메일/비밀번호 로그인
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logger.error('Error signing in:', error);
      throw error;
    }
  };

  // 이메일/비밀번호 회원가입
  const signUp = async (email: string, password: string, displayName: string, age: number) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // 사용자 프로필 업데이트
      await updateProfile(user, { displayName });

      // 연령대 계산
      const ageGroup = age <= 8 ? 'child' : age <= 14 ? 'teen' : 'adult';

      // Firestore에 사용자 프로필 저장
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        age,
        ageGroup,
        points: 100, // 신규 가입 시 100포인트 지급
        dailyFreeCount: 3, // 하루 3개 무료
        lastFreeDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (error) {
      logger.error('Error signing up:', error);
      throw error;
    }
  };

  // Google 로그인
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      // 사용자 프로필 확인 및 생성
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          age: 0, // Google 로그인 시 나이를 0으로 설정 (추후 업데이트 필요)
          ageGroup: 'child',
          points: 100,
          dailyFreeCount: 3,
          lastFreeDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
      }
    } catch (error) {
      logger.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {return;}

    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};