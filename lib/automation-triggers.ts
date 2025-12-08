import { getAutomations, createRunLog, type Automation } from './automations'
import { getCurrentAccount } from './auth'

// ============================================================================
// TRIGGER DEFINITIONS
// ============================================================================

export type TriggerId = 
  // Invoice & Payment Triggers
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.viewed'
  | 'invoice.paid'
  | 'invoice.partially_paid'
  | 'invoice.overdue'
  | 'invoice.due_soon'
  // Contract Triggers
  | 'contract.created'
  | 'contract.sent'
  | 'contract.viewed'
  | 'contract.signed'
  | 'contract.declined'
  | 'contract.expired'
  // Forms & Files Triggers
  | 'form.assigned'
  | 'form.completed'
  | 'file.uploaded'
  | 'file.request_overdue'

export interface TriggerDefinition {
  id: TriggerId
  name: string
  description: string
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'object'
      description: string
      required: boolean
    }
  }
}

export const TRIGGER_DEFINITIONS: Record<TriggerId, TriggerDefinition> = {
  // ============================================================================
  // INVOICE & PAYMENT TRIGGERS
  // ============================================================================
  
  'invoice.created': {
    id: 'invoice.created',
    name: 'Invoice Created',
    description: 'Fires when a new invoice is created',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount', required: true },
      status: { type: 'string', description: 'Invoice status', required: true },
      dueDate: { type: 'date', description: 'Due date', required: false },
    },
  },
  'invoice.sent': {
    id: 'invoice.sent',
    name: 'Invoice Sent',
    description: 'Fires when an invoice is sent to a client',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount', required: true },
      sentDate: { type: 'date', description: 'Date sent', required: true },
    },
  },
  'invoice.viewed': {
    id: 'invoice.viewed',
    name: 'Invoice Viewed',
    description: 'Fires when a client views an invoice',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount', required: true },
      viewedDate: { type: 'date', description: 'Date viewed', required: true },
    },
  },
  'invoice.paid': {
    id: 'invoice.paid',
    name: 'Invoice Paid',
    description: 'Fires when an invoice is fully paid',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount paid', required: true },
      paidDate: { type: 'date', description: 'Date paid', required: true },
      paymentMethod: { type: 'string', description: 'Payment method', required: false },
    },
  },
  'invoice.partially_paid': {
    id: 'invoice.partially_paid',
    name: 'Partial Payment Received',
    description: 'Fires when a partial payment is received for an invoice',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total invoice amount', required: true },
      paidAmount: { type: 'number', description: 'Amount paid', required: true },
      remainingAmount: { type: 'number', description: 'Remaining amount', required: true },
      paidDate: { type: 'date', description: 'Date paid', required: true },
    },
  },
  'invoice.overdue': {
    id: 'invoice.overdue',
    name: 'Invoice Overdue',
    description: 'Fires when an invoice becomes overdue',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount', required: true },
      dueDate: { type: 'date', description: 'Due date', required: true },
      daysOverdue: { type: 'number', description: 'Days overdue', required: true },
    },
  },
  'invoice.due_soon': {
    id: 'invoice.due_soon',
    name: 'Invoice Due Soon',
    description: 'Fires when an invoice is due within N days',
    parameters: {
      invoiceId: { type: 'string', description: 'Invoice ID', required: true },
      invoiceNumber: { type: 'string', description: 'Invoice number', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalAmount: { type: 'number', description: 'Total amount', required: true },
      dueDate: { type: 'date', description: 'Due date', required: true },
      daysUntilDue: { type: 'number', description: 'Days until due', required: true },
    },
  },
  
  // ============================================================================
  // CONTRACT TRIGGERS
  // ============================================================================
  
  'contract.created': {
    id: 'contract.created',
    name: 'Contract Created',
    description: 'Fires when a new contract is created',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      contractType: { type: 'string', description: 'Contract type', required: false },
      status: { type: 'string', description: 'Contract status', required: true },
    },
  },
  'contract.sent': {
    id: 'contract.sent',
    name: 'Contract Sent',
    description: 'Fires when a contract is sent to a client for signature',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      sentDate: { type: 'date', description: 'Date sent', required: true },
      expirationDate: { type: 'date', description: 'Expiration date', required: false },
    },
  },
  'contract.viewed': {
    id: 'contract.viewed',
    name: 'Contract Viewed',
    description: 'Fires when a client views a contract',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      viewedDate: { type: 'date', description: 'Date viewed', required: true },
    },
  },
  'contract.signed': {
    id: 'contract.signed',
    name: 'Contract Signed',
    description: 'Fires when a contract is signed',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      signedDate: { type: 'date', description: 'Date signed', required: true },
      signerName: { type: 'string', description: 'Signer name', required: false },
      signerEmail: { type: 'string', description: 'Signer email', required: false },
    },
  },
  'contract.declined': {
    id: 'contract.declined',
    name: 'Contract Declined',
    description: 'Fires when a contract is declined by a client',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      declinedDate: { type: 'date', description: 'Date declined', required: true },
      declineReason: { type: 'string', description: 'Reason for decline', required: false },
    },
  },
  'contract.expired': {
    id: 'contract.expired',
    name: 'Contract Expired',
    description: 'Fires when a contract expires without being signed',
    parameters: {
      contractId: { type: 'string', description: 'Contract ID', required: true },
      contractNumber: { type: 'string', description: 'Contract number', required: false },
      contractName: { type: 'string', description: 'Contract name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      totalValue: { type: 'number', description: 'Total contract value', required: false },
      expirationDate: { type: 'date', description: 'Expiration date', required: true },
      daysExpired: { type: 'number', description: 'Days since expiration', required: true },
    },
  },
  
  // ============================================================================
  // FORMS & FILES TRIGGERS
  // ============================================================================
  
  'form.assigned': {
    id: 'form.assigned',
    name: 'Form Assigned',
    description: 'Fires when a form is assigned to a client or project',
    parameters: {
      formId: { type: 'string', description: 'Form ID', required: true },
      formTitle: { type: 'string', description: 'Form title', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      portalId: { type: 'string', description: 'Portal ID', required: false },
      assignedDate: { type: 'date', description: 'Date assigned', required: true },
      submissionDeadline: { type: 'date', description: 'Submission deadline', required: false },
    },
  },
  'form.completed': {
    id: 'form.completed',
    name: 'Form Completed',
    description: 'Fires when a form submission is completed',
    parameters: {
      formId: { type: 'string', description: 'Form ID', required: true },
      formTitle: { type: 'string', description: 'Form title', required: true },
      submissionId: { type: 'string', description: 'Submission ID', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      respondentName: { type: 'string', description: 'Respondent name', required: false },
      respondentEmail: { type: 'string', description: 'Respondent email', required: false },
      completedDate: { type: 'date', description: 'Date completed', required: true },
      completionPercentage: { type: 'number', description: 'Completion percentage', required: false },
    },
  },
  'file.uploaded': {
    id: 'file.uploaded',
    name: 'File Uploaded',
    description: 'Fires when a file is uploaded (especially by a client)',
    parameters: {
      fileId: { type: 'string', description: 'File ID', required: true },
      fileName: { type: 'string', description: 'File name', required: true },
      fileType: { type: 'string', description: 'File type', required: true },
      fileSize: { type: 'number', description: 'File size in bytes', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      portalId: { type: 'string', description: 'Portal ID', required: false },
      uploadedByClient: { type: 'boolean', description: 'Whether uploaded by client', required: true },
      uploadedDate: { type: 'date', description: 'Date uploaded', required: true },
      uploaderName: { type: 'string', description: 'Uploader name', required: false },
    },
  },
  'file.request_overdue': {
    id: 'file.request_overdue',
    name: 'File Request Overdue',
    description: 'Fires when a file request becomes overdue',
    parameters: {
      fileRequestId: { type: 'string', description: 'File request ID', required: true },
      fileName: { type: 'string', description: 'Requested file name', required: true },
      clientId: { type: 'string', description: 'Client ID', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      requestedDate: { type: 'date', description: 'Date requested', required: true },
      dueDate: { type: 'date', description: 'Due date', required: true },
      daysOverdue: { type: 'number', description: 'Days overdue', required: true },
    },
  },
}

// ============================================================================
// ACTION DEFINITIONS
// ============================================================================

export type ActionId = 
  | 'sendEmail'
  | 'createTask'
  | 'createPortalNotice'
  | 'scheduleReminder'

export interface ActionDefinition {
  id: ActionId
  name: string
  description: string
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
      description: string
      required: boolean
    }
  }
}

export const ACTION_DEFINITIONS: Record<ActionId, ActionDefinition> = {
  sendEmail: {
    id: 'sendEmail',
    name: 'Send Email',
    description: 'Send an email to specified recipients',
    parameters: {
      templateId: { type: 'string', description: 'Email template ID', required: false },
      recipientId: { type: 'string', description: 'Recipient ID (client, user, etc.)', required: false },
      recipientEmail: { type: 'string', description: 'Recipient email address', required: false },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body (supports template variables)', required: true },
      cc: { type: 'array', description: 'CC recipients', required: false },
      bcc: { type: 'array', description: 'BCC recipients', required: false },
    },
  },
  createTask: {
    id: 'createTask',
    name: 'Create Task',
    description: 'Create a new task in a project',
    parameters: {
      title: { type: 'string', description: 'Task title', required: true },
      description: { type: 'string', description: 'Task description', required: false },
      projectId: { type: 'string', description: 'Project ID', required: false },
      assigneeId: { type: 'string', description: 'Assignee user ID', required: false },
      dueDate: { type: 'date', description: 'Due date', required: false },
      dueInDays: { type: 'number', description: 'Due in N days from now', required: false },
      priority: { type: 'string', description: 'Priority (low, medium, high, urgent)', required: false },
    },
  },
  createPortalNotice: {
    id: 'createPortalNotice',
    name: 'Create Portal Notice',
    description: 'Create a notice or action needed item in a client portal',
    parameters: {
      clientId: { type: 'string', description: 'Client ID', required: true },
      type: { type: 'string', description: 'Notice type (notice, action_needed)', required: true },
      title: { type: 'string', description: 'Notice title', required: true },
      message: { type: 'string', description: 'Notice message', required: true },
      buttonLabel: { type: 'string', description: 'Button label', required: false },
      deepLink: { type: 'string', description: 'Deep link URL', required: false },
      expireDays: { type: 'number', description: 'Days until expiration', required: false },
    },
  },
  scheduleReminder: {
    id: 'scheduleReminder',
    name: 'Schedule Reminder',
    description: 'Schedule a delayed reminder action',
    parameters: {
      waitAmount: { type: 'number', description: 'Wait amount', required: true },
      waitUnit: { type: 'string', description: 'Wait unit (hours, days)', required: true },
      action: { type: 'object', description: 'Action to execute after wait', required: true },
    },
  },
}

// ============================================================================
// CONDITION OPERATORS
// ============================================================================

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'

export interface Condition {
  field: string // e.g., "totalAmount", "clientId", "daysOverdue"
  operator: ConditionOperator
  value: any
}

// ============================================================================
// AUTOMATION EXECUTION ENGINE
// ============================================================================

export interface TriggerData {
  triggerId: TriggerId
  parameters: Record<string, any>
}

/**
 * Main function to fire a trigger and execute matching automations
 */
export async function fireTrigger(triggerData: TriggerData): Promise<void> {
  try {
    const account = await getCurrentAccount()
    if (!account) {
      console.warn('No account found, skipping automation trigger')
      return
    }

    // Get all enabled automations for this trigger
    const automations = await getAutomations()
    const matchingAutomations = automations.filter(
      (auto) => auto.enabled && auto.trigger === triggerData.triggerId
    )

    if (matchingAutomations.length === 0) {
      return // No automations to execute
    }

    // Execute each matching automation
    for (const automation of matchingAutomations) {
      try {
        // Check if automation matches scope and conditions
        if (await matchesAutomation(automation, triggerData)) {
          await executeAutomation(automation, triggerData)
        }
      } catch (error) {
        console.error(`Error executing automation ${automation.id}:`, error)
        // Continue with other automations even if one fails
      }
    }
  } catch (error) {
    console.error(`Error firing trigger ${triggerData.triggerId}:`, error)
  }
}

/**
 * Check if an automation matches the trigger data based on scope and conditions
 */
async function matchesAutomation(
  automation: Automation,
  triggerData: TriggerData
): Promise<boolean> {
  // Check scope
  if (automation.scope === 'client' && !triggerData.parameters.clientId) {
    return false
  }
  if (automation.scope === 'project' && !triggerData.parameters.projectId) {
    return false
  }
  if (automation.scope === 'client' && automation.targetId && automation.targetId !== triggerData.parameters.clientId) {
    return false
  }
  if (automation.scope === 'project' && automation.targetId && automation.targetId !== triggerData.parameters.projectId) {
    return false
  }

  // Check conditions (filters)
  if (automation.filters && automation.filters.length > 0) {
    for (const filter of automation.filters) {
      const condition: Condition = {
        field: filter.field,
        operator: filter.operator as ConditionOperator,
        value: filter.value,
      }
      if (!evaluateCondition(condition, triggerData.parameters)) {
        return false
      }
    }
  }

  return true
}

/**
 * Evaluate a single condition against trigger parameters
 */
function evaluateCondition(condition: Condition, parameters: Record<string, any>): boolean {
  const { field, operator, value } = condition
  const fieldValue = parameters[field]

  // Handle undefined/null values
  if (fieldValue === undefined || fieldValue === null) {
    return operator === 'not_equals' && value !== undefined && value !== null
  }

  switch (operator) {
    case 'equals':
      return String(fieldValue) === String(value)
    case 'not_equals':
      return String(fieldValue) !== String(value)
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value)
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
    case 'in':
      const valueArray = Array.isArray(value) ? value : [value]
      return valueArray.includes(fieldValue)
    case 'not_in':
      const notInArray = Array.isArray(value) ? value : [value]
      return !notInArray.includes(fieldValue)
    default:
      console.warn(`Unknown operator: ${operator}`)
      return true // Unknown operator, allow through
  }
}

/**
 * Execute an automation's actions
 */
async function executeAutomation(
  automation: Automation,
  triggerData: TriggerData
): Promise<void> {
  const startTime = Date.now()
  let success = true
  let errorMessage: string | undefined

  try {
    // Execute each action
    for (const action of automation.actions) {
      try {
        await executeAction(action, triggerData, automation)
      } catch (error: any) {
        console.error(`Error executing action ${action.type}:`, error)
        success = false
        errorMessage = error.message || 'Action execution failed'
        // Continue with other actions even if one fails
      }
    }
  } catch (error: any) {
    console.error(`Error executing automation ${automation.id}:`, error)
    success = false
    errorMessage = error.message || 'Automation execution failed'
  } finally {
    // Log the execution
    const duration = Date.now() - startTime
    const target = triggerData.parameters.clientId || 'Global'

    await createRunLog({
      automationId: automation.id,
      automationName: automation.name,
      target: target,
      targetId: triggerData.parameters.clientId || triggerData.parameters.invoiceId,
      status: success ? 'success' : 'failed',
      durationMs: duration,
      details: success ? 'Automation executed successfully' : errorMessage,
      executionContext: {
        trigger: triggerData.triggerId,
        parameters: triggerData.parameters,
      },
    })
  }
}

/**
 * Execute a single action
 */
async function executeAction(
  action: any,
  triggerData: TriggerData,
  automation: Automation
): Promise<void> {
  const actionId = action.type as ActionId

  // Get action definition
  const actionDef = ACTION_DEFINITIONS[actionId]
  if (!actionDef) {
    throw new Error(`Unknown action type: ${actionId}`)
  }

  // Get action parameters (from action.config)
  const params = action.config || {}

  // Replace template variables in parameters
  const processedParams = replaceTemplateVariables(params, triggerData.parameters)

  // Execute the action based on its type
  switch (actionId) {
    case 'sendEmail':
      await executeSendEmail(processedParams, triggerData)
      break
    case 'createTask':
      await executeCreateTask(processedParams, triggerData)
      break
    case 'createPortalNotice':
      await executeCreatePortalNotice(processedParams, triggerData)
      break
    case 'scheduleReminder':
      await executeScheduleReminder(processedParams, triggerData)
      break
    default:
      throw new Error(`Action ${actionId} not implemented`)
  }
}

// ============================================================================
// ACTION EXECUTORS
// ============================================================================

async function executeSendEmail(params: any, triggerData: TriggerData): Promise<void> {
  // TODO: Implement email sending
  console.log('Send Email Action:', {
    params,
    triggerData,
  })
  
  // In a real implementation:
  // 1. Resolve recipient email (from recipientId or recipientEmail)
  // 2. Replace template variables in subject and body
  // 3. Send email via email service (SendGrid, Resend, etc.)
}

async function executeCreateTask(params: any, triggerData: TriggerData): Promise<void> {
  // TODO: Implement task creation
  console.log('Create Task Action:', {
    params,
    triggerData,
  })
  
  // In a real implementation:
  // 1. Resolve projectId (from params or triggerData)
  // 2. Resolve assigneeId (from params, e.g., "me" -> current user)
  // 3. Calculate dueDate from dueInDays if provided
  // 4. Create task in database
}

async function executeCreatePortalNotice(params: any, triggerData: TriggerData): Promise<void> {
  // TODO: Implement portal notice creation
  console.log('Create Portal Notice Action:', {
    params,
    triggerData,
  })
  
  // In a real implementation:
  // 1. Get clientId from params or triggerData
  // 2. Create portal notice/action needed record
  // 3. Set expiration if expireDays provided
}

async function executeScheduleReminder(params: any, triggerData: TriggerData): Promise<void> {
  // TODO: Implement reminder scheduling
  console.log('Schedule Reminder Action:', {
    params,
    triggerData,
  })
  
  // In a real implementation:
  // 1. Calculate delay from waitAmount and waitUnit
  // 2. Schedule delayed execution of params.action
  // 3. Store in database or job queue
}

// ============================================================================
// TEMPLATE VARIABLE REPLACEMENT
// ============================================================================

function replaceTemplateVariables(template: any, parameters: Record<string, any>): any {
  if (typeof template === 'string') {
    let result = template
    // Replace {{parameterName}} with actual values
    for (const [key, value] of Object.entries(parameters)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value))
    }
    return result
  } else if (Array.isArray(template)) {
    return template.map(item => replaceTemplateVariables(item, parameters))
  } else if (typeof template === 'object' && template !== null) {
    const result: any = {}
    for (const [key, value] of Object.entries(template)) {
      result[key] = replaceTemplateVariables(value, parameters)
    }
    return result
  }
  return template
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC TRIGGERS
// ============================================================================

