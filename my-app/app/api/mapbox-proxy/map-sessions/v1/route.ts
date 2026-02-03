import { NextRequest, NextResponse } from 'next/server';

// Hardcoded Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sku = searchParams.get('sku') ?? '';
    const targetUrl = `https://api.mapbox.com/map-sessions/v1?sku=${encodeURIComponent(sku)}&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(targetUrl);

    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Mapbox session proxy error:', error);
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
