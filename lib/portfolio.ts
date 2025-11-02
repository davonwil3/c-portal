import { createClient } from '@/lib/supabase/client'
import type { PortfolioData } from '@/app/dashboard/portfolio/types'

interface PortfolioRecord {
  id?: string
  user_id: string
  name: string
  slug: string
  status: 'draft' | 'published'
  template_style: string
  
  // Hero Section
  hero_name?: string
  hero_tagline?: string
  hero_bio?: string
  hero_avatar?: string
  hero_cta_label?: string
  hero_prefix?: string
  hero_stat2_description?: string
  
  // About Section
  about_heading?: string
  about_column1?: string
  about_column2?: string
  about_tags?: string[]
  
  // Contact Section
  contact_title?: string
  contact_note?: string
  contact_cta_label?: string
  
  // Footer
  footer_company_name?: string
  footer_copyright_text?: string
  
  // Section Headers
  section_headers?: Record<string, string>
  
  // Modules enabled
  modules_enabled?: Record<string, boolean>
  
  // Modules order
  modules_order?: string[]
  
  // Appearance settings
  appearance?: Record<string, any>
  
  // Branding settings
  branding?: Record<string, any>
  
  // Behavior settings
  behavior?: Record<string, any>
  
  // SEO settings
  seo?: Record<string, any>
  
  // Public URL
  public_url?: string
}

interface ServiceRecord {
  id?: string
  portfolio_id: string
  title: string
  blurb: string
  price_label: string
  cta_label?: string
  tags?: string[]
  display_order?: number
}

interface ProjectRecord {
  id?: string
  portfolio_id: string
  title: string
  summary: string
  cover_image?: string
  tags?: string[]
  link?: string
  display_order?: number
}

interface TestimonialRecord {
  id?: string
  portfolio_id: string
  author: string
  role: string
  quote: string
  display_order?: number
}

interface ContactItemRecord {
  id?: string
  portfolio_id: string
  icon: string
  label: string
  value: string
  display_order?: number
}

interface SocialLinkRecord {
  id?: string
  portfolio_id: string
  icon: string
  url: string
  display_order?: number
}

// Convert PortfolioData to database format
function convertToDatabaseFormat(data: PortfolioData, userId: string, status: 'draft' | 'published', existingDomain?: string): PortfolioRecord {
  const slug = data.hero.name.toLowerCase().replace(/\s+/g, '-')
  // Generate subdomain from hero name - sanitize it to be URL-safe
  const domain = existingDomain || slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  
  // For published portfolios, use subdomain.jolix.io format
  const publicUrl = status === 'published' 
    ? `https://${domain}.jolix.io`
    : `https://clientportalhq.com/portfolio/${slug}`
  
  return {
    user_id: userId,
    name: data.hero.name,
    slug,
    status,
    template_style: data.appearance.layoutStyle || 'aura',
    
    // Hero Section
    hero_name: data.hero.name,
    hero_tagline: data.hero.tagline,
    hero_bio: data.hero.bio,
    hero_avatar: data.hero.avatar,
    hero_cta_label: data.hero.ctaLabel,
    hero_prefix: data.hero.prefix,
    hero_stat2_description: data.hero.stat2Description,
    
    // About Section
    about_heading: data.about?.heading,
    about_column1: data.about?.column1,
    about_column2: data.about?.column2,
    about_tags: data.about?.tags,
    
    // Contact Section
    contact_title: data.contact.title,
    contact_note: data.contact.note,
    contact_cta_label: data.contact.ctaLabel,
    
    // Footer
    footer_company_name: data.footer?.companyName,
    footer_copyright_text: data.footer?.copyrightText,
    
    // Section Headers
    section_headers: data.sectionHeaders,
    
    // Modules enabled
    modules_enabled: data.modules,
    
    // Modules order
    modules_order: data.modulesOrder,
    
    // Appearance settings
    appearance: {
      primaryColor: data.appearance.primaryColor,
      secondaryColor: data.appearance.secondaryColor,
      textColor: data.appearance.textColor,
      fontFamily: data.appearance.fontFamily,
      spacing: data.appearance.spacing,
      backgroundColor: data.appearance.backgroundColor,
      layoutStyle: data.appearance.layoutStyle
    },
    
    // Branding settings
    branding: data.branding,
    
    // Behavior settings
    behavior: data.behavior,
    
    // SEO settings
    seo: data.seo,
    
    // Public URL
    public_url: publicUrl
  }
}

