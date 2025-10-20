import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK 초기화
initializeApp();

// Firestore 인스턴스
export const db = getFirestore();

// 키워드 수집 함수들
export {
  collectKeywords,
  manualKeywordCollection,
} from './keyword-collector';

// 이미지 생성 함수들
export {
  generateColoringPages,
  manualImageGeneration,
} from './image-generator';

// 스케줄러 함수들
export {
  dailyScheduler,
} from './scheduler';

// 모든 함수를 내보내기 위한 통합 함수
export const allFunctions = {
  // 키워드 수집
  collectKeywords: functions.region('us-central1').pubsub.schedule('0 0 * * *').timeZone('Asia/Seoul'),
  manualKeywordCollection: functions.region('us-central1').https.onRequest,
  
  // 이미지 생성
  generateColoringPages: functions.region('us-central1').pubsub.schedule('0 2 * * *').timeZone('Asia/Seoul'),
  manualImageGeneration: functions.region('us-central1').https.onRequest,
  
  // 스케줄러
  dailyScheduler: functions.region('us-central1').pubsub.schedule('0 1 * * *').timeZone('Asia/Seoul'),
};
