import { Request, Response } from 'express';
import { characterService, Character } from '../services/characterService';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

/**
 * 캐릭터 관련 API 컨트롤러
 */
export class CharacterController {
  /**
   * 모든 캐릭터 조회
   */
  async getAllCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { ageGroup, origin, category, difficulty, limit, offset } = req.query;
      
      let characters = characterService.getAllCharacters();

      // 필터링
      if (ageGroup) {
        characters = characters.filter(char => char.ageGroup === ageGroup);
      }
      if (origin) {
        characters = characters.filter(char => char.origin === origin);
      }
      if (category) {
        characters = characters.filter(char => char.category === category);
      }
      if (difficulty) {
        characters = characters.filter(char => char.difficulty === difficulty);
      }

      // 페이지네이션
      const startIndex = offset ? parseInt(offset as string) : 0;
      const endIndex = limit ? startIndex + parseInt(limit as string) : characters.length;
      const paginatedCharacters = characters.slice(startIndex, endIndex);

      sendSuccess(res, {
        characters: paginatedCharacters,
        total: characters.length,
        offset: startIndex,
        limit: endIndex - startIndex,
      }, '캐릭터 목록 조회 성공');
      
    } catch (error) {
      logger.error('캐릭터 목록 조회 실패:', error);
      sendError(res, '캐릭터 목록 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 연령대별 캐릭터 조회
   */
  async getCharactersByAgeGroup(req: Request, res: Response): Promise<void> {
    try {
      const { ageGroup } = req.params;
      const { limit } = req.query;

      if (!['child', 'teen', 'adult'].includes(ageGroup)) {
        sendError(res, '유효하지 않은 연령대입니다.', 400);
        return;
      }

      let characters = characterService.getCharactersByAgeGroup(ageGroup as 'child' | 'teen' | 'adult');
      
      if (limit) {
        characters = characters.slice(0, parseInt(limit as string));
      }

      sendSuccess(res, {
        characters,
        ageGroup,
        count: characters.length,
      }, `${ageGroup} 연령대 캐릭터 조회 성공`);
      
    } catch (error) {
      logger.error('연령대별 캐릭터 조회 실패:', error);
      sendError(res, '연령대별 캐릭터 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 국가별 캐릭터 조회
   */
  async getCharactersByOrigin(req: Request, res: Response): Promise<void> {
    try {
      const { origin } = req.params;
      const { limit } = req.query;

      const characters = characterService.getCharactersByOrigin(origin);
      const limitedCharacters = limit ? characters.slice(0, parseInt(limit as string)) : characters;

      sendSuccess(res, {
        characters: limitedCharacters,
        origin,
        count: limitedCharacters.length,
      }, `${origin} 캐릭터 조회 성공`);
      
    } catch (error) {
      logger.error('국가별 캐릭터 조회 실패:', error);
      sendError(res, '국가별 캐릭터 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 인기 캐릭터 조회
   */
  async getPopularCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '20' } = req.query;
      const characters = characterService.getPopularCharacters(parseInt(limit as string));

      sendSuccess(res, {
        characters,
        count: characters.length,
      }, '인기 캐릭터 조회 성공');
      
    } catch (error) {
      logger.error('인기 캐릭터 조회 실패:', error);
      sendError(res, '인기 캐릭터 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 캐릭터 검색
   */
  async searchCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = '20' } = req.query;

      if (!q) {
        sendError(res, '검색어가 필요합니다.', 400);
        return;
      }

      const characters = characterService.searchCharacters(q as string);
      const limitedCharacters = characters.slice(0, parseInt(limit as string));

      sendSuccess(res, {
        characters: limitedCharacters,
        query: q,
        count: limitedCharacters.length,
        total: characters.length,
      }, '캐릭터 검색 성공');
      
    } catch (error) {
      logger.error('캐릭터 검색 실패:', error);
      sendError(res, '캐릭터 검색에 실패했습니다.', 500);
      
    }
  }

  /**
   * 캐릭터 상세 조회
   */
  async getCharacterById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const character = characterService.getCharacterById(parseInt(id));

      if (!character) {
        sendError(res, '캐릭터를 찾을 수 없습니다.', 404);
        return;
      }

      sendSuccess(res, {
        character,
      }, '캐릭터 상세 조회 성공');
      
    } catch (error) {
      logger.error('캐릭터 상세 조회 실패:', error);
      sendError(res, '캐릭터 상세 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 랜덤 캐릭터 조회
   */
  async getRandomCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { count = '5', ageGroup } = req.query;
      
      let characters: Character[];
      
      if (ageGroup && ['child', 'teen', 'adult'].includes(ageGroup as string)) {
        characters = characterService.getCharactersByAgeGroup(ageGroup as 'child' | 'teen' | 'adult');
        // 연령대별 캐릭터에서 랜덤 선택
        const shuffled = characters.sort(() => 0.5 - Math.random());
        characters = shuffled.slice(0, parseInt(count as string));
      } else {
        characters = characterService.getRandomCharacters(parseInt(count as string));
      }

      sendSuccess(res, {
        characters,
        count: characters.length,
      }, '랜덤 캐릭터 조회 성공');
      
    } catch (error) {
      logger.error('랜덤 캐릭터 조회 실패:', error);
      sendError(res, '랜덤 캐릭터 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 연령대별 추천 캐릭터
   */
  async getRecommendedCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { ageGroup } = req.params;
      const { limit = '10' } = req.query;

      if (!['child', 'teen', 'adult'].includes(ageGroup)) {
        sendError(res, '유효하지 않은 연령대입니다.', 400);
        return;
      }

      const characters = characterService.getRecommendedCharacters(
        ageGroup as 'child' | 'teen' | 'adult',
        parseInt(limit as string),
      );

      sendSuccess(res, {
        characters,
        ageGroup,
        count: characters.length,
      }, `${ageGroup} 연령대 추천 캐릭터 조회 성공`);
      
    } catch (error) {
      logger.error('추천 캐릭터 조회 실패:', error);
      sendError(res, '추천 캐릭터 조회에 실패했습니다.', 500);
      
    }
  }

  /**
   * 캐릭터 통계 조회
   */
  async getCharacterStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = characterService.getStatistics();
      const metadata = characterService.getMetadata();

      sendSuccess(res, {
        statistics,
        metadata,
      }, '캐릭터 통계 조회 성공');
      
    } catch (error) {
      logger.error('캐릭터 통계 조회 실패:', error);
      sendError(res, '캐릭터 통계 조회에 실패했습니다.', 500);
      
    }
  }
}

export const characterController = new CharacterController();
