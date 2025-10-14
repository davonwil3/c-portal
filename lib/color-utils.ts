/**
 * Color utility functions for portal theming
 */

/**
 * Converts a hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG guidelines
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Determines if a color is light or dark
 * Returns true if the color is light (should use dark text)
 * Returns false if the color is dark (should use light text)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return true // Default to light if invalid hex
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.5
}

/**
 * Gets the appropriate text color for a given background color
 * Returns 'black' for light backgrounds, 'white' for dark backgrounds
 */
export function getContrastTextColor(backgroundColor: string): 'black' | 'white' {
  return isLightColor(backgroundColor) ? 'black' : 'white'
}

/**
 * Generates CSS custom properties for portal theming
 */
export function generatePortalTheme(brandColor: string) {
  const isLight = isLightColor(brandColor)
  const textColor = isLight ? 'black' : 'white'
  
  return {
    '--portal-primary': brandColor,
    '--portal-primary-hover': adjustBrightness(brandColor, -20),
    '--portal-text-primary': textColor,
    '--portal-text-secondary': isLight ? '#374151' : '#E5E7EB',
    '--portal-bg-primary': brandColor,
    '--portal-bg-secondary': isLight ? '#F9FAFB' : '#1F2937',
    '--portal-border': isLight ? '#E5E7EB' : '#374151',
  }
}

/**
 * Adjusts the brightness of a hex color
 * Positive values make it lighter, negative values make it darker
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const { r, g, b } = rgb
  const factor = percent / 100
  
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)))
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)))
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)))
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

/**
 * Generates a lighter shade of the brand color for backgrounds
 */
export function getLightShade(hex: string, opacity: number = 0.1): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const { r, g, b } = rgb
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Generates CSS classes for portal theming
 */
export function getPortalThemeClasses(brandColor: string) {
  const isLight = isLightColor(brandColor)
  const textColor = isLight ? 'black' : 'white'
  
  return {
    primary: `bg-[${brandColor}] text-${textColor}`,
    primaryHover: `hover:bg-[${adjustBrightness(brandColor, -20)}]`,
    primaryText: `text-[${brandColor}]`,
    lightShade: `bg-[${getLightShade(brandColor, 0.1)}]`,
    lightShadeText: `text-[${brandColor}]`,
    border: isLight ? 'border-gray-200' : 'border-gray-600',
    background: isLight ? 'bg-gray-50' : 'bg-gray-900',
  }
}
