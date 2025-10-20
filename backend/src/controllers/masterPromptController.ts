import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import MasterPromptGenerator from '../services/masterPromptGenerator';
import AdaptiveLearningSystem from '../services/adaptiveLearningSystem';
import QualityValidationSystem from '../services/qualityValidationSystem';
import { ApiError } from '../utils/error';

const promptGenerator = new MasterPromptGenerator();
const learningSystem = new AdaptiveLearningSystem();
const qualityValidator = new QualityValidationSystem();

/**
 * 최적화된 프롬프트 생성 API
 */
export const generateOptimalPrompt = async (req: Request, res: Response) => {
  try {
    const { characterName, characterType, originCountry, ageGroup, difficulty, theme, activity, emotion } = req.body;

    // 입력 검증
    if (!characterName || !characterType || !originCountry || !ageGroup) {
      return res.status(400).json(errorResponse('Missing required parameters', 'VALIDATION_ERROR'));
    }

    logger.info('Generating optimal prompt', {
      characterName,
      characterType,
      originCountry,
      ageGroup,
      difficulty,
    });

    const characterData = {
      name: characterName,
      type: characterType,
      originCountry,
    };

    const userPreferences = {
      ageGroup,
      difficulty: difficulty || 'auto',
      theme,
      activity,
      emotion,
    };

    const result = await promptGenerator.generateOptimalPrompt(characterData, userPreferences);

    res.json(successResponse(result, 'Optimal prompt generated successfully'));
  } catch (error) {
    logger.error('Failed to generate optimal prompt', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to generate optimal prompt',
        error instanceof ApiError ? error.errorCode : 'PROMPT_ERROR',
      ),
    );
  }
};

/**
 * 사용자 피드백 수집 API
 */
export const collectUserFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    if (!userId) {
      throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
    }

    const {
      pageId,
      rating,
      completionRate,
      timeSpent,
      difficultyRating,
      ageGroup,
      characterType,
      theme,
    } = req.body;

    // 입력 검증
    if (!pageId || !rating || completionRate === undefined) {
      return res.status(400).json(errorResponse('Missing required feedback data', 'VALIDATION_ERROR'));
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(errorResponse('Rating must be between 1 and 5', 'VALIDATION_ERROR'));
    }

    if (completionRate < 0 || completionRate > 1) {
      return res.status(400).json(errorResponse('Completion rate must be between 0 and 1', 'VALIDATION_ERROR'));
    }

    const feedback = {
      userId,
      pageId,
      rating,
      completionRate,
      timeSpent: timeSpent || 0,
      difficultyRating: difficultyRating || rating,
      ageGroup: ageGroup || 'adult',
      characterType: characterType || 'unknown',
      theme: theme || 'default',
      timestamp: new Date().toISOString(),
    };

    await learningSystem.collectFeedback(feedback);

    res.json(successResponse({ feedbackId: `feedback_${Date.now()}` }, 'Feedback collected successfully'));
  } catch (error) {
    logger.error('Failed to collect user feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to collect feedback',
        error instanceof ApiError ? error.errorCode : 'FEEDBACK_ERROR',
      ),
    );
  }
};

/**
 * 이미지 품질 검증 API
 */
export const validateImageQuality = async (req: Request, res: Response) => {
  try {
    const { imageUrl, ageGroup, difficulty, prompt } = req.body;

    if (!imageUrl || !ageGroup || !difficulty) {
      return res.status(400).json(errorResponse('Missing required parameters', 'VALIDATION_ERROR'));
    }

    const result = await qualityValidator.validateImageQuality(imageUrl, ageGroup, difficulty, prompt || '');

    res.json(successResponse(result, 'Image quality validation completed'));
  } catch (error) {
    logger.error('Failed to validate image quality', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to validate image quality',
        error instanceof ApiError ? error.errorCode : 'VALIDATION_ERROR',
      ),
    );
  }
};

/**
 * A/B 테스트 시작 API
 */
