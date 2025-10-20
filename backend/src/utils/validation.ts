import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { ApiError, ErrorCodes } from './response';

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 모든 유효성 검사 실행
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      }));

      throw new ApiError(
        'Validation failed',
        400,
        ErrorCodes.VALIDATION_ERROR,
        errorMessages,
      );
    }

    next();
  };
};

// 공통 유효성 검사 규칙들
export const commonValidations = {
  // 이메일 검증
  email: (field: string = 'email') => 
    body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),

  // 비밀번호 검증
  password: (field: string = 'password') =>
    body(field)
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),

  // UID 검증
  uid: (field: string = 'uid') =>
    param(field)
      .isString()
      .isLength({ min: 1 })
      .withMessage('Valid UID is required'),

  // 페이지 ID 검증
  pageId: (field: string = 'pageId') =>
    param(field)
      .isString()
      .isLength({ min: 1 })
      .withMessage('Valid page ID is required'),

  // 연령대 검증
  ageGroup: (field: string = 'ageGroup') =>
    body(field)
      .isIn(['child', 'teen', 'adult'])
      .withMessage('Age group must be one of: child, teen, adult'),

  // 난이도 검증
  difficulty: (field: string = 'difficulty') =>
    body(field)
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be one of: easy, medium, hard'),

  // 포인트 검증
  points: (field: string = 'points') =>
    body(field)
      .isInt({ min: 0 })
      .withMessage('Points must be a non-negative integer'),

  // 금액 검증 (센트 단위)
  amount: (field: string = 'amount') =>
    body(field)
      .isInt({ min: 1 })
      .withMessage('Amount must be a positive integer (in cents)'),

  // 페이지네이션 검증
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  // 검색 쿼리 검증
  searchQuery: (field: string = 'q') =>
    query(field)
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),

  // 키워드 배열 검증
  keywords: (field: string = 'keywords') =>
    body(field)
      .isArray({ min: 1 })
      .withMessage('Keywords must be a non-empty array')
      .custom((value: string[]) => {
        if (!value.every(keyword => typeof keyword === 'string' && keyword.length > 0)) {
          throw new Error('All keywords must be non-empty strings');
        }
        return true;
      }),
};

// 에러 핸들링 미들웨어
export const handleValidationError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof ApiError && error.code === ErrorCodes.VALIDATION_ERROR) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }
  next(error);
};
