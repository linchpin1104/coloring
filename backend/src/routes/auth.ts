import { Router } from 'express';
import { authController, validateRegister, validateUpdateProfile } from '@/controllers/authController';
import { verifyToken } from '@/middlewares/auth';
import { authRateLimit } from '@/middlewares/rateLimiter';

const router = Router();

// 인증 관련 라우트
router.post('/register', authRateLimit, validateRegister, authController.register);
router.post('/login', authRateLimit, verifyToken, authController.login);
router.get('/me', verifyToken, authController.getCurrentUser);
router.put('/profile', verifyToken, validateUpdateProfile, authController.updateProfile);
router.delete('/account', verifyToken, authController.deleteAccount);
router.post('/custom-token', verifyToken, authController.createCustomToken);

export default router;
