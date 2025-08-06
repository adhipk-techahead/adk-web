import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://13.202.181.105:8002';
const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
  'User-Agent': 'EchoapiRuntime/1.1.0'
};

export async function POST(request: NextRequest) {
  try {
    const { message, stream = true } = await request.json();
    const authHeader = request.headers.get('Authorization');

    console.log('Chat API received:', { message, stream, authHeader: authHeader ? 'Bearer token present' : 'No auth header' });

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // Extract user_id from JWT token for the backend
    let userId = 'default_user';
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || 'default_user';
    } catch (e) {
      console.warn('Could not parse user_id from token, using default');
    }

    const apiUrl = `${API_BASE_URL}/chat`;
    
    const requestBody = {
      message: message,
      user_id: userId
    };

    console.log('Sending to API:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': authHeader
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status, response.statusText);
      return NextResponse.json({
        error: `HTTP ${response.status}: ${response.statusText}`
      }, { status: response.status });
    }

    if (stream && response.body) {
      // Stream the response back to the client
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } else {
      // Fallback to non-streaming response
      const responseData = await response.json();
      return NextResponse.json(responseData);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}