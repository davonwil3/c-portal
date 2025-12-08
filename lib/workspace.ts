import { createClient as createSupabaseClient } from '@/lib/supabase/client'

export interface WorkspacePlanLimits {
  maxTeamMembers: number
  allowsTeamInvites: boolean
}

export function getWorkspacePlanLimits(planTier: 'free' | 'pro' | 'premium'): WorkspacePlanLimits {
  switch (planTier) {
    case 'free':
      return {
        maxTeamMembers: 1,
        allowsTeamInvites: false,
      }
    case 'pro':
      return {
        maxTeamMembers: 1,
        allowsTeamInvites: false,
      }
    case 'premium':
      return {
        maxTeamMembers: 5,
        allowsTeamInvites: true,
      }
    default:
      return {
        maxTeamMembers: 1,
        allowsTeamInvites: false,
      }
  }
}

export async function getWorkspaceMemberCount(workspaceId: string): Promise<number> {
  const supabase = createSupabaseClient()
  const { count, error } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error getting workspace member count:', error)
    return 0
  }

  return count || 0
}

export async function getWorkspacePendingInviteCount(workspaceId: string): Promise<number> {
  const supabase = createSupabaseClient()
  const { count, error } = await supabase
    .from('workspace_invites')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error getting pending invite count:', error)
    return 0
  }

  return count || 0
}

export async function canInviteToWorkspace(workspaceId: string, planTier: 'free' | 'pro' | 'premium'): Promise<{ canInvite: boolean; reason?: string }> {
  const limits = getWorkspacePlanLimits(planTier)
  
  if (!limits.allowsTeamInvites) {
    return {
      canInvite: false,
      reason: `Team invites are only available on Premium plans. Your current plan is ${planTier}.`,
    }
  }

  const memberCount = await getWorkspaceMemberCount(workspaceId)
  const pendingInviteCount = await getWorkspacePendingInviteCount(workspaceId)
  const totalCount = memberCount + pendingInviteCount

  if (totalCount >= limits.maxTeamMembers) {
    return {
      canInvite: false,
      reason: `You've reached the maximum of ${limits.maxTeamMembers} team members for your plan.`,
    }
  }

  return { canInvite: true }
}

export function generateInviteToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

