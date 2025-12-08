import { createClient } from "./supabase/client"
import { getCurrentAccount } from "./auth"
import { format, isToday, isYesterday, startOfDay, differenceInHours } from "date-fns"

export interface Message {
  id: string
  content: string
  message_type: string
  sender_name: string
  sender_type: 'client' | 'account_user'
  client_id: string | null
  attachment_url: string | null
  attachment_name: string | null
  attachment_type: string | null
  attachment_size: number | null
  is_read: boolean
  read_at: string | null
  read_by: string | null
  parent_message_id: string | null
  thread_id: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export interface ProjectWithMessages {
  id: string
  name: string
  client: string
  unread: number
  last: string
  time: string
  client_id: string
}

export interface FormattedMessage {
  id: string
  who: "You" | "Client"
  name: string
  time: string
  day: "Today" | "Yesterday" | string
  text: string
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
}

// Get projects with message counts and last message info
export async function getProjectsWithMessages(): Promise<ProjectWithMessages[]> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.warn('No account found')
    return []
  }

  try {
    // Get all projects for the account
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        client_id
      `)
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return []
    }

    if (!projects || projects.length === 0) {
      return []
    }

    // Get clients for all projects
    const clientIds = projects.map(p => p.client_id).filter(Boolean) as string[]
    let clientsMap: Record<string, { first_name: string; last_name: string; company: string | null }> = {}
    
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company')
        .in('id', clientIds)
      
      if (clients) {
        clientsMap = clients.reduce((acc, client) => {
          acc[client.id] = client
          return acc
        }, {} as Record<string, { first_name: string; last_name: string; company: string | null }>)
      }
    }

    // Get message counts and last messages for each project
    const projectsWithMessages = await Promise.all(
      projects.map(async (project) => {
        // Get unread count (messages not read by account users)
        // Check for both false and null values
        const { count: unreadCount, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('account_id', account.id)
          .eq('sender_type', 'client')
          .or('is_read.is.null,is_read.eq.false')

        if (countError) {
          console.error('Error counting unread messages for project', project.id, ':', countError)
        }

        console.log(`Project ${project.name} (${project.id}): ${unreadCount || 0} unread messages`)

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_name')
          .eq('project_id', project.id)
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const client = project.client_id ? clientsMap[project.client_id] : null
        const clientName = client 
          ? (client.company || `${client.first_name} ${client.last_name}`)
          : 'Unknown Client'

        const lastMessageText = lastMessage?.content || 'No messages yet'
        const lastMessageTime = lastMessage?.created_at 
          ? formatTimeAgo(new Date(lastMessage.created_at))
          : ''

        return {
          id: project.id,
          name: project.name,
          client: clientName,
          unread: unreadCount || 0,
          last: lastMessageText,
          time: lastMessageTime,
          client_id: project.client_id || ''
        }
      })
    )

    return projectsWithMessages
  } catch (error) {
    console.error('Error fetching projects with messages:', error)
    return []
  }
}

// Get messages for a specific project
export async function getProjectMessages(projectId: string): Promise<FormattedMessage[]> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.warn('No account found')
    return []
  }

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .eq('account_id', account.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    if (!messages || messages.length === 0) {
      return []
    }

    // Format messages for display
    const formattedMessages: FormattedMessage[] = messages.map((msg) => {
      const messageDate = new Date(msg.created_at)
      const isAccountUser = msg.sender_type === 'account_user'
      
      let day: "Today" | "Yesterday" | string
      if (isToday(messageDate)) {
        day = "Today"
      } else if (isYesterday(messageDate)) {
        day = "Yesterday"
      } else {
        day = format(messageDate, 'MMM d, yyyy')
      }

      return {
        id: msg.id,
        who: isAccountUser ? "You" : "Client",
        name: msg.sender_name,
        time: format(messageDate, 'h:mm a'),
        day,
        text: msg.content,
        attachment_url: msg.attachment_url || null,
        attachment_name: msg.attachment_name || null,
        attachment_type: msg.attachment_type || null,
        attachment_size: msg.attachment_size || null
      }
    })

    return formattedMessages
  } catch (error) {
    console.error('Error fetching project messages:', error)
    return []
  }
}

// Send a message
export async function sendMessage(
  projectId: string,
  content: string,
  senderName: string = 'You',
  attachmentUrl?: string | null,
  attachmentName?: string | null,
  attachmentType?: string | null,
  attachmentSize?: number | null
): Promise<Message | null> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.error('No account found')
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return null
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        account_id: account.id,
        content: content.trim(),
        message_type: 'text',
        sender_name: senderName,
        sender_type: 'account_user',
        sender_id: user.id,
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_type: attachmentType || null,
        attachment_size: attachmentSize || null,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return message
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

// Mark messages as read for a project
export async function markProjectMessagesAsRead(projectId: string): Promise<boolean> {
  try {
    // Call the API endpoint to mark messages as read (uses service role)
    const response = await fetch('/api/messages/mark-read-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error marking messages as read:', result.error)
      return false
    }

    console.log(`Successfully marked ${result.count || 0} messages as read`)
    return true
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return false
  }
}

// Get starred conversations for the current user
export async function getStarredConversations(): Promise<Set<string>> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.warn('No account found')
    return new Set()
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Set()
    }

    const { data: starred, error } = await supabase
      .from('starred_conversations')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('account_id', account.id)

    if (error) {
      console.error('Error fetching starred conversations:', error)
      return new Set()
    }

    return new Set(starred?.map(s => s.project_id) || [])
  } catch (error) {
    console.error('Error fetching starred conversations:', error)
    return new Set()
  }
}

// Star a conversation (project)
export async function starConversation(projectId: string): Promise<boolean> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.error('No account found')
    return false
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return false
    }

    const { error } = await supabase
      .from('starred_conversations')
      .insert({
        account_id: account.id,
        user_id: user.id,
        project_id: projectId
      })

    if (error) {
      // If it's a unique constraint violation, the conversation is already starred
      if (error.code === '23505') {
        return true // Already starred, consider it success
      }
      console.error('Error starring conversation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error starring conversation:', error)
    return false
  }
}

// Unstar a conversation (project)
export async function unstarConversation(projectId: string): Promise<boolean> {
  const supabase = createClient()
  const account = await getCurrentAccount()
  
  if (!account) {
    console.error('No account found')
    return false
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return false
    }

    const { error } = await supabase
      .from('starred_conversations')
      .delete()
      .eq('account_id', account.id)
      .eq('user_id', user.id)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error unstarring conversation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error unstarring conversation:', error)
    return false
  }
}

// Format time ago (e.g., "2h ago", "1d ago")
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInHours = differenceInHours(now, date)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) {
      return '1d ago'
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return format(date, 'MMM d')
    }
  }
}

