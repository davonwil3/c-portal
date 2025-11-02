-- Portfolio Schema
-- This schema stores all portfolio data including templates, content, and settings

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolio table - stores main portfolio information and settings
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  
  -- Template & Layout
  template_style TEXT NOT NULL DEFAULT 'aura' CHECK (template_style IN ('aura', 'minimalist', 'shift', 'innovate')),
  
  -- Hero Section
  hero_name TEXT,
  hero_tagline TEXT,
  hero_bio TEXT,
  hero_avatar TEXT,
  hero_cta_label TEXT,
  hero_prefix TEXT,
  
  -- About Section
  about_heading TEXT,
  about_column1 TEXT,
  about_column2 TEXT,
  about_tags TEXT[], -- Array of skill tags
  
  -- Contact Section
  contact_title TEXT,
  contact_note TEXT,
  contact_cta_label TEXT,
  
  -- Footer
  footer_company_name TEXT,
  footer_copyright_text TEXT,
  
  -- Section Headers
  section_headers JSONB DEFAULT '{}'::jsonb, -- {services, projects, testimonials}
  
  -- Modules (enabled/disabled)
  modules_enabled JSONB DEFAULT '{}'::jsonb, -- {hero, about, services, projects, testimonials, contact, footer}
  
  -- Modules Order
  modules_order TEXT[],
  
  -- Appearance Settings (JSON)
  -- Note: layoutStyle is stored in template_style column, not in appearance JSONB
  appearance JSONB DEFAULT '{}'::jsonb, -- {primaryColor, secondaryColor, textColor, fontFamily, spacing, backgroundColor}
  
  -- Branding Settings (JSON)
  branding JSONB DEFAULT '{}'::jsonb, -- {logo, logoText, banner, hideLogo}
  
  -- Behavior Settings (JSON)
  behavior JSONB DEFAULT '{}'::jsonb, -- {isPublic, enableHireMe, enableBookCall, enableViewServices, contactDestination}
  
  -- SEO Settings (JSON)
  seo JSONB DEFAULT '{}'::jsonb, -- {metaTitle, metaDescription, socialImage}
  
  -- Public URL
  public_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_slug UNIQUE(user_id, slug)
);

-- Services table
CREATE TABLE IF NOT EXISTS portfolio_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  blurb TEXT NOT NULL,
  price_label TEXT NOT NULL,
  cta_label TEXT,
  tags TEXT[],
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT[],
  link TEXT,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS portfolio_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  author TEXT NOT NULL,
  role TEXT NOT NULL,
  quote TEXT NOT NULL,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Items table
CREATE TABLE IF NOT EXISTS portfolio_contact_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  icon TEXT NOT NULL, -- Icon name
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social Links table
CREATE TABLE IF NOT EXISTS portfolio_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  icon TEXT NOT NULL, -- Icon name
  url TEXT NOT NULL,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_services_portfolio_id ON portfolio_services(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_testimonials_portfolio_id ON portfolio_testimonials(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_contact_items_portfolio_id ON portfolio_contact_items(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_social_links_portfolio_id ON portfolio_social_links(portfolio_id);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_contact_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Portfolios
CREATE POLICY "Users can view their own portfolios" 
  ON portfolios FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" 
  ON portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
  ON portfolios FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" 
  ON portfolios FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published portfolios"
  ON portfolios FOR SELECT
  USING (status = 'published');

-- RLS Policies for Services
CREATE POLICY "Users can view services for their portfolios" 
  ON portfolio_services FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create services for their portfolios" 
  ON portfolio_services FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update services for their portfolios" 
  ON portfolio_services FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete services for their portfolios" 
  ON portfolio_services FOR DELETE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- RLS Policies for Projects
CREATE POLICY "Users can view projects for their portfolios" 
  ON portfolio_projects FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create projects for their portfolios" 
  ON portfolio_projects FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update projects for their portfolios" 
  ON portfolio_projects FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete projects for their portfolios" 
  ON portfolio_projects FOR DELETE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- RLS Policies for Testimonials
CREATE POLICY "Users can view testimonials for their portfolios" 
  ON portfolio_testimonials FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create testimonials for their portfolios" 
  ON portfolio_testimonials FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update testimonials for their portfolios" 
  ON portfolio_testimonials FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete testimonials for their portfolios" 
  ON portfolio_testimonials FOR DELETE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- RLS Policies for Contact Items
CREATE POLICY "Users can view contact items for their portfolios" 
  ON portfolio_contact_items FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create contact items for their portfolios" 
  ON portfolio_contact_items FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update contact items for their portfolios" 
  ON portfolio_contact_items FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete contact items for their portfolios" 
  ON portfolio_contact_items FOR DELETE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- RLS Policies for Social Links
CREATE POLICY "Users can view social links for their portfolios" 
  ON portfolio_social_links FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can create social links for their portfolios" 
  ON portfolio_social_links FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update social links for their portfolios" 
  ON portfolio_social_links FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete social links for their portfolios" 
  ON portfolio_social_links FOR DELETE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_services_updated_at
  BEFORE UPDATE ON portfolio_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_testimonials_updated_at
  BEFORE UPDATE ON portfolio_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_contact_items_updated_at
  BEFORE UPDATE ON portfolio_contact_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_social_links_updated_at
  BEFORE UPDATE ON portfolio_social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notes:
-- 1. All data from the control panel and template content is stored
-- 2. JSONB fields store complex objects like appearance, branding, behavior, seo
-- 3. Arrays (tags, modules_order) use PostgreSQL array types
-- 4. Row Level Security ensures users can only access their own portfolios
-- 5. Public portfolios can be viewed by anyone
-- 6. Related content (services, projects, etc.) are in separate tables for normalization
-- 7. Display_order allows custom ordering of content items
-- 8. Template support: Works with all 4 templates (aura, minimalist, shift, innovate)
-- 9. The schema is flexible and template-agnostic - different templates just render the data differently
-- 10. All portfolio content and settings from the control panel are captured

-- Template Compatibility:
-- - Aura: Uses hero section with prefix, large images, two-column layouts
-- - Minimalist: Uses background colors, simple navigation, skill tags in about section
-- - Shift: Uses editorial style with custom background colors and bold typography
-- - Innovate: Uses hero with stats overlay, corporate design, clean layouts
-- All templates share the same data structure but render it differently based on template_style column

-- Portfolio Analytics table - stores portfolio statistics and metadata
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Domain/Subdomain for routing (e.g., "yourname" for yourname.jolix.io)
  domain TEXT NOT NULL UNIQUE,
  
  -- Statistics
  view_count INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  
  -- SEO/Metadata
  title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_portfolio_analytics UNIQUE(portfolio_id)
);

-- Indexes for portfolio analytics
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_portfolio_id ON portfolio_analytics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_domain ON portfolio_analytics(domain);

-- Enable Row Level Security
ALTER TABLE portfolio_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Portfolio Analytics
CREATE POLICY "Users can view their own portfolio analytics" 
  ON portfolio_analytics FOR SELECT 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own portfolio analytics" 
  ON portfolio_analytics FOR UPDATE 
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own portfolio analytics" 
  ON portfolio_analytics FOR INSERT 
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- Public can view analytics for published portfolios (for view count tracking)
CREATE POLICY "Public can view analytics for published portfolios"
  ON portfolio_analytics FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Public can update view_count for published portfolios (for view tracking)
CREATE POLICY "Public can update view_count for published portfolios"
  ON portfolio_analytics FOR UPDATE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'))
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE status = 'published'));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_portfolio_analytics_updated_at
  BEFORE UPDATE ON portfolio_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

