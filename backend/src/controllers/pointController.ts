import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import PointService from '../services/pointService';

// 사용자 포인트 잔액 조회
export const getUserPoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    
    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    const pointService = new PointService();
    const balance = await pointService.getUserPointBalance(userId);

    res.json(successResponse(balance, 'User points retrieved successfully'));
  } catch (error) {
    logger.error('Failed to get user points', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (req as Request & { user?: { uid: string } }).user?.uid,
    });
    res.status(500).json(errorResponse('Failed to get user points', 'POINT_ERROR'));
  }
};

// 포인트 충전 세션 생성
export const createChargeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    const { points, amount } = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    if (!points || !amount) {
      return res.status(400).json(errorResponse('Points and amount are required', 'VALIDATION_ERROR'));
    }

    const pointService = new PointService();
    const session = await pointService.createChargeSession(userId, points, amount);

    res.json(successResponse(session, 'Charge session created successfully'));
  } catch (error) {
    logger.error('Failed to create charge session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (req as Request & { user?: { uid: string } }).user?.uid,
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to create charge session', 'PAYMENT_ERROR'));
  }
};

// 포인트 충전 (웹훅)
export const chargePoints = async (req: Request, res: Response) => {
  try {
    const { userId, points, paymentMethod } = req.body;

    if (!userId || !points) {
      return res.status(400).json(errorResponse('User ID and points are required', 'VALIDATION_ERROR'));
    }

    const pointService = new PointService();
    const transaction = await pointService.chargePoints(userId, points, paymentMethod || 'card');

    res.json(successResponse(transaction, 'Points charged successfully'));
  } catch (error) {
    logger.error('Failed to charge points', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    res.status(500).json(errorResponse('Failed to charge points', 'PAYMENT_ERROR'));
  }
};

// 색칠놀이 도안 다운로드 (포인트 차감)
export const downloadWithPoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    const { pageId } = req.params;
    const { isFree = false } = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    if (!pageId) {
      return res.status(400).json(errorResponse('Page ID is required', 'VALIDATION_ERROR'));
    }

    const pointService = new PointService();
    const transaction = await pointService.downloadColoringPage(userId, pageId, isFree);

    res.json(successResponse(transaction, 'Download processed successfully'));
  } catch (error) {
    logger.error('Failed to download with points', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (req as Request & { user?: { uid: string } }).user?.uid,
      pageId: req.params.pageId,
    });
    res.status(500).json(errorResponse('Failed to process download', 'DOWNLOAD_ERROR'));
  }
};

// 사용자 트랜잭션 내역 조회
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    const pointService = new PointService();
    const result = await pointService.getUserTransactions(
      userId,
      Number(page),
      Number(limit),
    );

    res.json(successResponse(result, 'Transactions retrieved successfully'));
  } catch (error) {
    logger.error('Failed to get user transactions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (req as Request & { user?: { uid: string } }).user?.uid,
    });
    res.status(500).json(errorResponse('Failed to get transactions', 'TRANSACTION_ERROR'));
  }
};

// 포인트 사용 가능 여부 확인
export const checkPointAvailability = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { uid: string } }).user?.uid;
    const { pageId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required', 'AUTH_ERROR'));
    }

    if (!pageId) {
      return res.status(400).json(errorResponse('Page ID is required', 'VALIDATION_ERROR'));
    }

    const pointService = new PointService();
    const balance = await pointService.getUserPointBalance(userId);

    const canDownload = balance.totalPoints >= 5 || balance.dailyFreeCount > 0;
    const isFree = balance.dailyFreeCount > 0;

    res.json(successResponse({
      canDownload,
      isFree,
      balance,
      cost: isFree ? 0 : 5,
    }, 'Point availability checked successfully'));
  } catch (error) {
    logger.error('Failed to check point availability', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: (req as Request & { user?: { uid: string } }).user?.uid,
      pageId: req.params.pageId,
    });
    res.status(500).json(errorResponse('Failed to check point availability', 'POINT_ERROR'));
  }
};
