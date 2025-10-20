import { logger } from '../utils/logger';
import { DatabaseService } from './databaseService';

interface CharacterData {
  name: string;
  type: 'anime' | 'cartoon' | 'game' | 'mascot';
  originCountry: 'korea' | 'japan' | 'usa' | 'china' | 'global';
  keywords?: string[];
}

interface UserPreferences {
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard' | 'auto';
  theme?: string;
  activity?: string;
  emotion?: string;
}

interface MasterRules {
  version: string;
  lastUpdated: string;
  masterRules: {
    structure: string;
    universalRequirements: string[];
    universalNegatives: string[];
  };
  characterTypeRules: Record<string, any>;
  difficultyRules: Record<string, any>;
  ageGroupRules: Record<string, any>;
  themeModifiers: Record<string, string>;
  compositionRules: Record<string, string>;
}

interface GeneratedPrompt {
  mainPrompt: string;
  negativePrompt: string;
  metadata: {
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    recommendedAge: string;
    lineComplexity: 'low' | 'medium' | 'high';
    coloringAreas: number;
    qualityScore: number;
    generationTime: number;
  };
  variations: Array<{
    type: 'standard' | 'action' | 'emotional';
    prompt: string;
    description: string;
  }>;
}

export class MasterPromptGenerator {
  private dbService: DatabaseService;
  private masterRules: MasterRules | null = null;

  constructor() {
    this.dbService = new DatabaseService();
  }

