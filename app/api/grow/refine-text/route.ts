import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RefineTextRequest {
  text: string
  preset?: string
  customPrompt?: string
  platform?: 'twitter' | 'linkedin'
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineTextRequest = await request.json()
    const { text, preset, customPrompt, platform = 'twitter' } = body

    console.log('📝 Refine Text Request:', {
      textLength: text.length,
      preset,
      customPrompt,
      platform,
    })

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    // Build the refinement prompt based on preset or custom prompt
    let refinementInstruction = ''

    if (preset) {
      switch (preset) {
        case 'Make clearer':
          refinementInstruction = 'Make this text clearer and easier to understand. Improve clarity without changing the core message.'
          break
        case 'More engaging':
          refinementInstruction = 'Make this text more engaging and compelling. Add hooks, improve flow, and make it more interesting to read.'
          break
        case 'More concise':
          refinementInstruction = `Make this text more concise and punchy. Remove unnecessary words while keeping the key message. Keep it under ${platform === 'twitter' ? '280' : '3000'} characters.`
          break
        case 'More professional':
          refinementInstruction = 'Make this text more professional and polished. Improve tone and structure while maintaining the message.'
          break
        default:
          refinementInstruction = 'Improve this text while keeping the core message.'
      }
    } else if (customPrompt) {
      refinementInstruction = customPrompt
    } else {
      refinementInstruction = 'Improve this text while keeping the core message.'
    }

    const systemPrompt = platform === 'twitter'
      ? 'You are an expert at refining social media posts for X (Twitter). Make posts concise, engaging, and under 280 characters when possible. Preserve the original intent and key points.'
      : 'You are an expert at refining social media posts for LinkedIn. Make posts professional, engaging, and well-structured. Preserve the original intent and key points.'

    const userPrompt = `${refinementInstruction}

Original text:
"${text}"

Return only the refined text, nothing else. Do not include quotes or explanations.`

    console.log('🤖 Calling OpenAI API for text refinement...')
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
      // Note: gpt-5-nano only supports default temperature (1), custom values are not supported
    })

    const refinedText = response.choices[0]?.message?.content?.trim()

    if (!refinedText) {
      console.error('❌ No content received from OpenAI')
      throw new Error('No content received from OpenAI')
    }

    console.log('✅ OpenAI Response received:', {
      model: response.model,
      usage: response.usage,
      refinedLength: refinedText.length,
    })

    return NextResponse.json({
      success: true,
      refinedText,
    })
  } catch (error) {
    console.error('❌ Error refining text:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refine text',
      },
      { status: 500 }
    )
  }
}

