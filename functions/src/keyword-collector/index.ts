import * as functions from 'firebase-functions';
import { db } from '@/config/firebase';
import { googleTrendsCollector, TrendKeyword } from './googleTrendsCollector';
import { socialMediaCollector, SocialMediaKeyword } from './socialMediaCollector';
import { createFunctionLogger } from '@/utils/logger';

const logger = createFunctionLogger('keywordCollector');

// 키워드 수집 Cloud Function
export const collectKeywords = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .pubsub.schedule('0 0 * * *') // 매일 자정 실행
  .timeZone('Asia/Seoul')
  .onRun(async (_context) => {
    try {
      logger.info('Starting keyword collection process');

      // 1. Google Trends에서 키워드 수집
      const trendKeywords = await googleTrendsCollector.collectTrendingKeywords('US');
      logger.info(`Collected ${trendKeywords.length} trend keywords`);

      // 2. 소셜 미디어에서 키워드 수집
      const socialKeywords = await socialMediaCollector.collectAllKeywords();
      logger.info(`Collected ${socialKeywords.length} social media keywords`);

      // 3. 키워드 통합 및 정규화
      const allKeywords = await integrateKeywords(trendKeywords, socialKeywords);
      logger.info(`Integrated ${allKeywords.length} total keywords`);

      // 4. Firestore에 저장
      await saveKeywordsToFirestore(allKeywords);

      logger.info('Keyword collection process completed successfully');
      return { success: true, keywordCount: allKeywords.length };
    } catch (error) {
      logger.error('Keyword collection process failed:', error);
      throw error;
    }
  });

// 키워드 통합 및 정규화
async function integrateKeywords(
  trendKeywords: TrendKeyword[],
  socialKeywords: SocialMediaKeyword[],
): Promise<any[]> {
  const keywordMap = new Map<string, any>();

  // Google Trends 키워드 처리
  for (const keyword of trendKeywords) {
    const key = keyword.keyword.toLowerCase();
    keywordMap.set(key, {
      keyword: keyword.keyword,
      trendScore: keyword.trendScore,
      searchVolume: keyword.searchVolume,
      category: keyword.category,
      sources: ['google-trends'],
      lastUpdated: keyword.lastUpdated,
    });
  }

  // 소셜 미디어 키워드 처리
  for (const keyword of socialKeywords) {
    const key = keyword.keyword.toLowerCase();
    if (keywordMap.has(key)) {
      const existing = keywordMap.get(key);
      existing.sources.push(keyword.platform);
      existing.engagementScore = (existing.engagementScore || 0) + keyword.engagementScore;
      existing.hashtagCount = (existing.hashtagCount || 0) + keyword.hashtagCount;
    } else {
      keywordMap.set(key, {
        keyword: keyword.keyword,
        engagementScore: keyword.engagementScore,
        hashtagCount: keyword.hashtagCount,
        category: keyword.category,
        sources: [keyword.platform],
        lastUpdated: keyword.lastUpdated,
      });
    }
  }

  // 최종 점수 계산 및 정렬
  const integratedKeywords = Array.from(keywordMap.values()).map(keyword => ({
    ...keyword,
    finalScore: calculateFinalScore(keyword),
  }));

  return integratedKeywords.sort((a, b) => b.finalScore - a.finalScore);
}

// 최종 점수 계산
function calculateFinalScore(keyword: any): number {
  let score = 0;

  // Google Trends 점수 (0-100)
  if (keyword.trendScore) {
    score += keyword.trendScore * 0.4;
  }

  // 검색량 점수 (정규화)
  if (keyword.searchVolume) {
    const normalizedVolume = Math.log10(keyword.searchVolume + 1) * 10;
    score += Math.min(normalizedVolume, 100) * 0.3;
  }

  // 소셜 미디어 참여도 점수
  if (keyword.engagementScore) {
    const normalizedEngagement = Math.log10(keyword.engagementScore + 1) * 5;
    score += Math.min(normalizedEngagement, 100) * 0.2;
  }

  // 해시태그 수 점수
  if (keyword.hashtagCount) {
    const normalizedHashtags = Math.log10(keyword.hashtagCount + 1) * 5;
    score += Math.min(normalizedHashtags, 100) * 0.1;
  }

  return Math.round(score);
}

// Firestore에 키워드 저장
async function saveKeywordsToFirestore(keywords: any[]): Promise<void> {
  const batch = db.batch();
  const keywordsCollection = db.collection('keywords');

  for (const keyword of keywords) {
    const docRef = keywordsCollection.doc();
    batch.set(docRef, {
      ...keyword,
      createdAt: new Date(),
    });
  }

  await batch.commit();
  logger.info(`Saved ${keywords.length} keywords to Firestore`);
}

// 수동 키워드 수집 트리거 (테스트용)
export const manualKeywordCollection = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .https.onRequest(async (req, res) => {
    try {
      logger.info('Manual keyword collection triggered');

      const trendKeywords = await googleTrendsCollector.collectTrendingKeywords('US');
      const socialKeywords = await socialMediaCollector.collectAllKeywords();
      const allKeywords = await integrateKeywords(trendKeywords, socialKeywords);
      await saveKeywordsToFirestore(allKeywords);

      res.json({
        success: true,
        message: 'Keywords collected successfully',
        keywordCount: allKeywords.length,
      });
    } catch (error) {
      logger.error('Manual keyword collection failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
