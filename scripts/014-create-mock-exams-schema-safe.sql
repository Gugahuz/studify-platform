-- Purpose: Creates comprehensive mock exam system with safe execution
-- Handles existing policies and ensures clean installation

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies for mock_exam_templates
    DROP POLICY IF EXISTS "Mock exam templates are publicly viewable" ON public.mock_exam_templates;
    DROP POLICY IF EXISTS "Users can manage their own templates" ON public.mock_exam_templates;
    
    -- Drop policies for mock_exam_questions  
    DROP POLICY IF EXISTS "Questions are viewable for active templates" ON public.mock_exam_questions;
    DROP POLICY IF EXISTS "Users can manage questions for their templates" ON public.mock_exam_questions;
    
    -- Drop policies for mock_exam_attempts
    DROP POLICY IF EXISTS "Users can manage their own attempts" ON public.mock_exam_attempts;
    
    -- Drop policies for mock_exam_responses
    DROP POLICY IF EXISTS "Users can manage responses for their attempts" ON public.mock_exam_responses;
    
    -- Drop policies for mock_exam_analytics
    DROP POLICY IF EXISTS "Users can view their own analytics" ON public.mock_exam_analytics;
    
    RAISE NOTICE 'Existing policies dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not have existed: %', SQLERRM;
END $$;

-- Mock Exam Templates (Reusable exam structures)
CREATE TABLE IF NOT EXISTS public.mock_exam_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.flashcard_subjects(id) ON DELETE SET NULL,
    category VARCHAR(100) DEFAULT 'general', -- 'enem', 'vestibular', 'concurso', 'general'
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    time_limit_minutes INTEGER DEFAULT 60,
    total_questions INTEGER DEFAULT 0,
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.mock_exam_templates IS 'Reusable mock exam templates with configuration';

-- Mock Exam Questions (Questions for each template)
CREATE TABLE IF NOT EXISTS public.mock_exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.mock_exam_templates(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank')),
    options JSONB, -- For multiple choice: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    subject_area VARCHAR(100),
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    points DECIMAL(5,2) DEFAULT 1.00,
    time_estimate_seconds INTEGER DEFAULT 120,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, question_number)
);
COMMENT ON TABLE public.mock_exam_questions IS 'Questions for mock exam templates';

-- Mock Exam Attempts (User attempts at mock exams)
CREATE TABLE IF NOT EXISTS public.mock_exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.mock_exam_templates(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'paused', 'completed', 'abandoned')),
    score DECIMAL(5,2) DEFAULT 0.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    total_questions INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    skipped_questions INTEGER DEFAULT 0,
    total_points DECIMAL(8,2) DEFAULT 0.00,
    max_points DECIMAL(8,2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    time_limit_seconds INTEGER DEFAULT 3600,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.mock_exam_attempts IS 'User attempts at mock exams with detailed tracking';

-- Mock Exam Responses (User answers to specific questions)
CREATE TABLE IF NOT EXISTS public.mock_exam_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.mock_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.mock_exam_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);
COMMENT ON TABLE public.mock_exam_responses IS 'User responses to mock exam questions';

-- Mock Exam Performance Analytics (Aggregated performance data)
CREATE TABLE IF NOT EXISTS public.mock_exam_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.mock_exam_templates(id) ON DELETE CASCADE,
    subject_area VARCHAR(100),
    total_attempts INTEGER DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    total_time_spent INTEGER DEFAULT 0,
    improvement_trend DECIMAL(5,2) DEFAULT 0.00, -- Positive = improving, Negative = declining
    weak_areas TEXT[],
    strong_areas TEXT[],
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id, subject_area)
);
COMMENT ON TABLE public.mock_exam_analytics IS 'Performance analytics for mock exams';

