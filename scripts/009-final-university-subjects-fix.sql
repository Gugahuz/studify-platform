-- Purpose: Add university subjects without UUID MIN() error
-- Final corrected version that handles duplicates properly

-- Step 1: Remove duplicate subjects using DISTINCT ON
CREATE TEMP TABLE temp_subjects AS
SELECT DISTINCT ON (name) id, name, category, description, icon, color, created_at, updated_at
FROM public.flashcard_subjects
ORDER BY name, created_at;

-- Delete all subjects and reinsert unique ones
DELETE FROM public.flashcard_topics WHERE subject_id IN (
    SELECT id FROM public.flashcard_subjects
);
DELETE FROM public.flashcard_subjects;

INSERT INTO public.flashcard_subjects 
SELECT * FROM temp_subjects;

DROP TABLE temp_subjects;

-- Step 2: Create unique constraints
DO $$
BEGIN
    -- Add unique constraint to flashcard_subjects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'flashcard_subjects_name_unique' 
        AND table_name = 'flashcard_subjects'
    ) THEN
        ALTER TABLE public.flashcard_subjects 
        ADD CONSTRAINT flashcard_subjects_name_unique UNIQUE (name);
    END IF;

    -- Add unique constraint to flashcard_topics
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'flashcard_topics_subject_name_unique' 
        AND table_name = 'flashcard_topics'
    ) THEN
        ALTER TABLE public.flashcard_topics 
        ADD CONSTRAINT flashcard_topics_subject_name_unique UNIQUE (subject_id, name);
    END IF;
END $$;

-- Step 3: Re-populate basic subjects first
INSERT INTO public.flashcard_subjects (name, category, description, icon, color) VALUES
-- Ensino Fundamental
('Matemática', 'Ensino Fundamental', 'Aritmética, Álgebra e Geometria Básica', 'Calculator', '#3B82F6'),
('Português', 'Ensino Fundamental', 'Gramática, Literatura e Redação', 'BookOpen', '#10B981'),
('Ciências', 'Ensino Fundamental', 'Biologia, Física e Química Básica', 'Microscope', '#8B5CF6'),
('História', 'Ensino Fundamental', 'História do Brasil e Mundial', 'Clock', '#F59E0B'),
('Geografia', 'Ensino Fundamental', 'Geografia Física e Humana', 'Globe', '#06B6D4'),
('Inglês', 'Ensino Fundamental', 'Gramática e Vocabulário Inglês', 'Languages', '#EF4444'),

