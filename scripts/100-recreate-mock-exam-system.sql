-- Recreate the entire mock exam system with a simpler, more robust structure
-- This script will drop and recreate all mock exam related tables and functions

-- Drop existing tables and functions
DROP TABLE IF EXISTS mock_exam_responses CASCADE;
DROP TABLE IF EXISTS mock_exam_attempts CASCADE;
DROP TABLE IF EXISTS mock_exam_questions CASCADE;
DROP TABLE IF EXISTS mock_exam_templates CASCADE;
DROP TABLE IF EXISTS mock_exam_analytics CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS complete_exam_attempt CASCADE;
DROP FUNCTION IF EXISTS get_exam_history CASCADE;
DROP FUNCTION IF EXISTS calculate_exam_results CASCADE;
DROP FUNCTION IF EXISTS get_current_or_test_user CASCADE;
DROP FUNCTION IF EXISTS get_current_or_test_user_text CASCADE;
DROP FUNCTION IF EXISTS get_or_create_test_user CASCADE;

-- Create mock exam templates table
CREATE TABLE mock_exam_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    total_questions INTEGER NOT NULL DEFAULT 10,
    passing_score INTEGER NOT NULL DEFAULT 60,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create mock exam questions table
CREATE TABLE mock_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES mock_exam_templates(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    subject_area TEXT DEFAULT 'Geral',
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    points INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(template_id, question_number)
);

-- Create mock exam attempts table
CREATE TABLE mock_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Using TEXT to avoid auth.users dependency
    template_id UUID NOT NULL REFERENCES mock_exam_templates(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'paused', 'completed', 'abandoned')),
    score INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    answered_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_questions INTEGER NOT NULL DEFAULT 0,
    total_points DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_points DECIMAL(10,2) NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    time_limit_seconds INTEGER NOT NULL DEFAULT 3600,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create mock exam responses table
CREATE TABLE mock_exam_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES mock_exam_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT false,
    points_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX idx_mock_exam_templates_active ON mock_exam_templates(is_active, category);
