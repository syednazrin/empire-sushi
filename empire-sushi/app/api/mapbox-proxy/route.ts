import { NextRequest, NextResponse } from 'next/server';

// Server-side Mapbox token (never exposed to client)
// Falls back to NEXT_PUBLIC if server-side token not set (for backwards compatibility)
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('MAPBOX_TOKEN is not set in environment variables');
}

// Allowed Mapbox domains for security
const ALLOWED_DOMAINS = [
  'api.mapbox.com',
  'tiles.mapbox.com',
  'a.tiles.mapbox.com',
  'b.tiles.mapbox.com',
  'c.tiles.mapbox.com',
  'd.tiles.mapbox.com',
  'events.mapbox.com',
];

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
    
    // Security: Validate that the URL is actually a Mapbox URL
    const urlObj = new URL(decodedUrl);
    const hostname = urlObj.hostname;
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      console.warn(`Blocked request to unauthorized domain: ${hostname}`);
      return NextResponse.json(
        { error: 'Unauthorized domain' },
        { status: 403, headers: corsHeaders() }
      );
    }

    // Always use server token: normalize URL and set access_token so client never needs the real token
    urlObj.searchParams.set('access_token', MAPBOX_TOKEN);
    const urlWithToken = urlObj.toString();

    const response = await fetch(urlWithToken, {
      // Forward relevant headers
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Empire-Sushi-Proxy',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Mapbox proxy error: ${response.status} for ${urlWithToken}`);
      return NextResponse.json(
        { error: `Failed to fetch from Mapbox: ${response.statusText}` },
        { status: response.status, headers: corsHeaders() }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    // Determine cache duration based on content type
    let cacheControl = 'public, max-age=86400'; // 24 hours default
    if (contentType.includes('application/json')) {
      cacheControl = 'public, max-age=3600'; // 1 hour for JSON (styles, etc.)
    } else if (contentType.includes('image') || contentType.includes('vector')) {
      cacheControl = 'public, max-age=604800, immutable'; // 7 days for tiles (immutable)
    }

    return new NextResponse(data, {
      headers: {
        ...corsHeaders(),
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Proxied-By': 'Empire-Sushi-Server',
      },
    });
  } catch (error) {
    console.error('Error in Mapbox proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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
