# Lead Forms Setup Guide

This guide will help you set up the Lead Workflow Forms functionality.

## What's Been Implemented

### 1. Database Schema (`supabase/lead_forms_schema.sql`)
- **`lead_forms` table**: Stores all lead and project forms
- **`lead_form_submissions` table**: Stores all form submissions
- Features:
  - Form type support (Lead or Project)
  - Project linking
  - Submission tracking and analytics
  - Tag system for organizing submissions (New, Qualified, Reviewed, Custom)
  - Auto-incrementing submission numbers
  - Automatic submission count updates

### 2. API Functions (`lib/lead-forms.ts`)
- `getLeadForms()`: Fetch all lead forms for the current account
- `getLeadFormsByType()`: Filter forms by type (Lead/Project/All)
- `getLeadFormSubmissions()`: Get all submissions for a specific form
- `createLeadForm()`: Create a new lead form
- `updateLeadForm()`: Update form details
- `updateLeadFormStatus()`: Change form status (draft/published/archived)
- `deleteLeadForm()`: Delete a form
- `submitLeadForm()`: Submit a form response
- `updateSubmissionTag()`: Update the tag on a submission

### 3. Updated FormsSection Component
The Forms section now:
- Fetches real data from the database
- Shows both lead forms (from `lead_forms` table) and project forms (from `forms` table)
- Displays actual submissions when clicking "View Submissions"
- Handles all form field types:
  - Text fields
  - Email fields
  - Phone fields
  - Budget fields
  - Rating fields (displays as stars)
  - Long text fields (Notes, Project Scope, etc.) - expandable
  - Custom fields
- Supports tagging submissions (New, Qualified, Reviewed, Custom)
- Export submissions to CSV with all fields
- Loading states and error handling

## Setup Instructions

### Step 1: Run the Database Migration

Execute the SQL schema in your Supabase database:

```bash
# Option 1: Using Supabase CLI
supabase db push supabase/lead_forms_schema.sql

# Option 2: Copy and paste the contents of lead_forms_schema.sql into your Supabase SQL editor
```

### Step 2: Verify Database Tables

Check that the following tables were created:
- `lead_forms`
- `lead_form_submissions`

And verify the RLS policies are in place.

### Step 3: Test the Functionality

1. Navigate to `/dashboard/lead-workflow?active=forms`
2. Click "New Form" to create a form (currently redirects to form builder)
3. Once you have forms in the database, they will appear in the table
4. Click "View" in the "View Submissions" column to see all submissions
5. Use the tag system to organize submissions (New, Qualified, Reviewed, etc.)

## How It Works

### Forms Display

The FormsSection component now fetches forms from two sources:
1. **Lead Forms**: From the `lead_forms` table (for Lead and Project forms created in the lead workflow)
2. **Project Forms**: From the regular `forms` table (for forms associated with specific projects)

Forms are combined and displayed in a unified table with:
- Form name
- Type (Lead or Project)
- Linked project (if applicable)
- Submission count
- Embed link
- Status (Active/Draft/Archived)

### Submissions View

When you click "View" on a form with submissions:
1. Fetches all submissions from `lead_form_submissions` table
2. Displays each submission with:
   - Respondent name and email
   - Submission date
   - Tag (New, Qualified, Reviewed, etc.)
   - All form field responses
3. Long text fields (Notes, Project Scope, etc.) are expandable
4. Rating fields display as stars (e.g., "4/5 ⭐")
5. Budget and other special fields are properly formatted

### Field Type Handling

The system automatically detects and handles:
- **Short text**: Displayed in a 2-column grid
- **Long text**: Displayed full-width with expand/collapse
- **Rating fields**: Object with `rating` property → displays as "X/5 ⭐"
- **Budget fields**: Displays the budget value
- **Custom objects**: JSON stringified if no special handling

### Tag System

Submissions can be tagged for organization:
- **New**: Default tag for new submissions (amber color)
- **Qualified**: For qualified leads (emerald color)
- **Reviewed**: For reviewed submissions (violet color)
- **Custom**: Create your own tags with custom colors

## Integration with Form Builder

To fully integrate with your form builder:

1. Update the form builder to save to `lead_forms` table when creating Lead/Project forms
2. Update the form builder to handle the `form_type` field
3. Ensure the form builder can edit existing lead forms
4. Make sure the public form submission page saves to `lead_form_submissions` table

## Project Forms Integration

For showing forms related to a specific project:
```typescript
// The component already filters by project
// Just pass the project_id when fetching:
const projectForms = await getProjectForms(projectId)
```

## Next Steps

1. **Run the migration** (Step 1 above)
2. **Test with sample data**: You can insert test forms directly in Supabase
3. **Connect your form builder** to save to the `lead_forms` table
4. **Set up form submission endpoint** to save responses to `lead_form_submissions`

## Sample SQL for Testing

```sql
-- Create a sample lead form
INSERT INTO lead_forms (
  account_id,
  title,
  description,
  form_structure,
  status,
  form_type,
  embed_link,
  created_by,
  created_by_name
) VALUES (
  'YOUR_ACCOUNT_ID',
  'General Lead Inquiry',
  'Capture basic lead information',
  '{"fields": [{"id": "1", "type": "text", "label": "Full Name", "required": true}, {"id": "2", "type": "email", "label": "Email", "required": true}, {"id": "3", "type": "text", "label": "Budget", "required": false}]}',
  'published',
  'Lead',
  'https://yoursite.com/forms/lead-inquiry',
  'YOUR_USER_ID',
  'Your Name'
);

-- Create a sample submission
INSERT INTO lead_form_submissions (
  form_id,
  respondent_name,
  respondent_email,
  responses,
  tag,
  tag_color
) VALUES (
  'FORM_ID_FROM_ABOVE',
  'John Doe',
  'john@example.com',
  '{"Full Name": "John Doe", "Email": "john@example.com", "Budget": "$10,000 - $25,000"}',
  'New',
  '#f59e0b'
);
```

## Troubleshooting

### Forms not showing up
- Check that you've run the migration
- Verify RLS policies are in place
- Check browser console for errors

### Submissions not loading
- Verify the form has submissions in the database
- Check that the form_id matches
- Look for errors in the browser console

### Export not working
- Make sure submissions have data
- Check browser console for errors
- Verify the form has a valid name

## Features

✅ Database schema for lead forms and submissions  
✅ API functions for CRUD operations  
✅ Real-time data fetching  
✅ All form field type support (text, rating, budget, etc.)  
✅ Submission tagging system  
✅ CSV export with all fields  
✅ Loading states and error handling  
✅ Project linking support  
✅ Form status management (draft/published/archived)  
✅ Auto-incrementing submission numbers  
✅ Expandable long text fields  

## Support

If you encounter any issues, check:
1. Database connection
2. RLS policies
3. Browser console for errors
4. Network tab for failed requests
