import { ChatSession, SessionConfig } from '../types';

class StorageService {
  private readonly CHAT_SESSIONS_KEY = 'chatbot_sessions';
  private readonly SESSION_CONFIG_KEY = 'session_config';

  saveChatSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;
    
    const sessions = this.getChatSessions();
    const existingIndex = sessions.findIndex(
      s => s.userId === session.userId && s.sessionId === session.sessionId
    );
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(this.CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  }

  getChatSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(this.CHAT_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getChatSession(userId: string, sessionId: string): ChatSession | null {
    const sessions = this.getChatSessions();
    return sessions.find(s => s.userId === userId && s.sessionId === sessionId) || null;
  }

  saveSessionConfig(config: SessionConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.SESSION_CONFIG_KEY, JSON.stringify(config));
  }

  getSessionConfig(): SessionConfig | null {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(this.SESSION_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearChatSession(userId: string, sessionId: string): void {
    if (typeof window === 'undefined') return;
    
    const sessions = this.getChatSessions();
    const filtered = sessions.filter(
      s => !(s.userId === userId && s.sessionId === sessionId)
    );
    localStorage.setItem(this.CHAT_SESSIONS_KEY, JSON.stringify(filtered));
  }

  exportChatHistory(userId: string, sessionId: string): string {
    const session = this.getChatSession(userId, sessionId);
    if (!session) return '';
    
    return JSON.stringify(session, null, 2);
  }

  exportSessionConfig(): string {
    const config = this.getSessionConfig();
    return config ? JSON.stringify(config, null, 2) : '';
  }
}

export const storageService = new StorageService();