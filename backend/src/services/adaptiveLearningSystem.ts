import { logger } from '../utils/logger';
import { DatabaseService } from './databaseService';

interface UserFeedback {
  userId: string;
  pageId: string;
  rating: number; // 1-5
  completionRate: number; // 0-1
  timeSpent: number; // seconds
  difficultyRating: number; // 1-5 (how difficult they found it)
  ageGroup: 'child' | 'teen' | 'adult';
  characterType: string;
  theme: string;
  timestamp: string;
}

interface PerformanceMetrics {
  downloadRate: number;
  averageRating: number;
  completionRate: number;
  ageGroupAccuracy: number;
  difficultyAccuracy: number;
  userSatisfaction: number;
  sampleSize?: number;
}

interface LearningInsights {
  characterType: string;
  ageGroup: string;
  difficulty: string;
  theme: string;
  insights: {
    optimalLineWeight: string;
    optimalComplexity: string;
    preferredEmotions: string[];
    successfulPatterns: string[];
    failedPatterns: string[];
  };
  confidence: number; // 0-1
  sampleSize: number;
}

interface ABTestResult {
  testId: string;
  variantA: {
    prompt: string;
    metrics: PerformanceMetrics;
  };
  variantB: {
    prompt: string;
    metrics: PerformanceMetrics;
  };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  sampleSize: number;
  duration: number; // days
}

export class AdaptiveLearningSystem {
  private dbService: DatabaseService;
  private learningThreshold = 100; // 최소 피드백 수
  private confidenceThreshold = 0.8; // 신뢰도 임계값

  constructor() {
    this.dbService = new DatabaseService();
  }