// Save or update a portfolio
export async function savePortfolio(
  data: PortfolioData,
  status: 'draft' | 'published',
  portfolioId?: string
): Promise<{ success: boolean; portfolioId?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Get existing analytics domain if updating
    let existingDomain: string | undefined
    if (portfolioId) {
      const { data: analytics } = await supabase
        .from('portfolio_analytics')
        .select('domain')
        .eq('portfolio_id', portfolioId)
        .single()
      existingDomain = analytics?.domain
    }
    
    // Convert data to database format
    const portfolioData = convertToDatabaseFormat(data, user.id, status, existingDomain)
    
    // Extract domain from public URL for analytics
    const domain = portfolioData.public_url?.replace('https://', '').replace('.jolix.io', '') || 
                   data.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')
    
    // Save or update main portfolio record
    let portfolioRecordId: string
    
    if (portfolioId) {
      // Update existing portfolio
      const { error: updateError } = await supabase
        .from('portfolios')
        .update(portfolioData)
        .eq('id', portfolioId)
        .eq('user_id', user.id)
      
      if (updateError) {
        return { success: false, error: updateError.message }
      }
      
      portfolioRecordId = portfolioId
      
      // Delete existing related records
      await deletePortfolioRelatedRecords(portfolioRecordId)
    } else {
      // Create new portfolio
      const { data: insertData, error: insertError } = await supabase
        .from('portfolios')
        .insert(portfolioData)
        .select('id')
        .single()
      
      if (insertError) {
        return { success: false, error: insertError.message }
      }
      
      portfolioRecordId = insertData.id
    }
    
    // Save related records
    await saveRelatedRecords(supabase, portfolioRecordId, data)
    
    // If publishing, create or update analytics record
    if (status === 'published') {
      const analyticsData = {
        portfolio_id: portfolioRecordId,
        domain: domain,
        title: data.seo?.metaTitle || data.hero.name,
        meta_description: data.seo?.metaDescription || data.hero.bio || '',
        view_count: 0,
        leads: 0,
        conversion_rate: 0.00
      }
      
      // Check if analytics record exists
      const { data: existingAnalytics } = await supabase
        .from('portfolio_analytics')
        .select('id, view_count, leads, conversion_rate')
        .eq('portfolio_id', portfolioRecordId)
        .single()
      
      if (existingAnalytics) {
        // Update existing analytics (preserve view_count and other stats)
        await supabase
          .from('portfolio_analytics')
          .update({
            domain: analyticsData.domain,
            title: analyticsData.title,
            meta_description: analyticsData.meta_description,
            view_count: existingAnalytics.view_count || 0,
            leads: existingAnalytics.leads || 0,
            conversion_rate: existingAnalytics.conversion_rate || 0.00
          })
          .eq('portfolio_id', portfolioRecordId)
      } else {
        // Create new analytics record
        await supabase
          .from('portfolio_analytics')
          .insert(analyticsData)
      }
    }
    
    return { success: true, portfolioId: portfolioRecordId }
  } catch (error: any) {
    console.error('Error saving portfolio:', error)
    return { success: false, error: error.message || 'Failed to save portfolio' }
  }
}

