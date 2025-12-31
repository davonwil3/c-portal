import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { buildBrandProfilePrompt, BrandProfile, getPromoDistribution } from '@/lib/brand-profile-helper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GrowthPlanRequest {
  userName: string
  industry?: string
  selectedGoal: string
  selectedTopics: string[]
  customFocusTopic: string
  platformMode: 'both' | 'x' | 'linkedin'
  postsPerWeek: number
  selectedSchedule: string[]
  includePromo?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const body: GrowthPlanRequest = await request.json()
    const {
      userName,
      industry,
      selectedGoal,
      selectedTopics,
      customFocusTopic,
      platformMode,
      postsPerWeek,
      selectedSchedule,
      includePromo = true, // Default to true for backward compatibility
    } = body

    console.log('📝 Growth Plan Generation Request:', {
      userName,
      industry,
      selectedGoal,
      selectedTopics,
      customFocusTopic,
      platformMode,
      postsPerWeek,
      selectedSchedule,
    })

    // Fetch brand profile
    const { data: brandProfileData } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('account_id', profile.account_id)
      .single()

    // Build brand profile object
    const brandProfile: BrandProfile = brandProfileData ? {
      brandName: brandProfileData.brand_name,
      aboutBrand: brandProfileData.about_brand,
      tone: brandProfileData.tone,
      topics: brandProfileData.topics || [],
      thingsToAvoid: brandProfileData.things_to_avoid,
      website: brandProfileData.website,
      pinnedOffer: brandProfileData.pinned_offer,
      pinnedOffers: brandProfileData.pinned_offers || [],
    } : {}

    // Map goal IDs to readable labels and promo focus types
    const goalLabels: Record<string, string> = {
      clients: 'Get Clients',
      audience: 'Grow Audience',
      expertise: 'Build Authority',
    }

    // Map goal to promo distribution focus
    const promoFocusMap: Record<string, 'clients' | 'audience' | 'authority'> = {
      clients: 'clients',
      audience: 'audience',
      expertise: 'authority',
    }

    // Get promo distribution for this plan (only if includePromo is true)
    const promoDistribution = includePromo
      ? getPromoDistribution(
          promoFocusMap[selectedGoal] || 'audience',
          postsPerWeek
        )
      : new Array(postsPerWeek).fill(false) // All false if promo is disabled

    console.log('🎯 Promo distribution for goal', selectedGoal, 'includePromo:', includePromo, ':', promoDistribution)

    // Map schedule IDs to readable labels
    const scheduleLabels: Record<string, string> = {
      morning: 'Morning (7-10 AM)',
      afternoon: 'Afternoon (12-3 PM)',
      evening: 'Evening (6-9 PM)',
    }

    const goalLabel = goalLabels[selectedGoal] || selectedGoal

    // Count how many posts should be promotional
    const numPromo = includePromo ? promoDistribution.filter(p => p).length : 0
    const numValue = postsPerWeek - numPromo

    // Build brand profile prompt (we'll add this to system context)
    // Pass includePromo so it knows about offers/website when promo is enabled
    const brandProfileContext = buildBrandProfilePrompt(brandProfile, includePromo)

    // Construct the prompt
    const promptText = `You are a social media growth strategist helping ${userName}, a freelancer/creator in the ${industry || 'freelancing'} industry who wants to ${goalLabel.toLowerCase()}.

${brandProfileContext}

${industry ? `Industry/Niche: ${industry}` : ''}
Selected focus topics: ${selectedTopics.length > 0 ? selectedTopics.join(', ') : 'general freelancing'}
${customFocusTopic ? `Custom focus: ${customFocusTopic}` : ''}
Platforms: ${platformMode === 'both' ? 'X (Twitter) and LinkedIn' : platformMode === 'x' ? 'X (Twitter)' : 'LinkedIn'}
Posts per week: ${postsPerWeek}
Preferred posting times: ${selectedSchedule.map(s => scheduleLabels[s] || s).join(', ')}

${includePromo 
  ? `Content mix for this goal (${goalLabel}):
- ${numValue} posts should be pure value/educational content (no mentions of offers or website)
- ${numPromo} posts should include a short, natural call-to-action promoting the pinned offer or website`
  : `CRITICAL: All ${postsPerWeek} posts should be PURE VALUE CONTENT ONLY. Do NOT include any promotional content, offers, website mentions, or CTAs in ANY posts. Focus entirely on providing value and insights.`}

Generate a personalized weekly growth plan with:
1. Specific posting schedule with days and times (use Tue, Thu, Sat format with specific times like "10 AM", "11 AM")
2. ${postsPerWeek} unique post ideas that are engaging, actionable, and tailored to the goal
3. Each post should be platform-specific (X posts should be concise and punchy; LinkedIn posts should be professional and storytelling)
4. Include post categories in the category parameter (like "Tip", "Story", "Insight", etc. - just give a one word category for the post...dont include the post category in the post)
${includePromo && numPromo > 0 ? `5. For the ${numPromo} promotional posts, naturally weave in a mention of the pinned offer/website at the end. Intelligently choose between different offers or the website - don't use the same one every time.` : ''}
${includePromo ? '6' : '5'}. 3 simple engagement actions to boost reach
${includePromo ? '7' : '6'}. A brief summary explaining the strategy

CRITICAL: Post content should be ready to publish as-is. DO NOT include labels, prefixes, or formatting like "Hook:", "Intro:", "CTA:", etc. Just write the actual post content.

Return the response as valid JSON with this exact structure:
{
  "greeting": "Hey [FirstName], here's your growth plan for the week 🌱",
  "postingSchedule": {
    "description": "X posts this week",
    "times": "Day Time • Day Time • Day Time format",
    "insight": "Engagement insight"
  },
  "posts": [
    {
      "num": "1️⃣",
      "date": "Day Time",
      "platform": "twitter or linkedin",
      "content": "The actual post content - ready to publish with no labels or prefixes",
      "category": "Post category"
    }
  ],
  "engagementActions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "summary": {
    "overview": "Brief explanation of the strategy",
    "expectedReach": "Expected reach increase percentage",
    "contentFocus": "Main content themes"
  }
}`

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API...')
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media growth strategist. Generate personalized, actionable growth plans for freelancers and creators. Always respond with valid JSON. IMPORTANT: Post content should be ready to publish as-is - no labels, no prefixes like "Hook:", "CTA:", etc. Just write the actual post content that can be copied and pasted directly.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      response_format: { type: 'json_object' },
      // Note: gpt-5-nano only supports default temperature (1), custom values are not supported
    })

    const aiContent = response.choices[0]?.message?.content

    if (!aiContent) {
      console.error('❌ No content received from OpenAI')
      throw new Error('No content received from OpenAI')
    }

    console.log('✅ OpenAI Response received:', {
      model: response.model,
      usage: response.usage,
      contentLength: aiContent.length,
    })

    // Parse the JSON response
    let planData
    try {
      planData = JSON.parse(aiContent)
      console.log('📊 Parsed Growth Plan Data:', JSON.stringify(planData, null, 2))
    } catch (parseError) {
      console.error('❌ Error parsing AI response as JSON:', parseError)
      console.error('Raw AI content:', aiContent)
      throw new Error('Failed to parse AI response as JSON')
    }

    return NextResponse.json({
      success: true,
      data: planData,
    })
  } catch (error) {
    console.error('❌ Error generating growth plan:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate growth plan',
      },
      { status: 500 }
    )
  }
}

