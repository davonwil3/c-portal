-- =====================================================
-- PRE-MADE FORM TEMPLATES FOR FREELANCERS
-- 5 Professional Templates for Common Freelance Scenarios
-- =====================================================

-- Note: Set account_id to NULL for system templates
-- Set category to 'premade' to mark as pre-made templates
-- Set is_public to true and is_featured to true for featured templates

-- =====================================================
-- Template 1: Project Brief & Discovery Form
-- =====================================================
INSERT INTO form_templates (
  account_id,
  name,
  description,
  category,
  template_data,
  is_public,
  is_featured,
  usage_count,
  created_by,
  created_by_name,
  created_at
) VALUES (
  NULL, -- System template
  'Project Brief & Discovery',
  'Comprehensive project discovery form to gather all essential information about your client''s project, goals, timeline, and budget.',
  'premade',
  '{
    "fields": [
      {
        "id": "1",
        "type": "short-text",
        "label": "Project Name",
        "description": "What would you like to call this project?",
        "required": true,
        "placeholder": "e.g., Website Redesign, Brand Identity"
      },
      {
        "id": "2",
        "type": "paragraph",
        "label": "Project Overview",
        "description": "Please provide a brief overview of your project",
        "required": true,
        "placeholder": "Describe your project in a few sentences..."
      },
      {
        "id": "3",
        "type": "paragraph",
        "label": "Project Goals",
        "description": "What are the main goals you want to achieve with this project?",
        "required": true,
        "placeholder": "e.g., Increase conversions, improve brand awareness..."
      },
      {
        "id": "4",
        "type": "dropdown",
        "label": "Project Type",
        "description": "What type of project is this?",
        "required": true,
        "options": ["Website Design", "Website Development", "Branding", "UI/UX Design", "Marketing", "Content Creation", "Other"]
      },
      {
        "id": "5",
        "type": "short-text",
        "label": "Target Audience",
        "description": "Who is the primary audience for this project?",
        "required": true,
        "placeholder": "e.g., Young professionals aged 25-35"
      },
      {
        "id": "6",
        "type": "paragraph",
        "label": "Competitors/Inspiration",
        "description": "Are there any competitors or websites/brands you admire?",
        "required": false,
        "placeholder": "Please list URLs or company names..."
      },
      {
        "id": "7",
        "type": "budget",
        "label": "Budget Range",
        "description": "What is your estimated budget for this project?",
        "required": true,
        "options": ["$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "$50,000+"]
      },
      {
        "id": "8",
        "type": "dropdown",
        "label": "Timeline",
        "description": "When do you need this project completed?",
        "required": true,
        "options": ["ASAP (< 2 weeks)", "1 month", "2-3 months", "3-6 months", "Flexible"]
      },
      {
        "id": "9",
        "type": "paragraph",
        "label": "Additional Requirements",
        "description": "Any specific requirements, constraints, or important details?",
        "required": false,
        "placeholder": "Technical requirements, brand guidelines, etc..."
      }
    ],
    "settings": {
      "title": "Project Brief & Discovery"
    }
  }'::jsonb,
  true, -- is_public
  true, -- is_featured
  0,
  NULL,
  NULL,
  now()
);

