# Mapbox Server-Side Proxy

This application uses a server-side proxy to serve Mapbox tiles, protecting your API token from client-side exposure.

## Architecture

```
Client (Browser) → Next.js API Route (/api/mapbox-proxy) → Mapbox API
```

### How It Works

1. **Client-Side Request Interception**
   - The `transformRequest` function in `Slide3.tsx` intercepts all Mapbox requests
   - Any URL containing `mapbox.com` is redirected to `/api/mapbox-proxy?url=...`

2. **Server-Side Proxy**
   - The API route at `/app/api/mapbox-proxy/route.ts` receives the request
   - It validates the URL is from an allowed Mapbox domain (security)
   - Adds the real Mapbox token from server-side environment variables
   - Fetches the tiles/styles from Mapbox
   - Returns them to the client with appropriate caching headers

3. **Security Benefits**
   - API token never exposed in client-side code
   - Domain whitelist prevents proxy abuse
   - Request timeout prevents hanging connections
   - CORS headers properly configured

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Server-side token (recommended - not exposed to client)
MAPBOX_TOKEN="pk.your_mapbox_token_here"

# OR use the public variable (backwards compatible)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_token_here"
```

**Note**: Using `MAPBOX_TOKEN` (without `NEXT_PUBLIC_`) is more secure as it's only available server-side.

## Caching Strategy

The proxy implements intelligent caching:

- **Vector/Raster Tiles**: 7 days, immutable (tiles don't change)
- **JSON (styles, metadata)**: 1 hour (may be updated occasionally)
- **Other content**: 24 hours (default)

## Performance

- Tiles are cached by the browser based on `Cache-Control` headers
- Next.js may also cache responses at the edge (if deployed on Vercel)
- 10-second timeout prevents slow requests from hanging

## Allowed Domains

The proxy only forwards requests to these Mapbox domains:

- `api.mapbox.com` - API endpoints
- `tiles.mapbox.com` - Tile servers
- `a/b/c/d.tiles.mapbox.com` - CDN tile servers
- `events.mapbox.com` - Analytics (optional)

## Development vs Production

- **Development**: Requests go through `http://localhost:3000/api/mapbox-proxy`
- **Production**: Requests go through your domain's `/api/mapbox-proxy`

No code changes needed - the proxy automatically detects the origin.

## Troubleshooting

### Maps not loading

1. Check browser console for errors
2. Verify `MAPBOX_TOKEN` is set in `.env.local`
3. Check server logs for proxy errors
4. Ensure Mapbox token is valid and has appropriate scopes

### Slow tile loading

1. Check network tab - tiles should be cached after first load
2. Verify `Cache-Control` headers are present
3. Consider deploying to Vercel Edge for better performance

### 403 Forbidden errors

- The proxy blocked a non-Mapbox domain (security feature working correctly)
- Check that you're only requesting Mapbox resources

## Additional Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
