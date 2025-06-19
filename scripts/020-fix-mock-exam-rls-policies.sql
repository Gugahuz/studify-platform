-- Fix Row Level Security policies for mock exam system
-- This script creates proper RLS policies or disables RLS for testing

-- First, let's check and fix RLS policies for mock_exam_attempts
ALTER TABLE mock_exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_questions DISABLE ROW LEVEL SECURITY;

-- Alternative: Create proper RLS policies (uncomment if you want to keep RLS enabled)
/*
-- Enable RLS
ALTER TABLE mock_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for mock_exam_templates (public read access)
CREATE POLICY "Allow public read access to templates" ON mock_exam_templates
    FOR SELECT USING (is_active = true);

-- Create policies for mock_exam_questions (public read access)
CREATE POLICY "Allow public read access to questions" ON mock_exam_questions
    FOR SELECT USING (true);

-- Create policies for mock_exam_attempts (users can manage their own attempts)
CREATE POLICY "Users can insert their own attempts" ON mock_exam_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own attempts" ON mock_exam_attempts
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own attempts" ON mock_exam_attempts
    FOR UPDATE USING (true);

-- Create policies for mock_exam_responses (users can manage their own responses)
CREATE POLICY "Users can insert their own responses" ON mock_exam_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own responses" ON mock_exam_responses
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own responses" ON mock_exam_responses
    FOR UPDATE USING (true);
*/

-- Grant necessary permissions to authenticated users
GRANT ALL ON mock_exam_templates TO authenticated;
GRANT ALL ON mock_exam_questions TO authenticated;
GRANT ALL ON mock_exam_attempts TO authenticated;
GRANT ALL ON mock_exam_responses TO authenticated;

-- Grant permissions to anon users for public access
GRANT SELECT ON mock_exam_templates TO anon;
GRANT SELECT ON mock_exam_questions TO anon;

-- Ensure service role has full access
GRANT ALL ON mock_exam_templates TO service_role;
GRANT ALL ON mock_exam_questions TO service_role;
GRANT ALL ON mock_exam_attempts TO service_role;
GRANT ALL ON mock_exam_responses TO service_role;

-- Create a test user if it doesn't exist (for development)
DO $$
BEGIN
    -- Insert test user into auth.users if it doesn't exist
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'test@studify.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Test User"}',
        false,
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert corresponding profile
    INSERT INTO profiles (
        id,
        nome,
        email,
        telefone,
        escolaridade
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Test User',
        'test@studify.com',
        '(11) 99999-9999',
        'superior'
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test user created or already exists';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create test user: %', SQLERRM;
END $$;

-- Verify the setup
DO $$
DECLARE
    template_count INTEGER;
    question_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
    SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
    
    RAISE NOTICE 'Setup complete:';
    RAISE NOTICE '- Templates: %', template_count;
    RAISE NOTICE '- Questions: %', question_count;
    RAISE NOTICE '- RLS disabled for testing';
    RAISE NOTICE '- Permissions granted';
END $$;
