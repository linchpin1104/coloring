import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { DatabaseService } from '../services/databaseService';

const dbService = new DatabaseService();

/**
 * 사이트맵 XML 생성
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://coloring-platform.com';
    
    // 색칠놀이 도안 데이터 조회
    const coloringPagesResult = await dbService.getColoringPages({ limit: 1000 }); // 최대 1000개
    const coloringPages = coloringPagesResult.pages;
    
    const staticPages = [
      { path: '/', priority: 1.0, changeFreq: 'daily' },
      { path: '/coloring-pages', priority: 0.9, changeFreq: 'daily' },
      { path: '/search', priority: 0.8, changeFreq: 'weekly' },
      { path: '/about', priority: 0.6, changeFreq: 'monthly' },
      { path: '/contact', priority: 0.5, changeFreq: 'monthly' },
      { path: '/privacy', priority: 0.3, changeFreq: 'yearly' },
      { path: '/terms', priority: 0.3, changeFreq: 'yearly' },
    ];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changeFreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${coloringPages.map(page => `  <url>
    <loc>${baseUrl}/coloring-pages/${page.id}</loc>
    <lastmod>${page.updatedAt || page.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemapXml);

  } catch (error) {
    logger.error('Failed to generate sitemap', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to generate sitemap', 'SITEMAP_ERROR'));
  }
};

/**
 * robots.txt 생성
 */
