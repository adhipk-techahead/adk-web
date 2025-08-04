export interface SessionConfig {
  userId: string;
  sessionId: string;
  appName: string;
  state: string;
}

export interface FunctionCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: {
    result: any;
  };
}

export interface MessagePart {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  parts?: MessagePart[];
  streaming?: boolean;
  options?: string[];
  // Enhanced metadata for multi-agent support
  author?: string;
  invocationId?: string;
  actions?: {
    stateDelta?: any;
    artifactDelta?: any;
    transferToAgent?: string;
    requestedAuthConfigs?: any;
  };
  customMetadata?: {
    opik_usage?: {
      candidates_token_count?: number;
      candidates_tokens_details?: Array<{ modality: string; token_count: number }>;
      prompt_token_count?: number;
      prompt_tokens_details?: Array<{ modality: string; token_count: number }>;
      total_token_count?: number;
    };
    provider?: string;
    model_version?: string;
  };
  usageMetadata?: {
    candidatesTokenCount?: number;
    candidatesTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    promptTokenCount?: number;
    promptTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    totalTokenCount?: number;
  };
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

export interface ResponseMetadata {
  fullResponse: any[];
  customMetadata?: {
    opik_usage?: {
      candidates_token_count?: number;
      candidates_tokens_details?: Array<{ modality: string; token_count: number }>;
      prompt_token_count?: number;
      prompt_tokens_details?: Array<{ modality: string; token_count: number }>;
      total_token_count?: number;
    };
    provider?: string;
    model_version?: string;
  };
  usageMetadata?: {
    candidatesTokenCount?: number;
    candidatesTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    promptTokenCount?: number;
    promptTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    totalTokenCount?: number;
  };
  invocationId?: string;
  author?: string;
  actions?: {
    stateDelta?: any;
    artifactDelta?: any;
    requestedAuthConfigs?: any;
  };
  id?: string;
  timestamp?: number;
}