CREATE INDEX idx_mock_exam_templates_featured ON mock_exam_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_mock_exam_questions_template ON mock_exam_questions(template_id, question_number);
CREATE INDEX idx_mock_exam_attempts_user ON mock_exam_attempts(user_id, status);
CREATE INDEX idx_mock_exam_attempts_completed ON mock_exam_attempts(completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_mock_exam_responses_attempt ON mock_exam_responses(attempt_id);

-- Insert sample templates
INSERT INTO mock_exam_templates (title, description, category, difficulty_level, time_limit_minutes, total_questions, passing_score, instructions, is_featured) VALUES
('ENEM - Matemática Básica', 'Simulado de matemática básica no estilo ENEM', 'enem', 2, 90, 10, 60, 'Responda todas as questões com atenção. Você tem 90 minutos para completar o simulado.', true),
('Vestibular - Português', 'Questões de português para vestibular', 'vestibular', 3, 60, 8, 70, 'Simulado focado em interpretação de texto e gramática.', true),
('Concurso Público - Raciocínio Lógico', 'Questões de raciocínio lógico para concursos', 'concurso', 4, 45, 6, 65, 'Teste seu raciocínio lógico com questões típicas de concursos públicos.', false),
('Ensino Médio - História do Brasil', 'História do Brasil para ensino médio', 'medio', 2, 50, 12, 60, 'Questões sobre os principais períodos da história brasileira.', false),
('Fundamental - Ciências', 'Ciências naturais para ensino fundamental', 'fundamental', 1, 40, 15, 55, 'Questões básicas de ciências para estudantes do fundamental.', false);

-- Insert sample questions for the first template (ENEM - Matemática Básica)
INSERT INTO mock_exam_questions (template_id, question_number, question_text, options, correct_answer, explanation, subject_area, difficulty_level, points) 
SELECT 
    t.id,
    q.question_number,
    q.question_text,
    q.options,
    q.correct_answer,
    q.explanation,
    q.subject_area,
    q.difficulty_level,
    q.points
FROM mock_exam_templates t,
(VALUES 
    (1, 'Qual é o resultado de 2 + 2 × 3?', '["6", "8", "10", "12", "14"]'::jsonb, '8', 'Primeiro multiplicação: 2 × 3 = 6, depois soma: 2 + 6 = 8', 'Matemática', 1, 1),
    (2, 'Se x + 5 = 12, qual é o valor de x?', '["5", "6", "7", "8", "9"]'::jsonb, '7', 'x + 5 = 12, então x = 12 - 5 = 7', 'Álgebra', 2, 1),
    (3, 'Qual é a área de um quadrado com lado de 4 cm?', '["8 cm²", "12 cm²", "16 cm²", "20 cm²", "24 cm²"]'::jsonb, '16 cm²', 'Área do quadrado = lado², então 4² = 16 cm²', 'Geometria', 2, 1),
    (4, 'Qual é 25% de 200?', '["25", "40", "50", "75", "100"]'::jsonb, '50', '25% de 200 = 0,25 × 200 = 50', 'Porcentagem', 1, 1),
    (5, 'Se um produto custa R$ 80 e tem desconto de 15%, qual o preço final?', '["R$ 65", "R$ 68", "R$ 70", "R$ 72", "R$ 75"]'::jsonb, 'R$ 68', 'Desconto: 15% de 80 = 12. Preço final: 80 - 12 = 68', 'Matemática Financeira', 2, 1),
    (6, 'Qual é o próximo número na sequência: 2, 4, 8, 16, ...?', '["24", "28", "30", "32", "36"]'::jsonb, '32', 'Cada número é o dobro do anterior: 16 × 2 = 32', 'Sequências', 2, 1),
    (7, 'Em uma turma de 30 alunos, 18 são meninas. Qual a porcentagem de meninos?', '["30%", "40%", "50%", "60%", "70%"]'::jsonb, '40%', 'Meninos: 30 - 18 = 12. Porcentagem: 12/30 = 0,4 = 40%', 'Estatística', 2, 1),
    (8, 'Qual é o valor de √64?', '["6", "7", "8", "9", "10"]'::jsonb, '8', '√64 = 8, pois 8² = 64', 'Radiciação', 1, 1),
    (9, 'Se 3x - 6 = 15, qual é o valor de x?', '["5", "6", "7", "8", "9"]'::jsonb, '7', '3x - 6 = 15, então 3x = 21, logo x = 7', 'Álgebra', 2, 1),
    (10, 'Qual é o perímetro de um retângulo com base 8 cm e altura 5 cm?', '["18 cm", "22 cm", "26 cm", "30 cm", "40 cm"]'::jsonb, '26 cm', 'Perímetro = 2(base + altura) = 2(8 + 5) = 2 × 13 = 26 cm', 'Geometria', 2, 1)
) AS q(question_number, question_text, options, correct_answer, explanation, subject_area, difficulty_level, points)
WHERE t.title = 'ENEM - Matemática Básica';

-- Insert sample questions for the second template (Vestibular - Português)
INSERT INTO mock_exam_questions (template_id, question_number, question_text, options, correct_answer, explanation, subject_area, difficulty_level, points) 
SELECT 
    t.id,
    q.question_number,
    q.question_text,
    q.options,
    q.correct_answer,
    q.explanation,
    q.subject_area,
    q.difficulty_level,
    q.points
FROM mock_exam_templates t,
(VALUES 
    (1, 'Qual é a função da vírgula na frase: "João, venha aqui"?', '["Separar sujeito do predicado", "Indicar vocativo", "Separar adjuntos", "Indicar aposto", "Separar orações"]'::jsonb, 'Indicar vocativo', 'A vírgula separa o vocativo "João" do resto da frase', 'Gramática', 2, 1),
    (2, 'Qual figura de linguagem está presente em "Seus olhos são duas estrelas"?', '["Metáfora", "Metonímia", "Hipérbole", "Personificação", "Ironia"]'::jsonb, 'Metáfora', 'Comparação implícita entre olhos e estrelas', 'Literatura', 2, 1),
    (3, 'Qual é o plural de "cidadão"?', '["cidadões", "cidadãos", "cidadans", "cidadães", "cidadãoes"]'::jsonb, 'cidadãos', 'Palavras terminadas em -ão fazem plural em -ãos quando oxítonas', 'Gramática', 1, 1),
    (4, 'Em qual período literário se enquadra Machado de Assis?', '["Romantismo", "Realismo", "Parnasianismo", "Simbolismo", "Modernismo"]'::jsonb, 'Realismo', 'Machado de Assis é o principal autor do Realismo brasileiro', 'Literatura', 2, 1),
    (5, 'Qual é a classe gramatical da palavra "muito" em "Ele correu muito"?', '["Adjetivo", "Substantivo", "Advérbio", "Pronome", "Verbo"]'::jsonb, 'Advérbio', 'Modifica o verbo "correu", indicando intensidade', 'Gramática', 2, 1),
    (6, 'Qual é o sujeito da oração "Choveu ontem à noite"?', '["Chuva", "Ontem", "Noite", "Oração sem sujeito", "Sujeito oculto"]'::jsonb, 'Oração sem sujeito', 'Verbos que indicam fenômenos da natureza são impessoais', 'Sintaxe', 3, 1),
    (7, 'Qual é o antônimo de "efêmero"?', '["Passageiro", "Duradouro", "Rápido", "Momentâneo", "Breve"]'::jsonb, 'Duradouro', 'Efêmero significa passageiro, seu antônimo é duradouro', 'Semântica', 2, 1),
    (8, 'Em "O livro que comprei é interessante", o termo "que" é:', '["Pronome relativo", "Conjunção", "Advérbio", "Preposição", "Interjeição"]'::jsonb, 'Pronome relativo', 'Liga duas orações e substitui "o livro"', 'Sintaxe', 3, 1)
) AS q(question_number, question_text, options, correct_answer, explanation, subject_area, difficulty_level, points)
WHERE t.title = 'Vestibular - Português';

-- Create a simple test user (using TEXT id to avoid auth dependencies)
INSERT INTO profiles (id, nome, email, telefone, escolaridade, created_at, updated_at) VALUES
('test-user-001', 'Usuário Teste', 'teste@studify.com', '(11) 99999-9999', 'superior', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Grant permissions
GRANT ALL ON mock_exam_templates TO authenticated, anon;
GRANT ALL ON mock_exam_questions TO authenticated, anon;
GRANT ALL ON mock_exam_attempts TO authenticated, anon;
GRANT ALL ON mock_exam_responses TO authenticated, anon;

-- Create simple function to get test user
CREATE OR REPLACE FUNCTION get_test_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT 'test-user-001'::TEXT;
$$;

GRANT EXECUTE ON FUNCTION get_test_user_id() TO authenticated, anon;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Mock exam system recreated successfully';
    RAISE NOTICE '📊 Templates created: %', (SELECT COUNT(*) FROM mock_exam_templates);
    RAISE NOTICE '❓ Questions created: %', (SELECT COUNT(*) FROM mock_exam_questions);
    RAISE NOTICE '👤 Test user ready: test-user-001';
END $$;
