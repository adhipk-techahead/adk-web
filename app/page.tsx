'use client';

import React, { useState, useEffect } from 'react';
import { SessionPanel } from '../components/SessionPanel';
import { ChatInterface } from '../components/ChatInterface';
import { DebugPanel } from '../components/DebugPanel';
import { SessionConfig, ApiCall, ConnectionStatus } from '../types';
import { storageService } from '../lib/storage';

export default function Home() {
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false
  });
  const [sessionState, setSessionState] = useState<any>(null);
  const [botMessage, setBotMessage] = useState<string>('');

  useEffect(() => {
    const savedConfig = storageService.getSessionConfig();
    if (savedConfig) {
      setSessionConfig(savedConfig);
    }

    // Test initial connection
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setConnectionStatus({
        isConnected: data.isConnected,
        lastPing: data.timestamp,
        error: data.error
      });
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        lastPing: Date.now(),
        error: error instanceof Error ? error.message : 'Connection test failed'
      });
    }
  };

  const handleCreateSession = async (config: SessionConfig) => {
    setIsLoading(true);
    setSessionConfig(config);

    try {
      const state = JSON.parse(config.initialState);
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: config.userId,
          sessionId: config.sessionId,
          state
        })
      });

      const data = await response.json();
      
      if (data.apiCall) {
        setApiCalls(prev => [data.apiCall, ...prev]);
      }
      
      if (!data.success) {
        throw new Error(data.error);
      }

      setIsSessionActive(true);
      setSessionState(state);
      setConnectionStatus(prev => ({ ...prev, isConnected: true, error: undefined }));
    } catch (error) {
      setIsSessionActive(false);
      setConnectionStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Session creation failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionConfig || !isSessionActive) return;

    setIsLoading(true);
    setBotMessage(''); // Clear previous bot message

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionConfig.userId,
          sessionId: sessionConfig.sessionId,
          message
        })
      });

      const data = await response.json();

      if (data.apiCall) {
        setApiCalls(prev => [data.apiCall, ...prev]);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      // Set bot message to trigger update in ChatInterface
      if (data.botMessage) {
        setBotMessage(data.botMessage);
      }

    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Message send failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chatbot Session Debugger
          </h1>
          <p className="text-gray-600">
            Create sessions, send messages, and debug API interactions with Google's SDK
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1">
            <SessionPanel
              onCreateSession={handleCreateSession}
              isLoading={isLoading}
            />
          </div>

          <div className="lg:col-span-1">
            <ChatInterface
              userId={sessionConfig?.userId || ''}
              sessionId={sessionConfig?.sessionId || ''}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isSessionActive={isSessionActive}
              botMessage={botMessage}
            />
          </div>

          <div className="lg:col-span-1">
            <DebugPanel
              apiCalls={apiCalls}
              connectionStatus={connectionStatus}
              sessionState={sessionState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}