// Save related records (services, projects, testimonials, etc.)
async function saveRelatedRecords(supabase: any, portfolioId: string, data: PortfolioData) {
  // Save services
  if (data.services && data.services.length > 0) {
    const services = data.services.map((service, index) => ({
      portfolio_id: portfolioId,
      title: service.title,
      blurb: service.blurb,
      price_label: service.priceLabel,
      cta_label: service.ctaLabel,
      tags: service.tags || [],
      display_order: index
    }))
    
    await supabase
      .from('portfolio_services')
      .insert(services)
  }
  
  // Save projects
  if (data.projects && data.projects.length > 0) {
    const projects = data.projects.map((project, index) => ({
      portfolio_id: portfolioId,
      title: project.title,
      summary: project.summary,
      cover_image: project.coverImage,
      tags: project.tags || [],
      link: project.link,
      display_order: index
    }))
    
    await supabase
      .from('portfolio_projects')
      .insert(projects)
  }
  
  // Save testimonials
  if (data.testimonials && data.testimonials.length > 0) {
    const testimonials = data.testimonials.map((testimonial, index) => ({
      portfolio_id: portfolioId,
      author: testimonial.author,
      role: testimonial.role,
      quote: testimonial.quote,
      display_order: index
    }))
    
    await supabase
      .from('portfolio_testimonials')
      .insert(testimonials)
  }
  
  // Save contact items
  if (data.contactItems && data.contactItems.length > 0) {
    const contactItems = data.contactItems.map((item, index) => ({
      portfolio_id: portfolioId,
      icon: item.icon,
      label: item.label,
      value: item.value,
      display_order: index
    }))
    
    await supabase
      .from('portfolio_contact_items')
      .insert(contactItems)
  }
  
  // Save social links
  if (data.socialLinks && data.socialLinks.length > 0) {
    const socialLinks = data.socialLinks.map((link, index) => ({
      portfolio_id: portfolioId,
      icon: link.icon,
      url: link.url,
      display_order: index
    }))
    
    await supabase
      .from('portfolio_social_links')
      .insert(socialLinks)
  }
}

// Delete related records for a portfolio
async function deletePortfolioRelatedRecords(portfolioId: string) {
  const supabase = createClient()
  
  await Promise.all([
    supabase.from('portfolio_services').delete().eq('portfolio_id', portfolioId),
    supabase.from('portfolio_projects').delete().eq('portfolio_id', portfolioId),
    supabase.from('portfolio_testimonials').delete().eq('portfolio_id', portfolioId),
    supabase.from('portfolio_contact_items').delete().eq('portfolio_id', portfolioId),
    supabase.from('portfolio_social_links').delete().eq('portfolio_id', portfolioId)
  ])
}

// Get a portfolio by ID
export async function getPortfolio(portfolioId: string): Promise<PortfolioData | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null
    }
    
    // Fetch portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()
    
    if (portfolioError || !portfolio) {
      return null
    }
    
    // Fetch related data
    const [services, projects, testimonials, contactItems, socialLinks] = await Promise.all([
      supabase.from('portfolio_services').select('*').eq('portfolio_id', portfolioId).order('display_order'),
      supabase.from('portfolio_projects').select('*').eq('portfolio_id', portfolioId).order('display_order'),
      supabase.from('portfolio_testimonials').select('*').eq('portfolio_id', portfolioId).order('display_order'),
      supabase.from('portfolio_contact_items').select('*').eq('portfolio_id', portfolioId).order('display_order'),
      supabase.from('portfolio_social_links').select('*').eq('portfolio_id', portfolioId).order('display_order')
    ])
    
    // Convert back to PortfolioData format
    return convertFromDatabaseFormat(
      portfolio,
      services.data || [],
      projects.data || [],
      testimonials.data || [],
      contactItems.data || [],
      socialLinks.data || []
    )
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return null
  }
}

// Convert database format back to PortfolioData
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
      quote: t.quote
    })),
    contact: {
      title: portfolio.contact_title || '',
      note: portfolio.contact_note || '',
      ctaLabel: portfolio.contact_cta_label || ''
    },
    contactItems: contactItems.map(c => ({
      id: c.id,
      icon: c.icon,
      label: c.label,
      value: c.value
    })),
    footer: portfolio.footer_company_name ? {
      companyName: portfolio.footer_company_name,
      copyrightText: portfolio.footer_copyright_text
    } : undefined,
    socialLinks: socialLinks.map(s => ({
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

// Get user's portfolios
export async function getUserPortfolios(): Promise<any[]> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return []
    }
    
    // Fetch portfolios
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching portfolios:', error)
      return []
    }
    
    return portfolios || []
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return []
  }
}

// Delete a portfolio
export async function deletePortfolio(portfolioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Delete portfolio (cascade will delete related records)
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', user.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting portfolio:', error)
    return { success: false, error: error.message || 'Failed to delete portfolio' }
  }
}