export async function fireInvoiceCreated(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  status: string
  due_date?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.created',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      dueDate: invoice.due_date,
    },
  })
}

export async function fireInvoiceSent(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  sent_date: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.sent',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      sentDate: invoice.sent_date,
    },
  })
}

export async function fireInvoiceViewed(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  viewed_date: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.viewed',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      viewedDate: invoice.viewed_date,
    },
  })
}

export async function fireInvoicePaid(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  paid_date: string
  payment_method?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.paid',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      paidDate: invoice.paid_date,
      paymentMethod: invoice.payment_method,
    },
  })
}

export async function fireInvoicePartiallyPaid(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  paid_date: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.partially_paid',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      paidAmount: invoice.paid_amount,
      remainingAmount: invoice.remaining_amount,
      paidDate: invoice.paid_date,
    },
  })
}

export async function fireInvoiceOverdue(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  due_date: string
  days_overdue: number
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.overdue',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      daysOverdue: invoice.days_overdue,
    },
  })
}

export async function fireInvoiceDueSoon(invoice: {
  id: string
  invoice_number: string
  client_id?: string
  project_id?: string
  total_amount: number
  due_date: string
  days_until_due: number
}): Promise<void> {
  await fireTrigger({
    triggerId: 'invoice.due_soon',
    parameters: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      projectId: invoice.project_id,
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      daysUntilDue: invoice.days_until_due,
    },
  })
}

