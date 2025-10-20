import { logger } from '../utils/logger';

interface QualityMetrics {
  overallScore: number; // 0-1
  lineQuality: number; // 0-1
  composition: number; // 0-1
  ageAppropriateness: number; // 0-1
  difficultyAccuracy: number; // 0-1
  technicalQuality: number; // 0-1
  coloringAreas: number; // 실제 색칠 영역 수
  lineThickness: number; // 평균 라인 두께 (px)
  complexity: number; // 복잡도 점수 (0-1)
}

interface ValidationResult {
  isValid: boolean;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
  metrics: QualityMetrics;
  passedChecks: string[];
  failedChecks: string[];
}

interface ImageAnalysis {
  width: number;
  height: number;
  lineCount: number;
  averageLineThickness: number;
  coloringAreas: number;
  complexity: number;
  contrast: number;
  sharpness: number;
}

export class QualityValidationSystem {
  private qualityThreshold = 0.7; // 최소 품질 점수
  private ageGroupRequirements = {
    child: {
      minLineThickness: 3,
      maxComplexity: 0.3,
      minColoringAreas: 3,
      maxColoringAreas: 8,
    },
    teen: {
      minLineThickness: 2,
      maxComplexity: 0.6,
      minColoringAreas: 6,
      maxColoringAreas: 15,
    },
    adult: {
      minLineThickness: 1,
      maxComplexity: 1.0,
      minColoringAreas: 10,
      maxColoringAreas: 30,
    },
  };

  /**
   * 이미지 품질 검증
   */
  async validateImageQuality(
    imageUrl: string,
    expectedAgeGroup: 'child' | 'teen' | 'adult',
    expectedDifficulty: 'easy' | 'medium' | 'hard',
    prompt: string,
  ): Promise<ValidationResult> {
    try {
      logger.info('Starting image quality validation', {
        imageUrl,
        expectedAgeGroup,
        expectedDifficulty,
      });

      // 1. 이미지 분석
      const analysis = await this.analyzeImage(imageUrl);
      
      // 2. 품질 메트릭 계산
      const metrics = this.calculateQualityMetrics(analysis, expectedAgeGroup, expectedDifficulty);
      
      // 3. 검증 체크 수행
      const validationChecks = this.performValidationChecks(analysis, expectedAgeGroup, expectedDifficulty, prompt);
      
      // 4. 종합 결과 생성
      const result = this.generateValidationResult(metrics, validationChecks, expectedAgeGroup);
      
      logger.info('Image quality validation completed', {
        imageUrl,
        overallScore: result.qualityScore,
        isValid: result.isValid,
        issuesCount: result.issues.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to validate image quality', {
        error: error instanceof Error ? error.message : 'Unknown error',
        imageUrl,
        expectedAgeGroup,
        expectedDifficulty,
      });
      throw error;
    }
  }