// Get portfolio analytics for a user's portfolio
export async function getPortfolioAnalytics(portfolioId: string): Promise<any | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null
    }
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()
    
    if (!portfolio) {
      return null
    }
    
    // Get analytics
    const { data: analytics, error } = await supabase
      .from('portfolio_analytics')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .single()
    
    if (error || !analytics) {
      return {
        view_count: 0,
        leads: 0,
        conversion_rate: 0.00,
        domain: '',
        title: '',
        meta_description: ''
      }
    }
    
    return analytics
  } catch (error) {
    console.error('Error fetching portfolio analytics:', error)
    return null
  }
}

// Get portfolio by domain (public access)
export async function getPortfolioByDomain(domain: string): Promise<PortfolioData | null> {
  try {
    const supabase = createClient()
    
    // Get analytics record to find portfolio_id
    const { data: analytics, error: analyticsError } = await supabase
      .from('portfolio_analytics')
      .select('portfolio_id')
      .eq('domain', domain)
      .single()
    
    if (analyticsError || !analytics) {
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
      return null
    }
    
    // Fetch related data
    const [services, projects, testimonials, contactItems, socialLinks] = await Promise.all([
      supabase.from('portfolio_services').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_projects').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_testimonials').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_contact_items').select('*').eq('portfolio_id', portfolio.id).order('display_order'),
      supabase.from('portfolio_social_links').select('*').eq('portfolio_id', portfolio.id).order('display_order')
    ])
    
    // Convert back to PortfolioData format
    return convertFromDatabaseFormat(
      portfolio,
      services.data || [],
      projects.data || [],
      testimonials.data || [],
      contactItems.data || [],
      socialLinks.data || []
    )
  } catch (error) {
    console.error('Error fetching portfolio by domain:', error)
    return null
  }
}

// Update portfolio analytics (domain, title, meta_description)
export async function updatePortfolioAnalytics(
  portfolioId: string,
  updates: {
    domain?: string
    title?: string
    meta_description?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()
    
    if (!portfolio) {
      return { success: false, error: 'Portfolio not found' }
    }
    
    // Check if analytics record exists
    const { data: existingAnalytics } = await supabase
      .from('portfolio_analytics')
      .select('id, view_count, leads, conversion_rate')
      .eq('portfolio_id', portfolioId)
      .single()
    
    const updateData: any = {}
    if (updates.domain !== undefined) updateData.domain = updates.domain
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.meta_description !== undefined) updateData.meta_description = updates.meta_description
    
    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No updates provided' }
    }
    
    if (existingAnalytics) {
      // Update existing analytics (preserve stats)
      const { error: updateError } = await supabase
        .from('portfolio_analytics')
        .update(updateData)
        .eq('portfolio_id', portfolioId)
      
      if (updateError) {
        return { success: false, error: updateError.message }
      }
    } else {
      // Create new analytics record if it doesn't exist
      const { error: insertError } = await supabase
        .from('portfolio_analytics')
        .insert({
          portfolio_id: portfolioId,
          domain: updates.domain || '',
          title: updates.title || '',
          meta_description: updates.meta_description || '',
          view_count: 0,
          leads: 0,
          conversion_rate: 0.00
        })
      
      if (insertError) {
        return { success: false, error: insertError.message }
      }
    }
    
    // If domain was updated, also update the portfolio's public_url
    if (updates.domain) {
      const { error: portfolioUpdateError } = await supabase
        .from('portfolios')
        .update({ public_url: `https://${updates.domain}.jolix.io` })
        .eq('id', portfolioId)
      
      if (portfolioUpdateError) {
        console.error('Error updating portfolio public_url:', portfolioUpdateError)
        // Don't fail the whole operation if this fails
      }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating portfolio analytics:', error)
    return { success: false, error: error.message || 'Failed to update analytics' }
  }
}

// Increment view count for a portfolio
export async function incrementPortfolioView(domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get analytics record
    const { data: analytics, error: fetchError } = await supabase
      .from('portfolio_analytics')
      .select('id, view_count')
      .eq('domain', domain)
      .single()
    
    if (fetchError || !analytics) {
      return { success: false, error: 'Portfolio not found' }
    }
    
    // Increment view count
    const { error: updateError } = await supabase
      .from('portfolio_analytics')
      .update({ view_count: (analytics.view_count || 0) + 1 })
      .eq('id', analytics.id)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Error incrementing portfolio view:', error)
    return { success: false, error: error.message || 'Failed to increment view' }
  }
}

