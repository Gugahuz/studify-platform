-- Script para limpar as tabelas problemáticas criadas e restaurar o sistema funcional
-- Este script remove apenas as adições problemáticas, mantendo o sistema original

-- 1. Primeiro, remover todos os triggers que podem estar usando as funções
DROP TRIGGER IF EXISTS update_statistics_on_exam_completion ON mock_exam_attempts;
DROP TRIGGER IF EXISTS auto_update_statistics ON mock_exam_attempts;
DROP TRIGGER IF EXISTS trigger_statistics_update ON mock_exam_attempts;

-- 2. Remover views que podem depender das tabelas
DROP VIEW IF EXISTS user_mock_exam_history CASCADE;
DROP VIEW IF EXISTS exam_history_view CASCADE;
DROP VIEW IF EXISTS user_statistics_view CASCADE;

-- 3. Remover funções na ordem correta (dependências primeiro)
DROP FUNCTION IF EXISTS trigger_update_statistics() CASCADE;
DROP FUNCTION IF EXISTS update_user_exam_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_category_statistics(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS record_performance_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_statistics_simple(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_test_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_user_performance(UUID) CASCADE;

-- 4. Remover tabelas de estatísticas problemáticas se existirem
DROP TABLE IF EXISTS user_study_sessions CASCADE;
DROP TABLE IF EXISTS user_question_analysis CASCADE;
DROP TABLE IF EXISTS user_performance_history CASCADE;
DROP TABLE IF EXISTS user_category_statistics CASCADE;
DROP TABLE IF EXISTS user_exam_statistics CASCADE;

-- 5. Remover índices específicos das estatísticas se existirem
DROP INDEX IF EXISTS idx_user_exam_statistics_user_id;
DROP INDEX IF EXISTS idx_user_category_statistics_user_category;
DROP INDEX IF EXISTS idx_user_performance_history_user_date;

-- 6. Verificar se o sistema original ainda está funcionando
DO $$
DECLARE
    table_count INTEGER;
    attempt_count INTEGER;
    template_count INTEGER;
    question_count INTEGER;
    response_count INTEGER;
    tbl_name TEXT;
BEGIN
    -- Verificar tabelas essenciais do sistema original
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN (
        'mock_exam_attempts',
        'mock_exam_responses',
        'mock_exam_questions',
        'mock_exam_templates'
    );
    
    -- Verificar se há dados nas tabelas principais
    SELECT COUNT(*) INTO attempt_count FROM mock_exam_attempts;
    SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
    SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
    SELECT COUNT(*) INTO response_count FROM mock_exam_responses;
    
    RAISE NOTICE '🔍 VERIFICAÇÃO DO SISTEMA ORIGINAL:';
    RAISE NOTICE '   - Tabelas essenciais encontradas: %/4', table_count;
    RAISE NOTICE '   - Templates de simulados: %', template_count;
    RAISE NOTICE '   - Questões disponíveis: %', question_count;
    RAISE NOTICE '   - Tentativas de simulados: %', attempt_count;
    RAISE NOTICE '   - Respostas registradas: %', response_count;
    
    IF table_count = 4 THEN
        RAISE NOTICE '✅ Sistema original está intacto e funcionando!';
        
        IF template_count > 0 AND question_count > 0 THEN
            RAISE NOTICE '✅ Dados dos simulados estão preservados!';
        ELSE
            RAISE NOTICE '⚠️  Pode ser necessário repovoar os dados dos simulados';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Algumas tabelas essenciais podem estar faltando';
        
        -- Listar tabelas que existem
        RAISE NOTICE '📋 Tabelas encontradas:';
        FOR tbl_name IN 
            SELECT t.table_name 
            FROM information_schema.tables t
            WHERE t.table_name LIKE 'mock_exam%'
            ORDER BY t.table_name
        LOOP
            RAISE NOTICE '   - %', tbl_name;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Limpeza das tabelas problemáticas concluída';
    RAISE NOTICE '💡 O sistema deve estar funcionando normalmente agora';
    RAISE NOTICE '🎯 Próximo passo: Testar os simulados na interface';
    
END $$;

-- 7. Verificar se ainda existem objetos problemáticos
DO $$
DECLARE
    func_count INTEGER;
    trigger_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Contar funções restantes relacionadas a estatísticas
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname LIKE '%statistic%';
    
    -- Contar triggers restantes relacionados a estatísticas
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%statistic%';
    
    -- Contar tabelas restantes relacionadas a estatísticas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name LIKE '%statistic%' OR table_name LIKE '%performance%';
    
    IF func_count = 0 AND trigger_count = 0 AND table_count = 0 THEN
        RAISE NOTICE '🎉 Limpeza completa! Nenhum objeto problemático restante.';
    ELSE
        RAISE NOTICE '⚠️  Ainda existem alguns objetos relacionados a estatísticas:';
        RAISE NOTICE '   - Funções: %', func_count;
        RAISE NOTICE '   - Triggers: %', trigger_count;
        RAISE NOTICE '   - Tabelas: %', table_count;
    END IF;
END $$;
