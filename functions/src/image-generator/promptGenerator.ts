import { logger } from '../utils/logger';

interface CharacterData {
  name: string;
  type: 'anime' | 'cartoon' | 'game' | 'mascot';
  originCountry: 'korea' | 'japan' | 'usa' | 'china' | 'global';
  keywords: string[];
}

interface GenerationRequest {
  character: CharacterData;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
  activity?: string;
  emotion?: string;
}

interface GeneratedPrompt {
  mainPrompt: string;
  negativePrompt: string;
  metadata: {
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    recommendedAge: string;
    lineComplexity: 'low' | 'medium' | 'high';
    coloringAreas: number;
  };
}

export class PromptGenerator {
  private masterRules: any;

  constructor() {
    this.initializeMasterRules();
  }

  /**
   * 마스터 규칙 초기화
   */
  private initializeMasterRules() {
    this.masterRules = {
      structure: '[CHARACTER] + [DESCRIPTION] + [POSE/ACTION] + [STYLE] + [TECHNICAL]',
      
      characterTypeRules: {
        anime: {
          styleKeywords: 'Japanese anime/manga style, expressive features, dynamic lines',
          emphasize: 'large expressive eyes, distinctive hairstyle',
        },
        cartoon: {
          styleKeywords: 'Western animation style, bold outlines, expressive features',
          emphasize: 'exaggerated expressions, rounded shapes',
        },
        game: {
          styleKeywords: 'video game character, recognizable game elements',
          emphasize: 'iconic accessories, characteristic poses',
        },
        mascot: {
          styleKeywords: 'cute mascot style, friendly rounded features',
          emphasize: 'simple lovable design, approachable',
        },
      },

      difficultyRules: {
        easy: {
          lineWeight: '3-5px',
          complexity: '3-5 main elements',
          patterns: 'none or minimal',
          areas: 'large (>20% each)',
          negativeAdd: 'complex patterns, small details, thin lines',
        },
        medium: {
          lineWeight: '2-3px',
          complexity: '6-12 elements',
          patterns: 'simple geometric ok',
          areas: 'medium variety',
          negativeAdd: 'too simple, overly complex',
        },
        hard: {
          lineWeight: '1-2px',
          complexity: '15+ elements',
          patterns: 'intricate encouraged',
          areas: 'fine details',
          negativeAdd: 'childish, thick lines, minimal details',
        },
      },

      ageGroupRules: {
        child: {
          age: '3-8',
          proportions: 'chibi (head = 1/3 body)',
          safetyFilters: ['no scary', 'no weapons', 'no dark themes'],
          preferredEmotions: ['happy', 'excited', 'curious', 'peaceful'],
        },
        teen: {
          age: '9-14',
          proportions: 'balanced',
          allowedThemes: ['action', 'adventure', 'sports', 'fantasy'],
          preferredEmotions: ['confident', 'dynamic', 'cool', 'adventurous'],
        },
        adult: {
          age: '15+',
          proportions: 'realistic or stylized',
          allowedThemes: ['all'],
          preferredEmotions: ['all'],
          encourageComplexity: true,
        },
      },

      themeModifiers: {
        halloween: 'jack-o-lanterns, bats, witch hat, spooky but friendly elements',
        christmas: 'Santa hat, Christmas tree, presents, snowflakes, festive decorations',
        birthday: 'birthday cake, balloons, party hat, confetti, celebration',
        spring: 'flowers, butterflies, sunshine, nature elements',
        summer: 'beach ball, sun, waves, vacation vibes',
        autumn: 'falling leaves, pumpkins, warm atmosphere',
        winter: 'snowflakes, snow, cozy elements',
      },
    };
  }

