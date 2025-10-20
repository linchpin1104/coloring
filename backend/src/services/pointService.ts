import { logger } from '../utils/logger';

interface PointTransaction {
  id: string;
  userId: string;
  type: 'charge' | 'download' | 'daily_free' | 'bonus';
  amount: number; // 포인트 양 (음수는 차감, 양수는 충전)
  description: string;
  pageId?: string; // 다운로드 시 색칠놀이 도안 ID
  createdAt: string;
}

interface UserPointBalance {
  userId: string;
  totalPoints: number;
  dailyFreeCount: number;
  lastFreeDate: string;
  lastUpdated: string;
}

export class PointService {
  /**
   * 사용자 포인트 잔액 조회
   */
  async getUserPointBalance(userId: string): Promise<UserPointBalance> {
    try {
      // 실제로는 Firestore에서 조회
      // 여기서는 시뮬레이션된 데이터 반환
      const today = new Date().toISOString().split('T')[0];
      
      return {
        userId,
        totalPoints: 100, // 기본 포인트
        dailyFreeCount: 3, // 하루 무료 다운로드
        lastFreeDate: today,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get user point balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * 포인트 충전
   */
  async chargePoints(userId: string, amount: number, paymentMethod: string): Promise<PointTransaction> {
    try {
      logger.info('Charging points', { userId, amount, paymentMethod });

      // 실제로는 Stripe 결제 처리 후 포인트 충전
      const transaction: PointTransaction = {
        id: `txn_${Date.now()}`,
        userId,
        type: 'charge',
        amount,
        description: `${amount}포인트 충전 (${paymentMethod})`,
        createdAt: new Date().toISOString(),
      };

      // Firestore에 트랜잭션 저장
      await this.saveTransaction(transaction);

      logger.info('Points charged successfully', {
        transactionId: transaction.id,
        userId,
        amount,
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to charge points', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        amount,
      });
      throw error;
    }
  }

  /**
   * 색칠놀이 도안 다운로드 (포인트 차감)
   */
  async downloadColoringPage(userId: string, pageId: string, isFree: boolean = false): Promise<PointTransaction> {
    try {
      const userBalance = await this.getUserPointBalance(userId);
      const downloadCost = isFree ? 0 : 5; // 무료가 아니면 5포인트

      // 무료 다운로드 확인
      if (!isFree && userBalance.dailyFreeCount <= 0 && userBalance.totalPoints < downloadCost) {
        throw new Error('Insufficient points or daily free downloads exhausted');
      }

      // 포인트 차감 (무료가 아닌 경우)
      let actualCost = 0;
      if (!isFree) {
        if (userBalance.dailyFreeCount > 0) {
          // 무료 다운로드 사용
          actualCost = 0;
          await this.updateDailyFreeCount(userId, userBalance.dailyFreeCount - 1);
        } else {
          // 포인트 차감
          actualCost = downloadCost;
          await this.deductPoints(userId, downloadCost);
        }
      }

      const transaction: PointTransaction = {
        id: `txn_${Date.now()}`,
        userId,
        type: isFree || actualCost === 0 ? 'daily_free' : 'download',
        amount: -actualCost,
        description: isFree || actualCost === 0 
          ? `무료 다운로드 (${pageId})` 
          : `${downloadCost}포인트 차감 (${pageId})`,
        pageId,
        createdAt: new Date().toISOString(),
      };

      await this.saveTransaction(transaction);

      logger.info('Coloring page downloaded', {
        transactionId: transaction.id,
        userId,
        pageId,
        cost: actualCost,
        isFree: actualCost === 0,
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to download coloring page', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        pageId,
      });
      throw error;
    }
  }

  /**
   * 포인트 차감
   */
  private async deductPoints(userId: string, amount: number): Promise<void> {
    try {
      // 실제로는 Firestore에서 사용자 포인트 차감
      logger.info('Deducting points', { userId, amount });
      
      // 시뮬레이션된 포인트 차감
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('Failed to deduct points', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        amount,
      });
      throw error;
    }
  }

  /**
   * 일일 무료 다운로드 수 업데이트
   */
  private async updateDailyFreeCount(userId: string, newCount: number): Promise<void> {
    try {
      // 실제로는 Firestore에서 일일 무료 다운로드 수 업데이트
      logger.info('Updating daily free count', { userId, newCount });
      
      // 시뮬레이션된 업데이트
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('Failed to update daily free count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        newCount,
      });
      throw error;
    }
  }

  /**
   * 트랜잭션 저장
   */
  private async saveTransaction(transaction: PointTransaction): Promise<void> {
    try {
      // 실제로는 Firestore에 트랜잭션 저장
      logger.info('Saving transaction', { transactionId: transaction.id });
      
      // 시뮬레이션된 저장
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('Failed to save transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transaction,
      });
      throw error;
    }
  }

  /**
   * 사용자 트랜잭션 내역 조회
   */
  async getUserTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{
    transactions: PointTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // 실제로는 Firestore에서 트랜잭션 조회
      const mockTransactions: PointTransaction[] = [
        {
          id: `txn_${Date.now() - 1000}`,
          userId,
          type: 'charge',
          amount: 100,
          description: '100포인트 충전 (카드)',
          createdAt: new Date(Date.now() - 1000).toISOString(),
        },
        {
          id: `txn_${Date.now() - 2000}`,
          userId,
          type: 'download',
          amount: -5,
          description: '5포인트 차감 (Pikachu 도안)',
          pageId: 'page_123',
          createdAt: new Date(Date.now() - 2000).toISOString(),
        },
        {
          id: `txn_${Date.now() - 3000}`,
          userId,
          type: 'daily_free',
          amount: 0,
          description: '무료 다운로드 (Naruto 도안)',
          pageId: 'page_456',
          createdAt: new Date(Date.now() - 3000).toISOString(),
        },
      ];

      return {
        transactions: mockTransactions,
        pagination: {
          page,
          limit,
          total: mockTransactions.length,
          totalPages: Math.ceil(mockTransactions.length / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get user transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * 포인트 충전 세션 생성 (Stripe)
   */
  async createChargeSession(userId: string, points: number, amount: number): Promise<{
    sessionId: string;
    url: string;
  }> {
    try {
      // 실제로는 Stripe Checkout 세션 생성
      const sessionId = `cs_${Date.now()}`;
      const url = `https://checkout.stripe.com/pay/${sessionId}`;

      logger.info('Created charge session', {
        sessionId,
        userId,
        points,
        amount,
      });

      return { sessionId, url };
    } catch (error) {
      logger.error('Failed to create charge session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        points,
        amount,
      });
      throw error;
    }
  }
}

export default PointService;
