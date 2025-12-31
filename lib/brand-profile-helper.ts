/**
 * Brand Profile Helper
 * Constructs system prompts for AI content generation based on user's brand profile
 */

export interface BrandProfile {
  brandName?: string
  aboutBrand?: string
  tone?: 'friendly' | 'professional' | 'casual' | 'expert'
  topics?: string[]
  thingsToAvoid?: string
  website?: string
  pinnedOffer?: string // Legacy single offer (for backward compatibility)
  pinnedOffers?: string[] // New: array of offers
}

/**
 * Builds a system prompt that includes the user's brand profile and promo behavior
 * @param profile - The user's brand profile data
 * @param includePromo - Whether to include promotional CTA in the content
 * @returns A formatted system prompt string
 */
export function buildBrandProfilePrompt(
  profile: BrandProfile,
  includePromo: boolean = false
): string {
  const parts: string[] = []

  // About the brand
  if (profile.aboutBrand) {
    parts.push(`You are a content creator. Here's your background: ${profile.aboutBrand}`)
  } else {
    parts.push('You are a content creator sharing your expertise.')
  }

  // Tone
  if (profile.tone) {
    parts.push(`\nWriting style: ${profile.tone} and conversational`)
  }

  // Topics
  if (profile.topics && profile.topics.length > 0) {
    parts.push(`Topics you cover: ${profile.topics.join(', ')}`)
  }

  // Things to avoid
  if (profile.thingsToAvoid) {
    parts.push(`Things to avoid: ${profile.thingsToAvoid}`)
  }

  parts.push('\nIMPORTANT: Write in first person as yourself, NOT as a brand or company. Never say "I\'m [brand name]" or introduce yourself with your business name. Just share your knowledge and experience naturally.')

  // Brand name usage
  if (profile.brandName) {
    parts.push(`\nYour business/service name is "${profile.brandName}" - only mention it if it makes sense in context (like when talking about your work or services), never as an introduction.`)
  }

  // Promo behavior with intelligent selection
  if (includePromo) {
    const offers = profile.pinnedOffers && profile.pinnedOffers.length > 0 
      ? profile.pinnedOffers 
      : profile.pinnedOffer 
        ? [profile.pinnedOffer] 
        : []
    
    const hasOffers = offers.length > 0
    const hasWebsite = profile.website && profile.website.trim() !== ''
    
    if (hasOffers || hasWebsite) {
      // Intelligently choose between offers and website
      // 70% chance of using an offer, 30% chance of using website
      const useOffer = hasOffers && (!hasWebsite || Math.random() < 0.7)
      
      if (useOffer && hasOffers) {
        // Randomly select one offer from the array
        const selectedOffer = offers[Math.floor(Math.random() * offers.length)]
        parts.push(`\nWhen including promotional content, you can mention: "${selectedOffer}"`)
      }
      
      if (hasWebsite) {
        parts.push(`\nAlternatively, you can invite people to visit ${profile.website}`)
      }
      
      parts.push('\nIMPORTANT: Only include promotional CTAs in posts where it naturally fits. Not every post needs a CTA. Keep it brief and conversational, not salesy.')
    }
  } else {
    parts.push('\nCRITICAL: Do NOT include any promotional content, offers, website mentions, or CTAs in ANY of these posts. This should be pure value content only.')
  }

  return parts.join('\n')
}

/**
 * Determines promo distribution based on growth focus
 * @param focus - The user's weekly growth focus
 * @param totalPosts - Total number of posts to generate
 * @returns Array of booleans indicating which posts should include promo
 */
export function getPromoDistribution(
  focus: 'clients' | 'audience' | 'authority',
  totalPosts: number
): boolean[] {
  const promoRatio = {
    clients: 0.40,    // 40% promo for getting clients
    audience: 0.25,   // 25% promo for growing audience
    authority: 0.15,  // 15% promo for building authority
  }[focus]

  const numPromo = Math.round(totalPosts * promoRatio)
  const distribution: boolean[] = []

  // Create array with the right number of promo posts
  for (let i = 0; i < totalPosts; i++) {
    distribution.push(i < numPromo)
  }

  // Shuffle to distribute promo posts randomly throughout the week
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]]
  }

  return distribution
}

