export type Plan = 'free' | 'pro' | 'premium'

/**
 * Check if plan can use full analytics features
 */
export function canUseFullAnalytics(plan: Plan): boolean {
  return plan === 'pro' || plan === 'premium'
}

/**
 * Check if plan is Premium
 */
export function isPremium(plan: Plan): boolean {
  return plan === 'premium'
}

/**
 * Get maximum number of visible upcoming due dates for a plan
 */
export function maxVisibleUpcomingDueDates(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 1
    case 'pro':
    case 'premium':
      return Infinity
    default:
      return 1
  }
}

/**
 * Get maximum number of visible overdue invoices for a plan
 */
export function maxVisibleOverdueInvoices(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 1
    case 'pro':
    case 'premium':
      return Infinity
    default:
      return 1
  }
}

/**
 * Get maximum number of visible clients in revenue breakdown for a plan
 */
export function maxVisibleClients(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 1
    case 'pro':
    case 'premium':
      return Infinity
    default:
      return 1
  }
}

/**
 * Get maximum number of visible projects in revenue breakdown for a plan
 */
export function maxVisibleProjects(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 1
    case 'pro':
    case 'premium':
      return Infinity
    default:
      return 1
  }
}

/**
 * Check if plan can see revenue trend chart
 */
export function canSeeRevenueTrend(plan: Plan): boolean {
  return canUseFullAnalytics(plan)
}

/**
 * Check if plan can see payment timeliness chart
 */
export function canSeePaymentTimeliness(plan: Plan): boolean {
  return canUseFullAnalytics(plan)
}

/**
 * Check if plan can see client types breakdown
 */
export function canSeeClientTypes(plan: Plan): boolean {
  return canUseFullAnalytics(plan)
}

/**
 * Check if plan can see all key metrics
 */
export function canSeeAllKeyMetrics(plan: Plan): boolean {
  return canUseFullAnalytics(plan)
}

/**
 * Check if plan can see AI insights
 */
export function canSeeAIInsights(plan: Plan): boolean {
  return isPremium(plan)
}

/**
 * Get upgrade target for a plan
 */
export function getUpgradeTarget(plan: Plan): 'pro' | 'premium' {
  if (plan === 'free') {
    return 'pro'
  }
  return 'premium'
}

/**
 * Get upgrade message for a plan
 */
export function getUpgradeMessage(plan: Plan, feature: string): string {
  if (plan === 'free') {
    return `Upgrade to Pro to ${feature}`
  }
  return `Upgrade to Premium to ${feature}`
}