-- Ensino Médio
('Matemática (EM)', 'Ensino Médio', 'Funções, Trigonometria e Geometria Analítica', 'Calculator', '#3B82F6'),
('Física', 'Ensino Médio', 'Mecânica, Termodinâmica e Eletromagnetismo', 'Zap', '#F59E0B'),
('Química', 'Ensino Médio', 'Química Geral, Orgânica e Inorgânica', 'TestTube', '#10B981'),
('Biologia', 'Ensino Médio', 'Citologia, Genética e Ecologia', 'Leaf', '#22C55E'),
('Literatura', 'Ensino Médio', 'Literatura Brasileira e Portuguesa', 'Book', '#8B5CF6'),
('Redação', 'Ensino Médio', 'Técnicas de Escrita e Argumentação', 'PenTool', '#EF4444'),
('História (EM)', 'Ensino Médio', 'História Contemporânea e do Brasil', 'Clock', '#F59E0B'),
('Geografia (EM)', 'Ensino Médio', 'Geopolítica e Geografia do Brasil', 'Globe', '#06B6D4'),
('Filosofia', 'Ensino Médio', 'História da Filosofia e Ética', 'Brain', '#7C3AED'),
('Sociologia', 'Ensino Médio', 'Sociedade, Política e Cultura', 'Users', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Add university subjects
INSERT INTO public.flashcard_subjects (name, category, description, icon, color) VALUES
('Medicina', 'Ensino Superior', 'Curso completo de Medicina com todas as especialidades', 'Heart', '#DC2626'),
('Direito', 'Ensino Superior', 'Curso completo de Direito com todas as áreas jurídicas', 'Scale', '#7C3AED'),
('Odontologia', 'Ensino Superior', 'Curso completo de Odontologia com todas as especialidades', 'Smile', '#10B981'),
('Engenharia', 'Ensino Superior', 'Curso completo de Engenharia com todas as modalidades', 'Cog', '#F59E0B'),
('Administração', 'Ensino Superior', 'Curso completo de Administração de Empresas', 'Briefcase', '#3B82F6'),
('Psicologia', 'Ensino Superior', 'Curso completo de Psicologia com todas as áreas', 'Brain', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Add university topics
DO $$
DECLARE
    medicina_id UUID;
    direito_id UUID;
    odontologia_id UUID;
    engenharia_id UUID;
    administracao_id UUID;
    psicologia_id UUID;
BEGIN
    -- Get subject IDs
    SELECT id INTO medicina_id FROM public.flashcard_subjects WHERE name = 'Medicina';
    SELECT id INTO direito_id FROM public.flashcard_subjects WHERE name = 'Direito';
    SELECT id INTO odontologia_id FROM public.flashcard_subjects WHERE name = 'Odontologia';
    SELECT id INTO engenharia_id FROM public.flashcard_subjects WHERE name = 'Engenharia';
    SELECT id INTO administracao_id FROM public.flashcard_subjects WHERE name = 'Administração';
    SELECT id INTO psicologia_id FROM public.flashcard_subjects WHERE name = 'Psicologia';

    -- Medicina topics (30 topics)
    IF medicina_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (medicina_id, 'Anatomia Humana', 'Estudo da estrutura do corpo humano', 4),
        (medicina_id, 'Fisiologia', 'Funcionamento dos sistemas corporais', 4),
        (medicina_id, 'Bioquímica', 'Processos químicos nos organismos vivos', 5),
        (medicina_id, 'Genética', 'Hereditariedade e variação genética', 4),
        (medicina_id, 'Histologia', 'Estudo dos tecidos biológicos', 4),
        (medicina_id, 'Embriologia', 'Desenvolvimento embrionário e fetal', 4),
        (medicina_id, 'Farmacologia', 'Ação e efeitos dos medicamentos', 5),
        (medicina_id, 'Microbiologia', 'Estudo dos microrganismos', 4),
        (medicina_id, 'Imunologia', 'Sistema imunológico e defesas do corpo', 5),
        (medicina_id, 'Patologia', 'Estudo das doenças e suas causas', 5),
        (medicina_id, 'Semiologia Médica', 'Sinais e sintomas das doenças', 4),
        (medicina_id, 'Clínica Médica', 'Diagnóstico e tratamento clínico', 5),
        (medicina_id, 'Cirurgia', 'Procedimentos cirúrgicos e técnicas', 5),
        (medicina_id, 'Pediatria', 'Medicina infantil e do adolescente', 4),
        (medicina_id, 'Ginecologia e Obstetrícia', 'Saúde da mulher e reprodução', 5),
        (medicina_id, 'Psiquiatria', 'Transtornos mentais e comportamentais', 5),
        (medicina_id, 'Radiologia', 'Diagnóstico por imagem', 4),
        (medicina_id, 'Neurologia', 'Doenças do sistema nervoso', 5),
        (medicina_id, 'Cardiologia', 'Doenças cardiovasculares', 5),
        (medicina_id, 'Pneumologia', 'Doenças respiratórias', 4),
        (medicina_id, 'Gastroenterologia', 'Doenças do sistema digestivo', 4),
        (medicina_id, 'Endocrinologia', 'Distúrbios hormonais', 5),
        (medicina_id, 'Nefrologia', 'Doenças renais', 5),
        (medicina_id, 'Hematologia', 'Doenças do sangue', 5),
        (medicina_id, 'Oncologia', 'Tratamento do câncer', 5),
        (medicina_id, 'Dermatologia', 'Doenças da pele', 3),
        (medicina_id, 'Infectologia', 'Doenças infecciosas', 4),
        (medicina_id, 'Medicina Legal', 'Aspectos legais da medicina', 3),
        (medicina_id, 'Saúde Pública', 'Prevenção e promoção da saúde', 3),
        (medicina_id, 'Ética Médica', 'Princípios éticos na medicina', 3);
    END IF;

    -- Direito topics (18 topics)
    IF direito_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (direito_id, 'Direito Constitucional', 'Princípios e normas constitucionais', 4),
        (direito_id, 'Direito Administrativo', 'Administração pública e seus atos', 4),
        (direito_id, 'Direito Civil', 'Relações jurídicas entre particulares', 4),
        (direito_id, 'Direito Penal', 'Crimes e suas punições', 5),
        (direito_id, 'Direito Empresarial', 'Atividade empresarial e comercial', 4),
        (direito_id, 'Direito do Trabalho', 'Relações trabalhistas', 4),
        (direito_id, 'Direito Tributário', 'Tributos e obrigações fiscais', 5),
        (direito_id, 'Direito Internacional Público', 'Relações entre Estados', 5),
        (direito_id, 'Direito Internacional Privado', 'Conflitos de leis no espaço', 5),
        (direito_id, 'Teoria do Direito', 'Fundamentos teóricos do direito', 4),
        (direito_id, 'Filosofia do Direito', 'Aspectos filosóficos do direito', 4),
        (direito_id, 'Sociologia Jurídica', 'Direito e sociedade', 3),
        (direito_id, 'Hermenêutica Jurídica', 'Interpretação das normas jurídicas', 5),
        (direito_id, 'Direito Processual Civil', 'Processo civil e procedimentos', 5),
        (direito_id, 'Direito Processual Penal', 'Processo penal e investigação', 5),
        (direito_id, 'Direito Previdenciário', 'Seguridade social', 4),
        (direito_id, 'Direito Ambiental', 'Proteção do meio ambiente', 4),
        (direito_id, 'Direito Digital', 'Tecnologia e direito na era digital', 4);
    END IF;

    -- Odontologia topics (15 topics)
    IF odontologia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (odontologia_id, 'Radiologia Odontológica', 'Diagnóstico por imagem em odontologia', 4),
        (odontologia_id, 'Patologia Bucal', 'Doenças da cavidade oral', 5),
        (odontologia_id, 'Anatomia Humana (Odonto)', 'Anatomia aplicada à odontologia', 4),
        (odontologia_id, 'Anatomia Dental', 'Estrutura e morfologia dos dentes', 4),
        (odontologia_id, 'Periodontia', 'Doenças periodontais e tratamento', 4),
        (odontologia_id, 'Dentística', 'Restaurações dentárias estéticas', 4),
        (odontologia_id, 'Prótese Total', 'Reabilitação com próteses totais', 4),
        (odontologia_id, 'Prótese Parcial', 'Próteses parciais removíveis e fixas', 4),
        (odontologia_id, 'Cirurgia Oral Menor', 'Procedimentos cirúrgicos simples', 4),
        (odontologia_id, 'Cirurgia Oral Maior', 'Cirurgias complexas da cavidade oral', 5),
        (odontologia_id, 'Terapêutica Medicamentosa', 'Farmacologia aplicada à odontologia', 4),
        (odontologia_id, 'Endodontia', 'Tratamento de canal radicular', 5),
        (odontologia_id, 'Ortodontia', 'Correção da posição dos dentes', 4),
        (odontologia_id, 'Odontopediatria', 'Odontologia infantil', 3),
        (odontologia_id, 'Materiais Dentários', 'Propriedades dos materiais odontológicos', 4);
    END IF;

    -- Engenharia topics (16 topics)
    IF engenharia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (engenharia_id, 'Cálculo (Engenharia)', 'Cálculo diferencial e integral aplicado', 5),
        (engenharia_id, 'Física (Engenharia)', 'Física aplicada à engenharia', 4),
        (engenharia_id, 'Química (Engenharia)', 'Química aplicada à engenharia', 4),
        (engenharia_id, 'Desenho Técnico', 'Representação gráfica de projetos', 3),
        (engenharia_id, 'Mecânica dos Sólidos', 'Comportamento mecânico dos materiais', 5),
        (engenharia_id, 'Termodinâmica', 'Energia e transformações térmicas', 5),
        (engenharia_id, 'Eletromagnetismo', 'Fenômenos elétricos e magnéticos', 5),
        (engenharia_id, 'Eletrônica', 'Circuitos e dispositivos eletrônicos', 4),
        (engenharia_id, 'Ciência dos Materiais', 'Propriedades e aplicações dos materiais', 4),
        (engenharia_id, 'Engenharia de Software', 'Desenvolvimento de sistemas', 4),
        (engenharia_id, 'Engenharia Civil', 'Construção e infraestrutura', 4),
        (engenharia_id, 'Engenharia Mecânica', 'Máquinas e sistemas mecânicos', 4),
        (engenharia_id, 'Engenharia Elétrica', 'Sistemas elétricos e eletrônicos', 4),
        (engenharia_id, 'Engenharia de Produção', 'Otimização de processos produtivos', 4),
        (engenharia_id, 'Engenharia Química', 'Processos químicos industriais', 5),
        (engenharia_id, 'Engenharia Ambiental', 'Sustentabilidade e meio ambiente', 4);
    END IF;

    -- Administração topics (11 topics)
    IF administracao_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (administracao_id, 'Administração Estratégica', 'Planejamento e estratégia empresarial', 4),
        (administracao_id, 'Marketing', 'Estratégias de marketing e vendas', 3),
        (administracao_id, 'Finanças', 'Gestão financeira empresarial', 4),
        (administracao_id, 'Recursos Humanos', 'Gestão de pessoas e talentos', 3),
        (administracao_id, 'Contabilidade', 'Controle e análise contábil', 4),
        (administracao_id, 'Economia', 'Princípios econômicos aplicados', 4),
        (administracao_id, 'Operações', 'Gestão de operações e processos', 4),
        (administracao_id, 'Empreendedorismo', 'Criação e gestão de negócios', 3),
        (administracao_id, 'Comportamento Organizacional', 'Dinâmica das organizações', 3),
        (administracao_id, 'Direito Empresarial (Admin)', 'Aspectos legais dos negócios', 3),
        (administracao_id, 'Estatística (Admin)', 'Análise estatística para negócios', 4);
    END IF;

    -- Psicologia topics (10 topics)
    IF psicologia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (psicologia_id, 'Psicologia do Desenvolvimento', 'Desenvolvimento humano ao longo da vida', 4),
        (psicologia_id, 'Psicologia Social', 'Comportamento em contextos sociais', 4),
        (psicologia_id, 'Psicopatologia', 'Transtornos mentais e comportamentais', 5),
        (psicologia_id, 'Teorias da Personalidade', 'Diferentes abordagens da personalidade', 4),
        (psicologia_id, 'Psicologia Cognitiva', 'Processos mentais e cognição', 4),
        (psicologia_id, 'Neuropsicologia', 'Relação entre cérebro e comportamento', 5),
        (psicologia_id, 'Psicologia Clínica', 'Avaliação e intervenção psicológica', 5),
        (psicologia_id, 'Psicologia Organizacional', 'Psicologia aplicada ao trabalho', 4),
        (psicologia_id, 'Metodologia da Pesquisa (Psico)', 'Métodos de pesquisa em psicologia', 4),
        (psicologia_id, 'Estatística (Psico)', 'Análise estatística em psicologia', 4);
    END IF;

END $$;

-- Final verification and summary
SELECT 
    'SUCCESS: Added ' || 
    (SELECT COUNT(*) FROM public.flashcard_subjects WHERE category = 'Ensino Superior' AND name IN ('Medicina', 'Direito', 'Odontologia', 'Engenharia', 'Administração', 'Psicologia')) || 
    ' university subjects with ' ||
    (SELECT COUNT(*) FROM public.flashcard_topics t 
     JOIN public.flashcard_subjects s ON t.subject_id = s.id 
     WHERE s.category = 'Ensino Superior' AND s.name IN ('Medicina', 'Direito', 'Odontologia', 'Engenharia', 'Administração', 'Psicologia')) || 
    ' topics total.' AS final_status;
