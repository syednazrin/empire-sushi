import { NextRequest, NextResponse } from 'next/server';

// Use server-side token only — frontend requests tiles via this proxy, so token stays on server
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';

export async function GET(request: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: 'Mapbox token not configured (NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_TOKEN)' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    // Always use server token: strip any client token and append server token
    const urlObj = new URL(decodedUrl);
    urlObj.searchParams.set('access_token', MAPBOX_TOKEN);
    const urlWithToken = urlObj.toString();

    const response = await fetch(urlWithToken);

    if (!response.ok) {
      console.error(`Mapbox proxy error: ${response.status} for ${urlWithToken}`);
      return NextResponse.json(
        { error: `Failed to fetch from Mapbox: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
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
