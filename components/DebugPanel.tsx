'use client';

import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronRight, Copy, AlertCircle, CheckCircle, Clock, MessageSquare, BarChart3, Settings, Zap, Terminal, Activity } from 'lucide-react';
import { ApiCall, ConnectionStatus, ResponseMetadata } from '../types';

interface DebugPanelProps {
  apiCalls: ApiCall[];
  connectionStatus: ConnectionStatus;
  sessionState: any;
  responseMetadata: ResponseMetadata | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  apiCalls,
  connectionStatus,
  sessionState,
  responseMetadata
}) => {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'session' | 'status' | 'metadata'>('api');
  const [expandedMetadataSection, setExpandedMetadataSection] = useState<string | null>(null);

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
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400) return 'text-red-400';
    return 'text-yellow-400';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTokenUsage = (usageData: any) => {
    if (!usageData) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Total:</span>
          <span className="text-gray-200 font-mono">{usageData.total_token_count || usageData.totalTokenCount || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Prompt:</span>
          <span className="text-gray-200 font-mono">{usageData.prompt_token_count || usageData.promptTokenCount || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Response:</span>
          <span className="text-gray-200 font-mono">{usageData.candidates_token_count || usageData.candidatesTokenCount || 'N/A'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('api')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'api'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          API ({apiCalls.length})
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'metadata'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Data {responseMetadata ? '✓' : ''}
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'session'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          State
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'status'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Status
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'metadata' && (
          <div className="p-3 space-y-3">
            {!responseMetadata ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-xs">No response data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Usage Statistics */}
                {(responseMetadata.usageMetadata || responseMetadata.customMetadata?.opik_usage) && (
                  <div className="border border-gray-600 rounded">
                    <button
                      onClick={() => setExpandedMetadataSection(expandedMetadataSection === 'usage' ? null : 'usage')}
                      className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-medium text-white">Token Usage</span>
                      </div>
                      {expandedMetadataSection === 'usage' ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    
                    {expandedMetadataSection === 'usage' && (
                      <div className="border-t border-gray-600 p-2 bg-gray-700">
                        <div className="space-y-2">
                          {responseMetadata.usageMetadata && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-300 mb-1">Usage Metadata</h4>
                              {formatTokenUsage(responseMetadata.usageMetadata)}
                            </div>
                          )}
                          {responseMetadata.customMetadata?.opik_usage && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-300 mb-1">Opik Usage</h4>
                              {formatTokenUsage(responseMetadata.customMetadata.opik_usage)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Model Information */}
                {responseMetadata.customMetadata && (
                  <div className="border border-gray-600 rounded">
                    <button
                      onClick={() => setExpandedMetadataSection(expandedMetadataSection === 'model' ? null : 'model')}
                      className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-green-400" />
                        <span className="text-xs font-medium text-white">Model Info</span>
                      </div>
                      {expandedMetadataSection === 'model' ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    
                    {expandedMetadataSection === 'model' && (
                      <div className="border-t border-gray-600 p-2 bg-gray-700">
                        <div className="space-y-1">
                          {responseMetadata.customMetadata.provider && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Provider:</span>
                              <span className="text-gray-200 font-mono">{responseMetadata.customMetadata.provider}</span>
                            </div>
                          )}
                          {responseMetadata.customMetadata.model_version && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Version:</span>
                              <span className="text-gray-200 font-mono">{responseMetadata.customMetadata.model_version}</span>
                            </div>
                          )}
                          {responseMetadata.author && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Author:</span>
                              <span className="text-gray-200 font-mono">{responseMetadata.author}</span>
                            </div>
                          )}
                          {responseMetadata.invocationId && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Invocation:</span>
                              <span className="text-gray-200 font-mono text-xs">{responseMetadata.invocationId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Agent Information */}
                {responseMetadata.fullResponse && Array.isArray(responseMetadata.fullResponse) && responseMetadata.fullResponse.length > 1 && (
                  <div className="border border-gray-600 rounded">
                    <button
                      onClick={() => setExpandedMetadataSection(expandedMetadataSection === 'agents' ? null : 'agents')}
                      className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span className="text-xs font-medium text-white">Multi-Agent ({responseMetadata.fullResponse.length})</span>
                      </div>
                      {expandedMetadataSection === 'agents' ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    
                    {expandedMetadataSection === 'agents' && (
                      <div className="border-t border-gray-600 p-2 bg-gray-700">
                        <div className="space-y-2">
                          {responseMetadata.fullResponse.map((agentResponse, index) => (
                            <div key={index} className="border border-gray-500 rounded p-2 bg-gray-800">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-white">
                                    Agent {index + 1}
                                  </span>
                                  {agentResponse.author && (
                                    <span className="px-1 py-0.5 bg-blue-900 text-blue-300 text-xs rounded">
                                      {agentResponse.author.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                {agentResponse.actions?.transferToAgent && (
                                  <span className="px-1 py-0.5 bg-purple-900 text-purple-300 text-xs rounded">
                                    → {agentResponse.actions.transferToAgent}
                                  </span>
                                )}
                              </div>
                              
                              {agentResponse.content?.parts && (
                                <div className="space-y-1">
                                  {agentResponse.content.parts.map((part: any, partIndex: number) => (
                                    <div key={partIndex}>
                                      {part.text && (
                                        <p className="text-xs text-gray-300">{part.text}</p>
                                      )}
                                      {part.functionCall && (
                                        <div className="bg-blue-900/50 border border-blue-700 rounded p-1 mt-1">
                                          <div className="text-xs font-medium text-blue-300">
                                            Function: {part.functionCall.name}
                                          </div>
                                          <pre className="text-xs text-blue-200 mt-1 overflow-x-auto">
                                            {JSON.stringify(part.functionCall.args, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                      {part.functionResponse && (
                                        <div className="bg-green-900/50 border border-green-700 rounded p-1 mt-1">
                                          <div className="text-xs font-medium text-green-300">
                                            Response: {part.functionResponse.name}
                                          </div>
                                          <pre className="text-xs text-green-200 mt-1 overflow-x-auto">
                                            {JSON.stringify(part.functionResponse.response, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {agentResponse.invocationId && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {agentResponse.invocationId}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions & State */}
                {responseMetadata.actions && (
                  <div className="border border-gray-600 rounded">
                    <button
                      onClick={() => setExpandedMetadataSection(expandedMetadataSection === 'actions' ? null : 'actions')}
                      className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-white">Actions & State</span>
                      </div>
                      {expandedMetadataSection === 'actions' ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    
                    {expandedMetadataSection === 'actions' && (
                      <div className="border-t border-gray-600 p-2 bg-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-medium text-white">Actions Data</h4>
                          <button
                            onClick={() => copyToClipboard(formatJson(responseMetadata.actions))}
                            className="p-1 text-gray-400 hover:text-white"
                            title="Copy actions data"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="bg-gray-800 p-2 rounded border text-xs overflow-x-auto text-gray-200">
                          {formatJson(responseMetadata.actions)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Response */}
                <div className="border border-gray-600 rounded">
                  <button
                    onClick={() => setExpandedMetadataSection(expandedMetadataSection === 'full' ? null : 'full')}
                    className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Bug className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-medium text-white">Full Response</span>
                    </div>
                    {expandedMetadataSection === 'full' ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  
                  {expandedMetadataSection === 'full' && (
                    <div className="border-t border-gray-600 p-2 bg-gray-700">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium text-white">Complete Response Data</h4>
                        <button
                          onClick={() => copyToClipboard(formatJson(responseMetadata.fullResponse))}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Copy full response"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <pre className="bg-gray-800 p-2 rounded border text-xs overflow-x-auto max-h-40 text-gray-200">
                        {formatJson(responseMetadata.fullResponse)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="p-3 space-y-2">
            {apiCalls.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-xs">No API calls made yet</p>
            ) : (
              apiCalls.map((call) => (
                <div key={call.id} className="border border-gray-600 rounded">
                  <button
                    onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                    className="w-full p-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCall === call.id ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span className="text-xs font-medium text-white">{call.request.method}</span>
                      <span className="text-gray-400 text-xs truncate">
                        {call.request.url.replace('http://localhost:8000', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.error ? (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      ) : call.response ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-yellow-400" />
                      )}
                      <span className={`text-xs ${getStatusColor(call.response?.status)}`}>
                        {call.response?.status || 'Pending'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDuration(call.duration)}
                      </span>
                    </div>
                  </button>

                  {expandedCall === call.id && (
                    <div className="border-t border-gray-600 p-2 bg-gray-700">
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-medium text-white">Request</h4>
                            <button
                              onClick={() => copyToClipboard(formatJson(call.request))}
                              className="p-1 text-gray-400 hover:text-white"
                              title="Copy request"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <pre className="bg-gray-800 p-2 rounded border text-xs overflow-x-auto text-gray-200">
                            {formatJson(call.request)}
                          </pre>
                        </div>

                        {call.response && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-medium text-white">Response</h4>
                              <button
                                onClick={() => copyToClipboard(formatJson(call.response))}
                                className="p-1 text-gray-400 hover:text-white"
                                title="Copy response"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <pre className="bg-gray-800 p-2 rounded border text-xs overflow-x-auto text-gray-200">
                              {formatJson(call.response)}
                            </pre>
                          </div>
                        )}

                        {call.error && (
                          <div>
                            <h4 className="text-xs font-medium text-red-400 mb-1">Error</h4>
                            <div className="bg-red-900/20 p-2 rounded border border-red-700 text-red-300 text-xs">
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
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-white">Current Session State</h3>
              <button
                onClick={() => copyToClipboard(formatJson(sessionState))}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                title="Copy session state"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <pre className="bg-gray-700 p-2 rounded border text-xs overflow-x-auto text-gray-200">
              {formatJson(sessionState)}
            </pre>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs font-medium text-white">
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {connectionStatus.lastPing && (
              <div className="text-xs">
                <span className="text-gray-400">Last ping: </span>
                <span className="text-gray-200">{formatTimestamp(connectionStatus.lastPing)}</span>
              </div>
            )}

            {connectionStatus.error && (
              <div className="bg-red-900/20 p-2 rounded border border-red-700">
                <p className="text-red-300 text-xs">{connectionStatus.error}</p>
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