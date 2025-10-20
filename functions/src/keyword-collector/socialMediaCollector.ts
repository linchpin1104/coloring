import axios from 'axios';
// import * as cheerio from 'cheerio';
import { createFunctionLogger } from '@/utils/logger';

const logger = createFunctionLogger('socialMediaCollector');

export interface SocialMediaKeyword {
  keyword: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  hashtagCount: number;
  engagementScore: number;
  category: string;
  lastUpdated: Date;
}

export class SocialMediaCollector {
  private readonly youtubeApiKey: string;
  private readonly instagramApiKey: string;

  constructor(youtubeApiKey: string, instagramApiKey: string) {
    this.youtubeApiKey = youtubeApiKey;
    this.instagramApiKey = instagramApiKey;
  }

  // YouTube에서 인기 키워드 수집
  async collectYouTubeKeywords(maxResults: number = 50): Promise<SocialMediaKeyword[]> {
    try {
      logger.info('Collecting YouTube keywords');

      const keywords: SocialMediaKeyword[] = [];

      // YouTube Data API v3를 사용하여 인기 동영상의 태그 수집
      const trendingVideos = await this.getTrendingVideos(maxResults);

      for (const video of trendingVideos) {
        if (video.tags && video.tags.length > 0) {
          for (const tag of video.tags) {
            // 색칠놀이와 관련된 키워드만 필터링
            if (this.isColoringRelated(tag)) {
              keywords.push({
                keyword: tag,
                platform: 'youtube',
                hashtagCount: 1,
                engagementScore: video.viewCount || 0,
                category: this.categorizeKeyword(tag),
                lastUpdated: new Date(),
              });
            }
          }
        }
      }

      // 키워드별로 집계
      const aggregatedKeywords = this.aggregateKeywords(keywords);

      logger.info(`Collected ${aggregatedKeywords.length} YouTube keywords`);
      return aggregatedKeywords;
    } catch (error) {
      logger.error('Failed to collect YouTube keywords:', error);
      throw error;
    }
  }

  // Instagram에서 인기 해시태그 수집
  async collectInstagramHashtags(maxResults: number = 50): Promise<SocialMediaKeyword[]> {
    try {
      logger.info('Collecting Instagram hashtags');

      const keywords: SocialMediaKeyword[] = [];

      // Instagram Basic Display API를 사용하여 인기 해시태그 수집
      const popularHashtags = await this.getPopularHashtags(maxResults);

      for (const hashtag of popularHashtags) {
        if (this.isColoringRelated(hashtag.name)) {
          keywords.push({
            keyword: hashtag.name,
            platform: 'instagram',
            hashtagCount: hashtag.mediaCount,
            engagementScore: hashtag.mediaCount * 0.1, // 간단한 engagement 점수 계산
            category: this.categorizeKeyword(hashtag.name),
            lastUpdated: new Date(),
          });
        }
      }

      logger.info(`Collected ${keywords.length} Instagram hashtags`);
      return keywords;
    } catch (error) {
      logger.error('Failed to collect Instagram hashtags:', error);
      throw error;
    }
  }

  // TikTok에서 인기 키워드 수집 (웹 스크래핑)
  async collectTikTokKeywords(maxResults: number = 50): Promise<SocialMediaKeyword[]> {
    try {
      logger.info('Collecting TikTok keywords');

      const keywords: SocialMediaKeyword[] = [];

      // TikTok 웹사이트에서 인기 해시태그 스크래핑
      const popularHashtags = await this.scrapeTikTokHashtags(maxResults);

      for (const hashtag of popularHashtags) {
        if (this.isColoringRelated(hashtag.name)) {
          keywords.push({
            keyword: hashtag.name,
            platform: 'tiktok',
            hashtagCount: hashtag.videoCount,
            engagementScore: hashtag.videoCount * 0.2,
            category: this.categorizeKeyword(hashtag.name),
            lastUpdated: new Date(),
          });
        }
      }

      logger.info(`Collected ${keywords.length} TikTok keywords`);
      return keywords;
    } catch (error) {
      logger.error('Failed to collect TikTok keywords:', error);
      throw error;
    }
  }

  // 모든 플랫폼에서 키워드 수집
  async collectAllKeywords(): Promise<SocialMediaKeyword[]> {
    try {
      logger.info('Collecting keywords from all social media platforms');

      const [youtubeKeywords, instagramKeywords, tiktokKeywords] = await Promise.all([
        this.collectYouTubeKeywords(50),
        this.collectInstagramHashtags(50),
        this.collectTikTokKeywords(50),
      ]);

      const allKeywords = [
        ...youtubeKeywords,
        ...instagramKeywords,
        ...tiktokKeywords,
      ];

      // 키워드별로 집계
      const aggregatedKeywords = this.aggregateKeywords(allKeywords);

      logger.info(`Collected total ${aggregatedKeywords.length} keywords from all platforms`);
      return aggregatedKeywords;
    } catch (error) {
      logger.error('Failed to collect keywords from all platforms:', error);
      throw error;
    }
  }

