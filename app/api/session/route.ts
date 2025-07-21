import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
  'User-Agent': 'EchoapiRuntime/1.1.0'
};

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, appName, state } = await request.json();

    console.log('Session API received:', { userId, sessionId, appName, state });

    if (!userId || !sessionId || !appName || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, appName, or state' },
        { status: 400 }
      );
    }
    const startTime = Date.now();
    const apiUrl = `${API_BASE_URL}/apps/${appName}/users/${userId}/sessions/${sessionId}`;
    
    const requestBody = state || {};
    
    console.log('Sending to session API:', { url: apiUrl, body: requestBody });

    const apiRequest = {
      method: 'POST',
      url: apiUrl,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(requestBody),
      timestamp: startTime
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(requestBody)
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    console.log('Session API response status:', response.status);
    console.log('Session API response body:', responseBody);

    let responseData;
    try {
      responseData = JSON.parse(responseBody);
    } catch {
      responseData = responseBody;
    }

    const apiResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData,
      timestamp: Date.now()
    };

    const apiCall = {
      id: Math.random().toString(36).substring(2, 15),
      request: apiRequest,
      response: apiResponse,
      duration
    };

    if (!response.ok) {
      console.error('Backend session API error:', response.status, response.statusText, responseBody);
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseBody,
        apiCall
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      apiCall
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Session API error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      apiCall: {
        id: Math.random().toString(36).substring(2, 15),
        request: {
          method: 'POST',
          url: `${API_BASE_URL}/apps/*/users/*/sessions/*`,
          headers: DEFAULT_HEADERS,
          timestamp: Date.now()
        },
        error: errorMessage,
        duration: 0
      }
    }, { status: 500 });
  }
}