-- =====================================================
-- Template 2: Client Intake & Onboarding Form
-- =====================================================
INSERT INTO form_templates (
  account_id,
  name,
  description,
  category,
  template_data,
  is_public,
  is_featured,
  usage_count,
  created_by,
  created_by_name,
  created_at
) VALUES (
  NULL,
  'Client Intake & Onboarding',
  'Streamlined onboarding form to collect client information, communication preferences, and project expectations.',
  'premade',
  '{
    "fields": [
      {
        "id": "1",
        "type": "short-text",
        "label": "Full Name",
        "description": "Your full name",
        "required": true,
        "placeholder": "John Doe"
      },
      {
        "id": "2",
        "type": "email",
        "label": "Email Address",
        "description": "Primary email for project communications",
        "required": true,
        "placeholder": "john@company.com"
      },
      {
        "id": "3",
        "type": "phone",
        "label": "Phone Number",
        "description": "Best contact number",
        "required": true,
        "placeholder": "+1 (555) 123-4567"
      },
      {
        "id": "4",
        "type": "short-text",
        "label": "Company Name",
        "description": "Your company or organization name",
        "required": true,
        "placeholder": "Acme Inc."
      },
      {
        "id": "5",
        "type": "short-text",
        "label": "Website",
        "description": "Your current website URL (if applicable)",
        "required": false,
        "placeholder": "https://www.yoursite.com"
      },
      {
        "id": "6",
        "type": "dropdown",
        "label": "How did you hear about us?",
        "description": "How did you find our services?",
        "required": false,
        "options": ["Google Search", "Social Media", "Referral", "Previous Client", "Other"]
      },
      {
        "id": "7",
        "type": "dropdown",
        "label": "Preferred Communication Method",
        "description": "How would you prefer to communicate?",
        "required": true,
        "options": ["Email", "Phone", "Slack", "Video Call", "In-Person"]
      },
      {
        "id": "8",
        "type": "dropdown",
        "label": "Availability for Meetings",
        "description": "What time works best for meetings?",
        "required": false,
        "options": ["Mornings (9am-12pm)", "Afternoons (12pm-5pm)", "Evenings (5pm-8pm)", "Flexible"]
      },
      {
        "id": "9",
        "type": "paragraph",
        "label": "Tell us about your business",
        "description": "Brief overview of what your company does",
        "required": true,
        "placeholder": "Describe your business, products, services..."
      },
      {
        "id": "10",
        "type": "paragraph",
        "label": "Additional Notes",
        "description": "Anything else we should know?",
        "required": false,
        "placeholder": "Special requirements, preferences, etc..."
      }
    ],
    "settings": {
      "title": "Client Intake & Onboarding"
    }
  }'::jsonb,
  true,
  true,
  0,
  NULL,
  NULL,
  now()
);

-- =====================================================
-- Template 3: Design Questionnaire
-- =====================================================
INSERT INTO form_templates (
  account_id,
  name,
  description,
  category,
  template_data,
  is_public,
  is_featured,
  usage_count,
  created_by,
  created_by_name,
  created_at
) VALUES (
  NULL,
  'Design Questionnaire',
  'In-depth design questionnaire to understand client preferences, style, brand personality, and visual direction.',
  'premade',
  '{
    "fields": [
      {
        "id": "1",
        "type": "paragraph",
        "label": "Design Vision",
        "description": "Describe your ideal design aesthetic and visual style",
        "required": true,
        "placeholder": "Modern, minimal, bold, elegant, playful..."
      },
      {
        "id": "2",
        "type": "dropdown",
        "label": "Primary Brand Color Preference",
        "description": "What color palette resonates with your brand?",
        "required": true,
        "options": ["Blue - Trust & Professional", "Green - Growth & Nature", "Red - Energy & Passion", "Purple - Creative & Luxury", "Orange - Friendly & Energetic", "Black/White - Sophisticated & Clean", "Colorful/Vibrant", "Neutral/Earthy"]
      },
      {
        "id": "3",
        "type": "paragraph",
        "label": "Brand Personality",
        "description": "If your brand was a person, how would you describe them?",
        "required": true,
        "placeholder": "Professional, approachable, innovative, traditional..."
      },
      {
        "id": "4",
        "type": "paragraph",
        "label": "Design Inspiration",
        "description": "Share links to designs/brands you love (websites, logos, etc.)",
        "required": false,
        "placeholder": "Please paste URLs or describe designs you admire..."
      },
      {
        "id": "5",
        "type": "paragraph",
        "label": "What to Avoid",
        "description": "Any design styles, colors, or elements you dislike?",
        "required": false,
        "placeholder": "e.g., Too corporate, overly colorful, etc..."
      },
      {
        "id": "6",
        "type": "dropdown",
        "label": "Typography Style",
        "description": "What typography style appeals to you?",
        "required": true,
        "options": ["Modern Sans-serif", "Classic Serif", "Geometric", "Handwritten/Script", "Bold/Display", "Mix of styles"]
      },
      {
        "id": "7",
        "type": "paragraph",
        "label": "Key Messages",
        "description": "What are the 3-5 key messages you want to communicate?",
        "required": true,
        "placeholder": "List the most important things you want people to know..."
      },
      {
        "id": "8",
        "type": "rating",
        "label": "Design Complexity Preference",
        "description": "Rate your preference: Simple & Clean (1) vs Rich & Detailed (5)",
        "required": true
      },
      {
        "id": "9",
        "type": "paragraph",
        "label": "Existing Brand Assets",
        "description": "Do you have existing logos, brand guidelines, or assets to incorporate?",
        "required": false,
        "placeholder": "Describe what you have or provide links..."
      }
    ],
    "settings": {
      "title": "Design Questionnaire"
    }
  }'::jsonb,
  true,
  true,
  0,
  NULL,
  NULL,
  now()
);

