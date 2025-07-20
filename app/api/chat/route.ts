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
    const { userId, sessionId, message } = await request.json();

    if (!userId || !sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, or message' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const apiUrl = `${API_BASE_URL}/run`;
    
    const requestBody = {
      appName: 'multi_tool_agent',
      userId,
      sessionId,
      newMessage: {
        role: 'user',
        parts: [{ text: message }]
      }
    };

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

    // Try to parse the response to extract bot message
    let botMessage = responseBody;
    try {
      const responseData = JSON.parse(responseBody);
      botMessage = responseData.message || responseData.response || responseBody;
    } catch {
      // Use raw response if not JSON
    }

    return NextResponse.json({
      success: true,
      data: responseBody,
      botMessage,
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
          url: `${API_BASE_URL}/run`,
          headers: DEFAULT_HEADERS,
          timestamp: Date.now()
        },
        error: errorMessage,
        duration: 0
      }
    }, { status: 500 });
  }
}