  /**
   * 이미지 분석
   */
  private async analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
    try {
      // 실제로는 이미지 처리 라이브러리 (OpenCV, Sharp 등)를 사용
      // 여기서는 시뮬레이션
      
      // 이미지 다운로드 및 분석 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 시뮬레이션된 분석 결과
      const analysis: ImageAnalysis = {
        width: 1024,
        height: 1024,
        lineCount: Math.floor(Math.random() * 50) + 20,
        averageLineThickness: Math.random() * 3 + 1,
        coloringAreas: Math.floor(Math.random() * 20) + 5,
        complexity: Math.random(),
        contrast: 0.8 + Math.random() * 0.2,
        sharpness: 0.7 + Math.random() * 0.3,
      };

      logger.info('Image analysis completed', analysis);
      return analysis;
    } catch (error) {
      logger.error('Failed to analyze image', {
        error: error instanceof Error ? error.message : 'Unknown error',
        imageUrl,
      });
      throw error;
    }
  }

  /**
   * 품질 메트릭 계산
   */
  private calculateQualityMetrics(
    analysis: ImageAnalysis,
    ageGroup: 'child' | 'teen' | 'adult',
    difficulty: 'easy' | 'medium' | 'hard',
  ): QualityMetrics {
    // 라인 품질 점수
    const lineQuality = this.calculateLineQuality(analysis);
    
    // 구성 점수
    const composition = this.calculateComposition(analysis);
    
    // 연령대 적합성 점수
    const ageAppropriateness = this.calculateAgeAppropriateness(analysis, ageGroup);
    
    // 난이도 정확성 점수
    const difficultyAccuracy = this.calculateDifficultyAccuracy(analysis, difficulty);
    
    // 기술적 품질 점수
    const technicalQuality = this.calculateTechnicalQuality(analysis);
    
    // 종합 점수
    const overallScore = (
      lineQuality * 0.25 +
      composition * 0.2 +
      ageAppropriateness * 0.25 +
      difficultyAccuracy * 0.15 +
      technicalQuality * 0.15
    );

    return {
      overallScore,
      lineQuality,
      composition,
      ageAppropriateness,
      difficultyAccuracy,
      technicalQuality,
      coloringAreas: analysis.coloringAreas,
      lineThickness: analysis.averageLineThickness,
      complexity: analysis.complexity,
    };
  }

  /**
   * 라인 품질 계산
   */
  private calculateLineQuality(analysis: ImageAnalysis): number {
    let score = 1.0;
    
    // 라인 두께 일관성
    if (analysis.averageLineThickness < 1 || analysis.averageLineThickness > 5) {
      score -= 0.3;
    }
    
    // 선명도
    if (analysis.sharpness < 0.8) {
      score -= 0.2;
    }
    
    // 대비
    if (analysis.contrast < 0.8) {
      score -= 0.2;
    }
    
    // 라인 수 (너무 적거나 많으면 감점)
    if (analysis.lineCount < 10) {
      score -= 0.2;
    } else if (analysis.lineCount > 100) {
      score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 구성 점수 계산
   */
  private calculateComposition(analysis: ImageAnalysis): number {
    let score = 1.0;
    
    // 종횡비 (정사각형에 가까울수록 좋음)
    const aspectRatio = analysis.width / analysis.height;
    const aspectRatioScore = 1 - Math.abs(aspectRatio - 1) * 0.5;
    score *= aspectRatioScore;
    
    // 색칠 영역 분포
    if (analysis.coloringAreas < 3) {
      score -= 0.3;
    } else if (analysis.coloringAreas > 30) {
      score -= 0.1;
    }
    
    // 복잡도 (적절한 수준)
    if (analysis.complexity < 0.2) {
      score -= 0.2; // 너무 단순
    } else if (analysis.complexity > 0.9) {
      score -= 0.1; // 너무 복잡
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 연령대 적합성 계산
   */
  private calculateAgeAppropriateness(
    analysis: ImageAnalysis,
    ageGroup: 'child' | 'teen' | 'adult',
  ): number {
    const requirements = this.ageGroupRequirements[ageGroup];
    let score = 1.0;
    
    // 라인 두께 체크
    if (analysis.averageLineThickness < requirements.minLineThickness) {
      score -= 0.3;
    }
    
    // 복잡도 체크
    if (analysis.complexity > requirements.maxComplexity) {
      score -= 0.4;
    }
    
    // 색칠 영역 수 체크
    if (analysis.coloringAreas < requirements.minColoringAreas) {
      score -= 0.2;
    } else if (analysis.coloringAreas > requirements.maxColoringAreas) {
      score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 난이도 정확성 계산
   */
  private calculateDifficultyAccuracy(
    analysis: ImageAnalysis,
    difficulty: 'easy' | 'medium' | 'hard',
  ): number {
    let score = 1.0;
    
    const difficultyRequirements = {
      easy: { maxComplexity: 0.3, minLineThickness: 3, maxColoringAreas: 8 },
      medium: { maxComplexity: 0.6, minLineThickness: 2, maxColoringAreas: 15 },
      hard: { maxComplexity: 1.0, minLineThickness: 1, maxColoringAreas: 30 },
    };
    
    const requirements = difficultyRequirements[difficulty];
    
    // 복잡도 체크
    if (analysis.complexity > requirements.maxComplexity) {
      score -= 0.3;
    }
    
    // 라인 두께 체크
    if (analysis.averageLineThickness < requirements.minLineThickness) {
      score -= 0.2;
    }
    
    // 색칠 영역 수 체크
    if (analysis.coloringAreas > requirements.maxColoringAreas) {
      score -= 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 기술적 품질 계산
   */
  private calculateTechnicalQuality(analysis: ImageAnalysis): number {
    let score = 1.0;
    
    // 해상도 체크
    if (analysis.width < 512 || analysis.height < 512) {
      score -= 0.3;
    }
    
    // 선명도 체크
    if (analysis.sharpness < 0.7) {
      score -= 0.3;
    }
    
    // 대비 체크
    if (analysis.contrast < 0.7) {
      score -= 0.2;
    }
    
    // 라인 수 체크 (너무 적으면 문제)
    if (analysis.lineCount < 5) {
      score -= 0.4;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 검증 체크 수행
   */
  private performValidationChecks(
    analysis: ImageAnalysis,
    ageGroup: 'child' | 'teen' | 'adult',
    difficulty: 'easy' | 'medium' | 'hard',
    prompt: string,
  ): {
    passedChecks: string[];
    failedChecks: string[];
    issues: string[];
    recommendations: string[];
  } {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 1. 기본 기술적 체크
    if (analysis.width >= 512 && analysis.height >= 512) {
      passedChecks.push('Minimum resolution met');
    } else {
      failedChecks.push('Resolution too low');
      issues.push('Image resolution is below minimum requirement (512x512)');
      recommendations.push('Increase image resolution to at least 512x512 pixels');
    }

    // 2. 대비 체크
    if (analysis.contrast >= 0.8) {
      passedChecks.push('Good contrast');
    } else {
      failedChecks.push('Low contrast');
      issues.push('Image contrast is too low');
      recommendations.push('Increase contrast between lines and background');
    }

    // 3. 선명도 체크
    if (analysis.sharpness >= 0.8) {
      passedChecks.push('Sharp lines');
    } else {
      failedChecks.push('Blurry lines');
      issues.push('Image lines are not sharp enough');
      recommendations.push('Improve line sharpness and clarity');
    }

    // 4. 연령대 적합성 체크
    const ageRequirements = this.ageGroupRequirements[ageGroup];
    if (analysis.averageLineThickness >= ageRequirements.minLineThickness) {
      passedChecks.push('Appropriate line thickness for age group');
    } else {
      failedChecks.push('Line thickness too thin for age group');
      issues.push(`Line thickness (${analysis.averageLineThickness.toFixed(1)}px) is too thin for ${ageGroup} age group`);
      recommendations.push(`Increase line thickness to at least ${ageRequirements.minLineThickness}px`);
    }

    // 5. 복잡도 체크
    if (analysis.complexity <= ageRequirements.maxComplexity) {
      passedChecks.push('Appropriate complexity for age group');
    } else {
      failedChecks.push('Complexity too high for age group');
      issues.push(`Image complexity (${(analysis.complexity * 100).toFixed(1)}%) is too high for ${ageGroup} age group`);
      recommendations.push('Simplify the design to reduce complexity');
    }

    // 6. 색칠 영역 수 체크
    if (analysis.coloringAreas >= ageRequirements.minColoringAreas && 
        analysis.coloringAreas <= ageRequirements.maxColoringAreas) {
      passedChecks.push('Appropriate number of coloring areas');
    } else {
      failedChecks.push('Inappropriate number of coloring areas');
      issues.push(`Number of coloring areas (${analysis.coloringAreas}) is not appropriate for ${ageGroup} age group`);
      recommendations.push(`Adjust number of coloring areas to ${ageRequirements.minColoringAreas}-${ageRequirements.maxColoringAreas}`);
    }

    // 7. 프롬프트 일치성 체크
    const promptIssues = this.checkPromptCompliance(prompt, analysis);
    if (promptIssues.length === 0) {
      passedChecks.push('Prompt compliance');
    } else {
      failedChecks.push('Prompt compliance issues');
      issues.push(...promptIssues);
      recommendations.push('Review and adjust prompt to match requirements');
    }

    return {
      passedChecks,
      failedChecks,
      issues,
      recommendations,
    };
  }

  /**
   * 프롬프트 준수 체크
   */
  private checkPromptCompliance(prompt: string, _analysis: ImageAnalysis): string[] {
    const issues: string[] = [];
    const promptLower = prompt.toLowerCase();

    // 흑백 라인아트 체크
    if (!promptLower.includes('black and white') && !promptLower.includes('line art')) {
      issues.push('Prompt should specify black and white line art');
    }

    // 배경 체크
    if (!promptLower.includes('white background')) {
      issues.push('Prompt should specify white background');
    }

    // 색칠 영역 체크
    if (!promptLower.includes('coloring page')) {
      issues.push('Prompt should specify this is a coloring page');
    }

    return issues;
  }

  /**
   * 검증 결과 생성
   */
  private generateValidationResult(
    metrics: QualityMetrics,
    checks: {
      passedChecks: string[];
      failedChecks: string[];
      issues: string[];
      recommendations: string[];
    },
    _ageGroup: 'child' | 'teen' | 'adult',
  ): ValidationResult {
    const isValid = metrics.overallScore >= this.qualityThreshold && 
                   checks.failedChecks.length === 0;

    return {
      isValid,
      qualityScore: Math.round(metrics.overallScore * 100) / 100,
      issues: checks.issues,
      recommendations: checks.recommendations,
      metrics,
      passedChecks: checks.passedChecks,
      failedChecks: checks.failedChecks,
    };
  }

  /**
   * 배치 품질 검증
   */
  async validateBatchImages(
    images: Array<{
      url: string;
      ageGroup: 'child' | 'teen' | 'adult';
      difficulty: 'easy' | 'medium' | 'hard';
      prompt: string;
    }>,
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const image of images) {
      try {
        const result = await this.validateImageQuality(
          image.url,
          image.ageGroup,
          image.difficulty,
          image.prompt,
        );
        results.push(result);
      } catch (error) {
        logger.error('Failed to validate image in batch', {
          error: error instanceof Error ? error.message : 'Unknown error',
          imageUrl: image.url,
        });
        
        // 실패한 경우 기본 실패 결과 생성
        results.push({
          isValid: false,
          qualityScore: 0,
          issues: ['Image validation failed'],
          recommendations: ['Retry image generation'],
          metrics: {
            overallScore: 0,
            lineQuality: 0,
            composition: 0,
            ageAppropriateness: 0,
            difficultyAccuracy: 0,
            technicalQuality: 0,
            coloringAreas: 0,
            lineThickness: 0,
            complexity: 0,
          },
          passedChecks: [],
          failedChecks: ['Validation failed'],
        });
      }
    }
    
    return results;
  }

  /**
   * 품질 임계값 업데이트
   */
  updateQualityThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.qualityThreshold = threshold;
      logger.info('Quality threshold updated', { newThreshold: threshold });
    } else {
      logger.warn('Invalid quality threshold', { threshold });
    }
  }

  /**
   * 연령대별 요구사항 업데이트
   */
  updateAgeGroupRequirements(
    ageGroup: 'child' | 'teen' | 'adult',
    requirements: {
      minLineThickness: number;
      maxComplexity: number;
      minColoringAreas: number;
      maxColoringAreas: number;
    },
  ): void {
    this.ageGroupRequirements[ageGroup] = requirements;
    logger.info('Age group requirements updated', { ageGroup, requirements });
  }
}

export default QualityValidationSystem;
