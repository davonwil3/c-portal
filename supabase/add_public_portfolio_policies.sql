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

