import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface Character {
  id: number;
  name: string;
  nameEn: string;
  origin: '한국' | '일본' | '중국' | '미국';
  ageGroup: 'child' | 'teen' | 'adult';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number;
  tags: string[];
}

export interface CharacterMetadata {
  totalCount: number;
  lastUpdated: string;
  ageGroups: {
    child: { range: string; count: number; description: string };
    teen: { range: string; count: number; description: string };
    adult: { range: string; count: number; description: string };
  };
  origins: Record<string, number>;
  categories: Record<string, number>;
}

export interface CharacterDatabase {
  characters: Character[];
  metadata: CharacterMetadata;
}

/**
 * 캐릭터 데이터베이스 서비스
 */
export class CharacterService {
  private characters: Character[] = [];
  private metadata: CharacterMetadata | null = null;
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, '../data/characters-complete.json');
    this.loadCharacters();
  }

  /**
   * 캐릭터 데이터 로드
   */
  private loadCharacters(): void {
    try {
      // 완전한 캐릭터 데이터 로드
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        const characterDb: CharacterDatabase = JSON.parse(data);
        this.characters = characterDb.characters;
        this.metadata = characterDb.metadata;
        logger.info(`완전한 캐릭터 데이터 로드 완료: ${this.characters.length}개`);
      } else {
        logger.warn('완전한 캐릭터 데이터 파일이 존재하지 않습니다.');
        this.characters = [];
        this.metadata = null;
      }
    } catch (error) {
      logger.error('캐릭터 데이터 로드 실패:', error);
      this.characters = [];
      this.metadata = null;
    }
  }

  /**
   * 모든 캐릭터 조회
   */
  getAllCharacters(): Character[] {
    return this.characters;
  }

  /**
   * 연령대별 캐릭터 조회
   */
  getCharactersByAgeGroup(ageGroup: 'child' | 'teen' | 'adult'): Character[] {
    return this.characters.filter(char => char.ageGroup === ageGroup);
  }

  /**
   * 국가별 캐릭터 조회
   */
  getCharactersByOrigin(origin: string): Character[] {
    return this.characters.filter(char => char.origin === origin);
  }

  /**
   * 카테고리별 캐릭터 조회
   */
  getCharactersByCategory(category: string): Character[] {
    return this.characters.filter(char => char.category === category);
  }

  /**
   * 난이도별 캐릭터 조회
   */
  getCharactersByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Character[] {
    return this.characters.filter(char => char.difficulty === difficulty);
  }

  /**
   * 인기순 캐릭터 조회
   */
  getPopularCharacters(limit?: number): Character[] {
    const sorted = this.characters.sort((a, b) => b.popularity - a.popularity);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * 캐릭터 검색
   */
  searchCharacters(query: string): Character[] {
    const lowerQuery = query.toLowerCase();
    return this.characters.filter(char => 
      char.name.toLowerCase().includes(lowerQuery) ||
      char.nameEn.toLowerCase().includes(lowerQuery) ||
      char.tags.some(tag => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * 캐릭터 ID로 조회
   */
  getCharacterById(id: number): Character | undefined {
    return this.characters.find(char => char.id === id);
  }

  /**
   * 랜덤 캐릭터 조회
   */
  getRandomCharacters(count: number = 1): Character[] {
    const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * 연령대별 추천 캐릭터
   */
  getRecommendedCharacters(ageGroup: 'child' | 'teen' | 'adult', limit: number = 10): Character[] {
    const ageCharacters = this.getCharactersByAgeGroup(ageGroup);
    const popular = ageCharacters.sort((a, b) => b.popularity - a.popularity);
    return popular.slice(0, limit);
  }

  /**
   * 메타데이터 조회
   */
  getMetadata(): CharacterMetadata | null {
    return this.metadata;
  }

  /**
   * 통계 정보 조회
   */
  getStatistics(): {
    total: number;
    byAgeGroup: Record<string, number>;
    byOrigin: Record<string, number>;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    } {
    const stats = {
      total: this.characters.length,
      byAgeGroup: {} as Record<string, number>,
      byOrigin: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
    };

    this.characters.forEach(char => {
      // 연령대별 통계
      stats.byAgeGroup[char.ageGroup] = (stats.byAgeGroup[char.ageGroup] || 0) + 1;
      
      // 국가별 통계
      stats.byOrigin[char.origin] = (stats.byOrigin[char.origin] || 0) + 1;
      
      // 카테고리별 통계
      stats.byCategory[char.category] = (stats.byCategory[char.category] || 0) + 1;
      
      // 난이도별 통계
      stats.byDifficulty[char.difficulty] = (stats.byDifficulty[char.difficulty] || 0) + 1;
    });

    return stats;
  }

  /**
   * 캐릭터 데이터 새로고침
   */
  refresh(): void {
    this.loadCharacters();
  }
}

export const characterService = new CharacterService();
