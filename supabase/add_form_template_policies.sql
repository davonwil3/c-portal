-- =====================================================
-- ADD MISSING FORM TEMPLATE POLICIES
-- This adds UPDATE and DELETE policies for form_templates
-- =====================================================

-- Add UPDATE policy for form templates
CREATE POLICY "Users can update form templates in their account" ON public.form_templates
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add DELETE policy for form templates
CREATE POLICY "Users can delete form templates in their account" ON public.form_templates
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

-- Run this SQL in your Supabase SQL Editor to add the missing policies
-- This will allow users to update and delete their own templates
