import React from 'react';
/* eslint-disable react-refresh/only-export-components */
import { Helmet } from 'react-helmet-async';

interface SitemapProps {
  baseUrl: string;
  pages: Array<{
    path: string;
    lastModified: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }>;
}

/**
 * XML 사이트맵 생성 컴포넌트
 */
export const Sitemap: React.FC<SitemapProps> = ({ baseUrl, pages: _pages }) => {
  // 사이트맵 XML 생성 (필요시 사용)
  // const _sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
// ${pages.map(page => `  <url>
//     <loc>${baseUrl}${page.path}</loc>
//     <lastmod>${page.lastModified}</lastmod>
//     <changefreq>${page.changeFrequency}</changefreq>
//     <priority>${page.priority}</priority>
//   </url>`).join('\n')}
// </urlset>`;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        })}
      </script>
    </Helmet>
  );
};

/**
 * 사이트맵 데이터 생성 함수
 */
export const generateSitemapData = (_baseUrl: string, coloringPages: Array<{ id: string; characterName: string; createdAt: string }> = []) => {
  const staticPages = [
    {
      path: '/',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      path: '/coloring-pages',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      path: '/search',
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      path: '/about',
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      path: '/contact',
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/privacy',
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      path: '/terms',
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  const coloringPageUrls = coloringPages.map(page => ({
    path: `/coloring-pages/${page.id}`,
        lastModified: page.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...coloringPageUrls];
};

/**
 * robots.txt 생성 함수
 */
export const generateRobotsTxt = (baseUrl: string, allowCrawling: boolean = true) => {
  if (!allowCrawling) {
    return `User-agent: *
Disallow: /`;
  }

  return `User-agent: *
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

# Crawl-delay (선택사항)
Crawl-delay: 1`;
};

/**
 * 메타 로봇 태그 컴포넌트
 */
interface MetaRobotsProps {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
}

export const MetaRobots: React.FC<MetaRobotsProps> = ({
  index = true,
  follow = true,
  noarchive = false,
  nosnippet = false,
  noimageindex = false,
}) => {
  const content = [
    index ? 'index' : 'noindex',
    follow ? 'follow' : 'nofollow',
    noarchive ? 'noarchive' : '',
    nosnippet ? 'nosnippet' : '',
    noimageindex ? 'noimageindex' : '',
  ].filter(Boolean).join(', ');

  return (
    <Helmet>
      <meta name="robots" content={content} />
    </Helmet>
  );
};

