// 구조화된 데이터 생성 유틸리티
export interface ColoringPageData {
  id: string;
  characterName: string;
  characterType: string;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  downloadCount: number;
  rating: number;
}

export interface WebsiteData {
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs: string[];
}

/**
 * 웹사이트 구조화된 데이터 생성
 */
export const generateWebsiteStructuredData = (data: WebsiteData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    description: data.description,
    url: data.url,
    logo: {
      '@type': 'ImageObject',
      url: data.logo,
    },
    sameAs: data.sameAs,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${data.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * 색칠놀이 도안 구조화된 데이터 생성
 */
export const generateColoringPageStructuredData = (data: ColoringPageData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `https://coloring-platform.com/coloring-pages/${data.id}`,
    name: `${data.characterName} 색칠놀이`,
    description: `${data.characterName} 캐릭터 색칠놀이 도안입니다. ${data.ageGroup === 'child' ? '어린이' : data.ageGroup === 'teen' ? '청소년' : '성인'}을 위한 ${data.difficulty === 'easy' ? '쉬운' : data.difficulty === 'medium' ? '보통' : '어려운'} 난이도의 색칠놀이입니다.`,
    image: {
      '@type': 'ImageObject',
      url: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl,
    },
    creator: {
      '@type': 'Organization',
      name: '색칠놀이 플랫폼',
    },
    dateCreated: data.createdAt,
    genre: '색칠놀이',
    audience: {
      '@type': 'Audience',
      audienceType: data.ageGroup === 'child' ? '어린이' : data.ageGroup === 'teen' ? '청소년' : '성인',
    },
    educationalLevel: data.ageGroup === 'child' ? '초등학교' : data.ageGroup === 'teen' ? '중학교' : '고등학교 이상',
    learningResourceType: '색칠놀이 도안',
    interactivityType: 'active',
    educationalUse: '창의성 개발, 집중력 향상, 색감 교육',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: data.rating,
      ratingCount: data.downloadCount,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
  };
};

/**
 * 컬렉션 구조화된 데이터 생성
 */
export const generateCollectionStructuredData = (coloringPages: ColoringPageData[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '색칠놀이 도안 모음',
    description: '전 세계 인기 캐릭터들의 색칠놀이 도안을 모은 컬렉션입니다.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: coloringPages.length,
      itemListElement: coloringPages.map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: generateColoringPageStructuredData(page),
      })),
    },
  };
};

/**
 * FAQ 구조화된 데이터 생성
 */
export const generateFAQStructuredData = (faqs: { question: string; answer: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

/**
 * 브레드크럼 구조화된 데이터 생성
 */
export const generateBreadcrumbStructuredData = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * 로컬 비즈니스 구조화된 데이터 생성 (GEO SEO용)
 */
export const generateLocalBusinessStructuredData = (businessData: {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessData.name,
    description: businessData.description,
    url: businessData.url,
    telephone: businessData.telephone,
    email: businessData.email,
    address: businessData.address ? {
      '@type': 'PostalAddress',
      streetAddress: businessData.address.streetAddress,
      addressLocality: businessData.address.addressLocality,
      addressRegion: businessData.address.addressRegion,
      postalCode: businessData.address.postalCode,
      addressCountry: businessData.address.addressCountry,
    } : undefined,
    geo: businessData.geo ? {
      '@type': 'GeoCoordinates',
      latitude: businessData.geo.latitude,
      longitude: businessData.geo.longitude,
    } : undefined,
    openingHours: businessData.openingHours,
    priceRange: businessData.priceRange,
    sameAs: [
      'https://www.facebook.com/coloring-platform',
      'https://www.instagram.com/coloring-platform',
      'https://twitter.com/coloring-platform',
    ],
  };
};

