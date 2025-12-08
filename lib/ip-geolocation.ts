/**
 * Get location information from IP address
 * Uses ip-api.com (free tier, no API key required)
 */
export async function getLocationFromIP(ip: string): Promise<{ country: string; countryCode: string; flag: string } | null> {
  // Skip localhost/private IPs
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return null
  }

  try {
    // Use ip-api.com free tier (no API key needed)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status === 'success' && data.country) {
      // Get flag emoji from country code
      const flag = getCountryFlag(data.countryCode)
      
      return {
        country: data.country,
        countryCode: data.countryCode,
        flag
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching location from IP:', error)
    return null
  }
}

/**
 * Get flag emoji from country code
 */
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'
  }

  // Convert country code to flag emoji
  // Each flag is made of two regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}


