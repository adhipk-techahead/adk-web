'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Trash2, Download, Copy, ArrowRight, Zap, User, Bot, Code, Wifi, WifiOff } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  onSendMessage: (messages: any[]) => void;
  isLoading: boolean;
  isSessionActive: boolean;
  botMessage?: string;
  responseData?: any[];
  error?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading,
  isSessionActive,
  botMessage,
  responseData,
  error
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (responseData && responseData.length > 0) {
      console.log('Processing responseData:', responseData);
      processStreamingResponse(responseData);
    } else if (botMessage) {
      console.log('Adding bot message:', botMessage);
      addBotMessage(botMessage);
    }
  }, [responseData, botMessage]);

  const processStreamingResponse = (responseArray: any[]) => {
    console.log('Processing streaming response:', responseArray);
    
    responseArray.forEach((response) => {
      if (response.content?.parts) {
        const textParts = response.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('');
        
        setMessages(prev => {
          const existingMessageIndex = prev.findIndex(msg => msg.id === response.id);
          
          if (existingMessageIndex !== -1) {
            // Update existing message
            const updated = [...prev];
            updated[existingMessageIndex] = {
              ...updated[existingMessageIndex],
              content: textParts,
              parts: response.content.parts,
              streaming: response.streaming,
              options: response.options,
              author: response.author,
              invocationId: response.invocationId,
              actions: response.actions,
              customMetadata: response.customMetadata,
              usageMetadata: response.usageMetadata
            };
            console.log('Updated existing message:', updated[existingMessageIndex]);
            return updated;
          } else {
            // Add new message if it doesn't exist
            const newMessage: Message = {
              id: response.id || `msg-${Date.now()}`,
              role: 'assistant',
              content: textParts,
              timestamp: response.timestamp || Date.now(),
              parts: response.content.parts,
              streaming: response.streaming,
              options: response.options,
              author: response.author,
              invocationId: response.invocationId,
              actions: response.actions,
              customMetadata: response.customMetadata,
              usageMetadata: response.usageMetadata
            };
            console.log('Adding new message:', newMessage);
            return [...prev, newMessage];
          }
        });
      }
    });
  };

  const handleOptionClick = (option: string) => {
    console.log('Option clicked:', option);
    
    // Create a user message with the selected option
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: option,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Send the option as a message
    const allMessages = messages.concat(userMessage).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    onSendMessage(allMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isSessionActive) return;

    console.log('Sending message:', trimmedMessage);

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      console.log('Added user message, updated messages:', updated);
      return updated;
    });
    setMessage('');

    console.log('Calling onSendMessage...');
    const allMessages = messages.concat(userMessage).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    onSendMessage(allMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addBotMessage = (content: string) => {
    console.log('Adding bot message with content:', content);
    
    setMessages(prev => {
      const botMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: 'assistant',
        content,
        timestamp: Date.now()
      };

      const updated = [...prev, botMessage];
      console.log('Updated messages after adding bot message:', updated);
      return updated;
    });
  };

  const clearChatHistory = () => {
    setMessages([]);
  };

  const exportChatHistory = () => {
    const chatData = {
      messages,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyMessageToClipboard = (msg: any) => {
    let content = '';
    if (msg.content?.parts) {
      content = msg.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('');
    } else if (typeof msg.content === 'string') {
      content = msg.content;
    }
    navigator.clipboard.writeText(content);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessageContent = (msg: any) => {
    let content = '';
    if (msg.content?.parts) {
      content = msg.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('');
    } else if (typeof msg.content === 'string') {
      content = msg.content;
    }

    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere hyphens-auto" style={{ wordBreak: 'break-word' }}>
          {content}
          {msg.streaming && (
            <span className="inline-flex items-center ml-1">
              <span className="animate-pulse">▋</span>
            </span>
          )}
        </p>
        
        {/* Render options as clickable bubbles */}
        {msg.options && msg.options.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {msg.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors duration-200 hover:scale-105 transform"
                disabled={isLoading}
              >
                {option}
              </button>
            ))}
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
              <h2 className="text-sm font-semibold text-white">Chat Interface</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Health Assistant</span>
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
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            console.log(`Rendering message ${index}:`, msg);
            return (
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
                      onClick={() => copyMessageToClipboard(msg)}
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
            );
          })
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