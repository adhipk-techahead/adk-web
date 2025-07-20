export interface SessionConfig {
  userId: string;
  sessionId: string;
  initialState: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  parts?: Array<{ text: string }>;
}

export interface ChatSession {
  userId: string;
  sessionId: string;
  messages: Message[];
  createdAt: number;
}

export interface ApiRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export interface ApiCall {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
  duration?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastPing?: number;
  error?: string;
}