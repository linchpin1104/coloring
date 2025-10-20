// 공통 타입 정의

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  displayName?: string;
  ageGroup?: 'child' | 'teen' | 'adult';
  points?: number;
  dailyFreeCount?: number;
  lastFreeDate?: string;
  preferences?: {
    favoriteCharacters?: string[];
    favoriteThemes?: string[];
    difficultyPreference?: 'easy' | 'medium' | 'hard';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CharacterData {
  id: string;
  name: string;
  type: string;
  originCountry: string;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ColoringPage {
  id: string;
  title: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: 'child' | 'teen' | 'adult';
  character: string;
  createdAt: string;
  updatedAt: string;
  downloadCount?: number;
  rating?: number;
}

export interface MasterPrompt {
  id: string;
  name: string;
  description: string;
  rules: MasterRules;
  createdAt: string;
  updatedAt: string;
}

export interface MasterRules {
  universalRules: string[];
  characterTypeRules: Record<string, string[]>;
  ageGroupRules: Record<string, AgeGroupRule>;
  difficultyRules: Record<string, DifficultyRule>;
  themeModifiers: Record<string, string[]>;
}

export interface AgeGroupRule {
  age: string;
  description: string;
  lineWeight: string;
  complexity: string;
  proportions: string;
}

export interface DifficultyRule {
  level: string;
  description: string;
  lineThickness: string;
  detailLevel: string;
  complexity: string;
}

export interface ImageGenerationRequest {
  characterName: string;
  characterType: string;
  originCountry: string;
  ageGroup: 'child' | 'teen' | 'adult';
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
  activity?: string;
  emotion?: string;
}

export interface SearchRequest {
  q?: string;
  ageGroup?: 'child' | 'teen' | 'adult';
  difficulty?: 'easy' | 'medium' | 'hard';
  characterName?: string;
  keywords?: string[];
  sortBy?: 'relevance' | 'popularity' | 'newest' | 'oldest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RecommendationRequest {
  userId: string;
  ageGroup: 'child' | 'teen' | 'adult';
  limit?: number;
  excludeDownloaded?: boolean;
  preferredCharacters?: string[];
  excludeCharacters?: string[];
  minDifficulty?: 'easy' | 'medium' | 'hard';
  maxDifficulty?: 'easy' | 'medium' | 'hard';
  sortBy?: 'popularity' | 'recent' | 'difficulty' | 'random';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  points: number;
  description: string;
}

export interface SecurityEvent {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface DatabaseQuery {
  collection: string;
  filters: Record<string, unknown>;
  sort?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

export interface FirebaseConfig {
  projectId: string;
  storageBucket: string;
  apiKey: string;
}

export interface EncryptionConfig {
  algorithm: string;
  secretKey: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
