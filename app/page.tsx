'use client';

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { DebugPanel } from '../components/DebugPanel';
import { SessionConfig, ApiCall, ConnectionStatus } from '../types';
import template from '../template.json'; // This will work if using next/dynamic import or require, but for client-side, use fetch

interface StateVariable {
  key: string;
  value: string;
}

export default function Home() {
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionState, setSessionState] = useState<Record<string, any>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState<SessionConfig>({
    userId: 'u_123',
    sessionId: 's_123',
    appName: 'multi_tool_agent',
    initialState: '{}'
  });
  const [stateVariables, setStateVariables] = useState<StateVariable[]>([
    { key: 'health_assessment_status', value: 'not_started' },
    { key: 'hipaa_accepted', value: '' },
    { key: 'health_assessment', value: '' },
    { key: 'last_assesment_question', value: '' }
  ]);

  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [responseData, setResponseData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch('/template.json');
        if (!res.ok) throw new Error('Failed to load template.json');
        const data = await res.json();
        setNewSessionData((prev) => ({
          ...prev,
          userId: data.userId || 'u_123',
          appName: data.appName || 'multi_tool_agent',
        }));
        if (data.state && typeof data.state === 'object') {
          setStateVariables(
            Object.entries(data.state).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : JSON.stringify(value)
            }))
          );
        }
      } catch (e) {
        // fallback to defaults
      }
    }
    loadTemplate();
  }, []);

  // Add new state variable
  const addStateVariable = () => {
    setStateVariables([...stateVariables, { key: '', value: '' }]);
  };

  // Update state variable
  const updateStateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...stateVariables];
    updated[index][field] = value;
    setStateVariables(updated);
  };

  // Remove state variable
  const removeStateVariable = (index: number) => {
    setStateVariables(stateVariables.filter((_, i) => i !== index));
  };

  // Generate JSON from state variables
  const generateStateJson = () => {
    const stateObject: Record<string, any> = {};
    stateVariables.forEach(({ key, value }) => {
      if (key.trim()) {
        try {
          stateObject[key.trim()] = JSON.parse(value);
        } catch {
          stateObject[key.trim()] = value;
        }
      }
    });
    return JSON.stringify(stateObject, null, 2);
  };

  const handleCreateSession = async () => {
    // Convert state variables to JSON
    const stateObject: Record<string, any> = {};
    stateVariables.forEach(({ key, value }) => {
      if (key.trim()) {
        // Try to parse as JSON, otherwise use as string
        try {
          stateObject[key.trim()] = JSON.parse(value);
        } catch {
          stateObject[key.trim()] = value;
        }
      }
    });

    const initialStateJson = JSON.stringify(stateObject, null, 2);

    // Generate default values if not provided
    const sessionData = {
      userId: newSessionData.userId || 'u_123',
      sessionId: newSessionData.sessionId || 's_123',
      appName: newSessionData.appName || 'multi_tool_agent',
      initialState: initialStateJson
    };

    console.log('Creating session with data:', sessionData);

    try {
      // Call the session creation API
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionData.userId,
          sessionId: sessionData.sessionId,
          appName: sessionData.appName,
          state: JSON.parse(sessionData.initialState) || {}
        })
      });

      const apiData = await response.json();

      if (!apiData.success) {
        console.error('Session creation error:', apiData.error, apiData.details);
        throw new Error(apiData.error || 'Failed to create session');
      }

      console.log('Session created successfully:', apiData);

      // Set session config in memory
      setSessionConfig(sessionData);
      setIsSessionActive(true);
      setError(null);
      
      // Try to parse the initial state
      try {
        const state = JSON.parse(sessionData.initialState);
        setSessionState(state);
      } catch {
        console.warn('Invalid session state JSON');
      }

      // Reset form and close modal
      setNewSessionData({
        userId: 'u_123',
        sessionId: 's_123',
        appName: 'multi_tool_agent',
        initialState: '{}'
      });
      setStateVariables([
        { key: 'health_assessment_status', value: 'not_started' },
        { key: 'hipaa_accepted', value: '' },
        { key: 'health_assessment', value: '' },
        { key: 'last_assesment_question', value: '' }
      ]);
      setShowCreateModal(false);

    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEndSession = () => {
    setSessionConfig(null);
    setIsSessionActive(false);
    setSessionState({});
    setError(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionConfig) return;

    setIsLoading(true);
    setResponseData([]);
    setError(null);

    const apiCall: ApiCall = {
      id: Math.random().toString(36).substring(2, 15),
      request: {
        method: 'POST',
        url: '/api/chat',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: sessionConfig.userId,
          sessionId: sessionConfig.sessionId,
          appName: sessionConfig.appName,
          state: sessionState || {}
        }),
        timestamp: Date.now()
      },
      duration: 0
    };

    setApiCalls(prev => [apiCall, ...prev]);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId: sessionConfig.userId,
          sessionId: sessionConfig.sessionId,
          appName: sessionConfig.appName,
          state: sessionState || {}
        })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      apiCall.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: JSON.stringify(data),
        timestamp: Date.now()
      };
      apiCall.duration = duration;

      setApiCalls(prev => prev.map(call => call.id === apiCall.id ? apiCall : call));

      if (data.success && data.data) {
        // Update session state if provided in response
        if (data.data.state) {
          setSessionState(data.data.state);
        }
        
        // Handle full response array for multi-agent support
        if (data.fullResponse && Array.isArray(data.fullResponse)) {
          setResponseData(data.fullResponse);
        }
      } else if (!data.success) {
        console.error('Chat API error:', data.error, data.details);
        setError(data.error || 'Failed to send message');
        return;
      }

      setConnectionStatus({ isConnected: true });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      apiCall.error = errorMessage;
      setApiCalls(prev => prev.map(call => call.id === apiCall.id ? apiCall : call));
      setConnectionStatus({ isConnected: false, error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Multi-Agent Chat Interface</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDebugPanelOpen(!debugPanelOpen)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              {debugPanelOpen ? 'Hide' : 'Show'} Debug
            </button>
            {!isSessionActive ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Create Session
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] max-w-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {isSessionActive && sessionConfig ? (
            <ChatInterface
              userId={sessionConfig.userId}
              sessionId={sessionConfig.sessionId}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isSessionActive={isSessionActive}
              responseData={responseData}
              error={error || undefined}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to Multi-Agent Chat</h2>
                <p className="text-gray-400 mb-6">Create a session to start chatting with agents</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        {debugPanelOpen && (
          <div className="w-80 sm:w-96 min-w-0 border-l border-gray-700">
            <DebugPanel
              apiCalls={apiCalls}
              connectionStatus={connectionStatus}
              sessionState={sessionState}
              responseMetadata={null}
            />
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User ID</label>
                <input
                  type="text"
                  value={newSessionData.userId}
                  onChange={(e) => setNewSessionData({...newSessionData, userId: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  placeholder="u_123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session ID</label>
                <input
                  type="text"
                  value={newSessionData.sessionId}
                  onChange={(e) => setNewSessionData({...newSessionData, sessionId: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  placeholder="s_123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">App Name</label>
                <input
                  type="text"
                  value={newSessionData.appName}
                  onChange={(e) => setNewSessionData({...newSessionData, appName: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  placeholder="multi_tool_agent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Initial State Variables</label>
                <div className="space-y-2">
                  {stateVariables.map((variable, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={variable.key}
                        onChange={(e) => updateStateVariable(index, 'key', e.target.value)}
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="Key"
                      />
                      <input
                        type="text"
                        value={variable.value}
                        onChange={(e) => updateStateVariable(index, 'value', e.target.value)}
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => removeStateVariable(index)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addStateVariable}
                    className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded border border-dashed border-gray-600"
                  >
                    + Add Variable
                  </button>
                </div>
                <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                  <strong>Generated JSON:</strong>
                  <pre className="mt-1 text-green-400">{generateStateJson()}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}