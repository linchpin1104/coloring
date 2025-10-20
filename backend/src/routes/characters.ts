import { Router } from 'express';
import { characterController } from '../controllers/characterController';

const router = Router();

/**
 * 캐릭터 관련 라우트
 */

// 모든 캐릭터 조회 (필터링 지원)
router.get('/', characterController.getAllCharacters);

// 연령대별 캐릭터 조회
router.get('/age/:ageGroup', characterController.getCharactersByAgeGroup);

// 국가별 캐릭터 조회
router.get('/origin/:origin', characterController.getCharactersByOrigin);

// 인기 캐릭터 조회
router.get('/popular', characterController.getPopularCharacters);

// 캐릭터 검색
router.get('/search', characterController.searchCharacters);

// 랜덤 캐릭터 조회
router.get('/random', characterController.getRandomCharacters);

// 연령대별 추천 캐릭터
router.get('/recommended/:ageGroup', characterController.getRecommendedCharacters);

// 캐릭터 통계
router.get('/statistics', characterController.getCharacterStatistics);

// 캐릭터 상세 조회
router.get('/:id', characterController.getCharacterById);

export default router;
