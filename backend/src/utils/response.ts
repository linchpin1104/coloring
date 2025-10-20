export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = <T>(
  data: T,
  message: string = 'Success',
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    pagination,
  };
};

export const errorResponse = (
  message: string,
  code: string = 'ERROR',
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
};

export const paginatedResponse = <T>(
  data: T,
  page: number,
  limit: number,
  total: number,
  message: string = 'Success',
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 추가된 exports
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_AGE_GROUP: 'INVALID_AGE_GROUP',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
} as const;

export const sendSuccess = <T>(
  res: any,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
) => {
  return res.status(statusCode).json(successResponse(data, message));
};

export const sendError = (
  res: any,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
) => {
  return res.status(statusCode).json(errorResponse(message, code));
};