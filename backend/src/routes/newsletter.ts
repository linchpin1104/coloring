import express from 'express';
import { 
  subscribeNewsletter, 
  unsubscribeNewsletter, 
  checkSubscriptionStatus,
  getSubscribers,
  subscribeValidation,
  unsubscribeValidation 
} from '../controllers/newsletterController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = express.Router();

// 뉴스레터 구독
router.post('/newsletter/subscribe', subscribeValidation, asyncHandler(subscribeNewsletter));

// 뉴스레터 구독 해지
router.post('/newsletter/unsubscribe', unsubscribeValidation, asyncHandler(unsubscribeNewsletter));

// 구독 상태 확인
router.get('/newsletter/status', asyncHandler(checkSubscriptionStatus));

// 구독자 목록 조회 (관리자용)
router.get('/newsletter/subscribers', asyncHandler(getSubscribers));

export default router;

