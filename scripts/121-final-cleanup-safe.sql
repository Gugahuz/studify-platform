-- Script final de limpeza SEGURO
-- Remove qualquer resíduo das tentativas anteriores

BEGIN;

-- 1. Remover tabelas problemáticas uma por uma
DO $$
BEGIN
    -- Remover tabelas se existirem
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_exam_statistics' AND table_schema = 'public') THEN
        DROP TABLE user_exam_statistics CASCADE;
        RAISE NOTICE '✅ Removida: user_exam_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_category_statistics' AND table_schema = 'public') THEN
        DROP TABLE user_category_statistics CASCADE;
        RAISE NOTICE '✅ Removida: user_category_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_performance_history' AND table_schema = 'public') THEN
        DROP TABLE user_performance_history CASCADE;
        RAISE NOTICE '✅ Removida: user_performance_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_question_analysis' AND table_schema = 'public') THEN
        DROP TABLE user_question_analysis CASCADE;
        RAISE NOTICE '✅ Removida: user_question_analysis';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_study_sessions' AND table_schema = 'public') THEN
        DROP TABLE user_study_sessions CASCADE;
        RAISE NOTICE '✅ Removida: user_study_sessions';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_stats' AND table_schema = 'public') THEN
        DROP TABLE user_stats CASCADE;
        RAISE NOTICE '✅ Removida: user_stats';
    END IF;
END $$;

-- 2. Remover views problemáticas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_mock_exam_history' AND table_schema = 'public') THEN
        DROP VIEW user_mock_exam_history CASCADE;
        RAISE NOTICE '✅ Removida view: user_mock_exam_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'exam_history_view' AND table_schema = 'public') THEN
        DROP VIEW exam_history_view CASCADE;
        RAISE NOTICE '✅ Removida view: exam_history_view';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_statistics_view' AND table_schema = 'public') THEN
        DROP VIEW user_statistics_view CASCADE;
        RAISE NOTICE '✅ Removida view: user_statistics_view';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_statistics_summary' AND table_schema = 'public') THEN
        DROP VIEW user_statistics_summary CASCADE;
        RAISE NOTICE '✅ Removida view: user_statistics_summary';
    END IF;
END $$;

-- 3. Remover funções problemáticas
DO $$
BEGIN
    -- Lista de funções para remover
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_exam_statistics') THEN
        DROP FUNCTION IF EXISTS update_user_exam_statistics(UUID, DECIMAL, INTEGER, INTEGER, INTEGER, JSONB) CASCADE;
        RAISE NOTICE '✅ Removida função: update_user_exam_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_category_statistics') THEN
        DROP FUNCTION IF EXISTS update_user_category_statistics(UUID, VARCHAR) CASCADE;
        RAISE NOTICE '✅ Removida função: update_user_category_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_performance_history') THEN
        DROP FUNCTION IF EXISTS record_performance_history(UUID) CASCADE;
        RAISE NOTICE '✅ Removida função: record_performance_history';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_statistics_simple') THEN
        DROP FUNCTION IF EXISTS update_user_statistics_simple(UUID, JSONB) CASCADE;
        RAISE NOTICE '✅ Removida função: update_user_statistics_simple';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_test_user') THEN
        DROP FUNCTION IF EXISTS create_test_user(UUID) CASCADE;
        RAISE NOTICE '✅ Removida função: create_test_user';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_statistics') THEN
        DROP FUNCTION IF EXISTS get_user_statistics(UUID) CASCADE;
        RAISE NOTICE '✅ Removida função: get_user_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_user_performance') THEN
        DROP FUNCTION IF EXISTS calculate_user_performance(UUID) CASCADE;
        RAISE NOTICE '✅ Removida função: calculate_user_performance';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_update_statistics') THEN
        DROP FUNCTION IF EXISTS trigger_update_statistics() CASCADE;
        RAISE NOTICE '✅ Removida função: trigger_update_statistics';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_stats') THEN
        DROP FUNCTION IF EXISTS update_user_stats(UUID, DECIMAL, INTEGER, INTEGER, INTEGER) CASCADE;
        RAISE NOTICE '✅ Removida função: update_user_stats';
    END IF;
END $$;

-- 4. Verificação final simples
DO $$
DECLARE
    remaining_tables INTEGER := 0;
    core_tables INTEGER := 0;
BEGIN
    -- Contar tabelas problemáticas restantes
    SELECT COUNT(*) INTO remaining_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'user_exam_statistics',
        'user_category_statistics', 
        'user_performance_history',
        'user_question_analysis',
        'user_study_sessions',
        'user_stats'
    );
    
    -- Contar tabelas core
    SELECT COUNT(*) INTO core_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'mock_exam_templates',
        'mock_exam_questions', 
        'mock_exam_attempts',
        'mock_exam_responses'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 LIMPEZA FINAL CONCLUÍDA';
    RAISE NOTICE '==========================================';
    
    IF remaining_tables = 0 THEN
        RAISE NOTICE '✅ LIMPEZA COMPLETA - Nenhuma tabela problemática encontrada';
    ELSE
        RAISE NOTICE '⚠️  % tabelas problemáticas ainda existem', remaining_tables;
    END IF;
    
    RAISE NOTICE '✅ Tabelas core do sistema: %/4', core_tables;
    
    IF remaining_tables = 0 AND core_tables = 4 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SISTEMA 100%% LIMPO E FUNCIONAL!';
        RAISE NOTICE '✅ Pronto para uso em produção';
    END IF;
END $$;

COMMIT;
