-- Verificação simples e robusta da saúde do sistema
DO $$
DECLARE
    template_count INTEGER := 0;
    question_count INTEGER := 0;
    attempt_count INTEGER := 0;
    response_count INTEGER := 0;
    completed_attempts INTEGER := 0;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 VERIFICAÇÃO DO SISTEMA STUDIFY';
    RAISE NOTICE '================================';
    
    -- 1. Verificar se as tabelas principais existem
    RAISE NOTICE '';
    RAISE NOTICE '📋 TABELAS PRINCIPAIS:';
    
    -- Verificar mock_exam_templates
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mock_exam_templates'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO template_count FROM mock_exam_templates;
        RAISE NOTICE '   ✅ mock_exam_templates (% registros)', template_count;
    ELSE
        RAISE NOTICE '   ❌ mock_exam_templates (não encontrada)';
    END IF;
    
    -- Verificar mock_exam_questions
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mock_exam_questions'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO question_count FROM mock_exam_questions;
        RAISE NOTICE '   ✅ mock_exam_questions (% registros)', question_count;
    ELSE
        RAISE NOTICE '   ❌ mock_exam_questions (não encontrada)';
    END IF;
    
    -- Verificar mock_exam_attempts
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mock_exam_attempts'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO attempt_count FROM mock_exam_attempts;
        SELECT COUNT(*) INTO completed_attempts FROM mock_exam_attempts WHERE status = 'completed';
        RAISE NOTICE '   ✅ mock_exam_attempts (% total, % completos)', attempt_count, completed_attempts;
    ELSE
        RAISE NOTICE '   ❌ mock_exam_attempts (não encontrada)';
    END IF;
    
    -- Verificar mock_exam_responses
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mock_exam_responses'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO response_count FROM mock_exam_responses;
        RAISE NOTICE '   ✅ mock_exam_responses (% registros)', response_count;
    ELSE
        RAISE NOTICE '   ❌ mock_exam_responses (não encontrada)';
    END IF;
    
    -- 2. Avaliar status geral
    RAISE NOTICE '';
    RAISE NOTICE '📊 STATUS GERAL:';
    
    IF template_count > 0 AND question_count > 0 THEN
        RAISE NOTICE '   ✅ Sistema tem dados para funcionar';
        RAISE NOTICE '   ✅ Simulados podem ser criados';
        
        IF attempt_count > 0 THEN
            RAISE NOTICE '   ✅ Histórico de simulados disponível';
        ELSE
            RAISE NOTICE '   ℹ️  Nenhum simulado realizado ainda';
        END IF;
    ELSE
        RAISE NOTICE '   ⚠️  Sistema precisa de dados básicos';
        
        IF template_count = 0 THEN
            RAISE NOTICE '   ❌ Sem templates de simulados';
        END IF;
        
        IF question_count = 0 THEN
            RAISE NOTICE '   ❌ Sem questões disponíveis';
        END IF;
    END IF;
    
    -- 3. Verificar limpeza
    RAISE NOTICE '';
    RAISE NOTICE '🧹 VERIFICAÇÃO DE LIMPEZA:';
    
    -- Verificar se tabelas problemáticas foram removidas
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name IN (
            'user_exam_statistics',
            'user_category_statistics', 
            'user_performance_history',
            'user_question_analysis',
            'user_study_sessions'
        )
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '   ✅ Tabelas problemáticas foram removidas';
    ELSE
        RAISE NOTICE '   ⚠️  Algumas tabelas problemáticas ainda existem';
    END IF;
    
    -- 4. Conclusão
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    
    IF template_count > 0 AND question_count > 0 AND NOT table_exists THEN
        RAISE NOTICE '🎉 SISTEMA RESTAURADO COM SUCESSO!';
        RAISE NOTICE '✅ Pronto para uso normal';
    ELSIF template_count > 0 AND question_count > 0 THEN
        RAISE NOTICE '⚠️  SISTEMA FUNCIONAL MAS COM RESÍDUOS';
        RAISE NOTICE '💡 Execute novamente o script de limpeza';
    ELSE
        RAISE NOTICE '⚠️  SISTEMA LIMPO MAS SEM DADOS';
        RAISE NOTICE '💡 Execute os scripts de população de dados';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Teste a interface dos simulados';
    RAISE NOTICE '   2. Verifique se não há erros no console';
    RAISE NOTICE '   3. Tente criar um simulado';
    
END $$;