  // YouTube 인기 동영상 조회
  private async getTrendingVideos(maxResults: number): Promise<any[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: 'US',
          maxResults,
          key: this.youtubeApiKey,
        },
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to get trending videos:', error);
      // API 호출 실패 시 시뮬레이션된 데이터 반환
      return this.getMockTrendingVideos(maxResults);
    }
  }

  // Instagram 인기 해시태그 조회
  private async getPopularHashtags(maxResults: number): Promise<any[]> {
    try {
      // Instagram Basic Display API 사용
      // 실제 구현에서는 Instagram API를 호출
      return this.getMockPopularHashtags(maxResults);
    } catch (error) {
      logger.error('Failed to get popular hashtags:', error);
      return this.getMockPopularHashtags(maxResults);
    }
  }

  // TikTok 해시태그 스크래핑
  private async scrapeTikTokHashtags(maxResults: number): Promise<any[]> {
    try {
      // 실제 구현에서는 Puppeteer를 사용하여 TikTok 웹사이트 스크래핑
      return this.getMockTikTokHashtags(maxResults);
    } catch (error) {
      logger.error('Failed to scrape TikTok hashtags:', error);
      return this.getMockTikTokHashtags(maxResults);
    }
  }

  // 색칠놀이 관련 키워드인지 확인
  private isColoringRelated(keyword: string): boolean {
    const coloringKeywords = [
      'coloring', 'color', 'drawing', 'art', 'craft', 'paint',
      'anime', 'cartoon', 'character', 'cute', 'kawaii',
      'pokemon', 'naruto', 'dragon', 'princess', 'superhero',
      'minecraft', 'roblox', 'game', 'disney', 'pixar',
    ];

    const lowerKeyword = keyword.toLowerCase();
    return coloringKeywords.some(k => lowerKeyword.includes(k));
  }

  // 키워드 카테고리 분류
  private categorizeKeyword(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();

    if (lowerKeyword.includes('pokemon') || lowerKeyword.includes('pikachu')) {
      return 'pokemon';
    } else if (lowerKeyword.includes('naruto') || lowerKeyword.includes('anime')) {
      return 'anime';
    } else if (lowerKeyword.includes('minecraft') || lowerKeyword.includes('game')) {
      return 'game';
    } else if (lowerKeyword.includes('disney') || lowerKeyword.includes('frozen')) {
      return 'disney';
    } else if (lowerKeyword.includes('cartoon') || lowerKeyword.includes('spongebob')) {
      return 'cartoon';
    } 
    return 'general';
    
  }

  // 키워드별로 집계
  private aggregateKeywords(keywords: SocialMediaKeyword[]): SocialMediaKeyword[] {
    const keywordMap = new Map<string, SocialMediaKeyword>();

    for (const keyword of keywords) {
      const key = keyword.keyword.toLowerCase();
      if (keywordMap.has(key)) {
        const existing = keywordMap.get(key)!;
        existing.hashtagCount += keyword.hashtagCount;
        existing.engagementScore += keyword.engagementScore;
      } else {
        keywordMap.set(key, { ...keyword });
      }
    }

    return Array.from(keywordMap.values())
      .sort((a, b) => b.engagementScore - a.engagementScore);
  }

  // 시뮬레이션된 데이터들
  private getMockTrendingVideos(maxResults: number): any[] {
    return Array.from({ length: maxResults }, (_, i) => ({
      snippet: {
        title: `Trending Video ${i + 1}`,
        tags: ['coloring', 'art', 'cute', 'anime', 'pokemon'],
      },
      statistics: {
        viewCount: Math.floor(Math.random() * 1000000) + 10000,
      },
    }));
  }

  private getMockPopularHashtags(maxResults: number): any[] {
    return [
      { name: 'coloring', mediaCount: 1000000 },
      { name: 'pokemon', mediaCount: 800000 },
      { name: 'anime', mediaCount: 750000 },
      { name: 'cute', mediaCount: 600000 },
      { name: 'art', mediaCount: 500000 },
    ].slice(0, maxResults);
  }

  private getMockTikTokHashtags(maxResults: number): any[] {
    return [
      { name: 'coloring', videoCount: 500000 },
      { name: 'pokemon', videoCount: 400000 },
      { name: 'anime', videoCount: 350000 },
      { name: 'cute', videoCount: 300000 },
      { name: 'art', videoCount: 250000 },
    ].slice(0, maxResults);
  }
}

export const socialMediaCollector = new SocialMediaCollector(
  process.env.YOUTUBE_API_KEY || 'mock-youtube-key',
  process.env.INSTAGRAM_API_KEY || 'mock-instagram-key',
);
