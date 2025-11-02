# Fix Public Portfolio Display

## Problem
The public portfolio page wasn't showing saved data because the database RLS (Row Level Security) policies were blocking public access to portfolio services, projects, testimonials, contact items, and social links.

## Solution
Run the SQL migration to add public read access for published portfolios.

## Steps to Fix

### 1. Run the SQL Migration in Supabase

Go to your Supabase dashboard → SQL Editor and run this file:
```
supabase/add_public_portfolio_policies.sql
```

Or copy/paste this SQL directly:

```sql
-- Add public SELECT policies for portfolio related tables
-- This allows public users to view services, projects, testimonials, contact items, and social links
-- for published portfolios

-- Public can view services for published portfolios
CREATE POLICY "Public can view services for published portfolios"
  ON portfolio_services FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Public can view projects for published portfolios
CREATE POLICY "Public can view projects for published portfolios"
  ON portfolio_projects FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Public can view testimonials for published portfolios
CREATE POLICY "Public can view testimonials for published portfolios"
  ON portfolio_testimonials FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Public can view contact items for published portfolios
CREATE POLICY "Public can view contact items for published portfolios"
  ON portfolio_contact_items FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Public can view social links for published portfolios
CREATE POLICY "Public can view social links for published portfolios"
  ON portfolio_social_links FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));
```

### 2. Test Your Portfolio

After running the SQL:

1. Go to Dashboard → Portfolio Builder
2. Customize your portfolio (add services, projects, testimonials, contact info)
3. Click "Publish Portfolio"
4. Visit your public URL (shown in the share modal)

### 3. What This Fixes

✅ Public visitors can now see ALL saved portfolio data including:
- Services you've added
- Projects with images
- Testimonials
- Contact information (email, phone, location, etc.)
- Social media links
- All custom text and images you saved

✅ The correct template is rendered based on what you selected (Aura, Minimalist, Shift, or Innovate)

✅ All images will load properly (both uploaded and external URLs)

## Technical Details

### What Changed

**Database (RLS Policies)**
- Added public SELECT policies for 5 tables that were previously owner-only
- Public users can now read data for published portfolios
- Draft portfolios remain private

**Server-Side Data Fetch**
- `/lib/portfolio.server.ts` now properly fetches all related data
- Simplified logic - no more mock fallbacks, uses real saved data
- Server-side rendering ensures fast load times

**Public Page**
- `/app/portfolio/[domain]/page.tsx` renders exact saved template
- `PortfolioPreview` component automatically selects correct template
- View counting still works via client-side increment

### How Data Flows

1. User visits `subdomain.jolix.io` (or `localhost:3000/portfolio/subdomain` in dev)
2. Middleware rewrites to `/portfolio/[domain]`
3. Server component fetches portfolio by domain
4. Server queries: analytics → portfolio → services/projects/testimonials/contact/social
5. Data is converted and passed to client wrapper
6. `PortfolioPreview` renders the correct template (Aura/Minimalist/Shift/Innovate)
7. Client increments view count after render

## Verification Checklist

After running the SQL migration, verify:

- [ ] Portfolio builder saves data successfully
- [ ] Publish button creates analytics record with domain
- [ ] Public URL opens and loads (no "Portfolio Not Found")
- [ ] Correct template renders (Aura/Minimalist/Shift/Innovate)
- [ ] Hero section shows saved name, tagline, bio, avatar
- [ ] Services section shows all added services
- [ ] Projects section shows all projects with images
- [ ] Testimonials section shows all testimonials
- [ ] Contact section shows left column (info) and right column (form)
- [ ] Contact items display with correct icons
- [ ] Footer shows social links
- [ ] All images load properly
- [ ] Custom colors and fonts apply correctly

## Troubleshooting

**Still seeing "Portfolio Not Found"?**
- Make sure you clicked "Publish Portfolio" (not just "Save Draft")
- Check that portfolio status is 'published' in database
- Verify analytics record exists with correct domain

**Missing services/projects/testimonials?**
- Verify the SQL migration ran successfully
- Check Supabase logs for RLS policy errors
- Make sure items were saved (check database tables)

**Wrong template rendering?**
- Check `template_style` column in portfolios table
- Should be one of: 'aura', 'minimalist', 'shift', 'innovate'
- Re-save and publish if needed

**Images not loading?**
- Check browser console for CORS errors
- Verify image URLs are accessible
- For uploaded images, check Supabase storage bucket is public

