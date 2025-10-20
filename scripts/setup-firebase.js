#!/usr/bin/env node
/**
 * Firebase 설정 스크립트
 * Firebase Storage와 Firestore 설정을 자동화
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 서비스 계정 키 파일 경로
const serviceAccountPath = path.join(__dirname, '..', 'coloring-98f0c-firebase-adminsdk-fbsvc-32d62b5d72.json');

// Firebase 초기화
function initializeFirebase() {
  try {
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ Firebase 서비스 계정 키 파일을 찾을 수 없습니다:', serviceAccountPath);
      return false;
    }

    const serviceAccount = require(serviceAccountPath);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'coloring-98f0c.firebasestorage.app'
      });
    }

    console.log('✅ Firebase Admin SDK 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error.message);
    return false;
  }
}

// Storage 버킷 설정
async function setupStorageBucket() {
  try {
    const bucket = admin.storage().bucket();
    
    console.log('📦 Storage 버킷 설정 중...');
    
    // 버킷 메타데이터 확인
    const [metadata] = await bucket.getMetadata();
    console.log(`✅ Storage 버킷: ${metadata.name}`);
    console.log(`📍 위치: ${metadata.location}`);
    console.log(`📅 생성일: ${metadata.timeCreated}`);
    
    return true;
  } catch (error) {
    console.error('❌ Storage 버킷 설정 실패:', error.message);
    return false;
  }
}

// Firestore 데이터베이스 설정
async function setupFirestoreDatabase() {
  try {
    const db = admin.firestore();
    
    console.log('🗄️ Firestore 데이터베이스 설정 중...');
    
    // 컬렉션 구조 생성
    const collections = [
      'coloringPages',
      'characters',
      'users',
      'masterPrompts',
      'analytics'
    ];
    
    for (const collectionName of collections) {
      try {
        // 컬렉션 존재 확인을 위한 더미 문서 생성
        const docRef = db.collection(collectionName).doc('_setup');
        await docRef.set({
          created: admin.firestore.FieldValue.serverTimestamp(),
          description: `Setup document for ${collectionName} collection`
        });
        
        console.log(`✅ 컬렉션 생성: ${collectionName}`);
      } catch (error) {
        console.log(`⚠️ 컬렉션 ${collectionName} 설정 중 오류:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firestore 데이터베이스 설정 실패:', error.message);
    return false;
  }
}

// 샘플 데이터 생성
async function createSampleData() {
  try {
    const db = admin.firestore();
    
    console.log('📝 샘플 데이터 생성 중...');
    
    // 샘플 캐릭터 데이터
    const sampleCharacters = [
      {
        id: 'char_001',
        name: '포켓몬 피카츄',
        type: 'anime',
        originCountry: 'japan',
        ageGroup: 'child',
        difficulty: 'easy',
        tags: ['포켓몬', '피카츄', 'anime', 'child', 'easy'],
        popularity: 95,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'char_002',
        name: '미키마우스',
        type: 'cartoon',
        originCountry: 'usa',
        ageGroup: 'child',
        difficulty: 'easy',
        tags: ['미키마우스', '디즈니', 'cartoon', 'child', 'easy'],
        popularity: 90,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'char_003',
        name: '헬로키티',
        type: 'mascot',
        originCountry: 'japan',
        ageGroup: 'child',
        difficulty: 'medium',
        tags: ['헬로키티', '산리오', 'mascot', 'child', 'medium'],
        popularity: 85,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    // 캐릭터 데이터 저장
    for (const character of sampleCharacters) {
      await db.collection('characters').doc(character.id).set(character);
      console.log(`✅ 캐릭터 저장: ${character.name}`);
    }
    
    // 샘플 색칠놀이 도안 데이터
    const sampleColoringPages = [
      {
        id: 'page_001',
        characterName: '포켓몬 피카츄',
        characterType: 'anime',
        originCountry: 'japan',
        ageGroup: 'child',
        difficulty: 'easy',
        theme: 'default',
        activity: 'standing',
        emotion: 'happy',
        imageUrl: 'https://storage.googleapis.com/coloring-98f0c.firebasestorage.app/coloring-pages/page_001.png',
        thumbnailUrl: 'https://storage.googleapis.com/coloring-98f0c.firebasestorage.app/thumbnails/page_001_thumb.png',
        downloads: 0,
        likes: 0,
        tags: ['포켓몬', '피카츄', 'anime', 'child', 'easy'],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    // 색칠놀이 도안 데이터 저장
    for (const page of sampleColoringPages) {
      await db.collection('coloringPages').doc(page.id).set(page);
      console.log(`✅ 색칠놀이 도안 저장: ${page.characterName}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error.message);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 Firebase 설정 시작');
  console.log('=' * 50);
  
  // 1. Firebase 초기화
  if (!initializeFirebase()) {
    process.exit(1);
  }
  
  // 2. Storage 버킷 설정
  await setupStorageBucket();
  
  // 3. Firestore 데이터베이스 설정
  await setupFirestoreDatabase();
  
  // 4. 샘플 데이터 생성
  await createSampleData();
  
  console.log('\n🎉 Firebase 설정 완료!');
  console.log('=' * 50);
  console.log('✅ Firebase Admin SDK 초기화');
  console.log('✅ Storage 버킷 설정');
  console.log('✅ Firestore 데이터베이스 설정');
  console.log('✅ 샘플 데이터 생성');
  console.log('\n📚 다음 단계:');
  console.log('1. Firebase Console에서 보안 규칙 확인');
  console.log('2. Storage 규칙 설정');
  console.log('3. Firestore 규칙 설정');
  console.log('4. 인증 설정 확인');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeFirebase,
  setupStorageBucket,
  setupFirestoreDatabase,
  createSampleData
};
