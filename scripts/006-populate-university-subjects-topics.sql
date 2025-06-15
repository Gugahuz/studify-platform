-- Purpose: Populates university-level subjects and topics for Medicine, Law, Dentistry, Engineering, Administration, and Psychology
-- This extends the flashcard system with comprehensive higher education content

-- First, ensure the unique constraints exist
ALTER TABLE public.flashcard_subjects 
ADD CONSTRAINT IF NOT EXISTS flashcard_subjects_name_unique UNIQUE (name);

ALTER TABLE public.flashcard_topics 
ADD CONSTRAINT IF NOT EXISTS flashcard_topics_subject_name_unique UNIQUE (subject_id, name);

-- Insert university subjects
INSERT INTO public.flashcard_subjects (name, category, description, icon, color) VALUES
-- Medicine
('Medicina', 'Ensino Superior', 'Curso completo de Medicina com todas as especialidades', 'Heart', '#DC2626'),
-- Law
('Direito', 'Ensino Superior', 'Curso completo de Direito com todas as áreas jurídicas', 'Scale', '#7C3AED'),
-- Dentistry
('Odontologia', 'Ensino Superior', 'Curso completo de Odontologia com todas as especialidades', 'Smile', '#10B981'),
-- Engineering
('Engenharia', 'Ensino Superior', 'Curso completo de Engenharia com todas as modalidades', 'Cog', '#F59E0B'),
-- Administration
('Administração', 'Ensino Superior', 'Curso completo de Administração de Empresas', 'Briefcase', '#3B82F6'),
-- Psychology
('Psicologia', 'Ensino Superior', 'Curso completo de Psicologia com todas as áreas', 'Brain', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- Populate topics using a DO block to fetch subject_ids
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

    -- Insert topics for Medicina if subject exists
    IF medicina_id IS NOT NULL THEN
        -- Use individual INSERT statements with WHERE NOT EXISTS to avoid conflicts
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Anatomia Humana', 'Estudo da estrutura do corpo humano', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Anatomia Humana');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Fisiologia', 'Funcionamento dos sistemas corporais', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Fisiologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Bioquímica', 'Processos químicos nos organismos vivos', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Bioquímica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Genética', 'Hereditariedade e variação genética', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Genética');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Histologia', 'Estudo dos tecidos biológicos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Histologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Embriologia', 'Desenvolvimento embrionário e fetal', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Embriologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Farmacologia', 'Ação e efeitos dos medicamentos', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Farmacologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Microbiologia', 'Estudo dos microrganismos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Microbiologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Imunologia', 'Sistema imunológico e defesas do corpo', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Imunologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Patologia', 'Estudo das doenças e suas causas', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Patologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Semiologia Médica', 'Sinais e sintomas das doenças', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Semiologia Médica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Clínica Médica', 'Diagnóstico e tratamento clínico', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Clínica Médica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Cirurgia', 'Procedimentos cirúrgicos e técnicas', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Cirurgia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Pediatria', 'Medicina infantil e do adolescente', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Pediatria');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Ginecologia e Obstetrícia', 'Saúde da mulher e reprodução', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Ginecologia e Obstetrícia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Psiquiatria', 'Transtornos mentais e comportamentais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Psiquiatria');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Radiologia', 'Diagnóstico por imagem', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Radiologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Neurologia', 'Doenças do sistema nervoso', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Neurologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Cardiologia', 'Doenças cardiovasculares', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Cardiologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Pneumologia', 'Doenças respiratórias', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Pneumologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Gastroenterologia', 'Doenças do sistema digestivo', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Gastroenterologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Endocrinologia', 'Distúrbios hormonais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Endocrinologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Nefrologia', 'Doenças renais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Nefrologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Hematologia', 'Doenças do sangue', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Hematologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Oncologia', 'Tratamento do câncer', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Oncologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Dermatologia', 'Doenças da pele', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Dermatologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Infectologia', 'Doenças infecciosas', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Infectologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Medicina Legal', 'Aspectos legais da medicina', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Medicina Legal');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Saúde Pública', 'Prevenção e promoção da saúde', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Saúde Pública');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT medicina_id, 'Ética Médica', 'Princípios éticos na medicina', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = medicina_id AND name = 'Ética Médica');
    END IF;

    -- Insert topics for Direito if subject exists
    IF direito_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Constitucional', 'Princípios e normas constitucionais', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Constitucional');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Administrativo', 'Administração pública e seus atos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Administrativo');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Civil', 'Relações jurídicas entre particulares', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Civil');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Penal', 'Crimes e suas punições', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Penal');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Empresarial', 'Atividade empresarial e comercial', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Empresarial');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito do Trabalho', 'Relações trabalhistas', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito do Trabalho');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Tributário', 'Tributos e obrigações fiscais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Tributário');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Internacional Público', 'Relações entre Estados', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Internacional Público');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Internacional Privado', 'Conflitos de leis no espaço', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Internacional Privado');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Teoria do Direito', 'Fundamentos teóricos do direito', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Teoria do Direito');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Filosofia do Direito', 'Aspectos filosóficos do direito', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Filosofia do Direito');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Sociologia Jurídica', 'Direito e sociedade', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Sociologia Jurídica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Hermenêutica Jurídica', 'Interpretação das normas jurídicas', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Hermenêutica Jurídica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Processual Civil', 'Processo civil e procedimentos', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Processual Civil');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Processual Penal', 'Processo penal e investigação', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Processual Penal');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Previdenciário', 'Seguridade social', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Previdenciário');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Ambiental', 'Proteção do meio ambiente', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Ambiental');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT direito_id, 'Direito Digital', 'Tecnologia e direito na era digital', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = direito_id AND name = 'Direito Digital');
    END IF;

    -- Insert topics for Odontologia if subject exists
    IF odontologia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Radiologia Odontológica', 'Diagnóstico por imagem em odontologia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Radiologia Odontológica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Patologia Bucal', 'Doenças da cavidade oral', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Patologia Bucal');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Anatomia Humana (Odonto)', 'Anatomia aplicada à odontologia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Anatomia Humana (Odonto)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Anatomia Dental', 'Estrutura e morfologia dos dentes', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Anatomia Dental');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Periodontia', 'Doenças periodontais e tratamento', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Periodontia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Dentística', 'Restaurações dentárias estéticas', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Dentística');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Prótese Total', 'Reabilitação com próteses totais', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Prótese Total');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Prótese Parcial', 'Próteses parciais removíveis e fixas', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Prótese Parcial');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Cirurgia Oral Menor', 'Procedimentos cirúrgicos simples', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Cirurgia Oral Menor');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Cirurgia Oral Maior', 'Cirurgias complexas da cavidade oral', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Cirurgia Oral Maior');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Terapêutica Medicamentosa', 'Farmacologia aplicada à odontologia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Terapêutica Medicamentosa');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Endodontia', 'Tratamento de canal radicular', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Endodontia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Ortodontia', 'Correção da posição dos dentes', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Ortodontia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Odontopediatria', 'Odontologia infantil', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Odontopediatria');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT odontologia_id, 'Materiais Dentários', 'Propriedades dos materiais odontológicos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = odontologia_id AND name = 'Materiais Dentários');
    END IF;

    -- Insert topics for Engenharia if subject exists
    IF engenharia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Cálculo (Engenharia)', 'Cálculo diferencial e integral aplicado', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Cálculo (Engenharia)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Física (Engenharia)', 'Física aplicada à engenharia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Física (Engenharia)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Química (Engenharia)', 'Química aplicada à engenharia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Química (Engenharia)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Desenho Técnico', 'Representação gráfica de projetos', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Desenho Técnico');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Mecânica dos Sólidos', 'Comportamento mecânico dos materiais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Mecânica dos Sólidos');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Termodinâmica', 'Energia e transformações térmicas', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Termodinâmica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Eletromagnetismo', 'Fenômenos elétricos e magnéticos', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Eletromagnetismo');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Eletrônica', 'Circuitos e dispositivos eletrônicos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Eletrônica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Ciência dos Materiais', 'Propriedades e aplicações dos materiais', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Ciência dos Materiais');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia de Software', 'Desenvolvimento de sistemas', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia de Software');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia Civil', 'Construção e infraestrutura', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia Civil');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia Mecânica', 'Máquinas e sistemas mecânicos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia Mecânica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia Elétrica', 'Sistemas elétricos e eletrônicos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia Elétrica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia de Produção', 'Otimização de processos produtivos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia de Produção');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia Química', 'Processos químicos industriais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia Química');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT engenharia_id, 'Engenharia Ambiental', 'Sustentabilidade e meio ambiente', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = engenharia_id AND name = 'Engenharia Ambiental');
    END IF;

    -- Insert topics for Administração if subject exists
    IF administracao_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Administração Estratégica', 'Planejamento e estratégia empresarial', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Administração Estratégica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Marketing', 'Estratégias de marketing e vendas', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Marketing');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Finanças', 'Gestão financeira empresarial', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Finanças');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Recursos Humanos', 'Gestão de pessoas e talentos', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Recursos Humanos');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Contabilidade', 'Controle e análise contábil', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Contabilidade');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Economia', 'Princípios econômicos aplicados', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Economia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Operações', 'Gestão de operações e processos', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Operações');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Empreendedorismo', 'Criação e gestão de negócios', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Empreendedorismo');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Comportamento Organizacional', 'Dinâmica das organizações', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Comportamento Organizacional');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Direito Empresarial (Admin)', 'Aspectos legais dos negócios', 3
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Direito Empresarial (Admin)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT administracao_id, 'Estatística (Admin)', 'Análise estatística para negócios', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = administracao_id AND name = 'Estatística (Admin)');
    END IF;

    -- Insert topics for Psicologia if subject exists
    IF psicologia_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicologia do Desenvolvimento', 'Desenvolvimento humano ao longo da vida', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicologia do Desenvolvimento');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicologia Social', 'Comportamento em contextos sociais', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicologia Social');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicopatologia', 'Transtornos mentais e comportamentais', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicopatologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Teorias da Personalidade', 'Diferentes abordagens da personalidade', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Teorias da Personalidade');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicologia Cognitiva', 'Processos mentais e cognição', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicologia Cognitiva');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Neuropsicologia', 'Relação entre cérebro e comportamento', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Neuropsicologia');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicologia Clínica', 'Avaliação e intervenção psicológica', 5
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicologia Clínica');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Psicologia Organizacional', 'Psicologia aplicada ao trabalho', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Psicologia Organizacional');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Metodologia da Pesquisa (Psico)', 'Métodos de pesquisa em psicologia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Metodologia da Pesquisa (Psico)');
        
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level)
        SELECT psicologia_id, 'Estatística (Psico)', 'Análise estatística em psicologia', 4
        WHERE NOT EXISTS (SELECT 1 FROM public.flashcard_topics WHERE subject_id = psicologia_id AND name = 'Estatística (Psico)');
    END IF;

END $$;

SELECT '006-populate-university-subjects-topics.sql executed successfully.' AS status;
