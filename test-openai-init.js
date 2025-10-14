// Test OpenAI SDK initialization
require('dotenv').config()

console.log('Testing OpenAI SDK initialization...')
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0)

try {
  const OpenAI = require('openai')
  console.log('OpenAI SDK loaded successfully')
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set')
    process.exit(1)
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  console.log('OpenAI client created successfully')
  
  // Test if responses is available
  console.log('Responses API available:', !!(openai as any).responses)
  
} catch (error) {
  console.error('Error initializing OpenAI:', error.message)
  process.exit(1)
}