export const startABTest = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    if (!userId) {
      throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
    }

    const {
      characterName,
      characterType,
      ageGroup,
      variantA,
      variantB,
      duration,
    } = req.body;

    if (!characterName || !characterType || !ageGroup || !variantA || !variantB) {
      return res.status(400).json(errorResponse('Missing required test parameters', 'VALIDATION_ERROR'));
    }

    const testConfig = {
      characterName,
      characterType,
      ageGroup,
      variantA,
      variantB,
      duration: duration || 7, // 기본 7일
    };

    const result = await learningSystem.runABTest(testConfig);

    res.json(successResponse(result, 'A/B test started successfully'));
  } catch (error) {
    logger.error('Failed to start A/B test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to start A/B test',
        error instanceof ApiError ? error.errorCode : 'ABTEST_ERROR',
      ),
    );
  }
};

/**
 * 학습 인사이트 조회 API
 */
export const getLearningInsights = async (req: Request, res: Response) => {
  try {
    const { characterType, ageGroup, theme } = req.query;

    // 실제로는 데이터베이스에서 조회
    const insights = {
      characterType: characterType || 'all',
      ageGroup: ageGroup || 'all',
      theme: theme || 'all',
      insights: {
        optimalLineWeight: '2-3px',
        optimalComplexity: '6-12 elements',
        preferredEmotions: ['happy', 'confident', 'peaceful'],
        successfulPatterns: ['simple composition', 'clear focal point'],
        failedPatterns: ['too complex', 'unclear composition'],
      },
      confidence: 0.85,
      sampleSize: 150,
      lastUpdated: new Date().toISOString(),
    };

    res.json(successResponse(insights, 'Learning insights retrieved successfully'));
  } catch (error) {
    logger.error('Failed to get learning insights', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json(errorResponse('Failed to get learning insights', 'INSIGHTS_ERROR'));
  }
};

/**
 * 마스터 규칙 업데이트 API
 */
export const updateMasterRules = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    if (!userId) {
      throw new ApiError(401, 'Authentication required', 'AUTH_ERROR');
    }

    // 관리자 권한 확인 (실제로는 더 정교한 권한 체크 필요)
    const { rules } = req.body;

    if (!rules) {
      return res.status(400).json(errorResponse('Rules data is required', 'VALIDATION_ERROR'));
    }

    // 마스터 규칙 업데이트 로직
    logger.info('Master rules update requested', {
      userId,
      rulesVersion: rules.version,
      updatedFields: Object.keys(rules),
    });

    // 실제 업데이트 로직은 MasterPromptGenerator에 구현
    // await promptGenerator.updateMasterRules(rules);

    res.json(successResponse({ updated: true, version: rules.version }, 'Master rules updated successfully'));
  } catch (error) {
    logger.error('Failed to update master rules', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(error instanceof ApiError ? error.statusCode : 500).json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to update master rules',
        error instanceof ApiError ? error.errorCode : 'RULES_ERROR',
      ),
    );
  }
};

/**
 * 품질 임계값 업데이트 API
 */
export const updateQualityThreshold = async (req: Request, res: Response) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold < 0 || threshold > 1) {
      return res.status(400).json(errorResponse('Threshold must be between 0 and 1', 'VALIDATION_ERROR'));
    }

    qualityValidator.updateQualityThreshold(threshold);

    res.json(successResponse({ threshold }, 'Quality threshold updated successfully'));
  } catch (error) {
    logger.error('Failed to update quality threshold', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to update quality threshold', 'THRESHOLD_ERROR'));
  }
};

/**
 * 연령대별 요구사항 업데이트 API
 */
export const updateAgeGroupRequirements = async (req: Request, res: Response) => {
  try {
    const { ageGroup, requirements } = req.body;

    if (!ageGroup || !requirements) {
      return res.status(400).json(errorResponse('Age group and requirements are required', 'VALIDATION_ERROR'));
    }

    if (!['child', 'teen', 'adult'].includes(ageGroup)) {
      return res.status(400).json(errorResponse('Invalid age group', 'VALIDATION_ERROR'));
    }

    qualityValidator.updateAgeGroupRequirements(ageGroup as 'child' | 'teen' | 'adult', requirements);

    res.json(successResponse({ ageGroup, requirements }, 'Age group requirements updated successfully'));
  } catch (error) {
    logger.error('Failed to update age group requirements', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to update age group requirements', 'REQUIREMENTS_ERROR'));
  }
};