// ============================================================================
// CONTRACT TRIGGER FUNCTIONS
// ============================================================================

export async function fireContractCreated(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  contract_type?: string
  status: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.created',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      contractType: contract.contract_type,
      status: contract.status,
    },
  })
}

export async function fireContractSent(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  sent_at: string
  expiration_date?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.sent',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      sentDate: contract.sent_at,
      expirationDate: contract.expiration_date,
    },
  })
}

export async function fireContractViewed(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  email_opened_at: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.viewed',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      viewedDate: contract.email_opened_at,
    },
  })
}

export async function fireContractSigned(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  signed_at: string
  signer_name?: string
  signer_email?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.signed',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      signedDate: contract.signed_at,
      signerName: contract.signer_name,
      signerEmail: contract.signer_email,
    },
  })
}

export async function fireContractDeclined(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  declined_at: string
  decline_reason?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.declined',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      declinedDate: contract.declined_at,
      declineReason: contract.decline_reason,
    },
  })
}

export async function fireContractExpired(contract: {
  id: string
  contract_number?: string
  name: string
  client_id?: string
  project_id?: string
  total_value?: number
  expiration_date: string
  days_expired: number
}): Promise<void> {
  await fireTrigger({
    triggerId: 'contract.expired',
    parameters: {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contractName: contract.name,
      clientId: contract.client_id,
      projectId: contract.project_id,
      totalValue: contract.total_value,
      expirationDate: contract.expiration_date,
      daysExpired: contract.days_expired,
    },
  })
}

