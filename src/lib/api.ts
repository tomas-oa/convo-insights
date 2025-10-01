import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiError,
  AuthResponse,
  UserProfile,
  ConversationWithRelations,
  ConversationDetail,
  ConversationStats,
  MessageWithPrompt,
  ChatResponse,
  PromptWithCounts,
  Prompt,
  DashboardAnalytics,
  TrendData,
  RatingDistribution,
  PromptAnalytics,
  DeleteResponse,
  ConversationStatus,
  ChannelType,
  MessageRole,
  ConversationQueryParams,
  MessageQueryParams,
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateMessageRequest,
  CreatePromptRequest,
  UpdatePromptRequest,
} from '@backend/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).error || 'Error en la petición');
    }

    return data as T;
  }

  // Auth endpoints
  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }
    );
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Conversations endpoints
  async getConversations(params?: ConversationQueryParams): Promise<ConversationWithRelations[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request<ConversationWithRelations[]>(
      `/api/conversations${query ? `?${query}` : ''}`
    );
  }

  async getConversation(id: string): Promise<ConversationDetail> {
    return this.request<ConversationDetail>(`/api/conversations/${id}`);
  }

  async createConversation(data: CreateConversationRequest): Promise<ConversationWithRelations> {
    return this.request<ConversationWithRelations>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(
    id: string,
    data: UpdateConversationRequest
  ): Promise<ConversationWithRelations> {
    return this.request<ConversationWithRelations>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async getConversationStats(id: string): Promise<ConversationStats> {
    return this.request<ConversationStats>(`/api/conversations/${id}/stats`);
  }

  // Messages endpoints
  async getMessages(conversationId: string, params?: MessageQueryParams): Promise<MessageWithPrompt[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request<MessageWithPrompt[]>(
      `/api/messages/conversation/${conversationId}${query ? `?${query}` : ''}`
    );
  }

  async createMessage(data: CreateMessageRequest): Promise<MessageWithPrompt> {
    return this.request<MessageWithPrompt>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMessage(id: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/api/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat endpoint
  async sendChatMessage(conversationId: string, message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    });
  }

  // Analytics endpoints
  async getDashboardAnalytics(period?: 'today' | 'week' | 'month' | 'all'): Promise<DashboardAnalytics> {
    const query = period ? `?period=${period}` : '';
    return this.request<DashboardAnalytics>(`/api/analytics/dashboard${query}`);
  }

  async getTrends(days: number = 30): Promise<TrendData[]> {
    return this.request<TrendData[]>(`/api/analytics/trends?days=${days}`);
  }

  async getRatings(): Promise<RatingDistribution[]> {
    return this.request<RatingDistribution[]>('/api/analytics/ratings');
  }

  async getPromptAnalytics(): Promise<PromptAnalytics[]> {
    return this.request<PromptAnalytics[]>('/api/analytics/prompts');
  }

  // Prompts endpoints
  async getPrompts(): Promise<PromptWithCounts[]> {
    return this.request<PromptWithCounts[]>('/api/prompts');
  }

  async getActivePrompt(): Promise<Prompt> {
    return this.request<Prompt>('/api/prompts/active');
  }

  async getPrompt(id: string): Promise<PromptWithCounts> {
    return this.request<PromptWithCounts>(`/api/prompts/${id}`);
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    return this.request<Prompt>('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    return this.request<Prompt>(`/api/prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async togglePrompt(id: string): Promise<Prompt> {
    return this.request<Prompt>(`/api/prompts/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deletePrompt(id: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/api/prompts/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_URL);
export default api;

// ============================================
// React Query Hooks
// ============================================

// Analytics hooks
export const useRatings = () => {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: () => api.getRatings(),
  });
};

export const usePromptAnalytics = () => {
  return useQuery({
    queryKey: ['promptAnalytics'],
    queryFn: () => api.getPromptAnalytics(),
  });
};

export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => api.getDashboardAnalytics(),
  });
};