-- Create indexes safely
DO $$ 
BEGIN
    -- Create indexes if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_templates_category') THEN
        CREATE INDEX idx_mock_exam_templates_category ON public.mock_exam_templates(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_templates_subject') THEN
        CREATE INDEX idx_mock_exam_templates_subject ON public.mock_exam_templates(subject_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_templates_active') THEN
        CREATE INDEX idx_mock_exam_templates_active ON public.mock_exam_templates(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_questions_template') THEN
        CREATE INDEX idx_mock_exam_questions_template ON public.mock_exam_questions(template_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_attempts_user') THEN
        CREATE INDEX idx_mock_exam_attempts_user ON public.mock_exam_attempts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_attempts_template') THEN
        CREATE INDEX idx_mock_exam_attempts_template ON public.mock_exam_attempts(template_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_attempts_status') THEN
        CREATE INDEX idx_mock_exam_attempts_status ON public.mock_exam_attempts(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_responses_attempt') THEN
        CREATE INDEX idx_mock_exam_responses_attempt ON public.mock_exam_responses(attempt_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mock_exam_analytics_user') THEN
        CREATE INDEX idx_mock_exam_analytics_user ON public.mock_exam_analytics(user_id);
    END IF;
    
    RAISE NOTICE 'Indexes created successfully';
END $$;

-- Drop existing triggers and functions safely
DROP TRIGGER IF EXISTS trigger_update_template_questions_count ON public.mock_exam_questions;
DROP TRIGGER IF EXISTS trigger_update_attempt_stats ON public.mock_exam_responses;
DROP FUNCTION IF EXISTS update_mock_exam_template_questions_count();
DROP FUNCTION IF EXISTS update_mock_exam_attempt_stats();

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_mock_exam_template_questions_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.mock_exam_templates 
    SET total_questions = (
        SELECT COUNT(*) 
        FROM public.mock_exam_questions 
        WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_questions_count
    AFTER INSERT OR UPDATE OR DELETE ON public.mock_exam_questions
    FOR EACH ROW EXECUTE FUNCTION update_mock_exam_template_questions_count();

-- Function to update attempt statistics
CREATE OR REPLACE FUNCTION update_mock_exam_attempt_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.mock_exam_attempts 
    SET 
        answered_questions = (
            SELECT COUNT(*) 
            FROM public.mock_exam_responses 
            WHERE attempt_id = NEW.attempt_id AND user_answer IS NOT NULL
        ),
        correct_answers = (
            SELECT COUNT(*) 
            FROM public.mock_exam_responses 
            WHERE attempt_id = NEW.attempt_id AND is_correct = true
        ),
        incorrect_answers = (
            SELECT COUNT(*) 
            FROM public.mock_exam_responses 
            WHERE attempt_id = NEW.attempt_id AND is_correct = false AND user_answer IS NOT NULL
        ),
        skipped_questions = (
            SELECT COUNT(*) 
            FROM public.mock_exam_responses 
            WHERE attempt_id = NEW.attempt_id AND user_answer IS NULL
        ),
        total_points = (
            SELECT COALESCE(SUM(points_earned), 0) 
            FROM public.mock_exam_responses 
            WHERE attempt_id = NEW.attempt_id
        ),
        updated_at = NOW()
    WHERE id = NEW.attempt_id;
    
    -- Update percentage
    UPDATE public.mock_exam_attempts 
    SET percentage = CASE 
        WHEN total_questions > 0 THEN (correct_answers::DECIMAL / total_questions::DECIMAL) * 100 
        ELSE 0 
    END
    WHERE id = NEW.attempt_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attempt_stats
    AFTER INSERT OR UPDATE ON public.mock_exam_responses
    FOR EACH ROW EXECUTE FUNCTION update_mock_exam_attempt_stats();

-- Enable RLS and create policies
ALTER TABLE public.mock_exam_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mock exam templates are publicly viewable" ON public.mock_exam_templates 
    FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage their own templates" ON public.mock_exam_templates 
    FOR ALL USING (auth.uid() = created_by);

ALTER TABLE public.mock_exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable for active templates" ON public.mock_exam_questions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mock_exam_templates 
            WHERE id = template_id AND is_active = true
        )
    );
CREATE POLICY "Users can manage questions for their templates" ON public.mock_exam_questions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mock_exam_templates 
            WHERE id = template_id AND created_by = auth.uid()
        )
    );

ALTER TABLE public.mock_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own attempts" ON public.mock_exam_attempts 
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.mock_exam_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage responses for their attempts" ON public.mock_exam_responses 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mock_exam_attempts 
            WHERE id = attempt_id AND user_id = auth.uid()
        )
    );

ALTER TABLE public.mock_exam_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analytics" ON public.mock_exam_analytics 
    FOR ALL USING (auth.uid() = user_id);

-- Insert sample mock exam templates (only if they don't exist)
INSERT INTO public.mock_exam_templates (title, description, category, difficulty_level, time_limit_minutes, passing_score, instructions)
SELECT * FROM (VALUES
    ('ENEM 2024 - Simulado Completo', 'Simulado completo baseado no formato do ENEM com questões de todas as áreas', 'enem', 4, 270, 60.0, 'Este simulado segue o formato oficial do ENEM. Leia atentamente cada questão e marque apenas uma alternativa.'),
    ('Matemática Básica - Nível Fundamental', 'Questões fundamentais de matemática para ensino fundamental', 'fundamental', 2, 60, 70.0, 'Resolva as questões de matemática básica. Você pode usar rascunho.'),
    ('Português - Interpretação de Texto', 'Simulado focado em interpretação e compreensão textual', 'vestibular', 3, 90, 65.0, 'Leia os textos com atenção e responda às questões de interpretação.'),
    ('Física - Mecânica Clássica', 'Questões de física focadas em mecânica, cinemática e dinâmica', 'vestibular', 4, 120, 60.0, 'Simulado de física com foco em mecânica clássica. Fórmulas básicas serão fornecidas quando necessário.'),
    ('História do Brasil - República', 'Questões sobre o período republicano brasileiro', 'concurso', 3, 75, 70.0, 'Simulado sobre história do Brasil no período republicano, desde a Proclamação até os dias atuais.')
) AS v(title, description, category, difficulty_level, time_limit_minutes, passing_score, instructions)
WHERE NOT EXISTS (
    SELECT 1 FROM public.mock_exam_templates WHERE title = v.title
);

SELECT '014-create-mock-exams-schema-safe.sql executed successfully.' AS status;
