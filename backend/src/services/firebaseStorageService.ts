import { Storage } from '@google-cloud/storage';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  error?: string;
}

export interface ColoringPageMetadata {
  character: string;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  origin: string;
  category: string;
  popularity: number;
  tags: string[];
  generatedAt: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Firebase Storage 서비스
 */
export class FirebaseStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Firebase Storage 초기화
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'coloring-98f0c.firebasestorage.app';
    
    try {
      // Google Cloud Storage 클라이언트 초기화
      this.storage = new Storage({
        projectId: process.env.FIREBASE_PROJECT_ID || 'coloring-98f0c',
        keyFilename: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './coloring-98f0c-firebase-adminsdk-fbsvc-c68fe8998e.json',
      });
      
      logger.info('Firebase Storage 초기화 완료', { bucketName: this.bucketName });
    } catch (error) {
      logger.error('Firebase Storage 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 색칠놀이 도안을 Firebase Storage에 업로드
   */
  async uploadColoringPage(
    imageBuffer: Buffer,
    metadata: ColoringPageMetadata,
    fileName?: string,
  ): Promise<UploadResult> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      
      // 파일명 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeCharacterName = metadata.character.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const finalFileName = fileName || `coloring-pages/${metadata.ageGroup}/${metadata.difficulty}/${safeCharacterName}_${timestamp}.png`;
      
      // Firebase Storage에 업로드
      const file = bucket.file(finalFileName);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
          metadata: {
            character: metadata.character,
            ageGroup: metadata.ageGroup,
            difficulty: metadata.difficulty,
            origin: metadata.origin,
            category: metadata.category,
            popularity: metadata.popularity.toString(),
            tags: metadata.tags.join(','),
            generatedAt: metadata.generatedAt,
            fileSize: metadata.fileSize.toString(),
            dimensions: `${metadata.dimensions.width}x${metadata.dimensions.height}`,
          },
        },
        public: true, // 공개 접근 허용
      });

      // 공개 URL 생성
      const imageUrl = `https://storage.googleapis.com/${this.bucketName}/${finalFileName}`;
      
      // 썸네일 생성 및 업로드
      const thumbnailUrl = await this.generateAndUploadThumbnail(imageBuffer, finalFileName, bucket);
      
      logger.info('색칠놀이 도안 Firebase Storage 업로드 완료', {
        fileName: finalFileName,
        imageUrl,
        thumbnailUrl,
        character: metadata.character,
      });

      return {
        success: true,
        imageUrl,
        thumbnailUrl,
        fileName: finalFileName,
      };

    } catch (error) {
      logger.error('색칠놀이 도안 Firebase Storage 업로드 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 썸네일 생성 및 업로드
   */
  private async generateAndUploadThumbnail(
    imageBuffer: Buffer,
    originalFileName: string,
    bucket: any,
  ): Promise<string> {
    try {
      // 썸네일 파일명 생성
      const thumbnailFileName = originalFileName.replace('.png', '_thumb.png');
      
      // 간단한 썸네일 생성 (실제로는 이미지 리사이징 라이브러리 사용)
      // 여기서는 원본 이미지를 그대로 사용 (실제 구현에서는 sharp나 jimp 사용)
      const thumbnailFile = bucket.file(thumbnailFileName);
      
      await thumbnailFile.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
        },
        public: true,
      });

      return `https://storage.googleapis.com/${this.bucketName}/${thumbnailFileName}`;
    } catch (error) {
      logger.error('썸네일 생성 실패:', error);
      return '';
    }
  }

  /**
   * 로컬 파일을 Firebase Storage에 업로드
   */
  async uploadLocalFile(
    localFilePath: string,
    metadata: ColoringPageMetadata,
  ): Promise<UploadResult> {
    try {
      // 로컬 파일 읽기
      const imageBuffer = fs.readFileSync(localFilePath);
      const stats = fs.statSync(localFilePath);
      
      // 파일 정보 업데이트
      const updatedMetadata = {
        ...metadata,
        fileSize: stats.size,
        generatedAt: new Date().toISOString(),
      };

      // 파일명 추출
      const fileName = path.basename(localFilePath);
      
      return await this.uploadColoringPage(imageBuffer, updatedMetadata, fileName);
      
    } catch (error) {
      logger.error('로컬 파일 Firebase Storage 업로드 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Firebase Storage에서 파일 삭제
   */
  async deleteColoringPage(fileName: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.delete();
      
      logger.info('Firebase Storage 파일 삭제 완료', { fileName });
      return true;
      
    } catch (error) {
      logger.error('Firebase Storage 파일 삭제 실패:', error);
      return false;
    }
  }

  /**
   * Firebase Storage 파일 목록 조회
   */
  async listColoringPages(prefix: string = 'coloring-pages/'): Promise<any[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix });
      
      const fileList = files.map(file => ({
        name: file.name,
        url: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
        size: file.metadata.size,
        created: file.metadata.timeCreated,
        updated: file.metadata.updated,
        metadata: file.metadata.metadata,
      }));
      
      logger.info('Firebase Storage 파일 목록 조회 완료', { count: fileList.length });
      return fileList;
      
    } catch (error) {
      logger.error('Firebase Storage 파일 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * Firebase Storage 연결 상태 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      
      if (exists) {
        logger.info('Firebase Storage 연결 확인 완료');
        return true;
      }
      logger.error('Firebase Storage 버킷이 존재하지 않습니다');
      return false;
    } catch (error) {
      logger.error('Firebase Storage 연결 확인 실패:', error);
      return false;
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
