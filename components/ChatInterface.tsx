'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Trash2, Download, Copy } from 'lucide-react';
import { Message, ChatSession } from '../types';
import { storageService } from '../lib/storage';

interface ChatInterfaceProps {
  userId: string;
  sessionId: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isSessionActive: boolean;
  botMessage?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  sessionId,
  onSendMessage,
  isLoading,
  isSessionActive,
  botMessage
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId && sessionId) {
      const session = storageService.getChatSession(userId, sessionId);
      setMessages(session?.messages || []);
    }
  }, [userId, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (botMessage) {
      addBotMessage(botMessage);
    }
  }, [botMessage]);

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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveSession(updatedMessages);
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

    setMessages(prev => {
      const updatedMessages = [...prev, botMessage];
      saveSession(updatedMessages);
      return updatedMessages;
    });
  };

  const saveSession = (msgs: Message[]) => {
    if (!userId || !sessionId) return;
    
    const session: ChatSession = {
      userId,
      sessionId,
      messages: msgs,
      createdAt: Date.now()
    };
    storageService.saveChatSession(session);
  };

  const clearChatHistory = () => {
    setMessages([]);
    if (userId && sessionId) {
      storageService.clearChatSession(userId, sessionId);
    }
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

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Chat Interface</h2>
          {isSessionActive && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportChatHistory}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Export chat history"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearChatHistory}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isSessionActive ? (
              <p>No messages yet. Start a conversation!</p>
            ) : (
              <p>Create a session to start chatting</p>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg relative group ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  <button
                    onClick={() => copyMessageToClipboard(msg.content)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                      msg.role === 'user' ? 'hover:bg-blue-700' : 'hover:bg-gray-200'
                    }`}
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSessionActive ? "Type your message... (Enter to send, Shift+Enter for new line)" : "Create a session first"}
            disabled={!isSessionActive || isLoading}
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isSessionActive || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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