import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get the tile coordinates and style info from query params
  const style = searchParams.get('style') || 'light-v11';
  const z = searchParams.get('z');
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const retina = searchParams.get('retina') === 'true' ? '@2x' : '';
  
  // If tile coordinates are provided, fetch vector tiles
  if (z && x && y) {
    const tileUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}${retina}.mvt?access_token=${MAPBOX_TOKEN}`;
    
    try {
      const response = await fetch(tileUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch tile' },
          { status: response.status }
        );
      }
      
      const data = await response.arrayBuffer();
      
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Error fetching Mapbox tile:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // If no tile coordinates, return style JSON
  const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/${style}?access_token=${MAPBOX_TOKEN}`;
  
  try {
    const response = await fetch(styleUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch style' },
        { status: response.status }
      );
    }
    
    const styleJson = await response.json();
    
    // Modify the style to use our proxy for tiles
    if (styleJson.sources) {
      Object.keys(styleJson.sources).forEach((sourceKey) => {
        const source = styleJson.sources[sourceKey];
        if (source.url) {
          // Replace Mapbox URLs with our proxy
          source.url = source.url.replace(
            'mapbox://',
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mapbox-proxy?style=${style}&`
          );
        }
        if (source.tiles) {
          source.tiles = source.tiles.map((tile: string) =>
            tile.replace(
              /https:\/\/[a-z]\.tiles\.mapbox\.com\/v4\/(.*?)\/{z}\/{x}\/{y}(.*?)\.mvt/,
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mapbox-proxy?style=${style}&z={z}&x={x}&y={y}`
            )
          );
        }
      });
    }
    
    return NextResponse.json(styleJson, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching Mapbox style:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