-- =====================================================
-- Template 4: Website Content & Requirements Form
-- =====================================================
INSERT INTO form_templates (
  account_id,
  name,
  description,
  category,
  template_data,
  is_public,
  is_featured,
  usage_count,
  created_by,
  created_by_name,
  created_at
) VALUES (
  NULL,
  'Website Content & Requirements',
  'Detailed form to gather website structure, content, features, and technical requirements from clients.',
  'premade',
  '{
    "fields": [
      {
        "id": "1",
        "type": "dropdown",
        "label": "Website Type",
        "description": "What type of website do you need?",
        "required": true,
        "options": ["Business/Corporate", "E-commerce", "Portfolio", "Blog", "Landing Page", "Web Application", "Other"]
      },
      {
        "id": "2",
        "type": "paragraph",
        "label": "Pages Needed",
        "description": "List all pages you need for your website",
        "required": true,
        "placeholder": "e.g., Home, About, Services, Blog, Contact, Portfolio..."
      },
      {
        "id": "3",
        "type": "paragraph",
        "label": "Key Features Required",
        "description": "What functionality does your website need?",
        "required": true,
        "placeholder": "e.g., Contact form, Newsletter signup, Blog, Search, User accounts, Payment processing..."
      },
      {
        "id": "4",
        "type": "dropdown",
        "label": "Content Management",
        "description": "Do you need to update content yourself?",
        "required": true,
        "options": ["Yes - Need easy CMS", "Some pages only", "No - I''ll hire someone", "Not sure"]
      },
      {
        "id": "5",
        "type": "paragraph",
        "label": "Content Status",
        "description": "Do you have content ready (text, images, videos)?",
        "required": true,
        "placeholder": "Describe what content you have and what you need help with..."
      },
      {
        "id": "6",
        "type": "dropdown",
        "label": "Mobile Responsiveness",
        "description": "Mobile optimization priority?",
        "required": true,
        "options": ["Critical - Mobile first", "Important", "Standard responsive", "Desktop focus"]
      },
      {
        "id": "7",
        "type": "paragraph",
        "label": "Integrations Needed",
        "description": "Any third-party tools to integrate?",
        "required": false,
        "placeholder": "e.g., Google Analytics, Mailchimp, Stripe, CRM, Social media..."
      },
      {
        "id": "8",
        "type": "dropdown",
        "label": "SEO Priority",
        "description": "How important is search engine optimization?",
        "required": true,
        "options": ["Critical - Major focus", "Important", "Nice to have", "Not a priority"]
      },
      {
        "id": "9",
        "type": "paragraph",
        "label": "Technical Requirements",
        "description": "Any specific technical requirements or hosting preferences?",
        "required": false,
        "placeholder": "Platform preferences, hosting, security requirements..."
      },
      {
        "id": "10",
        "type": "paragraph",
        "label": "Reference Websites",
        "description": "Share websites you like for functionality/layout inspiration",
        "required": false,
        "placeholder": "Paste URLs of websites you admire..."
      }
    ],
    "settings": {
      "title": "Website Content & Requirements"
    }
  }'::jsonb,
  true,
  false,
  0,
  NULL,
  NULL,
  now()
);

