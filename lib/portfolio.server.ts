import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import type { PortfolioData } from '@/app/dashboard/portfolio/types'

// Local copy of convertFromDatabaseFormat to avoid importing client code paths
function convertFromDatabaseFormat(
  portfolio: any,
  services: any[],
  projects: any[],
  testimonials: any[],
  contactItems: any[],
  socialLinks: any[]
): PortfolioData {
  return {
    hero: {
      name: portfolio.hero_name || '',
      tagline: portfolio.hero_tagline || '',
      bio: portfolio.hero_bio || '',
      avatar: portfolio.hero_avatar,
      ctaLabel: portfolio.hero_cta_label || '',
      prefix: portfolio.hero_prefix,
      stat2Description: portfolio.hero_stat2_description
    },
    about: portfolio.about_heading ? {
      heading: portfolio.about_heading,
      column1: portfolio.about_column1,
      column2: portfolio.about_column2,
      tags: portfolio.about_tags
    } : undefined,
    services: services.map(s => ({
      id: s.id,
      title: s.title,
      blurb: s.blurb,
      priceLabel: s.price_label,
      ctaLabel: s.cta_label,
      tags: s.tags
    })),
    projects: projects.map(p => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      coverImage: p.cover_image,
      tags: p.tags,
      link: p.link
    })),
    testimonials: testimonials.map(t => ({
      id: t.id,
      author: t.author,
      role: t.role,
      quote: t.quote,
      avatar: t.avatar || undefined
    })),
    contact: {
      title: portfolio.contact_title || '',
      note: portfolio.contact_note || '',
      ctaLabel: portfolio.contact_cta_label || ''
    },
    contactItems: contactItems.map((c: any) => ({
      id: c.id,
      icon: c.icon,
      label: c.label,
      value: c.value
    })),
    footer: portfolio.footer_company_name ? {
      companyName: portfolio.footer_company_name,
      copyrightText: portfolio.footer_copyright_text
    } : undefined,
    socialLinks: socialLinks.map((s: any) => ({
      id: s.id,
      icon: s.icon,
      url: s.url
    })),
    sectionHeaders: portfolio.section_headers || {},
    appearance: portfolio.appearance ? {
      ...portfolio.appearance,
      layoutStyle: portfolio.template_style || portfolio.appearance.layoutStyle || 'aura'
    } : {
      primaryColor: '#000000',
      secondaryColor: '#9CA3AF',
      fontFamily: 'system',
      layoutStyle: portfolio.template_style || 'aura',
      spacing: 'normal'
    },
    modules: portfolio.modules_enabled || {},
    modulesOrder: portfolio.modules_order || [],
    branding: portfolio.branding || {},
    behavior: portfolio.behavior || {},
    seo: portfolio.seo || {}
  }
}

export async function getPortfolioByDomainServer(domain: string): Promise<PortfolioData | null> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get analytics record to find portfolio_id
    const { data: analytics, error: analyticsError } = await supabase
      .from('portfolio_analytics')
      .select('portfolio_id')
      .eq('domain', domain)
      .single()

    if (analyticsError || !analytics) {
      console.error('Portfolio analytics not found for domain:', domain, analyticsError)
      return null
    }

    // Fetch portfolio (must be published)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', analytics.portfolio_id)
      .eq('status', 'published')
      .single()

    if (portfolioError || !portfolio) {
      console.error('Portfolio not found or not published:', portfolioError)
      return null
    }

    // Fetch related data - now public can access these for published portfolios
    const [services, projects, testimonials, contactItems, socialLinks] = await Promise.all([
      supabase.from('portfolio_services').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_projects').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_testimonials').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_contact_items').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_social_links').select('*').eq('portfolio_id', portfolio.id).order('display_order')
    ])

    // Log any errors fetching related data
    if (services.error) console.error('Error fetching services:', services.error)
    if (projects.error) console.error('Error fetching projects:', projects.error)
    if (testimonials.error) console.error('Error fetching testimonials:', testimonials.error)
    if (contactItems.error) console.error('Error fetching contact items:', contactItems.error)
    if (socialLinks.error) console.error('Error fetching social links:', socialLinks.error)

    // Convert back to PortfolioData format
    const portfolioData = convertFromDatabaseFormat(
      portfolio,
      services.data || [],
      projects.data || [],
      testimonials.data || [],
      contactItems.data || [],
      socialLinks.data || []
    )
    
    return portfolioData
  } catch (error) {
    console.error('Error fetching portfolio by domain (server):', error)
    return null
  }
}


