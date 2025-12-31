import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { buildBrandProfilePrompt, BrandProfile } from '@/lib/brand-profile-helper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GeneratePostsRequest {
  prompt: string
  platform: 'twitter' | 'linkedin'
  industry?: string
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

    const body: GeneratePostsRequest = await request.json()
    const { prompt, platform, industry, includePromo = false } = body

    console.log('📝 Generate Posts Request:', {
      prompt,
      platform,
      industry,
      includePromo,
    })

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is required',
        },
        { status: 400 }
      )
    }

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

    // Construct the base prompt
    let systemPrompt = platform === 'twitter'
      ? 'You are an expert social media content creator specializing in X (Twitter). Create concise, engaging, and punchy posts that are under 280 characters. Use emojis strategically and make them shareable. DO NOT include hashtags. DO NOT include labels like "Hook:", "CTA:", or any formatting prefixes - just write the actual post content.\n\n'
      : 'You are an expert social media content creator specializing in LinkedIn. Create professional, storytelling-focused posts that are engaging and valuable. Use a conversational tone, include insights, and encourage discussion. DO NOT include hashtags. DO NOT include labels or formatting prefixes - just write the actual post content.\n\n'

    // Add brand profile to system prompt
    systemPrompt += buildBrandProfilePrompt(brandProfile, includePromo)

    const userPrompt = `Generate 3 unique social media posts about: "${prompt}"

${industry ? `The user is in the ${industry} industry.` : ''}

${includePromo 
  ? 'PROMO INSTRUCTIONS: One of these posts should include a brief, natural call-to-action at the end (either mentioning a pinned offer or inviting to visit the website). The other posts should be pure value content.'
  : 'CRITICAL: These posts should be PURE VALUE CONTENT ONLY. Do NOT include any promotional content, offers, website mentions, or CTAs. Focus entirely on providing value and insights.'}

IMPORTANT RULES:
- Write ONLY the post content - no labels, no prefixes like "Hook:", "Intro:", etc.
- Make it engaging and actionable
- Tailored for ${platform === 'twitter' ? 'X (Twitter) - concise and punchy, under 280 characters' : 'LinkedIn - professional and storytelling'}
- Include a one-word category (like "Tip", "Story", "Insight", "Question") in the JSON, but NOT in the post content itself
- Ready to post as-is

Return the response as valid JSON with this exact structure:
{
  "posts": [
    {
      "content": "The actual post content ready to publish - no labels or prefixes",
      "category": "One word category",
      "platform": "${platform}"
    }
  ]
}`

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API for post generation...')
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
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
    let postData
    try {
      postData = JSON.parse(aiContent)
      console.log('📊 Parsed Post Data:', JSON.stringify(postData, null, 2))
    } catch (parseError) {
      console.error('❌ Error parsing AI response as JSON:', parseError)
      console.error('Raw AI content:', aiContent)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Ensure we have posts array
    if (!postData.posts || !Array.isArray(postData.posts)) {
      throw new Error('Invalid response format: posts array not found')
    }

    return NextResponse.json({
      success: true,
      data: postData,
    })
  } catch (error) {
    console.error('❌ Error generating posts:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate posts',
      },
      { status: 500 }
    )
  }
}

