import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * 데이터 암호화 서비스
 * 민감한 데이터 필드 암호화/복호화 담당
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || 'default-secret-key-change-in-production';
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * 데이터 암호화
   */
  static encrypt(data: string): string {
    try {
      if (!data) {return data;}

      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, this.SECRET_KEY);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // IV + AuthTag + EncryptedData 형태로 결합
      const result = `${iv.toString('hex')  }:${  authTag.toString('hex')  }:${  encrypted}`;
      
      logger.debug('Data encrypted successfully', { 
        dataLength: data.length,
        encryptedLength: result.length, 
      });
      
      return result;
    } catch (error) {
      logger.error('Encryption failed', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * 데이터 복호화
   */
  static decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) {return encryptedData;}

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ALGORITHM, this.SECRET_KEY);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Data decrypted successfully', { 
        encryptedLength: encryptedData.length,
        decryptedLength: decrypted.length, 
      });
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * 이메일 마스킹 (로그용)
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) {return email;}
    
    const [local, domain] = email.split('@');
    if (local.length <= 2) {return `***@${  domain}`;}
    
    return `${local.substring(0, 2)  }***@${  domain}`;
  }

  /**
   * 전화번호 마스킹 (로그용)
   */
  static maskPhoneNumber(phone: string): string {
    if (!phone) {return phone;}
    
    if (phone.length <= 4) {return '***';}
    
    return `${phone.substring(0, 3)  }***${  phone.substring(phone.length - 2)}`;
  }

  /**
   * 카드번호 마스킹 (로그용)
   */
  static maskCardNumber(cardNumber: string): string {
    if (!cardNumber) {return cardNumber;}
    
    if (cardNumber.length <= 8) {return '****';}
    
    return `${cardNumber.substring(0, 4)  } **** **** ${  cardNumber.substring(cardNumber.length - 4)}`;
  }

  /**
   * 해시 생성 (비밀번호 등)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 안전한 랜덤 문자열 생성
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 데이터 무결성 검증
   */
  static verifyIntegrity(data: string, hash: string): boolean {
    const computedHash = this.hash(data);
    return computedHash === hash;
  }
}

/**
 * 민감한 데이터 필드 타입 정의
 */
export interface SensitiveData {
  email?: string;
  phoneNumber?: string;
  cardNumber?: string;
  paymentInfo?: string;
  personalInfo?: string;
}

/**
 * 암호화된 사용자 데이터 인터페이스
 */
export interface EncryptedUserData {
  uid: string;
  email: string; // 암호화됨
  displayName: string;
  age: number;
  ageGroup: 'child' | 'teen' | 'adult';
  points: number;
  dailyFreeCount: number;
  lastFreeDate: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    favoriteCharacters: string[];
    favoriteThemes: string[];
    difficultyPreference: 'easy' | 'medium' | 'hard';
  };
  // 암호화된 필드들
  encryptedFields: {
    email: string;
    paymentInfo?: string;
    personalInfo?: string;
  };
}

/**
 * 암호화된 트랜잭션 데이터 인터페이스
 */
export interface EncryptedTransactionData {
  id: string;
  uid: string;
  type: 'charge' | 'download';
  amount: number; // 암호화됨
  points: number;
  stripePaymentIntentId?: string; // 암호화됨
  createdAt: string;
  updatedAt: string;
  // 암호화된 필드들
  encryptedFields: {
    amount: string;
    stripePaymentIntentId?: string;
  };
}