  /**
   * 마스터 규칙 로드
   */
  async loadMasterRules(): Promise<MasterRules> {
    try {
      if (this.masterRules) {
        return this.masterRules;
      }

      // 개발 환경에서는 기본 규칙 사용
      if (process.env['NODE_ENV'] === 'development') {
        this.masterRules = this.createDefaultMasterRules();
        logger.info('Using default master rules for development');
        return this.masterRules;
      }

      // Firestore에서 마스터 규칙 로드
      const rulesDoc = await this.dbService.getDocument('promptGenerationRules', 'master');
      
      if (!rulesDoc) {
        // 기본 규칙 생성
        this.masterRules = this.createDefaultMasterRules();
        await this.saveMasterRules(this.masterRules);
      } else {
        this.masterRules = rulesDoc as MasterRules;
      }

      logger.info('Master rules loaded successfully', {
        version: this.masterRules.version,
        lastUpdated: this.masterRules.lastUpdated,
      });

      return this.masterRules;
    } catch (error) {
      logger.error('Failed to load master rules, using default rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // 에러 발생 시 기본 규칙 사용
      this.masterRules = this.createDefaultMasterRules();
      return this.masterRules;
    }
  }

  /**
   * 최적화된 프롬프트 생성
   */
  async generateOptimalPrompt(
    characterData: CharacterData,
    userPreferences: UserPreferences,
  ): Promise<GeneratedPrompt> {
    try {
      const startTime = Date.now();
      
      // 1. 마스터 규칙 로드
      const rules = await this.loadMasterRules();
      
      // 2. 컨텍스트 분석
      const context = this.analyzeContext(characterData, userPreferences, rules);
      
      // 3. 메인 프롬프트 생성
      const mainPrompt = this.generateMainPrompt(characterData, context, rules);
      
      // 4. 네거티브 프롬프트 생성
      const negativePrompt = this.generateNegativePrompt(context, rules);
      
      // 5. 변형 프롬프트 생성
      const variations = this.generateVariations(characterData, context, rules);
      
      // 6. 메타데이터 생성
      const metadata = this.generateMetadata(context, Date.now() - startTime);
      
      const result: GeneratedPrompt = {
        mainPrompt,
        negativePrompt,
        metadata,
        variations,
      };

      logger.info('Optimal prompt generated successfully', {
        characterName: characterData.name,
        ageGroup: context.ageGroup,
        difficulty: context.difficulty,
        qualityScore: metadata.qualityScore,
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate optimal prompt', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterData,
        userPreferences,
      });
      throw error;
    }
  }

  /**
   * 컨텍스트 분석
   */
  private analyzeContext(
    characterData: CharacterData,
    userPreferences: UserPreferences,
    rules: MasterRules,
  ): any {
    // 자동 난이도 결정
    let { difficulty } = userPreferences;
    if (difficulty === 'auto') {
      difficulty = this.autoDetermineDifficulty(characterData, userPreferences.ageGroup);
    }

    // 테마 자동 감지
    const theme = userPreferences.theme || this.autoDetectTheme();

    // 활동 자동 제안
    const activity = userPreferences.activity || this.suggestActivity(characterData, userPreferences.ageGroup);

    // 감정 자동 제안
    const emotion = userPreferences.emotion || this.suggestEmotion(userPreferences.ageGroup);

    return {
      character: characterData,
      ageGroup: userPreferences.ageGroup,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      theme,
      activity,
      emotion,
      lineWeight: rules.difficultyRules[difficulty as string]?.lineWeight || '2-3px',
      complexity: rules.difficultyRules[difficulty as string]?.complexity || '6-12 elements',
      proportions: rules.ageGroupRules[userPreferences.ageGroup]?.proportions || 'balanced',
    };
  }

  /**
   * 메인 프롬프트 생성
   */
  private generateMainPrompt(
    characterData: CharacterData,
    context: any,
    rules: MasterRules,
  ): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { character, ageGroup, theme, activity, emotion, lineWeight, complexity, difficulty: _difficulty, proportions: _proportions } = context;
    
    // 1. 캐릭터 기본 정보
    let prompt = `${character.name}`;
    
    // 2. 캐릭터 타입별 스타일
    const typeRule = rules.characterTypeRules[character.type];
    if (typeRule) {
      prompt += `, ${typeRule.styleKeywords}`;
      if (typeRule.emphasize) {
        prompt += `, ${typeRule.emphasize}`;
      }
    }
    
    // 3. 원산지별 특성
    if (character.originCountry === 'korea') {
      prompt += ', Korean animation style, cute rounded features';
    } else if (character.originCountry === 'japan') {
      prompt += ', anime/manga style, expressive eyes';
    } else if (character.originCountry === 'usa') {
      prompt += ', Western animation style, bold expressions';
    }
    
    // 4. 키워드 추가
    if (character.keywords && character.keywords.length > 0) {
      prompt += `, ${character.keywords.join(', ')}`;
    }
    
    // 5. 포즈/액션
    if (activity) {
      prompt += `, ${activity} pose`;
      if (this.isActionPose(activity)) {
        prompt += ', dynamic pose, motion lines suggested by outline only';
      }
    }
    
    // 6. 감정 표현
    if (emotion) {
      prompt += ` with ${emotion} expression`;
    }
    
    // 7. 연령대별 최적화
    const ageRule = rules.ageGroupRules[ageGroup];
    if (ageRule) {
      prompt += `, coloring page for ${ageRule.age} ages`;
      if (ageGroup === 'child') {
        prompt += `, simple bold outlines with thick lines ${lineWeight}, minimal details with only ${complexity}, large clear coloring areas, cute chibi proportions with oversized head`;
      } else if (ageGroup === 'teen') {
        prompt += `, medium line weight ${lineWeight}, moderate details, balanced complexity, dynamic pose`;
      } else if (ageGroup === 'adult') {
        prompt += `, intricate patterns, fine line art ${lineWeight}, detailed design, complex elements`;
      }
    }
    
    // 8. 테마 요소
    if (theme && theme !== 'default') {
      const themeModifier = rules.themeModifiers[theme.toLowerCase()];
      if (themeModifier) {
        prompt += `, ${themeModifier}`;
      } else {
        prompt += `, ${theme} theme elements`;
      }
    }
    
    // 9. 기술적 요구사항 (항상 포함)
    prompt += `, ${rules.masterRules.universalRequirements.join(', ')}`;
    
    return prompt;
  }

