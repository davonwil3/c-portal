# Portfolio Builder

A comprehensive portfolio builder with **real template variations**, live preview, and inline editing capabilities.

## 🎨 NEW: Template System

### Onboarding Experience
When users visit the portfolio builder for the first time, they see a **beautiful template selection page** featuring:
- Stunning gradient backgrounds
- Animated card reveals
- Detailed template previews
- Feature lists for each template
- Professional SaaS-style UI

### Real Template Variations
Each template is **completely different** - not just color themes:

#### 1. **Minimal Professional** (Based on your design)
- Large, elegant typography ("About me," style heading)
- Full-width hero images (600px height)
- Two-column text layouts
- Alternating project layouts
- Clean, sophisticated spacing
- Black text on white background
- Perfect for designers and creatives

#### 2. **Creative Portfolio**
- Centered hero with gradient name
- Colorful gradient service cards
- Masonry-style project grid
- Hover overlays on images
- Vibrant purple/pink/orange gradients
- Star ratings in testimonials
- Perfect for artists and creative professionals

#### 3. **Corporate Professional**
- Sticky navigation bar
- Split-screen hero layout
- Structured service cards with icons
- Full-width case study layouts
- Dark blue testimonials section
- Professional footer
- Perfect for consultants and agencies

#### 4. **Dark Mode Elite**
- Dark background (gray-950)
- Animated grid pattern overlay
- Cyan/blue gradient accents
- Terminal-style elements
- Neon hover effects
- Tech-focused design
- Perfect for developers and tech professionals

## Features

### 1. Template Selection (NEW!)
- **Beautiful onboarding page** for first-time users
- Choose from 4 distinct template designs
- Preview mockups for each template
- Feature lists and descriptions
- One-click template selection
- Templates are fully customizable after selection

### 2. Full-Page Live Preview (NEW!)
- **No more weird blocks!** Preview looks like a real website
- Full-width, full-height rendering
- Each template renders completely differently
- Floating edit/view toggle button
- Seamless scrolling experience
- Real website appearance

### 3. Header Bar (Sticky)
- Template name display
- Template switcher dropdown
- Status badge (Draft/Published)
- Public URL with copy button
- Action buttons: Preview, Reset, Save, Publish

### 4. Main Workspace (2-Column Layout)

#### A. Left: Full-Page Live Preview
- **Renders actual template components** - not generic blocks
- **Full-page display** - looks like a real website
- **Edit Mode Toggle**: Floating button to switch between View and Edit
- **Inline Editing**: Click text to edit directly in place
- **Inline Image Replace**: Hover over images to upload new ones
- **Template-specific layouts**: Each template has unique structure

#### B. Right: Control Panel
Collapsible accordion sections:
- **Template**: Switch between templates (keeps content)
- **Appearance**: Colors, fonts, layout, spacing
- **Modules**: Show/hide and reorder sections
- **Content**: Quick add/edit for services, projects, testimonials
- **Branding**: Logo, banner uploads
- **Behavior**: Privacy settings, CTA toggles
- **SEO**: Meta tags and social sharing

### 5. Modals/Drawers
- **Service Modal**: Add/edit services with tags and pricing
- **Project Modal**: Add/edit projects with cover images
- **Testimonial Modal**: Add/edit client testimonials
- **Share Modal**: View and copy public portfolio URL

### 6. Footer Bar
- Appears when there are unsaved changes
- Unsaved changes indicator (animated pulse)
- Actions: Discard, Save, Publish

### 7. Global UI Elements
- **Toast Notifications**: Success messages for all actions
- **Smooth Animations**: CSS-based fade-ins and slides
- **Professional Design**: Modern SaaS aesthetics

## Component Structure

### Main Components
- `page.tsx` - Main portfolio builder with template selection logic
- `PortfolioPreview.tsx` - Template router component
- `ControlPanel.tsx` - Right sidebar controls

### Template Components (NEW!)
- `templates/MinimalTemplate.tsx` - Professional minimal design
- `templates/CreativeTemplate.tsx` - Vibrant creative layout
- `templates/ProfessionalTemplate.tsx` - Corporate business design
- `templates/DarkTemplate.tsx` - Dark mode with tech aesthetics

### Onboarding Components (NEW!)
- `TemplateSelector.tsx` - Beautiful template selection page

### Utility Components
- `InlineText.tsx` - Contenteditable text fields
- `InlineImageReplace.tsx` - Image upload with hover overlay

### Modal Components
- `TemplateModal.tsx` - Template switching confirmation
- `ServiceModal.tsx` - Service add/edit form
- `ProjectModal.tsx` - Project add/edit form
- `TestimonialModal.tsx` - Testimonial add/edit form
- `ShareModal.tsx` - Share portfolio URL

## Usage Flow

### First-Time User
1. Navigate to `/dashboard/portfolio`
2. See beautiful template selection page
3. Choose a template style
4. Automatically enter builder with chosen template
5. Start customizing content

### Returning User
1. Navigate to `/dashboard/portfolio`
2. Builder opens with saved template
3. Toggle Edit mode to modify content
4. Use control panel for advanced settings
5. Save and publish when ready

## Key Improvements

✅ **Real Templates**: Each template is completely unique (not just colors)
✅ **Professional Onboarding**: Beautiful SaaS-style template selection
✅ **Full-Page Preview**: No more blocks - looks like a real website
✅ **Based on Design**: Minimal template matches provided design concept
✅ **Floating Edit Toggle**: Doesn't interfere with preview
✅ **No Dependencies**: Removed framer-motion, using pure CSS animations
✅ **Inline Editing**: Edit text and images directly in preview
✅ **Responsive Design**: All templates work on all devices

## Template Customization

After selecting a template, users can:
- Change colors and fonts (Appearance panel)
- Show/hide sections (Modules panel)
- Reorder content sections
- Add/edit/delete services, projects, testimonials
- Upload custom images and branding
- Customize SEO settings
- Switch to a different template (keeps content)

## Technical Details

- **Template System**: Component-based with props interface
- **State Management**: React hooks with centralized data
- **Inline Editing**: ContentEditable with controlled inputs
- **Image Upload**: File reader with base64 encoding
- **Animations**: CSS-based (animate-in, fade-in, slide-in)
- **Layout**: Flexbox with full-height preview panel
- **Styling**: Tailwind CSS with template-specific overrides

## Future Enhancements

- Database persistence for portfolios
- More template options
- Template marketplace
- Custom CSS injection
- Domain mapping for published portfolios
- Analytics integration
- A/B testing for different templates
