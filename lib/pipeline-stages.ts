import { createClient } from "@/lib/supabase/client"

export interface PipelineStage {
  id: string
  name: string
  color: string
}

const defaultStages: PipelineStage[] = [
  { id: "new", name: "New", color: "bg-blue-100 text-blue-700" },
  { id: "contacted", name: "Contacted", color: "bg-purple-100 text-purple-700" },
  { id: "discovery", name: "Discovery", color: "bg-yellow-100 text-yellow-700" },
  { id: "proposal", name: "Proposal Sent", color: "bg-orange-100 text-orange-700" },
  { id: "negotiation", name: "Negotiation", color: "bg-pink-100 text-pink-700" },
  { id: "won", name: "Won", color: "bg-green-100 text-green-700" },
  { id: "lost", name: "Lost", color: "bg-red-100 text-red-700" },
]

const STORAGE_KEY = 'pipeline_stages'

// Get pipeline stages from database
export async function getPipelineStagesFromDB(): Promise<PipelineStage[]> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return defaultStages

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) return defaultStages

    const { data: account } = await supabase
      .from('accounts')
      .select('pipeline_stages')
      .eq('id', profile.account_id)
      .single()

    if (account?.pipeline_stages && Array.isArray(account.pipeline_stages)) {
      return account.pipeline_stages as PipelineStage[]
    }
  } catch (error) {
    console.error('Error loading pipeline stages from DB:', error)
  }
  
  return defaultStages
}

// Save pipeline stages to database
export async function savePipelineStagesToDB(stages: PipelineStage[]): Promise<void> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) return

    const { error } = await supabase
      .from('accounts')
      .update({ pipeline_stages: stages })
      .eq('id', profile.account_id)

    if (error) {
      console.error('Error saving pipeline stages to DB:', error)
      throw error
    }
  } catch (error) {
    console.error('Error saving pipeline stages to DB:', error)
    throw error
  }
}

// Get pipeline stages (tries DB first, falls back to localStorage, then defaults)
export function getPipelineStages(): PipelineStage[] {
  if (typeof window === 'undefined') {
    return defaultStages
  }
  
  // Try localStorage first for immediate access
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading pipeline stages from localStorage:', error)
  }
  
  return defaultStages
}

// Save pipeline stages (saves to both DB and localStorage)
export async function savePipelineStages(stages: PipelineStage[]): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    // Save to localStorage immediately for fast access
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages))
    
    // Save to database
    await savePipelineStagesToDB(stages)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('pipeline-stages-updated', { detail: stages }))
  } catch (error) {
    console.error('Error saving pipeline stages:', error)
    // Still dispatch event even if DB save fails, so UI updates
    window.dispatchEvent(new CustomEvent('pipeline-stages-updated', { detail: stages }))
  }
}

// Map lead status to pipeline stage ID
export function statusToStageId(status: string): string {
  const stages = getPipelineStages()
  // Try to find a stage with matching name (case-insensitive)
  const matchingStage = stages.find(s => s.name.toLowerCase() === status.toLowerCase())
  if (matchingStage) {
    return matchingStage.id
  }
  
  // Fallback to default mapping
  const defaultMapping: Record<string, string> = {
    'New': 'new',
    'Contacted': 'contacted',
    'Qualified': 'discovery',
    'Proposal Sent': 'proposal',
    'Won': 'won',
    'Lost': 'lost',
  }
  return defaultMapping[status] || 'new'
}

// Map pipeline stage ID to lead status
export function stageIdToStatus(stageId: string): string {
  const stages = getPipelineStages()
  const stage = stages.find(s => s.id === stageId)
  if (stage) {
    return stage.name
  }
  
  // Fallback to default mapping
  const defaultMapping: Record<string, string> = {
    'new': 'New',
    'contacted': 'Contacted',
    'discovery': 'Qualified',
    'proposal': 'Proposal Sent',
    'negotiation': 'Qualified',
    'won': 'Won',
    'lost': 'Lost',
  }
  return defaultMapping[stageId] || 'New'
}

// Get all status names from stages
export function getStatusNames(): string[] {
  return getPipelineStages().map(stage => stage.name)
}
