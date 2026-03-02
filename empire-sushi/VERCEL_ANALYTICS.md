# Vercel Analytics Setup

Vercel Analytics and Speed Insights have been successfully integrated into your Empire Sushi application.

## What's Included

### 1. **Vercel Analytics** (`@vercel/analytics`)
Tracks user behavior and page views in real-time.

**Features:**
- Page views and unique visitors
- Traffic sources (referrers)
- Geographic distribution
- Device types (desktop, mobile, tablet)
- Browser and OS analytics
- Custom event tracking (can be added later)

### 2. **Speed Insights** (`@vercel/speed-insights`)
Monitors your application's performance from real users.

**Features:**
- Real User Monitoring (RUM)
- Core Web Vitals:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
- Performance scores
- Page-by-page breakdown

## Implementation

Both components have been added to `app/layout.tsx`:

```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Viewing Your Analytics

### Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **Empire Sushi** project
3. Click on the **Analytics** tab in the sidebar
4. You'll see real-time data once your deployment is live

### Speed Insights

1. In the same project dashboard
2. Click on **Speed Insights** tab
3. View Core Web Vitals and performance metrics

## Data Collection

- **Development**: Analytics are disabled in `localhost` by default
- **Production**: Automatically starts collecting data once deployed
- **Privacy**: Compliant with GDPR, no cookies required
- **Data Retention**: Varies by Vercel plan

## Advanced Features (Optional)

### Track Custom Events

You can track custom user interactions:

```tsx
import { track } from '@vercel/analytics';

// Track button clicks, form submissions, etc.
track('DistrictSelected', { district: 'Kuala Lumpur' });
track('ChartExpanded', { chartType: 'Female Gen Z' });
track('BrandFiltered', { brand: 'Empire Sushi' });
```

### Track Page Views (Already Automatic)

Page views are tracked automatically. No additional code needed.

### Filter by Environment

Analytics automatically separates:
- Production data
- Preview deployments
- Development (ignored)

## Dashboard Features

### Analytics Tab Shows:
- **Overview**: Total visitors, page views, bounce rate
- **Top Pages**: Most visited pages/routes
- **Referrers**: Where traffic comes from
- **Countries**: Geographic distribution
- **Devices**: Desktop vs Mobile vs Tablet
- **Browsers**: Chrome, Safari, Firefox, etc.

### Speed Insights Tab Shows:
- **Performance Score**: 0-100 rating
- **Core Web Vitals**: LCP, FID, CLS metrics
- **Page Performance**: Per-route breakdown
- **Historic Data**: Performance over time
- **Device Breakdown**: Desktop vs Mobile performance

## Pricing

- **Hobby Plan**: Basic analytics (current)
- **Pro Plan**: Advanced filtering, longer retention, custom events
- **Enterprise**: Unlimited data, team features

## Troubleshooting

### Not Seeing Data?

1. **Wait 5-10 minutes** after deployment
2. Visit your live site (not localhost)
3. Check that deployment was successful
4. Verify you're looking at the production environment

### Analytics Not Loading?

- Check browser console for errors
- Ensure ad blockers aren't blocking Vercel scripts
- Verify the packages are in `package.json`

### Performance Impact?

- **Minimal**: < 1KB added to bundle
- **Async Loading**: Doesn't block page render
- **Edge Optimized**: Served from Vercel's edge network

## Next Steps

1. ✅ Analytics and Speed Insights are now live
2. Visit your deployed site to generate initial data
3. Check Vercel Dashboard after 10-15 minutes
4. Consider adding custom event tracking for key user actions
5. Monitor Core Web Vitals to improve performance

## Resources

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Speed Insights Docs](https://vercel.com/docs/speed-insights)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)
