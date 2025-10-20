import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { DatabaseService } from '../services/databaseService';
import { ApiError } from '../utils/error';
import { User } from '../types/common';

const dbService = new DatabaseService();

/**
 * 이메일 회원가입
 */
export const registerWithEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName, ageGroup } = req.body;

    // 입력 검증
    if (!email || !password || !ageGroup) {
      res.status(400).json(errorResponse('Email, password, and age group are required', 'VALIDATION_ERROR'));
      return;
    }

    if (password.length < 6) {
      res.status(400).json(errorResponse('Password must be at least 6 characters', 'VALIDATION_ERROR'));
      return;
    }

    if (!['child', 'teen', 'adult'].includes(ageGroup)) {
      res.status(400).json(errorResponse('Invalid age group', 'VALIDATION_ERROR'));
      return;
    }

    logger.info('Email registration attempt', { email, ageGroup });

    // 실제로는 Firebase Auth를 사용하여 사용자 생성
    // 여기서는 시뮬레이션
    const userId = `user_${Date.now()}`;
    
    const userData = {
      uid: userId,
      email,
      displayName: displayName || email.split('@')[0],
      age: ageGroup === 'child' ? 5 : ageGroup === 'teen' ? 12 : 20, // 기본 나이 설정
      ageGroup,
      points: 0,
      dailyFreeCount: 3,
      lastFreeDate: new Date().toISOString().split('T')[0],
      preferences: {
        favoriteCharacters: [],
        favoriteThemes: [],
        difficultyPreference: (ageGroup === 'child' ? 'easy' : ageGroup === 'teen' ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
      },
    };

    // 사용자 데이터 저장 (개발 환경에서는 시뮬레이션)
    if (process.env['NODE_ENV'] === 'development') {
      logger.info('Simulating user creation in development mode', { userId, email });
    } else {
      await dbService.createUser(userData);
    }

    logger.info('Email registration successful', { userId, email });

    res.json(successResponse({
      userId,
      email,
      displayName: userData.displayName,
      ageGroup,
      message: 'Registration successful',
    }, 'User registered successfully'));

  } catch (error) {
    logger.error('Failed to register with email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to register with email',
        error instanceof ApiError ? error.errorCode : 'REGISTRATION_ERROR',
      ),
    );
  }
};

/**
 * 이메일 로그인
 */
export const loginWithEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json(errorResponse('Email and password are required', 'VALIDATION_ERROR'));
      return;
    }

    logger.info('Email login attempt', { email });

    // 실제로는 Firebase Auth를 사용하여 로그인
    // 여기서는 시뮬레이션
    const userId = `user_${Date.now()}`;
    
    // 사용자 데이터 조회 (실제로는 Firebase Auth에서 검증 후)
    const userData = await dbService.getUser(userId);
    
    if (!userData) {
      res.status(401).json(errorResponse('Invalid credentials', 'AUTH_ERROR'));
      return;
    }

    logger.info('Email login successful', { userId, email });

    res.json(successResponse({
      userId,
      email: userData.email,
      displayName: userData.displayName,
      ageGroup: userData.ageGroup,
      points: userData.points,
      dailyFreeCount: userData.dailyFreeCount,
    }, 'Login successful'));

  } catch (error) {
    logger.error('Failed to login with email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to login with email',
        error instanceof ApiError ? error.errorCode : 'LOGIN_ERROR',
      ),
    );
  }
};

/**
 * Google 로그인
 */
