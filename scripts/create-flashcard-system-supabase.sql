-- Script para criar o sistema completo de flashcards no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de matérias
CREATE TABLE IF NOT EXISTS flashcard_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tópicos
CREATE TABLE IF NOT EXISTS flashcard_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES flashcard_subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    parent_topic_id UUID REFERENCES flashcard_topics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES flashcard_topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    question_type VARCHAR(50) DEFAULT 'text',
    options JSONB,
    tags TEXT[],
    source VARCHAR(255),
    created_by UUID REFERENCES profiles(id),
    is_verified BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de decks do usuário
CREATE TABLE IF NOT EXISTS user_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    subject_id UUID REFERENCES flashcard_subjects(id),
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relacionamento deck-flashcard
CREATE TABLE IF NOT EXISTS deck_flashcards (
    deck_id UUID REFERENCES user_flashcard_decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (deck_id, flashcard_id)
);

-- Criar tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_flashcard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
    ease_factor DECIMAL(4,2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date DATE DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    correct_streak INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);

-- Criar tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_flashcard_decks(id),
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de documentos enviados
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    processed_text TEXT,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    generated_cards_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de decks pré-construídos
CREATE TABLE IF NOT EXISTS prebuilt_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES flashcard_subjects(id),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_time_minutes INTEGER DEFAULT 30,
    total_cards INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de biblioteca de conteúdo
CREATE TABLE IF NOT EXISTS content_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES flashcard_subjects(id),
    topic_id UUID REFERENCES flashcard_topics(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'concept',
    keywords TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_id ON flashcards(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcards(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_flashcard_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_deck_flashcards_deck_id ON deck_flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON flashcard_study_sessions(user_id, session_date);

-- Habilitar RLS (Row Level Security) para as tabelas
ALTER TABLE flashcard_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prebuilt_flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leitura pública de matérias e tópicos
CREATE POLICY "Matérias são públicas" ON flashcard_subjects FOR SELECT USING (true);
CREATE POLICY "Tópicos são públicos" ON flashcard_topics FOR SELECT USING (true);
CREATE POLICY "Flashcards são públicos" ON flashcards FOR SELECT USING (true);
CREATE POLICY "Decks pré-construídos são públicos" ON prebuilt_flashcard_decks FOR SELECT USING (true);
CREATE POLICY "Biblioteca de conteúdo é pública" ON content_library FOR SELECT USING (true);

-- Políticas RLS para dados do usuário
CREATE POLICY "Usuários podem ver seus próprios decks" ON user_flashcard_decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver seus próprios progressos" ON user_flashcard_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver suas próprias sessões" ON flashcard_study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver seus próprios documentos" ON uploaded_documents FOR ALL USING (auth.uid() = user_id);

-- Políticas para deck_flashcards (baseada no deck do usuário)
CREATE POLICY "Usuários podem gerenciar flashcards de seus decks" ON deck_flashcards FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_flashcard_decks 
        WHERE id = deck_flashcards.deck_id AND user_id = auth.uid()
    )
);
