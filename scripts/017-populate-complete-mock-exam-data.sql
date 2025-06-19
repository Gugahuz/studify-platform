-- Populate complete mock exam data matching the design
-- This script creates realistic exam templates and questions

-- Clear existing data
DELETE FROM mock_exam_responses;
DELETE FROM mock_exam_questions;
DELETE FROM mock_exam_attempts;
DELETE FROM mock_exam_templates;

-- Insert realistic mock exam templates
INSERT INTO mock_exam_templates (
  id,
  title,
  description,
  category,
  difficulty_level,
  time_limit_minutes,
  total_questions,
  passing_score,
  instructions,
  is_active,
  is_featured,
  created_at,
  updated_at
) VALUES
-- ENEM 2023 - Featured
(
  gen_random_uuid(),
  'ENEM 2023 - Simulado Completo',
  'Simulado completo baseado no ENEM 2023 com questões de todas as áreas do conhecimento.',
  'enem',
  4,
  330,
  180,
  60,
  'Simulado completo com questões multidisciplinares baseadas no ENEM 2023. Navegação livre entre questões.',
  true,
  true,
  NOW(),
  NOW()
),
-- Matemática - Funções e Geometria
(
  gen_random_uuid(),
  'Matemática - Funções e Geometria',
  'Questões avançadas de funções, geometria plana e espacial.',
  'matematica',
  4,
  60,
  30,
  70,
  'Foque em conceitos avançados de funções e geometria.',
  true,
  true,
  NOW(),
  NOW()
),
-- Biologia - Genética e Evolução
(
  gen_random_uuid(),
  'Biologia - Genética e Evolução',
  'Leis de Mendel, evolução das espécies e biotecnologia.',
  'biologia',
  4,
  50,
  28,
  70,
  'Questões sobre genética, evolução e biotecnologia moderna.',
  true,
  true,
  NOW(),
  NOW()
),
-- Português - Interpretação de Texto
(
  gen_random_uuid(),
  'Português - Interpretação de Texto',
  'Foque na interpretação de textos com questões do ENEM e vestibulares.',
  'portugues',
  3,
  45,
  25,
  65,
  'Desenvolva suas habilidades de interpretação textual.',
  true,
  false,
  NOW(),
  NOW()
),
-- História do Brasil - República
(
  gen_random_uuid(),
  'História do Brasil - República',
  'Período republicano brasileiro: da Proclamação aos dias atuais.',
  'historia',
  3,
  40,
  20,
  65,
  'Estude o período republicano brasileiro em detalhes.',
  true,
  false,
  NOW(),
  NOW()
),
-- Física - Mecânica Clássica
(
  gen_random_uuid(),
  'Física - Mecânica Clássica',
  'Conceitos fundamentais de cinemática, dinâmica e estática.',
  'fisica',
  3,
  50,
  20,
  70,
  'Questões sobre os fundamentos da mecânica clássica.',
  true,
  false,
  NOW(),
  NOW()
),
-- Geografia - Geopolítica Mundial
(
  gen_random_uuid(),
  'Geografia - Geopolítica Mundial',
  'Relações internacionais, blocos econômicos e conflitos mundiais.',
  'geografia',
  3,
  45,
  22,
  65,
  'Analise as relações geopolíticas contemporâneas.',
  true,
  false,
  NOW(),
  NOW()
),
-- Química - Química Orgânica
(
  gen_random_uuid(),
  'Química - Química Orgânica',
  'Estruturas orgânicas, reações e nomenclatura.',
  'quimica',
  4,
  55,
  25,
  70,
  'Domine os conceitos da química orgânica.',
  true,
  false,
  NOW(),
  NOW()
);

-- Get template IDs for inserting questions
DO $$
DECLARE
  enem_template_id UUID;
  math_template_id UUID;
  bio_template_id UUID;
  port_template_id UUID;
  hist_template_id UUID;
