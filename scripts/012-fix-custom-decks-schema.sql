-- Script para corrigir o schema dos decks personalizados
-- Remove referências à coluna is_active que não existe em user_custom_flashcards

-- 1. Verificar estrutura atual das tabelas
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUTURA DAS TABELAS ===';
    
    -- Verificar se as tabelas existem
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_decks') THEN
        RAISE NOTICE '✅ Tabela user_custom_decks existe';
    ELSE
        RAISE NOTICE '❌ Tabela user_custom_decks NÃO existe';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_custom_flashcards') THEN
        RAISE NOTICE '✅ Tabela user_custom_flashcards existe';
    ELSE
        RAISE NOTICE '❌ Tabela user_custom_flashcards NÃO existe';
    END IF;
END $$;

-- 2. Verificar se a coluna is_active existe em user_custom_flashcards
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_custom_flashcards' 
        AND column_name = 'is_active'
    ) THEN
        RAISE NOTICE '✅ Coluna is_active existe em user_custom_flashcards';
    ELSE
        RAISE NOTICE '❌ Coluna is_active NÃO existe em user_custom_flashcards';
        RAISE NOTICE '🔧 Adicionando coluna is_active...';
        
        -- Adicionar a coluna is_active se não existir
        ALTER TABLE user_custom_flashcards 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        
        RAISE NOTICE '✅ Coluna is_active adicionada com sucesso';
    END IF;
END $$;

-- 3. Atualizar função de contagem de cards para considerar is_active
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE user_custom_decks 
        SET total_cards = (
            SELECT COUNT(*) 
            FROM user_custom_flashcards 
            WHERE deck_id = NEW.deck_id 
            AND (is_active IS NULL OR is_active = true)
        ),
        updated_at = NOW()
        WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_custom_decks 
        SET total_cards = (
            SELECT COUNT(*) 
            FROM user_custom_flashcards 
            WHERE deck_id = OLD.deck_id 
            AND (is_active IS NULL OR is_active = true)
        ),
        updated_at = NOW()
        WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar trigger se necessário
DROP TRIGGER IF EXISTS trigger_update_deck_card_count ON user_custom_flashcards;
CREATE TRIGGER trigger_update_deck_card_count
    AFTER INSERT OR UPDATE OR DELETE ON user_custom_flashcards
    FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- 5. Atualizar contagem de cards para todos os decks existentes
DO $$
DECLARE
    deck_record RECORD;
    card_count INTEGER;
BEGIN
    RAISE NOTICE '🔄 Atualizando contagem de cards para todos os decks...';
    
    FOR deck_record IN 
        SELECT id FROM user_custom_decks WHERE is_active = true
    LOOP
        SELECT COUNT(*) INTO card_count
        FROM user_custom_flashcards 
        WHERE deck_id = deck_record.id 
        AND (is_active IS NULL OR is_active = true);
        
        UPDATE user_custom_decks 
        SET total_cards = card_count,
            updated_at = NOW()
        WHERE id = deck_record.id;
        
        RAISE NOTICE 'Deck % atualizado com % cards', deck_record.id, card_count;
    END LOOP;
    
    RAISE NOTICE '✅ Contagem de cards atualizada para todos os decks';
END $$;

-- 6. Verificação final
DO $$
DECLARE
    deck_count INTEGER;
    flashcard_count INTEGER;
    active_flashcard_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO deck_count FROM user_custom_decks WHERE is_active = true;
    SELECT COUNT(*) INTO flashcard_count FROM user_custom_flashcards;
    SELECT COUNT(*) INTO active_flashcard_count FROM user_custom_flashcards WHERE (is_active IS NULL OR is_active = true);
    
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    RAISE NOTICE '📊 Decks ativos: %', deck_count;
    RAISE NOTICE '📊 Total de flashcards: %', flashcard_count;
    RAISE NOTICE '📊 Flashcards ativos: %', active_flashcard_count;
    RAISE NOTICE '✅ Schema corrigido e pronto para uso!';
END $$;
