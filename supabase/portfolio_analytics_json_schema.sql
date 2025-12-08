-- Portfolio Analytics JSON Schema
-- This migration adds a JSONB column to store all analytics data in one place
-- The existing columns (view_count, leads, conversion_rate, domain, title, meta_description) are kept for backward compatibility

-- Add analytics_data JSONB column to portfolio_analytics table
ALTER TABLE portfolio_analytics
ADD COLUMN IF NOT EXISTS analytics_data JSONB DEFAULT '{}'::jsonb;

-- Create index on analytics_data for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_data ON portfolio_analytics USING GIN (analytics_data);

-- Add comment explaining the JSON structure
COMMENT ON COLUMN portfolio_analytics.analytics_data IS 'JSONB object storing all portfolio analytics data. Structure:
{
  "overview": {
    "totalViews": number,
    "uniqueVisitors": number,
    "appointmentsBooked": number,
    "avgTimeOnPage": number (minutes),
    "trends": {
      "totalViews": { "value": string, "direction": "up" | "down" },
      "uniqueVisitors": { "value": string, "direction": "up" | "down" },
      "appointmentsBooked": { "value": string, "direction": "up" | "down" },
      "avgTimeOnPage": { "value": string, "direction": "up" | "down" }
    }
  },
  "viewsOverTime": [
    {
      "month": string,
      "views": number,
      "uniqueVisitors": number
    }
  ],
  "trafficSources": [
    {
      "name": string,
      "value": number,
      "color": string
    }
  ],
  "mostViewedSections": [
    {
      "page": string,
      "views": number
    }
  ],
  "engagement": [
    {
      "day": string,
      "avgTime": number,
      "bounceRate": number
    }
  ],
  "visitorActions": {
    "ctaClicks": number,
    "formSubmissions": number,
    "socialShares": number,
    "contactRequests": number
  },
  "topLocations": [
    {
      "country": string,
      "flag": string,
      "percentage": number
    }
  ],
  "deviceBreakdown": [
    {
      "device": string,
      "icon": string,
      "percentage": number
    }
  ],
  "dateRange": string
}';

-- Example of how to query the JSON data:
-- SELECT analytics_data->'overview'->>'totalViews' as total_views FROM portfolio_analytics;
-- SELECT analytics_data->'mostViewedSections' FROM portfolio_analytics;
-- SELECT jsonb_array_elements(analytics_data->'viewsOverTime') FROM portfolio_analytics;