  /**
   * 메인 프롬프트 생성
   */
  generate(request: GenerationRequest): GeneratedPrompt {
    try {
      const { character, ageGroup, difficulty, theme, activity, emotion } = request;

      // 1. 캐릭터 기본 정보 구성
      const characterDescription = this.buildCharacterDescription(character);
      
      // 2. 포즈/액션 구성
      const poseAction = this.buildPoseAction(activity, emotion, ageGroup);
      
      // 3. 스타일 모디파이어 구성
      const styleModifiers = this.buildStyleModifiers(character, ageGroup, difficulty);
      
      // 4. 테마 요소 추가
      const themeElements = this.buildThemeElements(theme);
      
      // 5. 기술적 요구사항
      const technicalSpecs = this.buildTechnicalSpecs(ageGroup, difficulty);

      // 6. 최종 프롬프트 조합
      const mainPrompt = [
        characterDescription,
        poseAction,
        styleModifiers,
        themeElements,
        technicalSpecs,
      ].filter(Boolean).join(', ');

      // 7. 네거티브 프롬프트 생성
      const negativePrompt = this.buildNegativePrompt(ageGroup, difficulty);

      // 8. 메타데이터 생성
      const metadata = this.buildMetadata(ageGroup, difficulty);

      logger.info('Prompt generated successfully', {
        character: character.name,
        ageGroup,
        difficulty,
        promptLength: mainPrompt.length,
      });

      return {
        mainPrompt,
        negativePrompt,
        metadata,
      };
    } catch (error) {
      logger.error('Failed to generate prompt', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request,
      });
      throw error;
    }
  }

  /**
   * 캐릭터 설명 구성
   */
  private buildCharacterDescription(character: CharacterData): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, type, originCountry: _originCountry, keywords } = character;
    const typeRule = this.masterRules.characterTypeRules[type];
    
    let description = `${name}`;
    
    // 키워드 기반 설명 추가
    if (keywords.length > 0) {
      description += `, ${keywords.slice(0, 3).join(', ')}`;
    }
    
    // 스타일 키워드 추가
    description += `, ${typeRule.styleKeywords}`;
    
    // 강조 요소 추가
    description += `, ${typeRule.emphasize}`;
    
    return description;
  }

  /**
   * 포즈/액션 구성
   */
  private buildPoseAction(activity?: string, emotion?: string, ageGroup?: string): string {
    const ageGroupRule = this.masterRules.ageGroupRules[ageGroup || 'child'];
    const { preferredEmotions } = ageGroupRule;
    
    let poseAction = '';
    
    if (activity) {
      poseAction += `${activity} pose`;
    } else {
      poseAction += 'standing pose';
    }
    
    if (emotion) {
      poseAction += ` with ${emotion} expression`;
    } else {
      // 연령대에 맞는 기본 감정 선택
      const defaultEmotion = preferredEmotions[0];
      poseAction += ` with ${defaultEmotion} expression`;
    }
    
    return poseAction;
  }

  /**
   * 스타일 모디파이어 구성
   */
  private buildStyleModifiers(
    character: CharacterData,
    ageGroup: 'child' | 'teen' | 'adult',
    difficulty: 'easy' | 'medium' | 'hard',
  ): string {
    const ageGroupRule = this.masterRules.ageGroupRules[ageGroup];
    const difficultyRule = this.masterRules.difficultyRules[difficulty];
    
    const modifiers = [
      `coloring page for ${ageGroupRule.age} years old`,
      `line weight ${difficultyRule.lineWeight}`,
      `${difficultyRule.complexity}`,
      `proportions ${ageGroupRule.proportions}`,
    ];
    
    return modifiers.join(', ');
  }

  /**
   * 테마 요소 구성
   */
  private buildThemeElements(theme?: string): string {
    if (!theme) {return '';}
    
    const themeModifier = this.masterRules.themeModifiers[theme.toLowerCase()];
    if (themeModifier) {
      return `with ${theme} elements in background, ${themeModifier}`;
    }
    
    return `with ${theme} theme elements`;
  }

  /**
   * 기술적 요구사항 구성
   */
  private buildTechnicalSpecs(_ageGroup: string, _difficulty: string): string {
    const specs = [
      'black and white line art only',
      'clean vector-style outlines',
      'no shading, no gradients, no fills',
      'pure white background',
      'high contrast',
      'centered composition',
      'printable at A4 size',
      '300 DPI quality',
    ];
    
    return specs.join(', ');
  }

  /**
   * 네거티브 프롬프트 구성
   */
  private buildNegativePrompt(ageGroup: string, difficulty: string): string {
    const baseNegatives = [
      'color',
      'colorful',
      'filled areas',
      'shading',
      'shadows',
      'gradients',
      'blur',
      'noise',
      'low quality',
      'bad anatomy',
      'distorted lines',
      'incomplete outlines',
      'messy lines',
      'cluttered',
      'busy background',
      'text',
      'watermark',
      'signature',
    ];
    
    const difficultyRule = this.masterRules.difficultyRules[difficulty];
    const ageGroupRule = this.masterRules.ageGroupRules[ageGroup];
    
    const additionalNegatives = [
      difficultyRule.negativeAdd,
      ...ageGroupRule.safetyFilters,
    ];
    
    return [...baseNegatives, ...additionalNegatives].join(', ');
  }

  /**
   * 메타데이터 구성
   */
  private buildMetadata(ageGroup: string, difficulty: string) {
    const ageGroupRule = this.masterRules.ageGroupRules[ageGroup];
    const _difficultyRule = this.masterRules.difficultyRules[difficulty];
    
    return {
      estimatedDifficulty: difficulty,
      recommendedAge: ageGroupRule.age,
      lineComplexity: this.getLineComplexity(difficulty),
      coloringAreas: this.estimateColoringAreas(difficulty),
    };
  }

  /**
   * 라인 복잡도 계산
   */
  private getLineComplexity(difficulty: string): 'low' | 'medium' | 'high' {
    const complexityMap = {
      easy: 'low',
      medium: 'medium',
      hard: 'high',
    };
    return complexityMap[difficulty] || 'medium';
  }

  /**
   * 색칠 영역 수 추정
   */
  private estimateColoringAreas(difficulty: string): number {
    const areaMap = {
      easy: 4,
      medium: 8,
      hard: 15,
    };
    return areaMap[difficulty] || 8;
  }
}

export default PromptGenerator;