import { logger } from '../utils/logger';

interface ImagenRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
}

interface ImagenResponse {
  images: Array<{
    imageBase64: string;
    mimeType: string;
  }>;
  metadata: {
    prompt: string;
    model: string;
    generationTime: number;
  };
}

export class ImagenService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Google Imagen API를 사용하여 이미지 생성
   */
  async generateImage(request: ImagenRequest): Promise<ImagenResponse> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/models/imagen-3.0-generate-001:generateImage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          prompt: {
            text: request.prompt,
          },
          generationConfig: {
            numberOfImages: request.numImages || 1,
            aspectRatio: 'ASPECT_RATIO_1_1',
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Imagen API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      logger.info('Image generated successfully', {
        generationTime,
        prompt: request.prompt,
        numImages: data.candidates?.length || 0,
      });

      return {
        images: data.candidates?.map((candidate: { imageBase64: string; mimeType?: string }) => ({
          imageBase64: candidate.imageBase64,
          mimeType: candidate.mimeType || 'image/png',
        })) || [],
        metadata: {
          prompt: request.prompt,
          model: 'imagen-3.0-generate-001',
          generationTime,
        },
      };
    } catch (error) {
      logger.error('Failed to generate image', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt,
      });
      throw error;
    }
  }

  /**
   * 색칠놀이 도안용 최적화된 이미지 생성
   */
  async generateColoringPage(
    characterName: string,
    prompt: string,
    negativePrompt: string,
    ageGroup: 'child' | 'teen' | 'adult',
    difficulty: 'easy' | 'medium' | 'hard',
  ): Promise<ImagenResponse> {
    const optimizedPrompt = this.optimizePromptForColoring(prompt, ageGroup, difficulty);
    const optimizedNegativePrompt = this.optimizeNegativePrompt(negativePrompt, ageGroup);

    return this.generateImage({
      prompt: optimizedPrompt,
      negativePrompt: optimizedNegativePrompt,
      width: 1024,
      height: 1024,
      numImages: 1,
    });
  }

  /**
   * 색칠놀이 도안용 프롬프트 최적화
   */
  private optimizePromptForColoring(
    prompt: string,
    ageGroup: 'child' | 'teen' | 'adult',
    difficulty: 'easy' | 'medium' | 'hard',
  ): string {
    const baseOptimizations = [
      'black and white line art only',
      'clean vector-style outlines',
      'no shading, no gradients, no fills',
      'pure white background',
      'high contrast',
      'centered composition',
      'printable at A4 size',
      '300 DPI quality',
    ];

    const ageGroupOptimizations = {
      child: [
        'simple bold outlines',
        'thick lines 4-5px',
        'minimal details',
        'large coloring areas',
        'cute chibi proportions',
        'kawaii style',
      ],
      teen: [
        'medium line weight 2-3px',
        'moderate details',
        'balanced complexity',
        'dynamic pose',
        'anime style',
      ],
      adult: [
        'intricate patterns',
        'fine line art 1-2px',
        'detailed design',
        'complex elements',
        'decorative features',
      ],
    };

    const difficultyOptimizations = {
      easy: ['maximum 5 distinct sections', 'simple shapes'],
      medium: ['6-12 distinct sections', 'some pattern elements'],
      hard: ['15+ distinct sections', 'complex compositions', 'mandala-inspired details'],
    };

    const allOptimizations = [
      ...baseOptimizations,
      ...ageGroupOptimizations[ageGroup],
      ...difficultyOptimizations[difficulty],
    ];

    return `${prompt}, ${allOptimizations.join(', ')}`;
  }

  /**
   * 네거티브 프롬프트 최적화
   */
  private optimizeNegativePrompt(
    negativePrompt: string,
    ageGroup: 'child' | 'teen' | 'adult',
  ): string {
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

    const ageGroupNegatives = {
      child: ['complex patterns', 'small details', 'thin lines', 'scary elements'],
      teen: ['too simple', 'baby style', 'overly complex patterns'],
      adult: ['childish', 'thick lines', 'minimal details', 'simple shapes'],
    };

    const allNegatives = [
      ...baseNegatives,
      ...ageGroupNegatives[ageGroup],
    ];

    return `${negativePrompt}, ${allNegatives.join(', ')}`;
  }
}

export default ImagenService;