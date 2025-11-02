# Minimalist Portfolio Template

## Overview
The Minimalist template is a clean, content-focused portfolio design inspired by modern design principles. It emphasizes simplicity, readability, and professional presentation without excessive design flair.

## Design Features

### Visual Elements
- **Single Background Color**: Entire page uses one customizable background color for true minimalism
- **Clean Navigation Header**: Fixed header with logo, navigation links, and CTA button
- **Minimal Color Palette**: Single background with black text and accent colors
- **Simple Typography**: Moderate, readable font sizes with clear hierarchy
- **Border-based Design**: Uses subtle borders and spacing instead of heavy shadows or alternating sections
- **Content-First Approach**: Design stays out of the way to highlight your work

### Layout Structure
1. **Header Navigation**
   - Logo/brand identifier
   - Navigation links (About, Services, Work, Contact)
   - Primary CTA button

2. **Hero Section**
   - Image on left (3:4 aspect ratio)
   - Content on right with large heading and bio
   - Side-by-side layout on desktop, stacked on mobile

3. **About/Career Section**
   - Two-column layout
   - Heading on left, content on right
   - Skill tags displayed as bordered labels
   - Light gray background for section separation

4. **Services Section**
   - Grid layout (3 columns on desktop)
   - Bordered cards with hover effects
   - Clean typography and pricing display

5. **Projects/Work Section**
   - 2-column grid layout
   - Image-first presentation
   - Clean project cards with hover states
   - Tags and links included

6. **Testimonials Section**
   - 2-column layout
   - Left border accent (uses primary color)
   - Italic quotes with author attribution

7. **Contact Section**
   - Centered layout
   - Contact info on left with icon badges
   - Contact form on right
   - Clean form styling

8. **Footer**
   - Simple copyright and social links
   - Minimal design

## Key Differences from Aura Template

| Feature | Aura | Minimalist |
|---------|------|------------|
| Navigation | Top-right logo only | Full header navigation bar |
| Hero Layout | Large image below text | Side-by-side image and text |
| Visual Style | Gradient accents, large typography | Borders, clean lines, minimal |
| Section Backgrounds | Alternating colored sections | **Single background color throughout** |
| Cards | Gradient backgrounds, shadows | Semi-transparent with borders, subtle shadows |
| Typography Scale | Very large (8xl headings) | Moderate (3xl-5xl) |
| Spacing | Very generous | Balanced and efficient |
| Footer | None visible | Clean footer with links |
| Background Color | Fixed white | **Customizable single color** |

## Module Support

All standard portfolio modules are supported:
- ✅ Hero
- ✅ About
- ✅ Services
- ✅ Projects
- ✅ Testimonials
- ✅ Contact

## Customization Options

The template fully supports all portfolio builder features:
- **Background Color**: Unique to minimalist template - choose any background color for the entire page
- **Colors**: Primary and secondary color customization for accents and CTAs
- **Fonts**: All font options supported
- **Content Editing**: Inline text editing throughout
- **Image Replacement**: Click to replace images in edit mode
- **Icon Customization**: Click icons to change in edit mode
- **Module Management**: Add/edit/delete services, projects, testimonials
- **Contact Items**: Add/edit/delete contact information

### Background Color Feature
The minimalist template includes a **Background Color** selector in the Appearance panel that only appears when using this template. This allows you to:
- Set a single, consistent background color for the entire page
- Default color is a warm light gray (#f5f5f0) inspired by the reference design
- Change to any color to match your brand (white, cream, light blue, etc.)
- Create a truly cohesive, minimalist aesthetic

## Usage

1. **Select Template**: Click "Change Template" in the portfolio builder
2. **Choose Minimalist**: Click "Use Minimalist" button
3. **Customize**: Use edit mode to customize content, colors, and images
4. **Save & Publish**: Save your changes and publish your portfolio

## Technical Implementation

### Files Created
- `MinimalistTemplate.tsx` - Main template component

### Files Modified
- `PortfolioPreview.tsx` - Added template switching logic
- `TemplateSelector.tsx` - Added minimalist template option
- `page.tsx` - Updated template selection handling

### Integration
The template is fully integrated with the existing portfolio builder infrastructure:
- Uses same data structure as other templates
- Supports all editing features
- Maintains data consistency when switching templates
- Plug-and-play with no data loss

## Design Inspiration

The template is inspired by the provided design concept featuring:
- Sebastian Petrovic's portfolio design
- Clean navigation header
- Side-by-side hero layout
- Skill tags presentation
- Minimal, content-focused approach
- Professional, modern aesthetic

## Browser Support

Same as the main application - supports all modern browsers with full responsive design for mobile, tablet, and desktop viewports.

