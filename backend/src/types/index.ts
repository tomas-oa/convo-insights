/**
 * Shared types between backend and frontend
 * These types are exported from the backend and can be imported by the frontend
 */

// Re-export Prisma generated types
export type {
  User,
  Prompt,
  Conversation,
  Message,
  ConversationStatus,
  ChannelType,
  MessageRole,
} from '../../generated/index.js';

// Import types for use in this file
import type { 
  Conversation, 
  Message, 
  Prompt,
  ConversationStatus,
  ChannelType,
  MessageRole
} from '../../generated/index.js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  createdAt: Date;
}

export interface PromptSummary {
  id: string;
  name: string;
  description?: string | null;
}

export interface ConversationWithRelations extends Conversation {
  prompt: PromptSummary | null;
  _count: {
    messages: number;
  };
}

export interface ConversationDetail extends Conversation {
  prompt: PromptSummary | null;
  _count: {
    messages: number;
  };
}

export interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  firstMessageAt: Date | null;
  lastMessageAt: Date | null;
  duration: number | null;
}

export interface MessageWithPrompt extends Message {
  prompt: {
    id: string;
    name: string;
  } | null;
}

export interface ChatResponse {
  userMessage: Message;
  aiMessage: Message;
}

export interface PromptWithCounts extends Prompt {
  _count: {
    conversations: number;
    messages: number;
  };
}

export interface DashboardAnalytics {
  totals: {
    conversations: number;
    openConversations: number;
    messages: number;
    averageRating: number;
    satisfactionPercentage: number;
    avgResponseTime: number;
  };
  byChannel: Array<{
    channel: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface TrendData {
  date: string;
  conversations: number;
  open: number;
  closed: number;
  avg_rating: number | null;
}

export interface RatingDistribution {
  rating: number | null;
  count: number;
}

export interface PromptAnalytics {
  promptId: string;
  promptName: string;
  promptDescription: string | null;
  avgRating: number;
  conversationCount: number;
}

export interface DeleteResponse {
  message: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

// ============================================================================
// Request Types
// ============================================================================

export interface ConversationQueryParams {
  status?: ConversationStatus;
  channel?: ChannelType;
  limit?: number;
  offset?: number;
}

export interface MessageQueryParams {
  limit?: number;
  offset?: number;
}

export interface CreateConversationRequest {
  channel: ChannelType;
  status?: ConversationStatus;
}

export interface UpdateConversationRequest {
  status?: ConversationStatus;
  rating?: number;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  role: MessageRole;
}

export interface CreatePromptRequest {
  name: string;
  description?: string;
  text: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  text?: string;
  isActive?: boolean;
  isDefault?: boolean;
}
