import { db } from '@/config/firebase';
import { ApiError, ErrorCodes } from '@/utils/response';
import { logger } from '@/utils/logger';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  age: number;
  ageGroup: 'child' | 'teen' | 'adult';
  points: number;
  dailyFreeCount: number;
  lastFreeDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  uid: string;
  email: string;
  displayName: string;
  age: number;
  ageGroup: 'child' | 'teen' | 'adult';
}

export interface UpdateUserData {
  displayName?: string;
  age?: number;
  ageGroup?: 'child' | 'teen' | 'adult';
}

export class UserService {
  private readonly collection = db.collection('users');

  // 사용자 생성
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const now = new Date();
      const user: Omit<User, 'uid'> = {
        email: userData.email,
        displayName: userData.displayName,
        age: userData.age,
        ageGroup: userData.ageGroup,
        points: 0,
        dailyFreeCount: 3,
        lastFreeDate: now,
        createdAt: now,
        updatedAt: now,
      };

      await this.collection.doc(userData.uid).set(user);

      logger.info(`User created: ${userData.uid}`);
      return { uid: userData.uid, ...user };
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw new ApiError(
        'Failed to create user',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 사용자 조회
  async getUserById(uid: string): Promise<User | null> {
    try {
      const doc = await this.collection.doc(uid).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as Omit<User, 'uid'>;
      return { uid, ...data };
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw new ApiError(
        'Failed to get user',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 사용자 업데이트
  async updateUser(uid: string, updateData: UpdateUserData): Promise<User> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new ApiError(
          'User not found',
          404,
          ErrorCodes.USER_NOT_FOUND,
        );
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
      };

      await this.collection.doc(uid).update(updatedData);

      logger.info(`User updated: ${uid}`);
      return { ...user, ...updatedData };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to update user:', error);
      throw new ApiError(
        'Failed to update user',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 포인트 추가
  async addPoints(uid: string, points: number): Promise<User> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new ApiError(
          'User not found',
          404,
          ErrorCodes.USER_NOT_FOUND,
        );
      }

      const newPoints = user.points + points;
      await this.collection.doc(uid).update({
        points: newPoints,
        updatedAt: new Date(),
      });

      logger.info(`Points added to user ${uid}: +${points} (total: ${newPoints})`);
      return { ...user, points: newPoints, updatedAt: new Date() };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to add points:', error);
      throw new ApiError(
        'Failed to add points',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 포인트 차감
  async deductPoints(uid: string, points: number): Promise<User> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new ApiError(
          'User not found',
          404,
          ErrorCodes.USER_NOT_FOUND,
        );
      }

      if (user.points < points) {
        throw new ApiError(
          'Insufficient points',
          400,
          ErrorCodes.INSUFFICIENT_POINTS,
        );
      }

      const newPoints = user.points - points;
      await this.collection.doc(uid).update({
        points: newPoints,
        updatedAt: new Date(),
      });

      logger.info(`Points deducted from user ${uid}: -${points} (remaining: ${newPoints})`);
      return { ...user, points: newPoints, updatedAt: new Date() };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to deduct points:', error);
      throw new ApiError(
        'Failed to deduct points',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 일일 무료 다운로드 확인 및 업데이트
  async checkAndUpdateDailyFree(uid: string): Promise<{ canDownload: boolean; remainingCount: number }> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new ApiError(
          'User not found',
          404,
          ErrorCodes.USER_NOT_FOUND,
        );
      }

      const now = new Date();
      const { lastFreeDate } = user;
      const isNewDay = now.toDateString() !== lastFreeDate.toDateString();

      if (isNewDay) {
        // 새로운 날이면 무료 다운로드 카운트 리셋
        await this.collection.doc(uid).update({
          dailyFreeCount: 3,
          lastFreeDate: now,
          updatedAt: now,
        });

        logger.info(`Daily free count reset for user ${uid}`);
        return { canDownload: true, remainingCount: 2 };
      }

      if (user.dailyFreeCount > 0) {
        // 무료 다운로드 가능
        const newCount = user.dailyFreeCount - 1;
        await this.collection.doc(uid).update({
          dailyFreeCount: newCount,
          updatedAt: now,
        });

        logger.info(`Daily free download used by user ${uid}, remaining: ${newCount}`);
        return { canDownload: true, remainingCount: newCount };
      }

      return { canDownload: false, remainingCount: 0 };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to check daily free:', error);
      throw new ApiError(
        'Failed to check daily free',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  // 사용자 삭제 (실제로는 삭제하지 않고 비활성화)
  async deleteUser(uid: string): Promise<void> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new ApiError(
          'User not found',
          404,
          ErrorCodes.USER_NOT_FOUND,
        );
      }

      // 실제로는 삭제하지 않고 비활성화 플래그 추가
      await this.collection.doc(uid).update({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`User deactivated: ${uid}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to delete user:', error);
      throw new ApiError(
        'Failed to delete user',
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }
}

export const userService = new UserService();
