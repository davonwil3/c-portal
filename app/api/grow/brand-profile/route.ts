import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface BrandProfileData {
  brandName?: string
  aboutBrand?: string
  tone?: 'friendly' | 'professional' | 'casual' | 'expert'
  topics?: string[]
  thingsToAvoid?: string
  website?: string
  pinnedOffer?: string // Legacy
  pinnedOffers?: string[] // New array of offers
}

// GET - Fetch user's brand profile
export async function GET(request: NextRequest) {
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

    // Fetch brand profile
    const { data: brandProfile, error: brandProfileError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('account_id', profile.account_id)
      .single()

    if (brandProfileError && brandProfileError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's ok, we'll return empty profile
      console.error('Error fetching brand profile:', brandProfileError)
      return NextResponse.json(
        { success: false, error: brandProfileError.message },
        { status: 500 }
      )
    }

    // Convert snake_case to camelCase for frontend
    const formattedProfile = brandProfile ? {
      brandName: brandProfile.brand_name,
      aboutBrand: brandProfile.about_brand,
      tone: brandProfile.tone,
      topics: brandProfile.topics || [],
      thingsToAvoid: brandProfile.things_to_avoid,
      website: brandProfile.website,
      pinnedOffer: brandProfile.pinned_offer,
      pinnedOffers: brandProfile.pinned_offers || [],
    } : null

    return NextResponse.json({
      success: true,
      profile: formattedProfile,
    })
  } catch (error) {
    console.error('Error in brand-profile GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch brand profile',
      },
      { status: 500 }
    )
  }
}

// POST - Save/update user's brand profile
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

    const body: BrandProfileData = await request.json()

    // Convert camelCase to snake_case for database
    const dbData = {
      account_id: profile.account_id,
      user_id: user.id,
      brand_name: body.brandName,
      about_brand: body.aboutBrand,
      tone: body.tone,
      topics: body.topics || [],
      things_to_avoid: body.thingsToAvoid,
      website: body.website,
      pinned_offer: body.pinnedOffer,
      pinned_offers: body.pinnedOffers || [],
      updated_at: new Date().toISOString(),
    }

    console.log('💾 Saving brand profile for account:', profile.account_id)

    // Upsert the brand profile
    const { data: savedProfile, error: saveError } = await supabase
      .from('brand_profiles')
      .upsert(dbData, {
        onConflict: 'account_id',
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving brand profile:', saveError)
      return NextResponse.json(
        { success: false, error: saveError.message },
        { status: 500 }
      )
    }

    console.log('✅ Brand profile saved successfully')

    return NextResponse.json({
      success: true,
      profile: savedProfile,
    })
  } catch (error) {
    console.error('Error in brand-profile POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save brand profile',
      },
      { status: 500 }
    )
  }
}