// ============================================================================
// FORMS & FILES TRIGGER FUNCTIONS
// ============================================================================

export async function fireFormAssigned(form: {
  id: string
  title: string
  client_id?: string
  project_id?: string
  portal_id?: string
  assigned_date: string
  submission_deadline?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'form.assigned',
    parameters: {
      formId: form.id,
      formTitle: form.title,
      clientId: form.client_id,
      projectId: form.project_id,
      portalId: form.portal_id,
      assignedDate: form.assigned_date,
      submissionDeadline: form.submission_deadline,
    },
  })
}

export async function fireFormCompleted(submission: {
  form_id: string
  form_title: string
  id: string
  client_id?: string
  project_id?: string
  respondent_name?: string
  respondent_email?: string
  completed_at: string
  completion_percentage?: number
}): Promise<void> {
  await fireTrigger({
    triggerId: 'form.completed',
    parameters: {
      formId: submission.form_id,
      formTitle: submission.form_title,
      submissionId: submission.id,
      clientId: submission.client_id,
      projectId: submission.project_id,
      respondentName: submission.respondent_name,
      respondentEmail: submission.respondent_email,
      completedDate: submission.completed_at,
      completionPercentage: submission.completion_percentage,
    },
  })
}

export async function fireFileUploaded(file: {
  id: string
  name: string
  file_type: string
  file_size: number
  client_id?: string
  project_id?: string
  portal_id?: string
  sent_by_client: boolean
  created_at: string
  uploaded_by_name?: string
}): Promise<void> {
  await fireTrigger({
    triggerId: 'file.uploaded',
    parameters: {
      fileId: file.id,
      fileName: file.name,
      fileType: file.file_type,
      fileSize: file.file_size,
      clientId: file.client_id,
      projectId: file.project_id,
      portalId: file.portal_id,
      uploadedByClient: file.sent_by_client,
      uploadedDate: file.created_at,
      uploaderName: file.uploaded_by_name,
    },
  })
}

export async function fireFileRequestOverdue(fileRequest: {
  id: string
  file_name: string
  client_id?: string
  project_id?: string
  requested_date: string
  due_date: string
  days_overdue: number
}): Promise<void> {
  await fireTrigger({
    triggerId: 'file.request_overdue',
    parameters: {
      fileRequestId: fileRequest.id,
      fileName: fileRequest.file_name,
      clientId: fileRequest.client_id,
      projectId: fileRequest.project_id,
      requestedDate: fileRequest.requested_date,
      dueDate: fileRequest.due_date,
      daysOverdue: fileRequest.days_overdue,
    },
  })
}