  /**
   * 네거티브 프롬프트 생성
   */
  private generateNegativePrompt(context: any, rules: MasterRules): string {
    let negativePrompt = rules.masterRules.universalNegatives.join(', ');
    
    // 연령대별 추가 네거티브
    const ageRule = rules.ageGroupRules[context.ageGroup];
    if (ageRule && ageRule.negativeAdd) {
      negativePrompt += `, ${ageRule.negativeAdd}`;
    }
    
    // 난이도별 추가 네거티브
    const difficultyRule = rules.difficultyRules[context.difficulty];
    if (difficultyRule && difficultyRule.negativeAdd) {
      negativePrompt += `, ${difficultyRule.negativeAdd}`;
    }
    
    return negativePrompt;
  }

  /**
   * 변형 프롬프트 생성
   */
  private generateVariations(
    characterData: CharacterData,
    context: any,
    rules: MasterRules,
  ): Array<{ type: 'standard' | 'action' | 'emotional'; prompt: string; description: string }> {
    const variations: Array<{
      type: 'standard' | 'action' | 'emotional';
      prompt: string;
      description: string;
    }> = [];
    
    // 1. 표준 포즈
    const standardContext = { ...context, activity: 'standing', emotion: 'neutral' };
    variations.push({
      type: 'standard',
      prompt: this.generateMainPrompt(characterData, standardContext, rules),
      description: 'Standard standing pose',
    });
    
    // 2. 액션 포즈
    if (context.activity && this.isActionPose(context.activity)) {
      variations.push({
        type: 'action',
        prompt: this.generateMainPrompt(characterData, context, rules),
        description: `${context.activity} action pose`,
      });
    }
    
    // 3. 감정 표현 포즈
    if (context.emotion && context.emotion !== 'neutral') {
      const emotionalContext = { ...context, activity: 'close-up', emotion: context.emotion };
      variations.push({
        type: 'emotional',
        prompt: this.generateMainPrompt(characterData, emotionalContext, rules),
        description: `${context.emotion} expression focus`,
      });
    }
    
    return variations;
  }

  /**
   * 메타데이터 생성
   */
  private generateMetadata(context: any, generationTime: number): any {
    const { ageGroup, difficulty } = context;
    
    // 품질 점수 계산 (0.8-1.0)
    const baseScore = 0.8;
    const ageBonus = ageGroup === 'child' ? 0.1 : ageGroup === 'teen' ? 0.05 : 0;
    const difficultyBonus = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.05 : 0;
    const qualityScore = Math.min(1.0, baseScore + ageBonus + difficultyBonus + Math.random() * 0.1);
    
    // 라인 복잡도 결정
    let lineComplexity: 'low' | 'medium' | 'high' = 'medium';
    if (difficulty === 'easy') {lineComplexity = 'low';}
    else if (difficulty === 'hard') {lineComplexity = 'high';}
    
    // 색칠 영역 수 계산
    let coloringAreas = 6;
    if (ageGroup === 'child') {coloringAreas = 4;}
    else if (ageGroup === 'adult') {coloringAreas = 15;}
    
    if (difficulty === 'easy') {coloringAreas = Math.max(4, coloringAreas - 3);}
    else if (difficulty === 'hard') {coloringAreas = coloringAreas + 5;}
    
    return {
      estimatedDifficulty: difficulty,
      recommendedAge: context.ageGroup === 'child' ? '3-8' : context.ageGroup === 'teen' ? '9-14' : '15+',
      lineComplexity,
      coloringAreas,
      qualityScore: Math.round(qualityScore * 100) / 100,
      generationTime,
    };
  }

  /**
   * 자동 난이도 결정
   */
  private autoDetermineDifficulty(characterData: CharacterData, ageGroup: string): 'easy' | 'medium' | 'hard' {
    if (ageGroup === 'child') {return 'easy';}
    if (ageGroup === 'teen') {return 'medium';}
    if (ageGroup === 'adult') {return 'hard';}
    
    // 캐릭터 타입별 기본 난이도
    if (characterData.type === 'mascot') {return 'easy';}
    if (characterData.type === 'game') {return 'medium';}
    if (characterData.type === 'anime') {return 'medium';}
    if (characterData.type === 'cartoon') {return 'easy';}
    
    return 'medium';
  }

