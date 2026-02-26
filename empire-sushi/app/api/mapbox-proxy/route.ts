import { NextRequest, NextResponse } from 'next/server';

// Hardcoded Mapbox token (tiles/styles proxied server-side)
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    // Always use server token: normalize URL and set access_token so client never needs the real token
    const urlObj = new URL(decodedUrl);
    urlObj.searchParams.set('access_token', MAPBOX_TOKEN);
    const urlWithToken = urlObj.toString();

    const response = await fetch(urlWithToken);

    if (!response.ok) {
      console.error(`Mapbox proxy error: ${response.status} for ${urlWithToken}`);
      return NextResponse.json(
        { error: `Failed to fetch from Mapbox: ${response.statusText}` },
        { status: response.status, headers: corsHeaders() }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        ...corsHeaders(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error in Mapbox proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
