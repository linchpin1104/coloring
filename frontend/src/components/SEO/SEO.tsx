import React from 'react';
import { Helmet } from 'react-helmet-async';
/* eslint-disable react-refresh/only-export-components */

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  alternateLocales?: { hreflang: string; href: string }[];
  structuredData?: Record<string, unknown>;
  canonicalUrl?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = '색칠놀이 플랫폼 - 전 세계 인기 캐릭터 색칠놀이',
  description = '전 세계 인기 캐릭터들의 색칠놀이 도안을 제공하는 플랫폼입니다. 어린이부터 성인까지 모든 연령대를 위한 맞춤형 색칠놀이를 만나보세요.',
  keywords = ['색칠놀이', '컬러링북', '캐릭터', '어린이', '교육', '창의성', '피카추', '나루토', '스폰지밥'],
  image = '/images/og-image.jpg',
  url = 'https://coloring-platform.com',
  type = 'website',
  locale = 'ko_KR',
  alternateLocales = [],
  structuredData,
  canonicalUrl,
}) => {
  const fullTitle = title.includes('색칠놀이 플랫폼') ? title : `${title} | 색칠놀이 플랫폼`;
  const fullUrl = canonicalUrl || url;

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="색칠놀이 플랫폼" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph 메타 태그 */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content="색칠놀이 플랫폼" />
      
      {/* Twitter Card 메타 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* 다국어 설정 */}
      {alternateLocales.map((locale) => (
        <link key={locale.hreflang} rel="alternate" hrefLang={locale.hreflang} href={locale.href} />
      ))}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* 구조화된 데이터 */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* 추가 SEO 메타 태그 */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="색칠놀이 플랫폼" />
      
      {/* 파비콘 */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEO;