BEGIN
  -- Get template IDs
  SELECT id INTO enem_template_id FROM mock_exam_templates WHERE title = 'ENEM 2023 - Simulado Completo';
  SELECT id INTO math_template_id FROM mock_exam_templates WHERE title = 'Matemática - Funções e Geometria';
  SELECT id INTO bio_template_id FROM mock_exam_templates WHERE title = 'Biologia - Genética e Evolução';
  SELECT id INTO port_template_id FROM mock_exam_templates WHERE title = 'Português - Interpretação de Texto';
  SELECT id INTO hist_template_id FROM mock_exam_templates WHERE title = 'História do Brasil - República';

  -- Insert sample questions for ENEM template
  INSERT INTO mock_exam_questions (
    id, template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points, time_estimate_seconds, tags, created_at
  ) VALUES
  (
    gen_random_uuid(),
    enem_template_id,
    1,
    'Leia o texto abaixo e responda:

"A linguagem é um sistema de signos que permite a comunicação entre os seres humanos. Ela não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social."

Segundo o texto, a linguagem:',
    'multiple_choice',
    '["É apenas um meio de comunicação básica", "Serve exclusivamente para transmitir informações", "Constrói a realidade social além de comunicar", "É um sistema simples de signos", "Não influencia a sociedade"]'::jsonb,
    'Constrói a realidade social além de comunicar',
    'O texto afirma que a linguagem "não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social", indicando que ela tem função além da comunicação básica.',
    'Português',
    2,
    1.0,
    90,
    ARRAY['interpretacao', 'linguagem', 'comunicacao'],
    NOW()
  ),
  (
    gen_random_uuid(),
    enem_template_id,
    2,
    'Qual é o resultado da expressão: 2x + 3 = 11?',
    'multiple_choice',
    '["x = 2", "x = 3", "x = 4", "x = 5", "x = 6"]'::jsonb,
    'x = 4',
    'Resolvendo: 2x + 3 = 11 → 2x = 11 - 3 → 2x = 8 → x = 4',
    'Matemática',
    1,
    1.0,
    60,
    ARRAY['algebra', 'equacao', 'basico'],
    NOW()
  ),
  (
    gen_random_uuid(),
    enem_template_id,
    3,
    'A Proclamação da República no Brasil ocorreu em:',
    'multiple_choice',
    '["15 de novembro de 1889", "7 de setembro de 1822", "15 de novembro de 1888", "13 de maio de 1888", "15 de dezembro de 1889"]'::jsonb,
    '15 de novembro de 1889',
    'A Proclamação da República brasileira ocorreu em 15 de novembro de 1889, liderada pelo Marechal Deodoro da Fonseca.',
    'História',
    2,
    1.0,
    45,
    ARRAY['republica', 'brasil', 'historia'],
    NOW()
  ),
  (
    gen_random_uuid(),
    enem_template_id,
    4,
    'Qual das alternativas apresenta corretamente a primeira lei de Mendel?',
    'multiple_choice',
    '["Lei da Segregação dos Fatores", "Lei da Dominância Completa", "Lei da Codominância", "Lei da Herança Ligada ao Sexo", "Lei da Epistasia"]'::jsonb,
    'Lei da Segregação dos Fatores',
    'A primeira lei de Mendel é conhecida como Lei da Segregação dos Fatores, que estabelece que cada característica é determinada por dois fatores que se separam na formação dos gametas.',
    'Biologia',
    3,
    1.0,
    75,
    ARRAY['genetica', 'mendel', 'hereditariedade'],
    NOW()
  ),
  (
    gen_random_uuid(),
    enem_template_id,
    5,
    'A velocidade média de um objeto que percorre 100 metros em 10 segundos é:',
    'multiple_choice',
    '["5 m/s", "10 m/s", "15 m/s", "20 m/s", "25 m/s"]'::jsonb,
    '10 m/s',
    'Velocidade média = distância / tempo = 100m / 10s = 10 m/s',
    'Física',
    2,
    1.0,
    60,
    ARRAY['cinematica', 'velocidade', 'movimento'],
    NOW()
  );

  -- Insert questions for Português template
  INSERT INTO mock_exam_questions (
    id, template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points, time_estimate_seconds, tags, created_at
  ) VALUES
  (
    gen_random_uuid(),
    port_template_id,
    1,
    'Leia o texto abaixo e responda:

"A linguagem é um sistema de signos que permite a comunicação entre os seres humanos. Ela não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social."

Segundo o texto, a linguagem:',
    'multiple_choice',
    '["É apenas um meio de comunicação básica", "Serve exclusivamente para transmitir informações", "Constrói a realidade social além de comunicar", "É um sistema simples de signos", "Não influencia a sociedade"]'::jsonb,
    'Constrói a realidade social além de comunicar',
    'O texto afirma que a linguagem "não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social", indicando que ela tem função além da comunicação básica.',
    'Português',
    3,
    1.0,
    120,
    ARRAY['interpretacao', 'linguagem', 'comunicacao'],
    NOW()
  ),
  (
    gen_random_uuid(),
    port_template_id,
    2,
    'Qual figura de linguagem está presente na frase: "O vento sussurrava segredos"?',
    'multiple_choice',
    '["Metáfora", "Personificação", "Hipérbole", "Ironia", "Antítese"]'::jsonb,
    'Personificação',
    'A personificação atribui características humanas (sussurrar segredos) a elementos não humanos (vento).',
    'Português',
    2,
    1.0,
    90,
    ARRAY['figuras-linguagem', 'personificacao', 'literatura'],
    NOW()
  );

  -- Insert questions for História template
  INSERT INTO mock_exam_questions (
    id, template_id, question_number, question_text, question_type, options, correct_answer, explanation, subject_area, difficulty_level, points, time_estimate_seconds, tags, created_at
  ) VALUES
  (
    gen_random_uuid(),
    hist_template_id,
    1,
    'A Proclamação da República no Brasil ocorreu em:',
    'multiple_choice',
    '["15 de novembro de 1889", "7 de setembro de 1822", "15 de novembro de 1888", "13 de maio de 1888", "15 de dezembro de 1889"]'::jsonb,
    '15 de novembro de 1889',
    'A Proclamação da República brasileira ocorreu em 15 de novembro de 1889, liderada pelo Marechal Deodoro da Fonseca.',
    'História',
    2,
    1.0,
    90,
    ARRAY['republica', 'brasil', 'proclamacao'],
    NOW()
  ),
  (
    gen_random_uuid(),
    hist_template_id,
    2,
    'O período conhecido como "República Velha" no Brasil compreende:',
    'multiple_choice',
    '["1889 a 1930", "1930 a 1945", "1945 a 1964", "1822 a 1889", "1964 a 1985"]'::jsonb,
    '1889 a 1930',
    'A República Velha ou Primeira República brasileira estendeu-se de 1889 (Proclamação da República) até 1930 (Revolução de 1930).',
    'História',
    3,
    1.0,
    75,
    ARRAY['republica-velha', 'periodizacao', 'brasil'],
    NOW()
  );

  RAISE NOTICE 'Mock exam data populated successfully!';
END $$;
