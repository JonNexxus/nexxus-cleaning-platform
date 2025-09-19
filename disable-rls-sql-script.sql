-- DISABLE RLS POLICIES FOR PRESENTATION
-- Run this in your Supabase SQL Editor to disable RLS temporarily

-- 1. Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on cleaner_profiles table  
ALTER TABLE cleaner_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on properties table
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on appointments table
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 5. Keep RLS on payments but make it permissive (optional - you can disable completely if needed)
DROP POLICY IF EXISTS "Users can view payments for their appointments" ON payments;
CREATE POLICY "Allow all access to payments" ON payments FOR ALL USING (true);

-- 6. Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 7. Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 8. Make service_types completely open (it should already be)
DROP POLICY IF EXISTS "Anyone can view service types" ON service_types;
CREATE POLICY "Allow all access to service_types" ON service_types FOR ALL USING (true);

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'cleaner_profiles', 'properties', 'appointments', 'payments', 'messages', 'reviews', 'service_types')
ORDER BY tablename;

-- Show all existing users and their roles
SELECT 
    up.email,
    up.role,
    up.first_name,
    up.last_name,
    CASE 
        WHEN cp.id IS NOT NULL THEN 'Has cleaner profile'
        ELSE 'No cleaner profile'
    END as cleaner_status
FROM user_profiles up
LEFT JOIN cleaner_profiles cp ON up.id = cp.id
ORDER BY up.role, up.email;
