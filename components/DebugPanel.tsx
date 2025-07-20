'use client';

import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronRight, Copy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ApiCall, ConnectionStatus } from '../types';

interface DebugPanelProps {
  apiCalls: ApiCall[];
  connectionStatus: ConnectionStatus;
  sessionState: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  apiCalls,
  connectionStatus,
  sessionState
}) => {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'session' | 'status'>('api');

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400) return 'text-red-600';
    return 'text-yellow-600';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Bug className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Debug Panel</h2>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'api'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            API Calls ({apiCalls.length})
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'session'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Session State
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'status'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Connection
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'api' && (
          <div className="space-y-3">
            {apiCalls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No API calls made yet</p>
            ) : (
              apiCalls.map((call) => (
                <div key={call.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCall === call.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">{call.request.method}</span>
                      <span className="text-gray-600 text-sm truncate">
                        {call.request.url.replace('http://localhost:8000', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.error ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : call.response ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={`text-sm ${getStatusColor(call.response?.status)}`}>
                        {call.response?.status || 'Pending'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(call.duration)}
                      </span>
                    </div>
                  </button>

                  {expandedCall === call.id && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Request</h4>
                            <button
                              onClick={() => copyToClipboard(formatJson(call.request))}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy request"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                            {formatJson(call.request)}
                          </pre>
                        </div>

                        {call.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">Response</h4>
                              <button
                                onClick={() => copyToClipboard(formatJson(call.response))}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                title="Copy response"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                              {formatJson(call.response)}
                            </pre>
                          </div>
                        )}

                        {call.error && (
                          <div>
                            <h4 className="font-medium text-red-700 mb-2">Error</h4>
                            <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700 text-sm">
                              {call.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'session' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Current Session State</h3>
              <button
                onClick={() => copyToClipboard(formatJson(sessionState))}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title="Copy session state"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg border text-sm overflow-x-auto">
              {formatJson(sessionState)}
            </pre>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {connectionStatus.lastPing && (
              <div>
                <span className="text-sm text-gray-600">Last ping: </span>
                <span className="text-sm">{formatTimestamp(connectionStatus.lastPing)}</span>
              </div>
            )}

            {connectionStatus.error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm">{connectionStatus.error}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>API Base URL: http://localhost:8000</p>
              <p>User Agent: EchoapiRuntime/1.1.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};