export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, displayName, email, photoURL } = req.body;

    if (!idToken || !email) {
      res.status(400).json(errorResponse('Google ID token and email are required', 'VALIDATION_ERROR'));
      return;
    }

    logger.info('Google login attempt', { email });

    // 실제로는 Firebase Auth를 사용하여 Google 토큰 검증
    // 여기서는 시뮬레이션
    const userId = `google_user_${Date.now()}`;
    
    // 기존 사용자 확인 (개발 환경에서는 시뮬레이션)
    let userData;
    if (process.env['NODE_ENV'] === 'development') {
      // 개발 환경에서는 새 사용자로 가정
      userData = {
        uid: userId,
        email,
        displayName: displayName || email.split('@')[0],
        age: 20,
        ageGroup: 'adult' as 'child' | 'teen' | 'adult',
        points: 0,
        dailyFreeCount: 3,
        lastFreeDate: new Date().toISOString().split('T')[0],
        photoURL: photoURL || undefined,
        preferences: {
          favoriteCharacters: [],
          favoriteThemes: [],
          difficultyPreference: 'medium' as 'easy' | 'medium' | 'hard',
        },
      };
    } else {
      userData = await dbService.getUser(userId);
      
      if (!userData) {
        // 새 사용자 생성
        userData = {
          uid: userId,
          email,
          displayName: displayName || email.split('@')[0],
          age: 20, // 기본 나이
          ageGroup: 'adult' as 'child' | 'teen' | 'adult', // 사용자가 나중에 설정
          points: 0,
          dailyFreeCount: 3,
          lastFreeDate: new Date().toISOString().split('T')[0],
          photoURL: photoURL || undefined,
          preferences: {
            favoriteCharacters: [],
            favoriteThemes: [],
            difficultyPreference: 'medium' as 'easy' | 'medium' | 'hard',
          },
        };
        
        await dbService.createUser(userData);
      }
    }

    logger.info('Google login successful', { userId, email });

    res.json(successResponse({
      userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      ageGroup: userData.ageGroup,
      points: userData.points,
      dailyFreeCount: userData.dailyFreeCount,
      isNewUser: !userData.ageGroup, // 연령대가 없으면 새 사용자
    }, 'Google login successful'));

  } catch (error) {
    logger.error('Failed to login with Google', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to login with Google',
        error instanceof ApiError ? error.errorCode : 'GOOGLE_LOGIN_ERROR',
      ),
    );
  }
};

/**
 * Apple 로그인
 */
export const loginWithApple = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identityToken, user } = req.body;

    if (!identityToken) {
      res.status(400).json(errorResponse('Apple identity token is required', 'VALIDATION_ERROR'));
      return;
    }

    // Apple에서 제공하는 사용자 정보 파싱
    const appleUserInfo = user ? JSON.parse(user) : {};
    const email = appleUserInfo.email || `apple_${Date.now()}@privaterelay.appleid.com`;
    const displayName = appleUserInfo.name ? 
      `${appleUserInfo.name.firstName || ''} ${appleUserInfo.name.lastName || ''}`.trim() : 
      email.split('@')[0];

    logger.info('Apple login attempt', { email });

    // 실제로는 Apple의 identity token을 검증
    // 여기서는 시뮬레이션
    const userId = `apple_user_${Date.now()}`;
    
    // 기존 사용자 확인 (개발 환경에서는 시뮬레이션)
    let userData;
    if (process.env['NODE_ENV'] === 'development') {
      // 개발 환경에서는 새 사용자로 가정
      userData = {
        uid: userId,
        email,
        displayName,
        age: 20,
        ageGroup: 'adult' as 'child' | 'teen' | 'adult',
        points: 0,
        dailyFreeCount: 3,
        lastFreeDate: new Date().toISOString().split('T')[0],
        photoURL: null,
        preferences: {
          favoriteCharacters: [],
          favoriteThemes: [],
          difficultyPreference: 'medium' as 'easy' | 'medium' | 'hard',
        },
      };
    } else {
      userData = await dbService.getUser(userId);
      
      if (!userData) {
        // 새 사용자 생성
        userData = {
          uid: userId,
          email,
          displayName,
          age: 20, // 기본 나이
          ageGroup: 'adult' as 'child' | 'teen' | 'adult', // 사용자가 나중에 설정
          points: 0,
          dailyFreeCount: 3,
          lastFreeDate: new Date().toISOString().split('T')[0],
          photoURL: undefined,
          preferences: {
            favoriteCharacters: [],
            favoriteThemes: [],
            difficultyPreference: 'medium' as 'easy' | 'medium' | 'hard',
          },
        };
        
        await dbService.createUser(userData);
      }
    }

    logger.info('Apple login successful', { userId, email });

    res.json(successResponse({
      userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      ageGroup: userData.ageGroup,
      points: userData.points,
      dailyFreeCount: userData.dailyFreeCount,
      isNewUser: !userData.ageGroup, // 연령대가 없으면 새 사용자
    }, 'Apple login successful'));

  } catch (error) {
    logger.error('Failed to login with Apple', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to login with Apple',
        error instanceof ApiError ? error.errorCode : 'APPLE_LOGIN_ERROR',
      ),
    );
  }
};

