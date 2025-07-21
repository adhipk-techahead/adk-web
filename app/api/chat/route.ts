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
    const { userId, sessionId, appName, message, state } = await request.json();

    console.log('API received:', { userId, sessionId, appName, message, state });

    if (!userId || !sessionId || !appName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, appName, or message' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const apiUrl = `${API_BASE_URL}/run`;
    
    const requestBody = {
      appName,
      userId,
      sessionId,
      newMessage: {
        role: 'user',
        parts: [{ text: message }]
      },
      state: state || {}
    };

    console.log('Sending to API:', JSON.stringify(requestBody, null, 2));

    const apiRequest = {
      method: 'POST',
      url: apiUrl,
      headers: DEFAULT_HEADERS,
      body: requestBody,
      timestamp: startTime
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(requestBody)
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    console.log('API response status:', response.status);
    console.log('API response body:', responseBody);

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
      console.error('Backend API error:', response.status, response.statusText, responseBody);
      
      // If it's a 500 error, provide a more helpful message
      if (response.status === 500) {
        return NextResponse.json({
          success: false,
          error: 'Backend service is currently unavailable. Please check if the backend server is running and properly configured.',
          details: responseBody,
          apiCall
        }, { status: 503 });
      }
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseBody,
        apiCall
      }, { status: response.status });
    }

    // Parse the response to extract structured data
    let botMessage = responseBody;
    let responseMetadata = null;
    let fullResponse = null;
    let updatedState = null;
    
    try {
      const responseData = JSON.parse(responseBody);
      
      // Handle array response format (like the user's example)
      if (Array.isArray(responseData) && responseData.length > 0) {
        fullResponse = responseData;
        
        // Extract text from all responses for backward compatibility
        const textParts = responseData
          .filter((resp: any) => resp.content?.parts)
          .map((resp: any) => 
            resp.content.parts
              .filter((part: any) => part.text)
              .map((part: any) => part.text)
              .join('')
          )
          .filter((text: string) => text.trim())
          .join('\n\n');
        
        botMessage = textParts || 'No text content found';
        
        // Extract state updates from responses
        const stateUpdates = responseData
          .filter((resp: any) => resp.actions?.stateDelta)
          .map((resp: any) => resp.actions.stateDelta);
        
        if (stateUpdates.length > 0) {
          updatedState = { ...state, ...Object.assign({}, ...stateUpdates) };
        }
        
        // Store metadata from the first response for developer interface
        const firstResponse = responseData[0];
        responseMetadata = {
          fullResponse: responseData,
          customMetadata: firstResponse.customMetadata,
          usageMetadata: firstResponse.usageMetadata,
          invocationId: firstResponse.invocationId,
          author: firstResponse.author,
          actions: firstResponse.actions,
          id: firstResponse.id,
          timestamp: firstResponse.timestamp
        };
      } else {
        // Fallback for other response formats
        botMessage = responseData.message || responseData.response || responseBody;
        fullResponse = responseData;
        updatedState = responseData.state || state;
      }
    } catch {
      // Use raw response if not JSON
      botMessage = responseBody;
    }

    return NextResponse.json({
      success: true,
      data: {
        message: botMessage,
        state: updatedState || state
      },
      botMessage,
      fullResponse,
      responseMetadata,
      apiCall
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', error);
    
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