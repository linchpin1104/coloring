import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '../utils/logger';

// 환경 변수에서 Firebase 설정 가져오기
const projectId = process.env['FIREBASE_PROJECT_ID'] || 'coloring-platform-demo';
const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n') || '';
const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'] || '';

const firebaseConfig = {
  projectId,
  privateKey,
  clientEmail,
};

// Firebase Admin SDK 초기화
if (getApps().length === 0) {
  try {
    // 개발 환경에서는 기본 설정 사용
    if (process.env['NODE_ENV'] === 'development') {
      initializeApp({
        projectId,
      });
    } else {
      initializeApp({
        credential: cert(firebaseConfig as ServiceAccount),
        storageBucket: `${projectId}.appspot.com`,
      });
    }
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    // 개발 환경에서는 에러를 무시하고 계속 진행
    if (process.env['NODE_ENV'] !== 'development') {
      throw error;
    }
  }
}

// Firestore 인스턴스
export const db = getFirestore();

// Auth 인스턴스
export const auth = getAuth();

// Storage 인스턴스
export const storage = getStorage();

// Firestore 설정
db.settings({
  ignoreUndefinedProperties: true,
});

export default { db, auth, storage };