import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export interface User {
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
  photoURL?: string;
  preferences?: {
    favoriteCharacters: string[];
    favoriteThemes: string[];
    difficultyPreference: 'easy' | 'medium' | 'hard';
  };
}

export interface ColoringPage {
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
  updatedAt: string;
  metadata: {
    prompt: string;
    generation: {
      generationTime: number;
      qualityScore: number;
      difficulty: string;
      ageGroup: string;
    };
    processing: {
      originalSize: { width: number; height: number };
      processedSize: { width: number; height: number };
      processingTime: number;
      qualityScore: number;
    };
  };
  tags: string[];
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'charge' | 'download' | 'daily_free' | 'bonus' | 'refund';
  amount: number;
  description: string;
  pageId?: string;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  pageId: string;
  score: number;
  reason: string;
  createdAt: string;
}

export class DatabaseService {
  // 사용자 관련 메서드
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const user: User = {
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('users').doc(userData.uid).set(user);
      logger.info('User created successfully', { uid: userData.uid });
    } catch (error) {
      logger.error('Failed to create user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userData,
      });
      throw error;
    }
  }

  async createDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await db.collection(collection).doc(docId).set(data);
      logger.info('Document created successfully', { collection, docId });
    } catch (error) {
      logger.error('Failed to create document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        collection,
        docId,
      });
      throw error;
    }
  }

  async getDocument(collection: string, docId: string): Promise<any> {
    try {
      const doc = await db.collection(collection).doc(docId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data();
    } catch (error) {
      logger.error('Failed to get document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        collection,
        docId,
      });
      throw error;
    }
  }

  async updateDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await db.collection(collection).doc(docId).update(data);
      logger.info('Document updated successfully', { collection, docId });
    } catch (error) {
      logger.error('Failed to update document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        collection,
        docId,
      });
      throw error;
    }
  }

  async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      logger.error('Failed to get user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uid,
      });
      throw error;
    }
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.collection('users').doc(uid).update(updateData);
      logger.info('User updated successfully', { uid, updates });
    } catch (error) {
      logger.error('Failed to update user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uid,
        updates,
      });
      throw error;
    }
  }

  async updateUserPoints(uid: string, pointsChange: number): Promise<void> {
    try {
      await db.collection('users').doc(uid).update({
        points: FieldValue.increment(pointsChange),
        updatedAt: new Date().toISOString(),
      });
      logger.info('User points updated', { uid, pointsChange });
    } catch (error) {
      logger.error('Failed to update user points', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uid,
        pointsChange,
      });
      throw error;
    }
  }

  async updateDailyFreeCount(uid: string, count: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await db.collection('users').doc(uid).update({
        dailyFreeCount: count,
        lastFreeDate: today,
        updatedAt: new Date().toISOString(),
      });
      logger.info('Daily free count updated', { uid, count });
    } catch (error) {
      logger.error('Failed to update daily free count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uid,
        count,
      });
      throw error;
    }
  }

  // 색칠놀이 도안 관련 메서드
  async createColoringPage(pageData: Omit<ColoringPage, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const page: ColoringPage = {
        ...pageData,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('coloringPages').doc(pageData.id).set(page);
      logger.info('Coloring page created successfully', { pageId: pageData.id });
    } catch (error) {
      logger.error('Failed to create coloring page', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pageData,
      });
      throw error;
    }
  }

  async getColoringPages(filters: {
    ageGroup?: string;
    difficulty?: string;
    characterName?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ pages: ColoringPage[]; total: number }> {
    try {
      let query = db.collection('coloringPages').where('isActive', '==', true);

      if (filters.ageGroup) {
        query = query.where('ageGroup', '==', filters.ageGroup);
      }
      if (filters.difficulty) {
        query = query.where('difficulty', '==', filters.difficulty);
      }
      if (filters.characterName) {
        query = query.where('characterName', '>=', filters.characterName)
          .where('characterName', '<=', `${filters.characterName  }\uf8ff`);
      }

      // 총 개수 조회
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // 페이지네이션 적용
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const pages = snapshot.docs.map(doc => doc.data() as ColoringPage);

      logger.info('Coloring pages fetched successfully', {
        count: pages.length,
        total,
        filters,
      });

      return { pages, total };
    } catch (error) {
      logger.error('Failed to get coloring pages', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
      });
      throw error;
    }
  }

  async getColoringPageById(id: string): Promise<ColoringPage | null> {
    try {
      const doc = await db.collection('coloringPages').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as ColoringPage;
    } catch (error) {
      logger.error('Failed to get coloring page by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  async incrementDownloads(pageId: string): Promise<void> {
    try {
      await db.collection('coloringPages').doc(pageId).update({
        downloads: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });
      logger.info('Downloads incremented', { pageId });
    } catch (error) {
      logger.error('Failed to increment downloads', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pageId,
      });
      throw error;
    }
  }

  // 트랜잭션 관련 메서드
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = `txn_${Date.now()}`;
      const transaction: Transaction = {
        ...transactionData,
        id,
        createdAt: new Date().toISOString(),
      };

      await db.collection('transactions').doc(id).set(transaction);
      logger.info('Transaction created successfully', { transactionId: id });
      
      return id;
    } catch (error) {
      logger.error('Failed to create transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionData,
      });
      throw error;
    }
  }

  async getUserTransactions(userId: string, limit: number = 20, offset: number = 0): Promise<{
    transactions: Transaction[];
    total: number;
  }> {
    try {
      // 총 개수 조회
      const totalSnapshot = await db.collection('transactions')
        .where('userId', '==', userId)
        .get();
      const total = totalSnapshot.size;

      // 페이지네이션 적용
      const snapshot = await db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      const transactions = snapshot.docs.map(doc => doc.data() as Transaction);

      logger.info('User transactions fetched successfully', {
        userId,
        count: transactions.length,
        total,
      });

      return { transactions, total };
    } catch (error) {
      logger.error('Failed to get user transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  // 추천 관련 메서드
  async createRecommendation(recommendationData: Omit<Recommendation, 'id' | 'createdAt'>): Promise<void> {
    try {
      const id = `rec_${Date.now()}`;
      const recommendation: Recommendation = {
        ...recommendationData,
        id,
        createdAt: new Date().toISOString(),
      };

      await db.collection('recommendations').doc(id).set(recommendation);
      logger.info('Recommendation created successfully', { recommendationId: id });
    } catch (error) {
      logger.error('Failed to create recommendation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendationData,
      });
      throw error;
    }
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      const snapshot = await db.collection('recommendations')
        .where('userId', '==', userId)
        .orderBy('score', 'desc')
        .limit(limit)
        .get();

      const recommendations = snapshot.docs.map(doc => doc.data() as Recommendation);

      logger.info('User recommendations fetched successfully', {
        userId,
        count: recommendations.length,
      });

      return recommendations;
    } catch (error) {
      logger.error('Failed to get user recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  // 통계 관련 메서드
  async getPopularColoringPages(limit: number = 10): Promise<ColoringPage[]> {
    try {
      const snapshot = await db.collection('coloringPages')
        .where('isActive', '==', true)
        .orderBy('downloads', 'desc')
        .limit(limit)
        .get();

      const pages = snapshot.docs.map(doc => doc.data() as ColoringPage);

      logger.info('Popular coloring pages fetched successfully', {
        count: pages.length,
      });

      return pages;
    } catch (error) {
      logger.error('Failed to get popular coloring pages', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getRecentColoringPages(limit: number = 10): Promise<ColoringPage[]> {
    try {
      const snapshot = await db.collection('coloringPages')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const pages = snapshot.docs.map(doc => doc.data() as ColoringPage);

      logger.info('Recent coloring pages fetched successfully', {
        count: pages.length,
      });

      return pages;
    } catch (error) {
      logger.error('Failed to get recent coloring pages', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default DatabaseService;
