-- Purpose: Populate sample questions for mock exam templates
-- Creates realistic questions for each template

-- First, let's get the template IDs
DO $$
DECLARE
    enem_template_id UUID;
    math_template_id UUID;
    portuguese_template_id UUID;
    physics_template_id UUID;
    history_template_id UUID;
BEGIN
    -- Get template IDs
    SELECT id INTO enem_template_id FROM public.mock_exam_templates WHERE title = 'ENEM 2024 - Simulado Completo' LIMIT 1;
    SELECT id INTO math_template_id FROM public.mock_exam_templates WHERE title = 'Matemática Básica - Nível Fundamental' LIMIT 1;
    SELECT id INTO portuguese_template_id FROM public.mock_exam_templates WHERE title = 'Português - Interpretação de Texto' LIMIT 1;
    SELECT id INTO physics_template_id FROM public.mock_exam_templates WHERE title = 'Física - Mecânica Clássica' LIMIT 1;
    SELECT id INTO history_template_id FROM public.mock_exam_templates WHERE title = 'História do Brasil - República' LIMIT 1;

    -- Insert ENEM questions
    IF enem_template_id IS NOT NULL THEN
        INSERT INTO public.mock_exam_questions (template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points) VALUES
        (enem_template_id, 1, 'Qual é a principal característica do Realismo na literatura brasileira?', 'multiple_choice', 
         '["Idealização da realidade", "Retrato fiel da sociedade", "Exaltação do nacionalismo", "Fuga da realidade", "Valorização do medieval"]',
         'Retrato fiel da sociedade', 
         'O Realismo se caracteriza pela representação objetiva e crítica da realidade social.', 
         'Literatura', 3, 1.0),
        
        (enem_template_id, 2, 'A função f(x) = 2x + 3 é uma função:', 'multiple_choice',
         '["Quadrática", "Linear", "Exponencial", "Logarítmica", "Trigonométrica"]',
         'Linear',
         'Uma função do tipo f(x) = ax + b, onde a ≠ 0, é chamada de função linear ou afim.',
         'Matemática', 2, 1.0),
         
        (enem_template_id, 3, 'O processo de fotossíntese ocorre principalmente:', 'multiple_choice',
         '["Nas raízes", "No caule", "Nas folhas", "Nas flores", "Nos frutos"]',
         'Nas folhas',
         'A fotossíntese ocorre principalmente nas folhas, onde estão localizados os cloroplastos.',
         'Biologia', 2, 1.0);
    END IF;

    -- Insert Math questions
    IF math_template_id IS NOT NULL THEN
        INSERT INTO public.mock_exam_questions (template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points) VALUES
        (math_template_id, 1, 'Quanto é 15 + 28?', 'multiple_choice',
         '["41", "42", "43", "44", "45"]',
         '43',
         '15 + 28 = 43. Soma simples de números inteiros.',
         'Aritmética', 1, 1.0),
         
        (math_template_id, 2, 'Qual é o resultado de 7 × 8?', 'multiple_choice',
         '["54", "55", "56", "57", "58"]',
         '56',
         '7 × 8 = 56. Multiplicação da tabuada do 7 e do 8.',
         'Aritmética', 1, 1.0),
         
        (math_template_id, 3, 'Se x + 5 = 12, qual é o valor de x?', 'multiple_choice',
         '["5", "6", "7", "8", "9"]',
         '7',
         'x + 5 = 12, então x = 12 - 5 = 7.',
         'Álgebra', 2, 1.0);
    END IF;

    -- Insert Portuguese questions
    IF portuguese_template_id IS NOT NULL THEN
        INSERT INTO public.mock_exam_questions (template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points) VALUES
        (portuguese_template_id, 1, 'Leia o texto: "O menino correu rapidamente para casa." A palavra "rapidamente" é:', 'multiple_choice',
         '["Substantivo", "Adjetivo", "Advérbio", "Verbo", "Preposição"]',
         'Advérbio',
         'A palavra "rapidamente" modifica o verbo "correu", indicando como a ação foi realizada, sendo portanto um advérbio de modo.',
         'Gramática', 2, 1.0),
         
        (portuguese_template_id, 2, 'Qual figura de linguagem está presente em "Seus olhos são duas estrelas"?', 'multiple_choice',
         '["Metáfora", "Metonímia", "Hipérbole", "Ironia", "Antítese"]',
         'Metáfora',
         'A metáfora é uma comparação implícita, onde os olhos são comparados a estrelas sem usar conectivos.',
         'Literatura', 3, 1.0);
    END IF;

    -- Insert Physics questions
    IF physics_template_id IS NOT NULL THEN
        INSERT INTO public.mock_exam_questions (template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points) VALUES
        (physics_template_id, 1, 'A primeira lei de Newton afirma que:', 'multiple_choice',
         '["F = ma", "Todo corpo em repouso tende a permanecer em repouso", "Ação e reação", "E = mc²", "P = mv"]',
         'Todo corpo em repouso tende a permanecer em repouso',
         'A primeira lei de Newton, ou lei da inércia, estabelece que um corpo em repouso permanece em repouso e um corpo em movimento permanece em movimento, a menos que uma força externa atue sobre ele.',
         'Mecânica', 3, 1.0),
         
        (physics_template_id, 2, 'A unidade de força no Sistema Internacional é:', 'multiple_choice',
         '["Joule", "Watt", "Newton", "Pascal", "Coulomb"]',
         'Newton',
         'O Newton (N) é a unidade de força no SI, definida como kg⋅m/s².',
         'Mecânica', 2, 1.0);
    END IF;

    -- Insert History questions
    IF history_template_id IS NOT NULL THEN
        INSERT INTO public.mock_exam_questions (template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points) VALUES
        (history_template_id, 1, 'A Proclamação da República no Brasil ocorreu em:', 'multiple_choice',
         '["15 de novembro de 1889", "7 de setembro de 1822", "13 de maio de 1888", "15 de novembro de 1888", "7 de setembro de 1889"]',
         '15 de novembro de 1889',
         'A Proclamação da República brasileira foi proclamada em 15 de novembro de 1889 pelo Marechal Deodoro da Fonseca.',
         'História do Brasil', 2, 1.0),
         
        (history_template_id, 2, 'O primeiro presidente civil do Brasil foi:', 'multiple_choice',
         '["Deodoro da Fonseca", "Floriano Peixoto", "Prudente de Morais", "Campos Sales", "Rodrigues Alves"]',
         'Prudente de Morais',
         'Prudente de Morais foi o primeiro presidente civil do Brasil (1894-1898), após os governos militares de Deodoro e Floriano.',
         'História do Brasil', 3, 1.0);
    END IF;

    RAISE NOTICE 'Sample questions inserted successfully for all templates';
END $$;

SELECT '015-populate-mock-exam-questions.sql executed successfully.' AS status;