export const generateRobotsTxt = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://coloring-platform.com';
    
    const robotsTxt = `User-agent: *
Allow: /
Allow: /coloring-pages/
Allow: /search/
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /user/
Disallow: /_next/
Disallow: /static/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);

  } catch (error) {
    logger.error('Failed to generate robots.txt', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json(errorResponse('Failed to generate robots.txt', 'ROBOTS_ERROR'));
  }
};

/**
 * 구조화된 데이터 생성 (색칠놀이 도안)
 */
export const generateStructuredData = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    
    if (!pageId) {
      return res.status(400).json(errorResponse('Page ID is required', 'VALIDATION_ERROR'));
    }

    const coloringPage = await dbService.getColoringPageById(pageId);
    
    if (!coloringPage) {
      return res.status(404).json(errorResponse('Coloring page not found', 'NOT_FOUND'));
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://coloring-platform.com';
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': `${baseUrl}/coloring-pages/${pageId}`,
      name: `${coloringPage.characterName} 색칠놀이`,
      description: `${coloringPage.characterName} 캐릭터 색칠놀이 도안입니다. ${coloringPage.ageGroup === 'child' ? '어린이' : coloringPage.ageGroup === 'teen' ? '청소년' : '성인'}을 위한 ${coloringPage.difficulty === 'easy' ? '쉬운' : coloringPage.difficulty === 'medium' ? '보통' : '어려운'} 난이도의 색칠놀이입니다.`,
      image: {
        '@type': 'ImageObject',
        url: coloringPage.imageUrl,
        thumbnailUrl: coloringPage.thumbnailUrl,
      },
      creator: {
        '@type': 'Organization',
        name: '색칠놀이 플랫폼',
      },
      dateCreated: coloringPage.createdAt,
      genre: '색칠놀이',
      audience: {
        '@type': 'Audience',
        audienceType: coloringPage.ageGroup === 'child' ? '어린이' : coloringPage.ageGroup === 'teen' ? '청소년' : '성인',
      },
      educationalLevel: coloringPage.ageGroup === 'child' ? '초등학교' : coloringPage.ageGroup === 'teen' ? '중학교' : '고등학교 이상',
      learningResourceType: '색칠놀이 도안',
      interactivityType: 'active',
      educationalUse: '창의성 개발, 집중력 향상, 색감 교육',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
      },
    };

    res.json(successResponse(structuredData, 'Structured data generated successfully'));

  } catch (error) {
    logger.error('Failed to generate structured data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.pageId,
    });
    res.status(500).json(errorResponse('Failed to generate structured data', 'STRUCTURED_DATA_ERROR'));
  }
};

/**
 * 위치 기반 콘텐츠 추천
 */
export const getLocationBasedContent = async (req: Request, res: Response) => {
  try {
    const { country, city, latitude, longitude } = req.query;
    
    if (!country) {
      return res.status(400).json(errorResponse('Country is required', 'VALIDATION_ERROR'));
    }

    // 위치 기반 추천 로직
    const locationRecommendations: Record<string, {
      characters: string[];
      themes: string[];
      language: string;
    }> = {
      KR: {
        characters: ['피카추', '포켓몬', '뽀로로', '뽀롱뽀롱 뽀로로', '타요'],
        themes: ['한국 전통', 'K-팝', '한국 애니메이션'],
        language: 'ko',
      },
      JP: {
        characters: ['나루토', '원피스', '드래곤볼', '포켓몬', '헬로키티'],
        themes: ['일본 애니메이션', '만화', '일본 전통'],
        language: 'ja',
      },
      US: {
        characters: ['스폰지밥', '미키마우스', '엘사', '토르', '스파이더맨'],
        themes: ['디즈니', '마블', 'DC', '미국 애니메이션'],
        language: 'en',
      },
      CN: {
        characters: ['판다', '용', '중국 전통 캐릭터'],
        themes: ['중국 전통', '중국 애니메이션', '중국 문화'],
        language: 'zh',
      },
    };

    const recommendations = locationRecommendations[country as string] || locationRecommendations.US;
    
    // 해당 지역 인기 콘텐츠 조회 (임시로 전체 목록에서 필터링)
    const allPagesResult = await dbService.getColoringPages({ limit: 100 });
    const popularContent = allPagesResult.pages.filter(page => 
      recommendations.characters.some(char => 
        page.characterName?.toLowerCase().includes(char.toLowerCase()),
      ),
    ).slice(0, 10);

    const result = {
      location: {
        country,
        city,
        latitude: latitude ? parseFloat(latitude as string) : null,
        longitude: longitude ? parseFloat(longitude as string) : null,
      },
      recommendations,
      popularContent,
      seoData: {
        title: `${city || country} 인기 캐릭터 색칠놀이 | 지역별 색칠놀이 플랫폼`,
        description: `${city || country}에서 인기 있는 캐릭터들의 색칠놀이 도안을 제공합니다.`,
        keywords: [
          `${city} 색칠놀이`,
          `${country} 캐릭터`,
          ...recommendations.characters,
          ...recommendations.themes,
        ],
      },
    };

    res.json(successResponse(result, 'Location-based content retrieved successfully'));

  } catch (error) {
    logger.error('Failed to get location-based content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json(errorResponse('Failed to get location-based content', 'LOCATION_ERROR'));
  }
};

/**
 * SEO 메타데이터 생성
 */
export const generateSEOMetadata = async (req: Request, res: Response) => {
  try {
    const { pageType, pageId, characterName, ageGroup, difficulty } = req.query;
    
    const baseUrl = process.env.FRONTEND_URL || 'https://coloring-platform.com';
    
    const metadata: {
      title: string;
      description: string;
      keywords: string[];
      openGraph: Record<string, unknown>;
      twitterCard: Record<string, unknown>;
      jsonLd: Record<string, unknown>;
    } = {
      title: '색칠놀이 플랫폼 - 전 세계 인기 캐릭터 색칠놀이',
      description: '전 세계 인기 캐릭터들의 색칠놀이 도안을 제공하는 플랫폼입니다.',
      keywords: ['색칠놀이', '컬러링북', '캐릭터', '어린이', '교육'],
      canonicalUrl: baseUrl,
    };

    switch (pageType) {
    case 'coloring-page':
      if (characterName) {
        metadata.title = `${characterName} 색칠놀이 | 색칠놀이 플랫폼`;
        metadata.description = `${characterName} 캐릭터 색칠놀이 도안입니다. ${ageGroup === 'child' ? '어린이' : ageGroup === 'teen' ? '청소년' : '성인'}을 위한 ${difficulty === 'easy' ? '쉬운' : difficulty === 'medium' ? '보통' : '어려운'} 난이도의 색칠놀이를 다운로드하세요.`;
        metadata.keywords = [characterName, '색칠놀이', '컬러링북', ageGroup, difficulty];
        metadata.canonicalUrl = `${baseUrl}/coloring-pages/${pageId}`;
      }
      break;
        
    case 'search':
      metadata.title = '색칠놀이 검색 | 색칠놀이 플랫폼';
      metadata.description = '원하는 캐릭터나 테마의 색칠놀이 도안을 검색해보세요.';
      metadata.keywords = ['색칠놀이 검색', '캐릭터 검색', '색칠놀이 도안'];
      metadata.canonicalUrl = `${baseUrl}/search`;
      break;
        
    case 'category':
      if (ageGroup) {
        const ageGroupName = ageGroup === 'child' ? '어린이' : ageGroup === 'teen' ? '청소년' : '성인';
        metadata.title = `${ageGroupName} 색칠놀이 | 색칠놀이 플랫폼`;
        metadata.description = `${ageGroupName}을 위한 맞춤형 색칠놀이 도안을 제공합니다.`;
        metadata.keywords = [`${ageGroupName} 색칠놀이`, '연령별 색칠놀이', '맞춤형 색칠놀이'];
        metadata.canonicalUrl = `${baseUrl}/coloring-pages?ageGroup=${ageGroup}`;
      }
      break;
    }

    res.json(successResponse(metadata, 'SEO metadata generated successfully'));

  } catch (error) {
    logger.error('Failed to generate SEO metadata', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    res.status(500).json(errorResponse('Failed to generate SEO metadata', 'SEO_ERROR'));
  }
};
