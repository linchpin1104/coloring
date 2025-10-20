import axios, { AxiosInstance } from 'axios';
import { auth } from '../config/firebase';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ColoringPage {
  id: string;
  title: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: 'child' | 'teen' | 'adult';
  character: string;
  createdAt: string;
}

interface UserData {
  email: string;
  password: string;
  name: string;
  profileImage?: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      timeout: 10000,
    });

    // 요청 인터셉터 - 인증 토큰 추가
    this.api.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 응답 인터셉터 - 에러 처리
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 인증 에러 시 로그아웃 처리
          auth.signOut();
        }
        return Promise.reject(error);
      },
    );
  }

  // 인증 관련 API
  async loginUser(): Promise<User> {
    const response = await this.api.post<ApiResponse<{ user: User }>>('/auth/login');
    return response.data.data.user;
  }

  async registerUser(userData: UserData): Promise<User> {
    const response = await this.api.post<ApiResponse<{ user: User }>>('/auth/register', userData);
    return response.data.data.user;
  }

  async getUserProfile(): Promise<User> {
    const response = await this.api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  }

  async updateUserProfile(data: Partial<UserData>): Promise<User> {
    const response = await this.api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data.data.user;
  }

  // 색칠놀이 도안 관련 API
  async getColoringPages(params?: Record<string, unknown>): Promise<ApiResponse<{ coloringPages: ColoringPage[]; total: number }>> {
    const response = await this.api.get<ApiResponse<{ coloringPages: ColoringPage[]; total: number }>>('/coloring-pages', { params });
    return response.data;
  }

  async getColoringPageById(id: string): Promise<ColoringPage> {
    const response = await this.api.get<ApiResponse<{ coloringPage: ColoringPage }>>(`/coloring-pages/${id}`);
    return response.data.data.coloringPage;
  }

  async getPopularColoringPages(limit?: number): Promise<ColoringPage[]> {
    const response = await this.api.get('/coloring-pages/popular', {
      params: { limit },
    });
    return response.data.data.coloringPages;
  }

  async getRecentColoringPages(limit?: number): Promise<ColoringPage[]> {
    const response = await this.api.get('/coloring-pages/recent', {
      params: { limit },
    });
    return response.data.data.coloringPages;
  }

  async getRecommendedColoringPages(ageGroup: string, limit?: number): Promise<ColoringPage[]> {
    const response = await this.api.get(`/coloring-pages/recommended/${ageGroup}`, {
      params: { limit },
    });
    return response.data.data.coloringPages;
  }

  async searchColoringPages(query: string, filters?: Record<string, unknown>): Promise<{ coloringPages: ColoringPage[]; total: number }> {
    const response = await this.api.get('/coloring-pages/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  async downloadColoringPage(id: string): Promise<{ downloadUrl: string; filename: string }> {
    const response = await this.api.post(`/coloring-pages/${id}/download`);
    return response.data.data;
  }

  // 추천 관련 API
  async getRecommendations(params?: Record<string, unknown>): Promise<{ recommendations: ColoringPage[]; total: number }> {
    const response = await this.api.get('/recommendations', { params });
    return response.data.data;
  }

  async getPersonalizedRecommendations(params?: Record<string, unknown>): Promise<{ recommendations: ColoringPage[]; total: number }> {
    const response = await this.api.get('/recommendations/personalized', { params });
    return response.data.data;
  }

  async getAgeBasedRecommendations(ageGroup: string, limit?: number): Promise<ColoringPage[]> {
    const response = await this.api.get(`/recommendations/age/${ageGroup}`, {
      params: { limit },
    });
    return response.data.data;
  }

  async submitRecommendationFeedback(pageId: string, feedback: string, rating?: number): Promise<void> {
    await this.api.post('/recommendations/feedback', {
      pageId,
      feedback,
      rating,
    });
  }

  // 검색 관련 API
  async search(query: string, filters?: Record<string, unknown>): Promise<{ results: ColoringPage[]; total: number; facets: Record<string, unknown> }> {
    const response = await this.api.get('/search', {
      params: { q: query, ...filters },
    });
    return response.data.data;
  }

  async advancedSearch(query: string, filters?: Record<string, unknown>): Promise<{ results: ColoringPage[]; total: number; facets: Record<string, unknown> }> {
    const response = await this.api.get('/search/advanced', {
      params: { q: query, ...filters },
    });
    return response.data.data;
  }

  async autocomplete(query: string, limit?: number): Promise<string[]> {
    const response = await this.api.get('/search/autocomplete', {
      params: { q: query, limit },
    });
    return response.data.data.suggestions;
  }

  async getPopularSearches(limit?: number, days?: number): Promise<Array<{ query: string; count: number; lastSearched: string }>> {
    const response = await this.api.get('/search/popular', {
      params: { limit, days },
    });
    return response.data.data.popularSearches;
  }

  async saveSearchHistory(query: string, filters?: Record<string, unknown>, resultsCount?: number): Promise<void> {
    await this.api.post('/search/history', {
      query,
      filters,
      resultsCount,
    });
  }

  // 결제 관련 API
  async getPoints(): Promise<{ balance: number; totalEarned: number; totalSpent: number }> {
    const response = await this.api.get('/payments/points');
    return response.data.data;
  }

  async createPaymentIntent(amount: number, currency?: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await this.api.post('/payments/create-intent', {
      amount,
      currency,
    });
    return response.data.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; transactionId: string }> {
    const response = await this.api.post('/payments/confirm', {
      paymentIntentId,
    });
    return response.data.data;
  }

  async getPaymentHistory(page?: number, limit?: number): Promise<{ payments: Array<{ id: string; amount: number; status: string; createdAt: string }>; total: number }> {
    const response = await this.api.get('/payments/history', {
      params: { page, limit },
    });
    return response.data.data;
  }

  // 유틸리티 메서드
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
