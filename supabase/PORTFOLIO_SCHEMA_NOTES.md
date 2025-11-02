# Portfolio Schema Overview

## Schema Structure

The portfolio schema is designed to be **template-agnostic** and works with all 4 templates (Aura, Minimalist, Shift, Innovate).

## Main Table: `portfolios`

Stores the main portfolio record with all content, settings, and configuration.

### Key Fields:
- **Basic Info**: `name`, `slug`, `status` (draft/published), `public_url`
- **Template**: `template_style` (aura, minimalist, shift, innovate)
- **Hero Section**: All fields for hero content
- **About Section**: Heading, two columns, skill tags array
- **Contact**: Title, note, CTA label
- **Footer**: Company name, copyright text
- **Section Headers**: JSONB for custom section headers
- **Modules**: JSONB for enabled/disabled modules
- **Appearance**: JSONB for colors, fonts, spacing, background
- **Branding**: JSONB for logo, logo text, banner, hide logo
- **Behavior**: JSONB for public/private, CTAs, contact destination
- **SEO**: JSONB for meta title, description, social image

## Related Tables

### `portfolio_services`
- Stores individual service items
- Includes: title, blurb, price_label, cta_label, tags
- Has display_order for custom ordering

### `portfolio_projects`
- Stores individual project items
- Includes: title, summary, cover_image, tags, link
- Has display_order for custom ordering

### `portfolio_testimonials`
- Stores individual testimonial items
- Includes: author, role, quote
- Has display_order for custom ordering

### `portfolio_contact_items`
- Stores individual contact items
- Includes: icon, label, value
- Has display_order for custom ordering

### `portfolio_social_links`
- Stores individual social links
- Includes: icon, url
- Has display_order for custom ordering

## Template Compatibility

### All Templates Use the Same Data Structure

The schema is **template-agnostic** - different templates just render the same data differently:

- **Aura**: Large hero images, two-column layouts, elegant spacing
- **Minimalist**: Clean design, simple navigation, background colors, skill tags
- **Shift**: Editorial style, bold typography, custom background colors
- **Innovate**: Hero with stats overlay, corporate design, clean layouts

### What Makes It Work for All Templates

1. **Flexible Data Storage**: JSONB fields store complex nested objects
2. **Array Support**: PostgreSQL arrays store lists (tags, modules_order)
3. **Template Detection**: `template_style` column determines which template to render
4. **Module System**: Turn sections on/off per template needs
5. **Display Order**: All content items can be reordered

## Security

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own portfolios
- **Public Access**: Published portfolios can be viewed by anyone
- **Cascade Deletes**: Related content is deleted when portfolio is deleted

## Features

1. **Complete Data Capture**: Stores everything from control panel and template
2. **Flexible**: Works with any template without schema changes
3. **Secure**: RLS policies protect user data
4. **Performant**: Indexes on foreign keys and common queries
5. **Auditable**: Automatic updated_at timestamps
6. **Extensible**: JSONB fields allow adding new settings without migrations

## Usage Example

```typescript
// Save portfolio
const portfolio = {
  name: "John's Portfolio",
  slug: "john-doe",
  template_style: "minimalist",
  hero_name: "John Doe",
  hero_tagline: "Creative Designer",
  // ... all other fields
  appearance: {
    primaryColor: "#0066FF",
    secondaryColor: "#9CA3AF",
    fontFamily: "inter"
  },
  // Related items stored in separate tables
};

// Services, projects, etc. are inserted into their respective tables
// with portfolio_id as foreign key
```

## Migration Path

To apply this schema:

```bash
# In Supabase dashboard SQL editor or via CLI
psql -h <host> -U postgres -d postgres -f supabase/portfolio_schema.sql
```

Or copy and paste the contents of `portfolio_schema.sql` into the Supabase SQL editor.

