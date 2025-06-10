-- Step 1: Create the tests table first
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS tests CASCADE;

-- Create tests table
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample tests
INSERT INTO tests (id, title, subject, description) VALUES 
(1, 'ENEM 2023 - Simulado Completo', 'Multidisciplinar', 'Simulado completo do ENEM 2023'),
(2, 'Português - Interpretação de Texto', 'Português', 'Teste focado em interpretação de texto'),
(3, 'Matemática - Funções e Geometria', 'Matemática', 'Teste de matemática básica'),
(4, 'História do Brasil', 'História', 'Teste sobre história do Brasil'),
(5, 'Física - Mecânica', 'Física', 'Teste de física básica');

-- Step 2: Create test_attempts table with foreign key
CREATE TABLE test_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
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

-- Step 3: Verify tables were created
SELECT 'Tests table:' as info;
SELECT * FROM tests ORDER BY id;

SELECT 'Test attempts table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'test_attempts'
ORDER BY ordinal_position;

SELECT 'Foreign key constraints:' as info;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'test_attempts';

SELECT 'Setup complete!' as status;
