import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get the full URL that needs to be proxied
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Decode the URL and add the access token if not present
    const decodedUrl = decodeURIComponent(targetUrl);
    const urlWithToken = decodedUrl.includes('access_token=') 
      ? decodedUrl 
      : `${decodedUrl}${decodedUrl.includes('?') ? '&' : '?'}access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(urlWithToken);

    if (!response.ok) {
      console.error(`Mapbox proxy error: ${response.status} for ${urlWithToken}`);
      return NextResponse.json(
        { error: `Failed to fetch from Mapbox: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Determine content type from response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the response data
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in Mapbox proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