-- =====================================================
-- Template 5: Project Feedback & Review Form
-- =====================================================
INSERT INTO form_templates (
  account_id,
  name,
  description,
  category,
  template_data,
  is_public,
  is_featured,
  usage_count,
  created_by,
  created_by_name,
  created_at
) VALUES (
  NULL,
  'Project Feedback & Review',
  'Structured feedback form for clients to review deliverables, provide feedback, and request revisions.',
  'premade',
  '{
    "fields": [
      {
        "id": "1",
        "type": "short-text",
        "label": "Project Name",
        "description": "Which project are you reviewing?",
        "required": true,
        "placeholder": "e.g., Website Redesign"
      },
      {
        "id": "2",
        "type": "short-text",
        "label": "Deliverable Being Reviewed",
        "description": "What specific deliverable are you providing feedback on?",
        "required": true,
        "placeholder": "e.g., Homepage mockup, Logo concepts, Final website..."
      },
      {
        "id": "3",
        "type": "rating",
        "label": "Overall Satisfaction",
        "description": "Rate your overall satisfaction with this deliverable (1-5 stars)",
        "required": true
      },
      {
        "id": "4",
        "type": "paragraph",
        "label": "What You Like",
        "description": "What aspects of the deliverable do you particularly like?",
        "required": true,
        "placeholder": "Be specific about elements you love..."
      },
      {
        "id": "5",
        "type": "paragraph",
        "label": "Requested Changes",
        "description": "What changes or revisions would you like to see?",
        "required": false,
        "placeholder": "List specific changes, be as detailed as possible..."
      },
      {
        "id": "6",
        "type": "dropdown",
        "label": "Change Priority",
        "description": "How critical are these changes?",
        "required": false,
        "options": ["Must have - Critical changes", "Important - Should be addressed", "Nice to have - Minor tweaks", "Just suggestions"]
      },
      {
        "id": "7",
        "type": "paragraph",
        "label": "Additional Feedback",
        "description": "Any other thoughts, concerns, or suggestions?",
        "required": false,
        "placeholder": "Share any additional feedback..."
      },
      {
        "id": "8",
        "type": "dropdown",
        "label": "Next Steps",
        "description": "What would you like to happen next?",
        "required": true,
        "options": ["Proceed with revisions", "Approved - Move to next phase", "Schedule a call to discuss", "Need more time to review"]
      },
      {
        "id": "9",
        "type": "rating",
        "label": "Communication Rating",
        "description": "How would you rate the communication during this phase? (1-5 stars)",
        "required": false
      },
      {
        "id": "10",
        "type": "paragraph",
        "label": "Files/References",
        "description": "Any files, links, or references to share?",
        "required": false,
        "placeholder": "Paste links or describe files you''ll send separately..."
      }
    ],
    "settings": {
      "title": "Project Feedback & Review"
    }
  }'::jsonb,
  true,
  false,
  0,
  NULL,
  NULL,
  now()
);

-- =====================================================
-- Update RLS Policy for Template Deletion (if needed)
-- =====================================================

-- Make sure users can delete their own templates
-- This policy should already exist, but adding it here for reference
DROP POLICY IF EXISTS "Users can delete form templates in their account" ON public.form_templates;

CREATE POLICY "Users can delete form templates in their account" ON public.form_templates
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

-- To add these templates to your database:
-- 1. Copy and paste this entire SQL file into your Supabase SQL Editor
-- 2. Run the query
-- 3. The 5 pre-made templates will be added to your form_templates table
-- 4. They will appear in the "Pre-made Templates" section (toggle on)
-- 5. Users can use these templates but cannot delete them (account_id is NULL)

-- Template Features:
-- ✅ Project Brief & Discovery - Comprehensive project kickoff form
-- ✅ Client Intake & Onboarding - Streamlined client onboarding
-- ✅ Design Questionnaire - In-depth design preferences
-- ✅ Website Content & Requirements - Detailed website planning
-- ✅ Project Feedback & Review - Structured client feedback

-- All templates include:
-- - Professional field names and descriptions
-- - Required/optional fields
-- - Helpful placeholders
-- - Various input types (text, textarea, select, rating, budget)
-- - Optimized for freelancer workflows
