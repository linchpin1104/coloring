/**
 * 다국어 검색 유틸리티
 */

// 언어별 키워드 매핑
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  ko: ['색칠', '색칠공부', '색칠놀이', '그림', '도안'],
  en: ['coloring', 'coloring page', 'coloring book', 'drawing', 'template'],
  ja: ['塗り絵', 'ぬりえ', '着色', '絵'],
  zh: ['涂色', '着色', '图画', '模板'],
};

// 언어별 캐릭터 이름 매핑
const CHARACTER_TRANSLATIONS: Record<string, Record<string, string>> = {
  '도라에몽': {
    en: 'doraemon',
    ja: 'ドラえもん',
    zh: '哆啦A梦',
  },
  '하츄핑': {
    en: 'hacheuping',
    ja: 'ハッチューピング',
    zh: '哈雀平',
  },
  '아이언미야옹': {
    en: 'iron miyaong',
    ja: 'アイアンミャオン',
    zh: '钢铁喵',
  },
  '피카츄': {
    en: 'pikachu',
    ja: 'ピカチュウ',
    zh: '皮卡丘',
  },
  '미키마우스': {
    en: 'mickey mouse',
    ja: 'ミッキーマウス',
    zh: '米老鼠',
  },
  '배트맨': {
    en: 'batman',
    ja: 'バットマン',
    zh: '蝙蝠侠',
  },
};

/**
 * 언어 감지
 */
export function detectLanguage(text: string): string {
  if (!text) return 'ko';

  // 한글
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  
  // 일본어
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  
  // 중국어
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  
  // 영어
  if (/[a-zA-Z]/.test(text)) return 'en';
  
  return 'ko';
}

/**
 * 검색어 번역
 */
export function translateSearchQuery(query: string): string {
  if (!query) return '';

  const detectedLang = detectLanguage(query);
  let translatedQuery = query.toLowerCase().trim();

  // 캐릭터 이름 번역
  for (const [koName, translations] of Object.entries(CHARACTER_TRANSLATIONS)) {
    const pattern = new RegExp(koName, 'gi');
    if (pattern.test(translatedQuery)) {
      translatedQuery = koName; // 한글 이름으로 정규화
      break;
    }

    // 다른 언어에서 한글로 변환
    for (const [lang, translation] of Object.entries(translations)) {
      if (detectedLang === lang) {
        const langPattern = new RegExp(translation, 'gi');
        if (langPattern.test(translatedQuery)) {
          translatedQuery = koName;
          break;
        }
      }
    }
  }

  return translatedQuery;
}

/**
 * 다국어 검색어 생성
 */
export function generateMultilingualSearchTerms(query: string): string[] {
  if (!query) return [];

  const terms: string[] = [query];
  const lowerQuery = query.toLowerCase();

  // 캐릭터 이름의 다국어 변형 추가
  for (const [koName, translations] of Object.entries(CHARACTER_TRANSLATIONS)) {
    if (lowerQuery.includes(koName.toLowerCase())) {
      terms.push(...Object.values(translations));
    }
  }

  // 언어별 키워드 추가
  const detectedLang = detectLanguage(query);
  if (LANGUAGE_KEYWORDS[detectedLang]) {
    // 현재 언어의 키워드는 제외하고 다른 언어의 키워드만 추가
    for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
      if (lang !== detectedLang) {
        terms.push(...keywords);
      }
    }
  }

  // 중복 제거
  return [...new Set(terms)];
}

/**
 * 검색어 확장 (유사어, 동의어)
 */
export function expandSearchTerms(query: string): string[] {
  if (!query) return [];

  const expanded: string[] = [query];
  const lowerQuery = query.toLowerCase();

  // 색칠 관련 동의어
  const coloringTerms = ['색칠', '색칠공부', '색칠놀이', 'coloring', 'painting'];
  if (coloringTerms.some(term => lowerQuery.includes(term))) {
    expanded.push(...coloringTerms);
  }

  // 도안 관련 동의어
  const templateTerms = ['도안', '그림', '템플릿', 'template', 'drawing'];
  if (templateTerms.some(term => lowerQuery.includes(term))) {
    expanded.push(...templateTerms);
  }

  // 캐릭터별 관련 검색어
  if (lowerQuery.includes('도라에몽')) {
    expanded.push('도라에몽', 'doraemon', '노비타', '진구');
  }
  
  if (lowerQuery.includes('피카츄')) {
    expanded.push('피카츄', 'pikachu', '포켓몬', 'pokemon');
  }

  if (lowerQuery.includes('미키')) {
    expanded.push('미키마우스', 'mickey', 'disney', '디즈니');
  }

  // 중복 제거
  return [...new Set(expanded)];
}

/**
 * 검색어 하이라이트용 정규식 생성
 */
export function createHighlightRegex(query: string): RegExp {
  const terms = generateMultilingualSearchTerms(query);
  const pattern = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(${pattern})`, 'gi');
}

/**
 * 텍스트에서 검색어 하이라이트
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!text || !query) return text;

  const regex = createHighlightRegex(query);
  return text.replace(regex, '<mark>$1</mark>');
}

