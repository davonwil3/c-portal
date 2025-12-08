import dns from 'dns'
import { promisify } from 'util'

const resolve4 = promisify(dns.resolve4)
const resolveCname = promisify(dns.resolveCname)

interface DNSVerificationResult {
  success: boolean
  errors: string[]
  details: {
    wwwCname: {
      found: boolean
      value?: string
      correct: boolean
    }
    rootA: {
      found: boolean
      value?: string
      correct: boolean
    }
  }
}

/**
 * Verify DNS records for a custom domain
 * Checks:
 * - www.<domain> CNAME → cname.jolix.io
 * - <domain> A record → 76.76.21.21
 */
export async function verifyDNSRecords(domain: string): Promise<DNSVerificationResult> {
  const result: DNSVerificationResult = {
    success: false,
    errors: [],
    details: {
      wwwCname: { found: false, correct: false },
      rootA: { found: false, correct: false }
    }
  }

  const wwwDomain = `www.${domain}`
  const expectedCname = 'cname.jolix.io'
  const expectedA = '76.76.21.21'

  // Check www CNAME record
  try {
    const cnameRecords = await resolveCname(wwwDomain)
    if (cnameRecords && cnameRecords.length > 0) {
      const cnameValue = cnameRecords[0].toLowerCase()
      result.details.wwwCname.found = true
      result.details.wwwCname.value = cnameValue
      
      // Check if it points to the correct value (allow trailing dot)
      if (cnameValue === expectedCname || cnameValue === `${expectedCname}.`) {
        result.details.wwwCname.correct = true
      } else {
        result.errors.push(`CNAME for www.${domain} is pointing to "${cnameValue}" but should point to "${expectedCname}"`)
      }
    } else {
      result.errors.push(`CNAME record for www.${domain} not found`)
    }
  } catch (error: any) {
    // DNS errors are common - record might not exist yet
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      result.errors.push(`CNAME record for www.${domain} not found yet`)
    } else {
      result.errors.push(`Error checking CNAME for www.${domain}: ${error.message}`)
    }
  }

  // Check root A record
  try {
    const aRecords = await resolve4(domain)
    if (aRecords && aRecords.length > 0) {
      result.details.rootA.found = true
      // Check if any of the A records match (domains can have multiple A records)
      const hasCorrectA = aRecords.some(ip => ip === expectedA)
      
      if (hasCorrectA) {
        result.details.rootA.correct = true
        result.details.rootA.value = expectedA
      } else {
        const foundIPs = aRecords.join(', ')
        result.details.rootA.value = foundIPs
        result.errors.push(`A record for ${domain} is pointing to "${foundIPs}" but should point to "${expectedA}"`)
      }
    } else {
      result.errors.push(`A record for ${domain} not found`)
    }
  } catch (error: any) {
    // DNS errors are common - record might not exist yet
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      result.errors.push(`A record for ${domain} not found yet`)
    } else {
      result.errors.push(`Error checking A record for ${domain}: ${error.message}`)
    }
  }

  // Success if both records are correct
  result.success = result.details.wwwCname.correct && result.details.rootA.correct

  return result
}

/**
 * Get a human-readable verification error message
 */
export function getVerificationErrorMessage(result: DNSVerificationResult, domain: string): string {
  if (result.success) {
    return ''
  }

  const errors = result.errors
  if (errors.length === 0) {
    return 'DNS records not configured correctly'
  }

  // If neither record is found, it's likely still propagating
  if (!result.details.wwwCname.found && !result.details.rootA.found) {
    return 'DNS records not found yet. DNS changes can take up to 15 minutes to propagate. Please try again in a few minutes.'
  }

  // If one is correct and one is missing, provide specific guidance
  if (result.details.wwwCname.correct && !result.details.rootA.found) {
    return 'CNAME record is correct, but A record for the root domain is not found yet. DNS changes can take up to 15 minutes to propagate.'
  }

  if (result.details.rootA.correct && !result.details.wwwCname.found) {
    return 'A record is correct, but CNAME record for www is not found yet. DNS changes can take up to 15 minutes to propagate.'
  }

  // Return the first error message
  return errors[0]
}

