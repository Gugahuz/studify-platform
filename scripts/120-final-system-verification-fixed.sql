-- Verificação completa do sistema após restauração (CORRIGIDA)
-- Este script verifica se todas as tabelas problemáticas foram removidas
-- e se o sistema está funcionando corretamente

DO $$
DECLARE
    problematic_tables TEXT[] := ARRAY[
        'user_exam_statistics',
        'user_category_statistics', 
        'user_performance_history',
        'user_question_analysis',
        'user_study_sessions',
        'user_stats'
    ];
    problematic_functions TEXT[] := ARRAY[
        'update_user_exam_statistics',
        'update_user_category_statistics',
        'record_performance_history',
        'update_user_statistics_simple',
        'create_test_user',
        'get_user_statistics',
        'calculate_user_performance',
        'trigger_update_statistics',
        'update_user_stats'
    ];
    problematic_views TEXT[] := ARRAY[
        'user_mock_exam_history',
        'exam_history_view',
        'user_statistics_view',
        'user_statistics_summary'
    ];
    
    table_name TEXT;
    function_name TEXT;
    view_name TEXT;
    found_tables INTEGER := 0;
    found_functions INTEGER := 0;
    found_views INTEGER := 0;
    
    -- Core system tables
    core_tables_count INTEGER := 0;
    templates_count INTEGER := 0;
    questions_count INTEGER := 0;
    attempts_count INTEGER := 0;
    responses_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 VERIFICAÇÃO FINAL DO SISTEMA STUDIFY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    
    -- 1. Verificar se tabelas problemáticas foram removidas
    RAISE NOTICE '🗑️  VERIFICANDO REMOÇÃO DE TABELAS PROBLEMÁTICAS:';
    
    FOREACH table_name IN ARRAY problematic_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_name = table_name AND t.table_schema = 'public'
        ) THEN
            RAISE NOTICE '   ❌ ENCONTRADA: %', table_name;
            found_tables := found_tables + 1;
        ELSE
            RAISE NOTICE '   ✅ REMOVIDA: %', table_name;
        END IF;
    END LOOP;
    
    -- 2. Verificar se funções problemáticas foram removidas
    RAISE NOTICE '';
    RAISE NOTICE '🔧 VERIFICANDO REMOÇÃO DE FUNÇÕES PROBLEMÁTICAS:';
    
    FOREACH function_name IN ARRAY problematic_functions
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = function_name
        ) THEN
            RAISE NOTICE '   ❌ ENCONTRADA: %', function_name;
            found_functions := found_functions + 1;
        ELSE
            RAISE NOTICE '   ✅ REMOVIDA: %', function_name;
        END IF;
    END LOOP;
    
    -- 3. Verificar se views problemáticas foram removidas
    RAISE NOTICE '';
    RAISE NOTICE '👁️  VERIFICANDO REMOÇÃO DE VIEWS PROBLEMÁTICAS:';
    
    FOREACH view_name IN ARRAY problematic_views
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.views v
            WHERE v.table_name = view_name AND v.table_schema = 'public'
        ) THEN
            RAISE NOTICE '   ❌ ENCONTRADA: %', view_name;
            found_views := found_views + 1;
        ELSE
            RAISE NOTICE '   ✅ REMOVIDA: %', view_name;
        END IF;
    END LOOP;
    
    -- 4. Verificar sistema core
    RAISE NOTICE '';
    RAISE NOTICE '🎯 VERIFICANDO SISTEMA CORE:';
    
    -- Contar tabelas essenciais
    SELECT COUNT(*) INTO core_tables_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name IN (
        'mock_exam_templates',
        'mock_exam_questions', 
        'mock_exam_attempts',
        'mock_exam_responses'
    );
    
    -- Contar dados nas tabelas (com verificação de existência)
    SELECT COUNT(*) INTO templates_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'mock_exam_templates';
    
    IF templates_count > 0 THEN
        SELECT COUNT(*) INTO templates_count FROM mock_exam_templates;
    END IF;
    
    SELECT COUNT(*) INTO questions_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'mock_exam_questions';
    
    IF questions_count > 0 THEN
        SELECT COUNT(*) INTO questions_count FROM mock_exam_questions;
    END IF;
    
    SELECT COUNT(*) INTO attempts_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'mock_exam_attempts';
    
    IF attempts_count > 0 THEN
        SELECT COUNT(*) INTO attempts_count FROM mock_exam_attempts;
    END IF;
    
    SELECT COUNT(*) INTO responses_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'mock_exam_responses';
    
    IF responses_count > 0 THEN
        SELECT COUNT(*) INTO responses_count FROM mock_exam_responses;
    END IF;
    
    RAISE NOTICE '   - Tabelas core encontradas: %/4', core_tables_count;
    RAISE NOTICE '   - Templates de simulados: %', templates_count;
    RAISE NOTICE '   - Questões disponíveis: %', questions_count;
    RAISE NOTICE '   - Tentativas registradas: %', attempts_count;
    RAISE NOTICE '   - Respostas registradas: %', responses_count;
    
    -- 5. Resultado final
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 RESULTADO FINAL:';
    
    IF found_tables = 0 AND found_functions = 0 AND found_views = 0 THEN
        RAISE NOTICE '✅ LIMPEZA COMPLETA - Todos os objetos problemáticos removidos';
    ELSE
        RAISE NOTICE '⚠️  LIMPEZA INCOMPLETA:';
        IF found_tables > 0 THEN
            RAISE NOTICE '   - % tabelas problemáticas ainda existem', found_tables;
        END IF;
        IF found_functions > 0 THEN
            RAISE NOTICE '   - % funções problemáticas ainda existem', found_functions;
        END IF;
        IF found_views > 0 THEN
            RAISE NOTICE '   - % views problemáticas ainda existem', found_views;
        END IF;
    END IF;
    
    IF core_tables_count = 4 THEN
        RAISE NOTICE '✅ SISTEMA CORE INTACTO - Todas as tabelas essenciais presentes';
        
        IF templates_count > 0 AND questions_count > 0 THEN
            RAISE NOTICE '✅ DADOS FUNCIONAIS - Sistema pronto para uso';
        ELSE
            RAISE NOTICE '⚠️  DADOS INSUFICIENTES - Pode precisar popular dados';
        END IF;
    ELSE
        RAISE NOTICE '❌ SISTEMA CORE INCOMPLETO - Faltam tabelas essenciais';
    END IF;
    
    -- Status final
    RAISE NOTICE '';
    IF found_tables = 0 AND found_functions = 0 AND found_views = 0 AND core_tables_count = 4 THEN
        RAISE NOTICE '🎉 SISTEMA 100%% FUNCIONAL E LIMPO!';
        RAISE NOTICE '✅ Pronto para uso em produção';
    ELSE
        RAISE NOTICE '⚠️  SISTEMA PRECISA DE AJUSTES';
        RAISE NOTICE '💡 Execute scripts de limpeza ou população conforme necessário';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Teste a interface /dashboard/simulados';
    RAISE NOTICE '   2. Verifique se não há erros no console';
    RAISE NOTICE '   3. Complete um simulado para testar o fluxo';
    RAISE NOTICE '   4. Confirme que a navegação funciona';
    
END $$;