  /**
   * 사용자 피드백 수집
   */
  async collectFeedback(feedback: UserFeedback): Promise<void> {
    try {
      // 피드백 저장
      await this.dbService.createDocument('userFeedback', `feedback_${Date.now()}`, feedback);
      
      // 실시간 학습 트리거
      await this.triggerLearning(feedback);
      
      logger.info('User feedback collected and processed', {
        userId: feedback.userId,
        pageId: feedback.pageId,
        rating: feedback.rating,
        completionRate: feedback.completionRate,
      });
    } catch (error) {
      logger.error('Failed to collect feedback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        feedback,
      });
      throw error;
    }
  }

  /**
   * 실시간 학습 트리거
   */
  private async triggerLearning(feedback: UserFeedback): Promise<void> {
    try {
      // 해당 조합의 피드백 수 확인
      const feedbackCount = await this.getFeedbackCount({
        characterType: feedback.characterType,
        ageGroup: feedback.ageGroup,
        theme: feedback.theme,
      });

      if (feedbackCount >= this.learningThreshold) {
        await this.performLearning({
          characterType: feedback.characterType,
          ageGroup: feedback.ageGroup,
          theme: feedback.theme,
        });
      }
    } catch (error) {
      logger.error('Failed to trigger learning', {
        error: error instanceof Error ? error.message : 'Unknown error',
        feedback,
      });
    }
  }

  /**
   * 학습 수행
   */
  async performLearning(context: {
    characterType: string;
    ageGroup: string;
    theme: string;
  }): Promise<LearningInsights> {
    try {
      logger.info('Starting learning process', context);

      // 1. 관련 피드백 수집
      const feedbacks = await this.getRelevantFeedbacks(context);
      
      // 2. 성능 메트릭 계산
      const metrics = this.calculatePerformanceMetrics(feedbacks);
      
      // 3. 인사이트 추출
      const insights = this.extractInsights(feedbacks, metrics);
      
      // 4. 신뢰도 계산
      const confidence = this.calculateConfidence(feedbacks, insights);
      
      // 5. 학습 결과 저장
      const learningResult: LearningInsights = {
        characterType: context.characterType,
        ageGroup: context.ageGroup,
        difficulty: this.determineOptimalDifficulty(metrics),
        theme: context.theme,
        insights,
        confidence,
        sampleSize: feedbacks.length,
      };

      await this.saveLearningInsights(learningResult);
      
      // 6. 마스터 규칙 업데이트
      if (confidence >= this.confidenceThreshold) {
        await this.updateMasterRules(learningResult);
      }

      logger.info('Learning process completed', {
        context,
        confidence,
        sampleSize: feedbacks.length,
        insights: Object.keys(insights).length,
      });

      return learningResult;
    } catch (error) {
      logger.error('Failed to perform learning', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
      throw error;
    }
  }

  /**
   * A/B 테스트 실행
   */
  async runABTest(testConfig: {
    characterName: string;
    characterType: string;
    ageGroup: string;
    variantA: string; // 프롬프트 A
    variantB: string; // 프롬프트 B
    duration: number; // 테스트 기간 (일)
  }): Promise<ABTestResult> {
    try {
      const testId = `ab_test_${Date.now()}`;
      
      logger.info('Starting A/B test', { testId, testConfig });

      // 테스트 설정 저장
      await this.dbService.createDocument('abTests', testId, {
        ...testConfig,
        testId,
        status: 'running',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + testConfig.duration * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 테스트 완료 후 결과 분석
      setTimeout(async () => {
        await this.analyzeABTestResult(testId);
      }, testConfig.duration * 24 * 60 * 60 * 1000);

      return {
        testId,
        variantA: { prompt: testConfig.variantA, metrics: {} as PerformanceMetrics },
        variantB: { prompt: testConfig.variantB, metrics: {} as PerformanceMetrics },
        winner: 'tie',
        confidence: 0,
        sampleSize: 0,
        duration: testConfig.duration,
      };
    } catch (error) {
      logger.error('Failed to run A/B test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testConfig,
      });
      throw error;
    }
  }

  /**
   * A/B 테스트 결과 분석
   */
  private async analyzeABTestResult(testId: string): Promise<void> {
    try {
      // 테스트 데이터 조회
      const testData = await this.dbService.getDocument('abTests', testId);
      if (!testData) {return;}

      // 각 변형의 성능 메트릭 계산
      const variantAMetrics = await this.calculateVariantMetrics(testId, 'A');
      const variantBMetrics = await this.calculateVariantMetrics(testId, 'B');

      // 승자 결정
      const winner = this.determineWinner(variantAMetrics, variantBMetrics);
      const confidence = this.calculateTestConfidence(variantAMetrics, variantBMetrics);

      // 결과 저장
      const result: ABTestResult = {
        testId,
        variantA: { prompt: testData.variantA, metrics: variantAMetrics },
        variantB: { prompt: testData.variantB, metrics: variantBMetrics },
        winner,
        confidence,
        sampleSize: (variantAMetrics.sampleSize || 0) + (variantBMetrics.sampleSize || 0),
        duration: testData.duration,
      };

      await this.dbService.updateDocument('abTests', testId, {
        status: 'completed',
        result,
        completedAt: new Date().toISOString(),
      });

      // 승리한 변형을 마스터 규칙에 반영
      if (winner !== 'tie' && confidence >= 0.8) {
        await this.applyWinningVariant(result);
      }

      logger.info('A/B test analysis completed', {
        testId,
        winner,
        confidence,
        sampleSize: result.sampleSize,
      });
    } catch (error) {
      logger.error('Failed to analyze A/B test result', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
    }
  }

  /**
   * 성능 메트릭 계산
   */
  private calculatePerformanceMetrics(feedbacks: UserFeedback[]): PerformanceMetrics {
    if (feedbacks.length === 0) {
      return {
        downloadRate: 0,
        averageRating: 0,
        completionRate: 0,
        ageGroupAccuracy: 0,
        difficultyAccuracy: 0,
        userSatisfaction: 0,
      };
    }

    const totalFeedbacks = feedbacks.length;
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks;
    const averageCompletionRate = feedbacks.reduce((sum, f) => sum + f.completionRate, 0) / totalFeedbacks;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _averageTimeSpent = feedbacks.reduce((sum, f) => sum + f.timeSpent, 0) / totalFeedbacks;

    // 다운로드율 (완료율 기반 추정)
    const downloadRate = averageCompletionRate;

    // 연령대 정확도 (완료율과 시간 기반)
    const ageGroupAccuracy = this.calculateAgeGroupAccuracy(feedbacks);

    // 난이도 정확도 (완료율과 난이도 평가 기반)
    const difficultyAccuracy = this.calculateDifficultyAccuracy(feedbacks);

    // 사용자 만족도 (종합 점수)
    const userSatisfaction = (averageRating + averageCompletionRate + ageGroupAccuracy) / 3;

    return {
      downloadRate,
      averageRating,
      completionRate: averageCompletionRate,
      ageGroupAccuracy,
      difficultyAccuracy,
      userSatisfaction,
      sampleSize: totalFeedbacks,
    };
  }

  /**
   * 인사이트 추출
   */
  private extractInsights(feedbacks: UserFeedback[], _metrics: PerformanceMetrics): any {
    const insights = {
      optimalLineWeight: this.determineOptimalLineWeight(feedbacks),
      optimalComplexity: this.determineOptimalComplexity(feedbacks),
      preferredEmotions: this.extractPreferredEmotions(feedbacks),
      successfulPatterns: this.extractSuccessfulPatterns(feedbacks),
      failedPatterns: this.extractFailedPatterns(feedbacks),
    };

    return insights;
  }

  /**
   * 최적 라인 두께 결정
   */
  private determineOptimalLineWeight(feedbacks: UserFeedback[]): string {
    // 완료율이 높은 피드백들의 특성 분석
    const highCompletionFeedbacks = feedbacks.filter(f => f.completionRate > 0.8);
    
    if (highCompletionFeedbacks.length === 0) {return '2-3px';}

    // 연령대별 최적 라인 두께
    const { ageGroup } = highCompletionFeedbacks[0];
    if (ageGroup === 'child') {return '3-5px';}
    if (ageGroup === 'teen') {return '2-3px';}
    if (ageGroup === 'adult') {return '1-2px';}

    return '2-3px';
  }

  /**
   * 최적 복잡도 결정
   */
  private determineOptimalComplexity(feedbacks: UserFeedback[]): string {
    const highRatingFeedbacks = feedbacks.filter(f => f.rating >= 4);
    
    if (highRatingFeedbacks.length === 0) {return '6-12 elements';}

    const avgCompletionRate = highRatingFeedbacks.reduce((sum, f) => sum + f.completionRate, 0) / highRatingFeedbacks.length;
    
    if (avgCompletionRate > 0.9) {return '3-5 elements';}
    if (avgCompletionRate > 0.7) {return '6-12 elements';}
    return '15+ elements';
  }

  /**
   * 선호 감정 추출
   */
  private extractPreferredEmotions(feedbacks: UserFeedback[]): string[] {
    // 높은 평점을 받은 피드백들의 감정 패턴 분석
    const highRatingFeedbacks = feedbacks.filter(f => f.rating >= 4);
    
    // 실제로는 더 복잡한 분석이 필요하지만, 여기서는 시뮬레이션
    const emotions = ['happy', 'excited', 'confident', 'peaceful', 'curious'];
    return emotions.slice(0, Math.min(3, highRatingFeedbacks.length));
  }

  /**
   * 성공 패턴 추출
   */
  private extractSuccessfulPatterns(feedbacks: UserFeedback[]): string[] {
    const successfulFeedbacks = feedbacks.filter(f => f.rating >= 4 && f.completionRate > 0.8);
    
    // 성공적인 패턴들 (실제로는 더 복잡한 분석 필요)
    const patterns = [
      'simple composition',
      'clear focal point',
      'balanced elements',
      'appropriate complexity',
    ];
    
    return patterns.slice(0, Math.min(2, successfulFeedbacks.length));
  }

  /**
   * 실패 패턴 추출
   */
  private extractFailedPatterns(feedbacks: UserFeedback[]): string[] {
    const failedFeedbacks = feedbacks.filter(f => f.rating <= 2 || f.completionRate < 0.3);
    
    // 실패한 패턴들
    const patterns = [
      'too complex',
      'unclear composition',
      'inappropriate difficulty',
      'confusing elements',
    ];
    
    return patterns.slice(0, Math.min(2, failedFeedbacks.length));
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(feedbacks: UserFeedback[], _insights: any): number {
    const sampleSize = feedbacks.length;
    const baseConfidence = Math.min(1.0, sampleSize / this.learningThreshold);
    
    // 일관성 점수 (피드백의 일관성)
    const consistency = this.calculateConsistency(feedbacks);
    
    // 다양성 점수 (다양한 사용자로부터의 피드백)
    const diversity = this.calculateDiversity(feedbacks);
    
    return Math.min(1.0, baseConfidence * consistency * diversity);
  }

  /**
   * 일관성 계산
   */
  private calculateConsistency(feedbacks: UserFeedback[]): number {
    if (feedbacks.length < 2) {return 0.5;}
    
    const ratings = feedbacks.map(f => f.rating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    
    // 분산이 낮을수록 일관성이 높음
    return Math.max(0.1, 1 - (variance / 4)); // 4는 최대 분산 (1-5 스케일)
  }

  /**
   * 다양성 계산
   */
  private calculateDiversity(feedbacks: UserFeedback[]): number {
    const uniqueUsers = new Set(feedbacks.map(f => f.userId)).size;
    const uniqueThemes = new Set(feedbacks.map(f => f.theme)).size;
    
    const userDiversity = Math.min(1.0, uniqueUsers / 10); // 10명 이상이면 최대
    const themeDiversity = Math.min(1.0, uniqueThemes / 5); // 5개 테마 이상이면 최대
    
    return (userDiversity + themeDiversity) / 2;
  }

  /**
   * 연령대 정확도 계산
   */
  private calculateAgeGroupAccuracy(feedbacks: UserFeedback[]): number {
    if (feedbacks.length === 0) {return 0;}
    
    // 완료율이 높을수록 연령대가 적절함
    const avgCompletionRate = feedbacks.reduce((sum, f) => sum + f.completionRate, 0) / feedbacks.length;
    return avgCompletionRate;
  }

  /**
   * 난이도 정확도 계산
   */
  private calculateDifficultyAccuracy(feedbacks: UserFeedback[]): number {
    if (feedbacks.length === 0) {return 0;}
    
    // 난이도 평가와 완료율의 상관관계
    const difficultyRatings = feedbacks.map(f => f.difficultyRating);
    const completionRates = feedbacks.map(f => f.completionRate);
    
    // 난이도가 높을수록 완료율이 낮아야 정확
    const correlation = this.calculateCorrelation(difficultyRatings, completionRates);
    return Math.max(0, -correlation); // 음의 상관관계가 좋음
  }

  /**
   * 상관관계 계산
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) {return 0;}
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 최적 난이도 결정
   */
  private determineOptimalDifficulty(metrics: PerformanceMetrics): string {
    if (metrics.completionRate > 0.9) {return 'easy';}
    if (metrics.completionRate > 0.7) {return 'medium';}
    return 'hard';
  }

  /**
   * 승자 결정
   */
  private determineWinner(metricsA: PerformanceMetrics, metricsB: PerformanceMetrics): 'A' | 'B' | 'tie' {
    const scoreA = metricsA.userSatisfaction;
    const scoreB = metricsB.userSatisfaction;
    
    const difference = Math.abs(scoreA - scoreB);
    if (difference < 0.05) {return 'tie';} // 5% 미만 차이면 무승부
    
    return scoreA > scoreB ? 'A' : 'B';
  }

  /**
   * 테스트 신뢰도 계산
   */
  private calculateTestConfidence(metricsA: PerformanceMetrics, metricsB: PerformanceMetrics): number {
    const sampleSize = (metricsA.sampleSize || 0) + (metricsB.sampleSize || 0);
    const baseConfidence = Math.min(1.0, sampleSize / 200); // 200개 이상이면 최대
    
    const difference = Math.abs(metricsA.userSatisfaction - metricsB.userSatisfaction);
    const significance = Math.min(1.0, difference * 10); // 차이가 클수록 유의미
    
    return baseConfidence * significance;
  }

  /**
   * 관련 피드백 조회
   */
  private async getRelevantFeedbacks(_context: {
    characterType: string;
    ageGroup: string;
    theme: string;
  }): Promise<UserFeedback[]> {
    // 실제로는 Firestore 쿼리로 구현
    // 여기서는 시뮬레이션
    return [];
  }

  /**
   * 피드백 수 조회
   */
  private async getFeedbackCount(_context: {
    characterType: string;
    ageGroup: string;
    theme: string;
  }): Promise<number> {
    // 실제로는 Firestore 쿼리로 구현
    return 0;
  }

  /**
   * 변형 메트릭 계산
   */
  private async calculateVariantMetrics(_testId: string, _variant: string): Promise<PerformanceMetrics> {
    // 실제로는 해당 변형의 피드백 데이터를 분석
    return {
      downloadRate: 0.8,
      averageRating: 4.2,
      completionRate: 0.85,
      ageGroupAccuracy: 0.9,
      difficultyAccuracy: 0.8,
      userSatisfaction: 0.85,
      sampleSize: 50,
    };
  }

  /**
   * 학습 인사이트 저장
   */
  private async saveLearningInsights(insights: LearningInsights): Promise<void> {
    await this.dbService.createDocument('learningInsights', `insights_${Date.now()}`, insights);
  }

  /**
   * 마스터 규칙 업데이트
   */
  private async updateMasterRules(insights: LearningInsights): Promise<void> {
    // 마스터 규칙을 학습 결과에 따라 업데이트
    logger.info('Updating master rules based on learning insights', {
      characterType: insights.characterType,
      ageGroup: insights.ageGroup,
      confidence: insights.confidence,
    });
  }

  /**
   * 승리 변형 적용
   */
  private async applyWinningVariant(result: ABTestResult): Promise<void> {
    logger.info('Applying winning variant to master rules', {
      testId: result.testId,
      winner: result.winner,
      confidence: result.confidence,
    });
  }
}

export default AdaptiveLearningSystem;