  /**
   * 테마 자동 감지
   */
  private autoDetectTheme(): string {
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    
    // 계절별 테마
    if (month >= 3 && month <= 5) {return 'spring';}
    if (month >= 6 && month <= 8) {return 'summer';}
    if (month >= 9 && month <= 11) {return 'autumn';}
    if (month >= 12 || month <= 2) {return 'winter';}
    
    // 특별한 날 테마
    if (month === 10 && day === 31) {return 'halloween';}
    if (month === 12 && day >= 20) {return 'christmas';}
    if (month === 2 && day === 14) {return 'valentine';}
    
    return 'default';
  }

  /**
   * 활동 제안
   */
  private suggestActivity(characterData: CharacterData, ageGroup: string): string {
    const activities = {
      child: ['playing', 'jumping', 'smiling', 'waving'],
      teen: ['running', 'dancing', 'studying', 'gaming'],
      adult: ['working', 'meditating', 'reading', 'exercising'],
    };
    
    const ageActivities = activities[ageGroup as keyof typeof activities] || activities.teen;
    return ageActivities[Math.floor(Math.random() * ageActivities.length)];
  }

  /**
   * 감정 제안
   */
  private suggestEmotion(ageGroup: string): string {
    const emotions = {
      child: ['happy', 'excited', 'curious', 'peaceful'],
      teen: ['confident', 'dynamic', 'cool', 'adventurous'],
      adult: ['focused', 'calm', 'determined', 'inspired'],
    };
    
    const ageEmotions = emotions[ageGroup as keyof typeof emotions] || emotions.teen;
    return ageEmotions[Math.floor(Math.random() * ageEmotions.length)];
  }

  /**
   * 액션 포즈 판단
   */
  private isActionPose(activity: string): boolean {
    const actionActivities = ['running', 'jumping', 'flying', 'dancing', 'fighting', 'swimming'];
    return actionActivities.includes(activity.toLowerCase());
  }

