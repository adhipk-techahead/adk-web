import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:8000';
const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
  'User-Agent': 'EchoapiRuntime/1.1.0'
};

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, state } = await request.json();

    if (!userId || !sessionId || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, or state' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const apiUrl = `${API_BASE_URL}/apps/multi_tool_agent/users/${userId}/sessions/${sessionId}`;
    
    const apiRequest = {
      method: 'POST',
      url: apiUrl,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify( {...state} ),
      timestamp: startTime
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ ...state })
    });

    const responseBody = await response.json();
    const duration = Date.now() - startTime;

    const apiResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      timestamp: Date.now()
    };

    const apiCall = {
      id: Math.random().toString(36).substring(2, 15),
      request: apiRequest,
      response: apiResponse,
      duration
    };

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        apiCall
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: responseBody,
      apiCall
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      apiCall: {
        id: Math.random().toString(36).substring(2, 15),
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/apps/agents/users/*/sessions/*`,
          headers: DEFAULT_HEADERS,
          timestamp: Date.now()
        },
        error: errorMessage,
        duration: 0
      }
    }, { status: 500 });
  }
}