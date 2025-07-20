'use client';

import React, { useState, useEffect } from 'react';
import { Play, Settings, Download, Upload, RefreshCw } from 'lucide-react';
import { SessionConfig } from '../types';
import { storageService } from '../lib/storage';

interface SessionPanelProps {
  onCreateSession: (config: SessionConfig) => void;
  isLoading: boolean;
}

const defaultJwtToken = `{
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIrMTkwODM3NjY1NTQiLCJhY2NvdW50X251bWJlciI6IlNSMjAyNTA2MDIxNDI5MzkiLCJsb2NhbGUiOiJlbi1VUyIsImV4cCI6MTc1MDA5NTg4MH0.J_pGZFwX491vhW7kKvUFxFc9iPgNc3akSxcZe0iu4FI"
}`;

export const SessionPanel: React.FC<SessionPanelProps> = ({ onCreateSession, isLoading }) => {
  const [userId, setUserId] = useState('u_123');
  const [sessionId, setSessionId] = useState('s_123');
  const [initialState, setInitialState] = useState(defaultJwtToken);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedConfig = storageService.getSessionConfig();
    if (savedConfig) {
      setUserId(savedConfig.userId);
      setSessionId(savedConfig.sessionId);
      setInitialState(savedConfig.initialState);
    }
  }, []);

  const handleCreateSession = () => {
    setError('');
    
    try {
      JSON.parse(initialState);
    } catch {
      setError('Invalid JSON in initial state');
      return;
    }

    if (!userId.trim() || !sessionId.trim()) {
      setError('User ID and Session ID are required');
      return;
    }

    const config: SessionConfig = {
      userId: userId.trim(),
      sessionId: sessionId.trim(),
      initialState
    };

    storageService.saveSessionConfig(config);
    onCreateSession(config);
  };

  const handleExportConfig = () => {
    const config: SessionConfig = { userId, sessionId, initialState };
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        setUserId(config.userId || 'u_123');
        setSessionId(config.sessionId || 's_123');
        setInitialState(config.initialState || defaultJwtToken);
        setError('');
      } catch {
        setError('Invalid configuration file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const generateNewIds = () => {
    setUserId(`u_${Math.random().toString(36).substring(2, 8)}`);
    setSessionId(`s_${Math.random().toString(36).substring(2, 8)}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Session Configuration</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
              Session ID
            </label>
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter session ID"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateNewIds}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New IDs
          </button>
        </div>

        <div>
          <label htmlFor="initialState" className="block text-sm font-medium text-gray-700 mb-2">
            Initial Session State (JSON)
          </label>
          <textarea
            id="initialState"
            value={initialState}
            onChange={(e) => setInitialState(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter initial session state as JSON"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Create Session
          </button>

          <button
            onClick={handleExportConfig}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};