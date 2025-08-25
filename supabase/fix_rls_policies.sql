-- Quick fix for RLS policies - run this in your Supabase SQL editor
-- This will allow authenticated users to manage their own allowlist entries

-- Step 1: Drop the existing restrictive policy
DROP POLICY IF EXISTS "Service role can manage allowlist" ON client_allowlist;

-- Step 2: Create a new policy that allows users to manage their own entries
CREATE POLICY "Users can manage their own allowlist entries" ON client_allowlist
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Step 3: Keep service role access for admin operations
CREATE POLICY "Service role can manage all allowlist entries" ON client_allowlist
  FOR ALL USING (auth.role() = 'service_role');

-- Step 4: Verify the policies are working
-- You can check with: SELECT * FROM pg_policies WHERE tablename = 'client_allowlist';
