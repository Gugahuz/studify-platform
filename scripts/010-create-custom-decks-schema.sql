-- Script para criar o sistema de decks personalizados
-- Execute este script no Supabase SQL Editor

-- Criar tabela de decks personalizados do usuário
CREATE TABLE IF NOT EXISTS user_custom_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_cards INTEGER DEFAULT 0 CHECK (total_cards <= 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Criar tabela de flashcards personalizados
CREATE TABLE IF NOT EXISTS user_custom_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_id UUID REFERENCES user_custom_decks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    tags TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de progresso de estudo dos decks personalizados
CREATE TABLE IF NOT EXISTS user_custom_deck_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_custom_decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES user_custom_flashcards(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    next_review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deck_id, flashcard_id)
);

-- Criar tabela de sessões de estudo dos decks personalizados
CREATE TABLE IF NOT EXISTS user_custom_study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_custom_decks(id) ON DELETE CASCADE,
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_custom_decks_user_id ON user_custom_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_flashcards_deck_id ON user_custom_flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_deck_progress_user_deck ON user_custom_deck_progress(user_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_study_sessions_user_date ON user_custom_study_sessions(user_id, session_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_custom_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_deck_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_study_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para decks personalizados
CREATE POLICY "Usuários podem gerenciar seus próprios decks" ON user_custom_decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar flashcards de seus decks" ON user_custom_flashcards FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_custom_decks 
        WHERE id = user_custom_flashcards.deck_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Usuários podem gerenciar seu próprio progresso" ON user_custom_deck_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar suas próprias sessões" ON user_custom_study_sessions FOR ALL USING (auth.uid() = user_id);

-- Função para atualizar o contador de cards no deck
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_custom_decks 
        SET total_cards = (
            SELECT COUNT(*) FROM user_custom_flashcards 
            WHERE deck_id = NEW.deck_id
        ),
        updated_at = NOW()
        WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_custom_decks 
        SET total_cards = (
            SELECT COUNT(*) FROM user_custom_flashcards 
            WHERE deck_id = OLD.deck_id
        ),
        updated_at = NOW()
        WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_deck_card_count ON user_custom_flashcards;
CREATE TRIGGER trigger_update_deck_card_count
    AFTER INSERT OR DELETE ON user_custom_flashcards
    FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- Função para limitar número de decks por usuário (máximo 10)
CREATE OR REPLACE FUNCTION check_deck_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM user_custom_decks WHERE user_id = NEW.user_id AND is_active = TRUE) >= 10 THEN
        RAISE EXCEPTION 'Usuário não pode ter mais de 10 decks ativos';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar limite de decks
DROP TRIGGER IF EXISTS trigger_check_deck_limit ON user_custom_decks;
CREATE TRIGGER trigger_check_deck_limit
    BEFORE INSERT ON user_custom_decks
    FOR EACH ROW EXECUTE FUNCTION check_deck_limit();

-- Função para limitar número de flashcards por deck (máximo 20)
CREATE OR REPLACE FUNCTION check_flashcard_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM user_custom_flashcards WHERE deck_id = NEW.deck_id) >= 20 THEN
        RAISE EXCEPTION 'Deck não pode ter mais de 20 flashcards';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar limite de flashcards
DROP TRIGGER IF EXISTS trigger_check_flashcard_limit ON user_custom_flashcards;
CREATE TRIGGER trigger_check_flashcard_limit
    BEFORE INSERT ON user_custom_flashcards
    FOR EACH ROW EXECUTE FUNCTION check_flashcard_limit();

-- Inserir dados de exemplo (opcional)
DO $$
BEGIN
    -- Verificar se já existem dados
    IF NOT EXISTS (SELECT 1 FROM user_custom_decks LIMIT 1) THEN
        -- Dados de exemplo serão inseridos via aplicação
        RAISE NOTICE 'Schema de decks personalizados criado com sucesso!';
    END IF;
END $$;

-- Verificação final
SELECT 
    'user_custom_decks' as table_name,
    COUNT(*) as record_count
FROM user_custom_decks
UNION ALL
SELECT 
    'user_custom_flashcards' as table_name,
    COUNT(*) as record_count
FROM user_custom_flashcards
UNION ALL
SELECT 
    'user_custom_deck_progress' as table_name,
    COUNT(*) as record_count
FROM user_custom_deck_progress
UNION ALL
SELECT 
    'user_custom_study_sessions' as table_name,
    COUNT(*) as record_count
FROM user_custom_study_sessions;
