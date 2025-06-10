-- First, create the tests table if it doesn't exist
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert some sample tests
INSERT INTO tests (id, title, subject, description) VALUES 
(1, 'ENEM 2023 - Simulado Completo', 'Multidisciplinar', 'Simulado completo do ENEM 2023'),
(2, 'Português - Interpretação de Texto', 'Português', 'Teste focado em interpretação de texto'),
(3, 'Matemática - Funções e Geometria', 'Matemática', 'Teste de matemática básica')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subject = EXCLUDED.subject,
    description = EXCLUDED.description;

-- Now create or update the test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    test_id INTEGER NOT NULL REFERENCES tests(id),
    score DECIMAL(5,2) DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    unanswered_questions INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    time_allowed INTEGER DEFAULT 0,
    user_rating INTEGER,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Check the structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('tests', 'test_attempts')
ORDER BY table_name, ordinal_position;

-- Show the tests we created
SELECT * FROM tests;

-- Show any existing test attempts
SELECT COUNT(*) as total_attempts FROM test_attempts;
