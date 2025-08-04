'use client';

import React, { useState } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { SignJWT } from 'jose';

export default function Home() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [responseData, setResponseData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('user123');

  const generateTestToken = async () => {
    // Generate a properly signed JWT token using the specified user ID
    const secret = new TextEncoder().encode('YOUR_JWT_SECRET');
    
    try {
      const token = await new SignJWT({
        user_id: userId || 'user123',
        iss: 'navi-health-assistant'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      setBearerToken(token);
    } catch (error) {
      console.error('Error generating token:', error);
    }
  };

  const handleSendMessage = async (messages: any[]) => {
    // Get the latest user message
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
    if (!latestUserMessage) {
      setError('No user message found');
      return;
    }

    if (!bearerToken.trim()) {
      setError('Please enter a Bearer Token');
      return;
    }

    setIsLoading(true);
    setResponseData([]);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken.trim()}`
        },
        body: JSON.stringify({
          message: latestUserMessage.content,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMessage = '';

        // Create initial assistant message
        const assistantId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        
        // Initialize the assistant message
        setResponseData([{
          id: assistantId,
          content: {
            parts: [{ text: '' }]
          },
          role: 'assistant',
          timestamp: Date.now(),
          streaming: true
        }]);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'chunk' && data.content) {
                  assistantMessage += data.content;
                  // Update the existing streaming message
                  setResponseData(prevData => {
                    const updatedData = [...prevData];
                    const messageIndex = updatedData.findIndex(msg => msg.id === assistantId);
                    
                    if (messageIndex !== -1) {
                      updatedData[messageIndex] = {
                        ...updatedData[messageIndex],
                        content: {
                          parts: [{ text: assistantMessage }]
                        },
                        streaming: true
                      };
                    }
                    
                    return updatedData;
                  });
                } else if (data.type === 'complete') {
                  // Mark message as complete
                  setResponseData(prevData => {
                    const updatedData = [...prevData];
                    const messageIndex = updatedData.findIndex(msg => msg.id === assistantId);
                    
                    if (messageIndex !== -1) {
                      updatedData[messageIndex] = {
                        ...updatedData[messageIndex],
                        content: {
                          parts: [{ text: assistantMessage }]
                        },
                        streaming: false
                      };
                    }
                    
                    return updatedData;
                  });
                } else if (data.type === 'options' && data.options) {
                  console.log('Received options:', data.options);
                  // Update the existing message with options
                  setResponseData(prevData => {
                    const updatedData = [...prevData];
                    const messageIndex = updatedData.findIndex(msg => msg.id === assistantId);
                    
                    if (messageIndex !== -1) {
                      updatedData[messageIndex] = {
                        ...updatedData[messageIndex],
                        options: data.options
                      };
                    }
                    
                    return updatedData;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setError(null);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Health Assistant Chat</h1>
          <div className="flex items-center space-x-4">
            {!isSessionActive ? (
              <button
                onClick={handleStartSession}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Start Chat
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                End Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User ID Input */}
      {isSessionActive && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* User ID Input */}
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter User ID..."
                />
                <button
                  onClick={generateTestToken}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Generate Token
                </button>
              </div>
            </div>

            {/* Bearer Token Display */}
            <div>
              <label className="block text-sm font-medium mb-2">Bearer Token</label>
              <textarea
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs resize-none"
                placeholder="Enter your Bearer Token or generate one above..."
                rows={3}
              />
              {bearerToken && (
                <div className="mt-2 text-xs text-gray-400">
                  Token generated for user: <span className="text-green-400 font-medium">{userId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)] max-w-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {isSessionActive ? (
            <ChatInterface
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isSessionActive={isSessionActive}
              responseData={responseData}
              error={error || undefined}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Health Assistant Chat</h2>
                <p className="text-gray-400 mb-6">Start a chat session to begin conversing with the health assistant</p>
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}