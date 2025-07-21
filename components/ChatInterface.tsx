'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Trash2, Download, Copy, ArrowRight, Zap, User, Bot, Code } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  userId: string;
  sessionId: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isSessionActive: boolean;
  botMessage?: string;
  responseData?: any[]; // Full response array from the API
  error?: string; // Error message to display
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  sessionId,
  onSendMessage,
  isLoading,
  isSessionActive,
  botMessage,
  responseData,
  error
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (responseData && responseData.length > 0) {
      // Process the full response array to handle multiple agents
      processMultiAgentResponse(responseData);
    } else if (botMessage) {
      addBotMessage(botMessage);
    }
  }, [responseData, botMessage]);

  const processMultiAgentResponse = (responseArray: any[]) => {
    const newMessages: Message[] = [];
    
    responseArray.forEach((response, index) => {
      if (response.content?.parts) {
        // Handle messages with parts (text, function calls, etc.)
        const textParts = response.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('');
        
        if (textParts.trim()) {
          const message: Message = {
            id: response.id || `msg-${Date.now()}-${index}`,
            role: 'assistant',
            content: textParts,
            timestamp: response.timestamp || Date.now(),
            parts: response.content.parts,
            author: response.author,
            invocationId: response.invocationId,
            actions: response.actions,
            customMetadata: response.customMetadata,
            usageMetadata: response.usageMetadata
          };
          newMessages.push(message);
        }
      } else if (response.content?.functionResponse) {
        // Handle function responses
        const message: Message = {
          id: response.id || `func-${Date.now()}-${index}`,
          role: 'assistant',
          content: `Function ${response.content.functionResponse.name} completed`,
          timestamp: response.timestamp || Date.now(),
          parts: [{ functionResponse: response.content.functionResponse }],
          author: response.author,
          invocationId: response.invocationId
        };
        newMessages.push(message);
      }
    });

    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isSessionActive) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    onSendMessage(trimmedMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addBotMessage = (content: string) => {
    const botMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'assistant',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const clearChatHistory = () => {
    setMessages([]);
  };

  const exportChatHistory = () => {
    const chatData = {
      userId,
      sessionId,
      messages,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${userId}-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessageContent = (msg: Message) => {
    return (
      <div className="space-y-2">
        {/* Main text content */}
        <p className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere hyphens-auto" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
        
        {/* Function calls */}
        {msg.parts?.map((part, index) => {
          if (part.functionCall) {
            return (
              <div key={index} className="bg-blue-900/50 border border-blue-700 rounded p-2 mt-2 min-w-0">
                <div className="flex items-center gap-2 text-blue-300 font-medium text-xs">
                  <Code className="w-3 h-3" />
                  Function Call: {part.functionCall.name}
                </div>
                <pre className="text-xs text-blue-200 mt-1 overflow-x-auto break-words whitespace-pre-wrap">
                  {JSON.stringify(part.functionCall.args, null, 2)}
                </pre>
              </div>
            );
          }
          if (part.functionResponse) {
            return (
              <div key={index} className="bg-green-900/50 border border-green-700 rounded p-2 mt-2 min-w-0">
                <div className="flex items-center gap-2 text-green-300 font-medium text-xs">
                  <ArrowRight className="w-3 h-3" />
                  Function Response: {part.functionResponse.name}
                </div>
                <pre className="text-xs text-green-200 mt-1 overflow-x-auto break-words whitespace-pre-wrap">
                  {JSON.stringify(part.functionResponse.response, null, 2)}
                </pre>
              </div>
            );
          }
          return null;
        })}

        {/* Agent transfer */}
        {msg.actions?.transferToAgent && (
          <div className="bg-purple-900/50 border border-purple-700 rounded p-2 mt-2 min-w-0">
            <div className="flex items-center gap-2 text-purple-300 font-medium text-xs">
              <ArrowRight className="w-3 h-3" />
              Transferred to: {msg.actions.transferToAgent}
            </div>
          </div>
        )}

        {/* State changes */}
        {msg.actions?.stateDelta && Object.keys(msg.actions.stateDelta).length > 0 && (
          <div className="bg-yellow-900/50 border border-yellow-700 rounded p-2 mt-2 min-w-0">
            <div className="flex items-center gap-2 text-yellow-300 font-medium text-xs">
              <Zap className="w-3 h-3" />
              State Updated
            </div>
            <pre className="text-xs text-yellow-200 mt-1 overflow-x-auto break-words whitespace-pre-wrap">
              {JSON.stringify(msg.actions.stateDelta, null, 2)}
            </pre>
          </div>
        )}

        {/* Agent info */}
        {msg.author && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Bot className="w-3 h-3" />
            {msg.author}
            {msg.invocationId && (
              <span className="text-gray-500">({msg.invocationId.slice(0, 8)}...)</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Chat Session</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>User: {userId}</span>
                <span>•</span>
                <span>Session: {sessionId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChatHistory}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={exportChatHistory}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
              title="Export chat history"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">!</span>
              </div>
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-2">
              Please check if the backend service is running and properly configured.
            </p>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 w-full ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] min-w-0 rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    {renderMessageContent(msg)}
                  </div>
                  <button
                    onClick={() => copyMessageToClipboard(msg.content)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex gap-3 min-w-0">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
            rows={1}
            disabled={!isSessionActive || isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isSessionActive || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};