  /**
   * 기본 마스터 규칙 생성 (개선된 버전)
   */
  private createDefaultMasterRules(): MasterRules {
    return {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      masterRules: {
        structure: '[CHARACTER] + [STYLE] + [POSE/ACTION] + [EMOTION] + [AGE_OPTIMIZATION] + [TECHNICAL]',
        universalRequirements: [
          'black and white line art only',
          'clean vector-style outlines',
          'no shading, no gradients, no fills',
          'pure white background',
          'high contrast',
          'centered composition',
          'printable at A4 size',
          '300 DPI quality',
          'clear separation between coloring areas',
          'consistent line weight throughout',
        ],
        universalNegatives: [
          'color', 'colorful', 'filled areas', 'shading',
          'shadows', 'gradients', 'blur', 'noise',
          'low quality', 'distorted lines', 'text', 'watermark',
          'photorealistic', '3D rendering', 'texture',
          'overlapping lines', 'broken outlines',
        ],
      },
      characterTypeRules: {
        anime: {
          styleKeywords: 'Japanese anime/manga style, expressive features, dynamic lines',
          emphasize: 'large expressive eyes, distinctive hairstyle, clean line art',
          proportions: 'anime proportions with oversized head',
        },
        cartoon: {
          styleKeywords: 'Western animation style, bold outlines, expressive features',
          emphasize: 'exaggerated expressions, rounded shapes, simple forms',
          proportions: 'cartoon proportions with simplified anatomy',
        },
        game: {
          styleKeywords: 'video game character, recognizable game elements',
          emphasize: 'iconic accessories, characteristic poses, pixel-perfect details',
          proportions: 'game-appropriate proportions',
        },
        mascot: {
          styleKeywords: 'cute mascot style, friendly rounded features',
          emphasize: 'simple lovable design, approachable, minimal details',
          proportions: 'chibi proportions with oversized head',
        },
      },
      difficultyRules: {
        easy: {
          lineWeight: '4-6px',
          complexity: '3-5 main elements',
          patterns: 'none or minimal',
          areas: 'large (>25% each)',
          details: 'minimal facial features, simple shapes',
          negativeAdd: 'complex patterns, small details, thin lines, intricate designs',
        },
        medium: {
          lineWeight: '2-4px',
          complexity: '6-12 elements',
          patterns: 'simple geometric ok',
          areas: 'medium variety (15-25% each)',
          details: 'moderate facial features, balanced complexity',
          negativeAdd: 'too simple, overly complex, extreme details',
        },
        hard: {
          lineWeight: '1-3px',
          complexity: '15+ elements',
          patterns: 'intricate encouraged',
          areas: 'fine details (<15% each)',
          details: 'detailed facial features, complex designs',
          negativeAdd: 'childish, thick lines, minimal details, simple shapes',
        },
      },
      ageGroupRules: {
        child: {
          age: '3-8',
          proportions: 'chibi (head = 1/3 body)',
          safetyFilters: ['no scary', 'no weapons', 'no dark themes'],
          preferredEmotions: ['happy', 'excited', 'curious', 'peaceful'],
          lineStyle: 'thick bold lines, simple shapes',
          negativeAdd: 'complex patterns, small details, thin lines, scary elements, realistic proportions',
        },
        teen: {
          age: '9-14',
          proportions: 'balanced anime/cartoon style',
          allowedThemes: ['action', 'adventure', 'sports', 'fantasy'],
          preferredEmotions: ['confident', 'dynamic', 'cool', 'adventurous'],
          lineStyle: 'medium weight lines, dynamic poses',
          negativeAdd: 'too simple, baby style, overly complex, realistic details',
        },
        adult: {
          age: '15+',
          proportions: 'realistic or stylized',
          allowedThemes: ['all'],
          preferredEmotions: ['all'],
          encourageComplexity: true,
          lineStyle: 'fine detailed lines, intricate patterns',
          negativeAdd: 'childish, thick lines, minimal details, simple shapes, chibi proportions',
        },
      },
      themeModifiers: {
        halloween: 'jack-o-lanterns, bats, witch hat, spooky but friendly elements, autumn colors suggested',
        christmas: 'Santa hat, Christmas tree, presents, snowflakes, festive decorations, winter elements',
        birthday: 'birthday cake, balloons, party hat, confetti, celebration elements',
        spring: 'flowers, butterflies, sunshine, nature elements, pastel colors suggested',
        summer: 'beach ball, sun, waves, vacation vibes, bright colors suggested',
        autumn: 'falling leaves, pumpkins, warm atmosphere, earth tones suggested',
        winter: 'snowflakes, snow, cozy elements, cool colors suggested',
        valentine: 'hearts, roses, romantic elements, pink and red colors suggested',
        school: 'backpack, books, pencil, classroom elements',
        sports: 'ball, equipment, athletic pose, dynamic movement',
        fantasy: 'magic elements, mystical creatures, enchanted objects',
      },
      compositionRules: {
        ifActionPose: 'add motion suggestion through line placement only, maintain clear outlines',
        ifThemeProvided: 'integrate theme elements in background, maintain focus on character',
        ifMultipleCharacters: 'increase difficulty by one level, ensure clear separation',
        ifPetWithCharacter: 'keep pet simple even if main character is complex',
        ifComplexCharacter: 'simplify accessories and background elements',
        ifSimpleCharacter: 'add subtle details to enhance appeal',
      },
    };
  }

  /**
   * 마스터 규칙 저장
   */
  private async saveMasterRules(rules: MasterRules): Promise<void> {
    try {
      // 개발 환경에서는 저장하지 않음
      if (process.env['NODE_ENV'] === 'development') {
        logger.info('Skipping master rules save in development mode');
        return;
      }

      await this.dbService.createDocument('promptGenerationRules', 'master', rules);
      logger.info('Master rules saved successfully');
    } catch (error) {
      logger.error('Failed to save master rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // 개발 환경에서는 에러를 무시
      if (process.env['NODE_ENV'] !== 'development') {
        throw error;
      }
    }
  }
}

export default MasterPromptGenerator;
