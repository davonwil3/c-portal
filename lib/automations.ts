import { createClient } from '@/lib/supabase/client'
import { getCurrentAccount } from './auth'

export interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  triggerGroup: string
  conditions: string[]
  filters: Array<{ field: string; operator: string; value: string }>
  actions: ActionConfig[]
  scope: "global" | "client" | "project"
  targetId?: string
  targetName?: string
  enabled: boolean
  lastRun?: string
  successRate: number
  totalRuns: number
  account_id?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface ActionConfig {
  type: "email" | "portal_notice" | "action_needed" | "create_task" | "schedule_reminder"
  config?: {
    emailTo?: string[]
    emailSubject?: string
    emailBody?: string
    emailTemplate?: string
    noticeType?: "notice" | "action_needed"
    noticeTitle?: string
    noticeMessage?: string
    noticeButtonLabel?: string
    noticeDeepLink?: string
    noticeExpireDays?: number
    taskTitle?: string
    taskAssignee?: string
    taskDueInDays?: number
    taskNotes?: string
    reminderWaitAmount?: number
    reminderWaitUnit?: "hours" | "days"
    reminderAction?: ActionConfig
  }
}

export interface RunLog {
  id: string
  automationName: string
  timestamp: string
  target: string
  status: "success" | "failed"
  duration: string
  details?: string
  automation_id?: string
  account_id?: string
  target_id?: string
  duration_ms?: number
  execution_context?: any
  created_at?: string
}

export interface CreateAutomationInput {
  name: string
  description?: string
  trigger: string
  triggerGroup: string
  conditions?: string[]
  filters?: Array<{ field: string; operator: string; value: string }>
  actions: ActionConfig[]
  scope: "global" | "client" | "project"
  targetId?: string
  targetName?: string
  enabled?: boolean
}

export interface UpdateAutomationInput {
  name?: string
  description?: string
  trigger?: string
  triggerGroup?: string
  conditions?: string[]
  filters?: Array<{ field: string; operator: string; value: string }>
  actions?: ActionConfig[]
  scope?: "global" | "client" | "project"
  targetId?: string
  targetName?: string
  enabled?: boolean
}

/**
 * Get all automations for the current account
 */
export async function getAutomations(): Promise<Automation[]> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching automations:', error)
    throw error
  }

  return (data || []).map(mapAutomationFromDb)
}

/**
 * Get a single automation by ID
 */
export async function getAutomation(id: string): Promise<Automation | null> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .eq('account_id', account.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching automation:', error)
    throw error
  }

  return data ? mapAutomationFromDb(data) : null
}

/**
 * Create a new automation
 */
export async function createAutomation(input: CreateAutomationInput): Promise<Automation> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!account) {
    throw new Error('No account found')
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      account_id: account.id,
      user_id: user?.id,
      name: input.name,
      description: input.description || null,
      trigger: input.trigger,
      trigger_group: input.triggerGroup,
      conditions: input.conditions || [],
      filters: input.filters || [],
      actions: input.actions,
      scope: input.scope,
      target_id: input.targetId || null,
      target_name: input.targetName || null,
      enabled: input.enabled !== false,
      success_rate: 0,
      total_runs: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating automation:', error)
    throw error
  }

  return mapAutomationFromDb(data)
}

/**
 * Update an existing automation
 */
export async function updateAutomation(id: string, input: UpdateAutomationInput): Promise<Automation> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  const updateData: any = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.trigger !== undefined) updateData.trigger = input.trigger
  if (input.triggerGroup !== undefined) updateData.trigger_group = input.triggerGroup
  if (input.conditions !== undefined) updateData.conditions = input.conditions
  if (input.filters !== undefined) updateData.filters = input.filters
  if (input.actions !== undefined) updateData.actions = input.actions
  if (input.scope !== undefined) updateData.scope = input.scope
  if (input.targetId !== undefined) updateData.target_id = input.targetId || null
  if (input.targetName !== undefined) updateData.target_name = input.targetName || null
  if (input.enabled !== undefined) updateData.enabled = input.enabled

  const { data, error } = await supabase
    .from('automations')
    .update(updateData)
    .eq('id', id)
    .eq('account_id', account.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating automation:', error)
    throw error
  }

  return mapAutomationFromDb(data)
}

/**
 * Delete an automation
 */
export async function deleteAutomation(id: string): Promise<void> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('account_id', account.id)

  if (error) {
    console.error('Error deleting automation:', error)
    throw error
  }
}

/**
 * Get run logs for automations
 */
export async function getRunLogs(automationId?: string, limit: number = 100): Promise<RunLog[]> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  let query = supabase
    .from('automation_run_logs')
    .select('*')
    .eq('account_id', account.id)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (automationId) {
    query = query.eq('automation_id', automationId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching run logs:', error)
    throw error
  }

  return (data || []).map(mapRunLogFromDb)
}

/**
 * Create a run log entry
 */
export async function createRunLog(input: {
  automationId?: string
  automationName: string
  target: string
  targetId?: string
  status: "success" | "failed"
  durationMs?: number
  details?: string
  executionContext?: any
}): Promise<RunLog> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    throw new Error('No account found')
  }

  const { data, error } = await supabase
    .from('automation_run_logs')
    .insert({
      account_id: account.id,
      automation_id: input.automationId || null,
      automation_name: input.automationName,
      target: input.target,
      target_id: input.targetId || null,
      status: input.status,
      duration_ms: input.durationMs || null,
      details: input.details || null,
      execution_context: input.executionContext || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating run log:', error)
    throw error
  }

  return mapRunLogFromDb(data)
}

/**
 * Map database record to Automation interface
 */
function mapAutomationFromDb(record: any): Automation {
  return {
    id: record.id,
    name: record.name,
    description: record.description || '',
    trigger: record.trigger,
    triggerGroup: record.trigger_group,
    conditions: record.conditions || [],
    filters: record.filters || [],
    actions: record.actions || [],
    scope: record.scope,
    targetId: record.target_id,
    targetName: record.target_name,
    enabled: record.enabled,
    lastRun: record.last_run,
    successRate: parseFloat(record.success_rate) || 0,
    totalRuns: record.total_runs || 0,
    account_id: record.account_id,
    user_id: record.user_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

/**
 * Map database record to RunLog interface
 */
function mapRunLogFromDb(record: any): RunLog {
  const durationMs = record.duration_ms
  const duration = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : 'N/A'
  
  return {
    id: record.id,
    automationName: record.automation_name,
    timestamp: record.timestamp || record.created_at,
    target: record.target,
    status: record.status,
    duration,
    details: record.details,
    automation_id: record.automation_id,
    account_id: record.account_id,
    target_id: record.target_id,
    duration_ms: durationMs,
    execution_context: record.execution_context,
    created_at: record.created_at,
  }
}

