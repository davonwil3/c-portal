# Portal Theming and Bucket Storage Setup

This guide walks you through setting up dynamic brand theming and bucket storage for portal logos.

## 1. Database Setup

Run the SQL script to add logo_url column and create the storage bucket:

```sql
-- Run this in your Supabase SQL editor
\i add_logo_url_to_portal_settings.sql
```

This will:
- Add `logo_url` column to `portal_settings` table
- Create `portal-logos` storage bucket
- Set up RLS policies for the bucket

## 2. Features Implemented

### Dynamic Brand Theming
- **Color Contrast Detection**: Automatically determines if text should be black or white based on background color
- **Theme Classes**: Dynamic CSS classes that adapt to the brand color
- **Consistent Styling**: All portal elements use the brand color throughout

### Bucket Storage for Logos
- **File Upload**: Portal logos are uploaded to Supabase Storage instead of base64
- **File Validation**: Validates file type (JPEG, PNG, SVG, WebP) and size (5MB max)
- **Public URLs**: Generates public URLs for logo display
- **Automatic Cleanup**: Replaces old logos when new ones are uploaded

### Color Utilities
The `lib/color-utils.ts` file provides:
- `isLightColor(hex)`: Determines if a color is light or dark
- `getContrastTextColor(hex)`: Returns 'black' or 'white' for optimal contrast
- `getPortalThemeClasses(hex)`: Generates CSS classes for theming
- `adjustBrightness(hex, percent)`: Lightens or darkens colors
- `getLightShade(hex, opacity)`: Creates light background shades

### Storage Utilities
The `lib/storage.ts` file provides:
- `uploadPortalLogo(file, portalId)`: Uploads logo to bucket
- `deletePortalLogo(portalId)`: Removes logo from bucket
- `getPortalLogoUrl(path)`: Gets public URL for logo
- `validateLogoFile(file)`: Validates file before upload

## 3. How It Works

### Portal Settings Page
1. User selects a logo file
2. File is validated (type, size)
3. On save, file is uploaded to `portal-logos/{portalId}/logo.{ext}`
4. The bucket path is stored in `portal_settings.logo_url`
5. Public URL is generated for display

### Portal Pages
1. Portal settings are fetched on page load
2. Brand color and logo URL are extracted
3. Theme classes are calculated based on brand color
4. All UI elements use dynamic colors and logo

### Color Contrast
- Light colors (luminance > 0.5) use black text
- Dark colors (luminance ≤ 0.5) use white text
- Based on WCAG accessibility guidelines

## 4. Usage Examples

### Setting Brand Color
```typescript
const brandColor = '#FF6B6B' // Red color
const themeClasses = getPortalThemeClasses(brandColor)
const textColor = getContrastTextColor(brandColor) // 'white' for red

// Use in JSX
<button className={`${themeClasses.primary} ${themeClasses.primaryHover}`}>
  Click me
</button>
```

### Uploading Logo
```typescript
const handleLogoUpload = async (file: File, portalId: string) => {
  const validation = validateLogoFile(file)
  if (!validation.valid) {
    toast.error(validation.error)
    return
  }
  
  const result = await uploadPortalLogo(file, portalId)
  if (result.success) {
    setLogoUrl(result.url)
  }
}
```

### Displaying Logo
```typescript
const logoUrl = getPortalLogoUrl(portalSettings.logoUrl)
<img src={logoUrl} alt="Portal Logo" />
```

## 5. Customization

### Adding New Theme Elements
Add new properties to `getPortalThemeClasses()`:

```typescript
export function getPortalThemeClasses(brandColor: string) {
  const isLight = isLightColor(brandColor)
  const textColor = isLight ? 'black' : 'white'
  
  return {
    // ... existing classes
    customElement: `bg-[${brandColor}] text-${textColor}`,
    customHover: `hover:bg-[${adjustBrightness(brandColor, -20)}]`,
  }
}
```

### Custom Color Calculations
Extend the color utilities for specific needs:

```typescript
export function getComplementaryColor(hex: string): string {
  // Add complementary color logic
}
```

## 6. Testing

### Test Color Contrast
```typescript
// Test various colors
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000']
colors.forEach(color => {
  console.log(`${color}: ${getContrastTextColor(color)}`)
})
```

### Test Logo Upload
1. Go to portal settings
2. Upload a logo file
3. Verify it appears in the portal
4. Check Supabase Storage for the file

## 7. Troubleshooting

### Logo Not Displaying
- Check if `logo_url` is set in database
- Verify bucket permissions
- Check file path format

### Colors Not Updating
- Ensure `brandColor` state is updated
- Check if theme classes are being applied
- Verify CSS custom properties

### Upload Errors
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, SVG, WebP)
- Check Supabase Storage permissions

## 8. Performance Considerations

- Logos are cached by the browser
- Color calculations are memoized
- File uploads are optimized with proper MIME types
- RLS policies ensure secure access

## 9. Security

- All file uploads are validated
- RLS policies protect storage access
- File size limits prevent abuse
- Only authenticated users can upload logos