/**
 * 로그아웃
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated', 'AUTH_ERROR'));
    }

    logger.info('User logout', { userId });

    // 실제로는 Firebase Auth 토큰을 무효화
    // 여기서는 시뮬레이션

    res.json(successResponse({ message: 'Logout successful' }, 'Logout successful'));

  } catch (error) {
    logger.error('Failed to logout', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to logout', 'LOGOUT_ERROR'));
  }
};

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    const userData = await dbService.getUser(userId);
    
    if (!userData) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
    }

    // 민감한 정보 제외
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUserData } = userData as User & { password?: string };

    res.json(successResponse(safeUserData, 'User profile retrieved successfully'));

  } catch (error) {
    logger.error('Failed to get user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to get user profile', 'PROFILE_ERROR'));
  }
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    const { displayName, ageGroup, preferences } = req.body;

    const updateData: Partial<User> = {
    };

    if (displayName) {updateData.displayName = displayName;}
    if (ageGroup && ['child', 'teen', 'adult'].includes(ageGroup)) {
      updateData.ageGroup = ageGroup;
    }
    if (preferences) {updateData.preferences = preferences;}

    await dbService.updateUser(userId, updateData);

    logger.info('User profile updated', { userId, updateData });

    res.json(successResponse({ message: 'Profile updated successfully' }, 'Profile updated successfully'));

  } catch (error) {
    logger.error('Failed to update user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to update user profile', 'UPDATE_ERROR'));
  }
};

/**
 * 비밀번호 재설정 요청
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json(errorResponse('Email is required', 'VALIDATION_ERROR'));
    }

    logger.info('Password reset requested', { email });

    // 실제로는 Firebase Auth의 비밀번호 재설정 이메일 발송
    // 여기서는 시뮬레이션

    res.json(successResponse({ 
      message: 'Password reset email sent',
      email, // 실제로는 이메일을 노출하지 않음
    }, 'Password reset email sent'));

  } catch (error) {
    logger.error('Failed to request password reset', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to request password reset', 'PASSWORD_RESET_ERROR'));
  }
};

/**
 * 이메일 인증 요청
 */
export const requestEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    logger.info('Email verification requested', { userId });

    // 실제로는 Firebase Auth의 이메일 인증 발송
    // 여기서는 시뮬레이션

    res.json(successResponse({ 
      message: 'Verification email sent',
    }, 'Verification email sent'));

  } catch (error) {
    logger.error('Failed to request email verification', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to request email verification', 'EMAIL_VERIFICATION_ERROR'));
  }
};

/**
 * 계정 삭제
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    logger.info('Account deletion requested', { userId });

    // 실제로는 Firebase Auth에서 계정 삭제
    // 관련 데이터도 모두 삭제
    // await dbService.deleteUser(userId);

    res.json(successResponse({ 
      message: 'Account deleted successfully',
    }, 'Account deleted successfully'));

  } catch (error) {
    logger.error('Failed to delete account', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to delete account', 'DELETE_ERROR'));
  }
};