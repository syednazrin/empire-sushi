import { NextRequest, NextResponse } from 'next/server';

// Hardcoded Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path?.length) {
      return NextResponse.json(
        { error: 'Missing path' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const pathSegment = path.join('/');
    const { searchParams } = request.nextUrl;
    const query = new URLSearchParams(searchParams);
    query.set('access_token', MAPBOX_TOKEN);
    const targetUrl = `https://api.mapbox.com/${pathSegment}?${query.toString()}`;

    const response = await fetch(targetUrl);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': contentType,
        'Cache-Control': response.ok ? 'public, max-age=86400' : 'no-store',
      },
    });
  } catch (error) {
    console.error('Mapbox path proxy error:', error);
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
