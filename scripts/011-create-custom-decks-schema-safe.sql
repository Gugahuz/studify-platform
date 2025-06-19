-- Script seguro para criar schema de decks personalizados
-- Verifica existência antes de criar para evitar conflitos

-- 1. Criar tabela de decks personalizados do usuário (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_decks') THEN
        CREATE TABLE user_custom_decks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            total_cards INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela user_custom_decks criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_custom_decks já existe';
    END IF;
END $$;

-- 2. Criar tabela de flashcards personalizados (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_flashcards') THEN
        CREATE TABLE user_custom_flashcards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            deck_id UUID NOT NULL REFERENCES user_custom_decks(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            explanation TEXT,
            difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
            tags TEXT[] DEFAULT '{}',
            order_index INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela user_custom_flashcards criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_custom_flashcards já existe';
    END IF;
END $$;

-- 3. Criar tabela de sessões de estudo (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_study_sessions') THEN
        CREATE TABLE user_custom_study_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            deck_id UUID NOT NULL REFERENCES user_custom_decks(id) ON DELETE CASCADE,
            cards_studied INTEGER DEFAULT 0,
            cards_correct INTEGER DEFAULT 0,
            duration_minutes INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela user_custom_study_sessions criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_custom_study_sessions já existe';
    END IF;
END $$;

-- 4. Criar tabela de progresso individual (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_deck_progress') THEN
        CREATE TABLE user_custom_deck_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            deck_id UUID NOT NULL REFERENCES user_custom_decks(id) ON DELETE CASCADE,
            flashcard_id UUID NOT NULL REFERENCES user_custom_flashcards(id) ON DELETE CASCADE,
            correct_count INTEGER DEFAULT 0,
            incorrect_count INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered')),
            last_studied_at TIMESTAMP WITH TIME ZONE,
            next_review_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, deck_id, flashcard_id)
        );
        
        RAISE NOTICE 'Tabela user_custom_deck_progress criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_custom_deck_progress já existe';
    END IF;
END $$;

-- 5. Criar índices (se não existirem)
DO $$ 
BEGIN
    -- Índices para user_custom_decks
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_decks_user_id') THEN
        CREATE INDEX idx_user_custom_decks_user_id ON user_custom_decks(user_id);
        RAISE NOTICE 'Índice idx_user_custom_decks_user_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_decks_active') THEN
        CREATE INDEX idx_user_custom_decks_active ON user_custom_decks(user_id, is_active);
        RAISE NOTICE 'Índice idx_user_custom_decks_active criado';
    END IF;
    
    -- Índices para user_custom_flashcards
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_flashcards_deck_id') THEN
        CREATE INDEX idx_user_custom_flashcards_deck_id ON user_custom_flashcards(deck_id);
        RAISE NOTICE 'Índice idx_user_custom_flashcards_deck_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_flashcards_order') THEN
        CREATE INDEX idx_user_custom_flashcards_order ON user_custom_flashcards(deck_id, order_index);
        RAISE NOTICE 'Índice idx_user_custom_flashcards_order criado';
    END IF;
    
    -- Índices para sessões de estudo
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_study_sessions_user_deck') THEN
        CREATE INDEX idx_user_custom_study_sessions_user_deck ON user_custom_study_sessions(user_id, deck_id);
        RAISE NOTICE 'Índice idx_user_custom_study_sessions_user_deck criado';
    END IF;
    
    -- Índices para progresso
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_custom_deck_progress_user_deck') THEN
        CREATE INDEX idx_user_custom_deck_progress_user_deck ON user_custom_deck_progress(user_id, deck_id);
        RAISE NOTICE 'Índice idx_user_custom_deck_progress_user_deck criado';
    END IF;
END $$;

-- 6. Criar triggers para atualizar updated_at (se não existirem)
DO $$ 
BEGIN
    -- Função para atualizar updated_at
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Função update_updated_at_column criada';
    END IF;
    
    -- Triggers para user_custom_decks
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_custom_decks_updated_at') THEN
        CREATE TRIGGER update_user_custom_decks_updated_at
            BEFORE UPDATE ON user_custom_decks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_user_custom_decks_updated_at criado';
    END IF;
    
    -- Triggers para user_custom_flashcards
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_custom_flashcards_updated_at') THEN
        CREATE TRIGGER update_user_custom_flashcards_updated_at
            BEFORE UPDATE ON user_custom_flashcards
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_user_custom_flashcards_updated_at criado';
    END IF;
    
    -- Triggers para user_custom_deck_progress
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_custom_deck_progress_updated_at') THEN
        CREATE TRIGGER update_user_custom_deck_progress_updated_at
            BEFORE UPDATE ON user_custom_deck_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_user_custom_deck_progress_updated_at criado';
    END IF;
END $$;

-- 7. Criar trigger para atualizar total_cards automaticamente
DO $$ 
BEGIN
    -- Função para atualizar contagem de cards
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_deck_card_count') THEN
        CREATE OR REPLACE FUNCTION update_deck_card_count()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                UPDATE user_custom_decks 
                SET total_cards = (
                    SELECT COUNT(*) 
                    FROM user_custom_flashcards 
                    WHERE deck_id = NEW.deck_id AND is_active = true
                )
                WHERE id = NEW.deck_id;
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                UPDATE user_custom_decks 
                SET total_cards = (
                    SELECT COUNT(*) 
                    FROM user_custom_flashcards 
                    WHERE deck_id = OLD.deck_id AND is_active = true
                )
                WHERE id = OLD.deck_id;
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Função update_deck_card_count criada';
    END IF;
    
    -- Trigger para atualizar contagem
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_update_deck_card_count') THEN
        CREATE TRIGGER trigger_update_deck_card_count
            AFTER INSERT OR UPDATE OR DELETE ON user_custom_flashcards
            FOR EACH ROW
            EXECUTE FUNCTION update_deck_card_count();
        RAISE NOTICE 'Trigger trigger_update_deck_card_count criado';
    END IF;
END $$;

-- 8. Habilitar RLS (Row Level Security)
DO $$ 
BEGIN
    -- Habilitar RLS nas tabelas
    ALTER TABLE user_custom_decks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_custom_flashcards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_custom_study_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_custom_deck_progress ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS habilitado em todas as tabelas';
END $$;

-- 9. Criar políticas RLS (se não existirem)
DO $$ 
BEGIN
    -- Políticas para user_custom_decks
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem gerenciar seus próprios decks' AND tablename = 'user_custom_decks') THEN
        CREATE POLICY "Usuários podem gerenciar seus próprios decks"
            ON user_custom_decks
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Política para user_custom_decks criada';
    ELSE
        RAISE NOTICE 'Política para user_custom_decks já existe';
    END IF;
    
    -- Políticas para user_custom_flashcards
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem gerenciar flashcards de seus decks' AND tablename = 'user_custom_flashcards') THEN
        CREATE POLICY "Usuários podem gerenciar flashcards de seus decks"
            ON user_custom_flashcards
            FOR ALL
            USING (EXISTS (
                SELECT 1 FROM user_custom_decks 
                WHERE id = user_custom_flashcards.deck_id 
                AND user_id = auth.uid()
            ))
            WITH CHECK (EXISTS (
                SELECT 1 FROM user_custom_decks 
                WHERE id = user_custom_flashcards.deck_id 
                AND user_id = auth.uid()
            ));
        RAISE NOTICE 'Política para user_custom_flashcards criada';
    ELSE
        RAISE NOTICE 'Política para user_custom_flashcards já existe';
    END IF;
    
    -- Políticas para user_custom_study_sessions
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem ver suas próprias sessões' AND tablename = 'user_custom_study_sessions') THEN
        CREATE POLICY "Usuários podem ver suas próprias sessões"
            ON user_custom_study_sessions
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Política para user_custom_study_sessions criada';
    ELSE
        RAISE NOTICE 'Política para user_custom_study_sessions já existe';
    END IF;
    
    -- Políticas para user_custom_deck_progress
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Usuários podem ver seu próprio progresso' AND tablename = 'user_custom_deck_progress') THEN
        CREATE POLICY "Usuários podem ver seu próprio progresso"
            ON user_custom_deck_progress
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Política para user_custom_deck_progress criada';
    ELSE
        RAISE NOTICE 'Política para user_custom_deck_progress já existe';
    END IF;
END $$;

-- 10. Inserir dados de exemplo (opcional)
DO $$ 
DECLARE
    example_user_id UUID;
    example_deck_id UUID;
BEGIN
    -- Verificar se existe algum usuário para criar dados de exemplo
    SELECT id INTO example_user_id FROM auth.users LIMIT 1;
    
    IF example_user_id IS NOT NULL THEN
        -- Verificar se já existem decks de exemplo
        IF NOT EXISTS (SELECT 1 FROM user_custom_decks WHERE name = 'Deck de Exemplo') THEN
            -- Criar deck de exemplo
            INSERT INTO user_custom_decks (user_id, name, description)
            VALUES (example_user_id, 'Deck de Exemplo', 'Um deck de exemplo para testar o sistema')
            RETURNING id INTO example_deck_id;
            
            -- Criar flashcards de exemplo
            INSERT INTO user_custom_flashcards (deck_id, question, answer, order_index) VALUES
            (example_deck_id, 'O que é um flashcard?', 'Um cartão de estudo com pergunta de um lado e resposta do outro', 1),
            (example_deck_id, 'Para que servem os flashcards?', 'Para memorização e revisão ativa de conteúdo', 2),
            (example_deck_id, 'Qual a vantagem do estudo com flashcards?', 'Permite repetição espaçada e feedback imediato', 3);
            
            RAISE NOTICE 'Dados de exemplo criados para o usuário %', example_user_id;
        ELSE
            RAISE NOTICE 'Dados de exemplo já existem';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para criar dados de exemplo';
    END IF;
END $$;

-- Verificação final
DO $$ 
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    RAISE NOTICE 'Tabelas criadas: user_custom_decks, user_custom_flashcards, user_custom_study_sessions, user_custom_deck_progress';
    RAISE NOTICE 'Índices criados para otimização de performance';
    RAISE NOTICE 'Triggers criados para manutenção automática';
    RAISE NOTICE 'RLS habilitado com políticas de segurança';
    RAISE NOTICE 'Sistema de decks personalizados pronto para uso!';
END $$;
