-- Purpose: Populates 'flashcard_subjects' and 'flashcard_topics' with initial data.
-- Based on 'populate-flashcard-content.sql'.

-- Insert subjects for Vestibular (High School Entrance Exams)
INSERT INTO public.flashcard_subjects (name, category, description, icon, color) VALUES
('Matemática (Vestibular)', 'Vestibular', 'Álgebra, Geometria, Trigonometria e Análise para Vestibular', 'Calculator', '#3B82F6'),
('Física (Vestibular)', 'Vestibular', 'Mecânica, Termodinâmica, Eletromagnetismo e Óptica para Vestibular', 'Zap', '#8B5CF6'),
('Química (Vestibular)', 'Vestibular', 'Química Geral, Orgânica e Inorgânica para Vestibular', 'Flask', '#10B981'),
('Biologia (Vestibular)', 'Vestibular', 'Citologia, Genética, Ecologia e Evolução para Vestibular', 'Leaf', '#059669'),
('História (Vestibular)', 'Vestibular', 'História do Brasil e História Geral para Vestibular', 'Clock', '#DC2626'),
('Geografia (Vestibular)', 'Vestibular', 'Geografia Física e Humana para Vestibular', 'Globe', '#2563EB'),
('Português (Vestibular)', 'Vestibular', 'Gramática, Literatura e Redação para Vestibular', 'BookOpen', '#7C3AED'),
('Literatura (Vestibular)', 'Vestibular', 'Literatura Brasileira e Portuguesa para Vestibular', 'Book', '#BE185D'),
('Inglês (Vestibular)', 'Vestibular', 'Gramática, Vocabulário e Interpretação para Vestibular', 'Languages', '#0891B2'),
('Filosofia (Vestibular)', 'Vestibular', 'História da Filosofia e Pensamento Crítico para Vestibular', 'Brain', '#7C2D12'),
('Sociologia (Vestibular)', 'Vestibular', 'Teorias Sociológicas e Sociedade Contemporânea para Vestibular', 'Users', '#1F2937')
ON CONFLICT (name) DO NOTHING;

-- Insert subjects for Ensino Superior (Undergraduate)
INSERT INTO public.flashcard_subjects (name, category, description, icon, color) VALUES
('Cálculo I', 'Ensino Superior', 'Limites, Derivadas e Integrais', 'TrendingUp', '#3B82F6'),
('Cálculo II', 'Ensino Superior', 'Integrais Múltiplas e Séries', 'BarChart', '#3B82F6'),
('Álgebra Linear', 'Ensino Superior', 'Matrizes, Vetores e Transformações', 'Grid', '#8B5CF6'),
('Algoritmos e Estruturas de Dados', 'Ensino Superior', 'Estruturas de Dados e Complexidade de Algoritmos', 'Code', '#10B981'),
('Programação Orientada a Objetos', 'Ensino Superior', 'Conceitos de POO e Linguagens', 'Terminal', '#059669'),
('Banco de Dados I', 'Ensino Superior', 'Modelagem Relacional e SQL', 'Database', '#DC2626'),
('Redes de Computadores I', 'Ensino Superior', 'Protocolos e Arquiteturas de Redes', 'Wifi', '#2563EB'),
('Engenharia de Software I', 'Ensino Superior', 'Metodologias Ágeis e Ciclo de Vida', 'Settings', '#7C3AED'),
('Estatística Aplicada', 'Ensino Superior', 'Probabilidade e Inferência Estatística', 'PieChart', '#BE185D'),
('Física I (Mecânica)', 'Ensino Superior', 'Mecânica Clássica para Engenharia e Ciências Exatas', 'Atom', '#0891B2'),
('Química Geral (Superior)', 'Ensino Superior', 'Estrutura Atômica, Ligações e Termoquímica para Ensino Superior', 'Beaker', '#7C2D12')
ON CONFLICT (name) DO NOTHING;

-- Populate topics using a DO block to fetch subject_ids
DO $$
DECLARE
    math_vest_id UUID;
    physics_vest_id UUID;
    chemistry_vest_id UUID;
    biology_vest_id UUID;
    history_vest_id UUID;
    calc1_id UUID;
    algorithms_id UUID;
    programming_id UUID;
BEGIN
    -- Get Vestibular subject IDs
    SELECT id INTO math_vest_id FROM public.flashcard_subjects WHERE name = 'Matemática (Vestibular)';
    SELECT id INTO physics_vest_id FROM public.flashcard_subjects WHERE name = 'Física (Vestibular)';
    SELECT id INTO chemistry_vest_id FROM public.flashcard_subjects WHERE name = 'Química (Vestibular)';
    SELECT id INTO biology_vest_id FROM public.flashcard_subjects WHERE name = 'Biologia (Vestibular)';
    SELECT id INTO history_vest_id FROM public.flashcard_subjects WHERE name = 'História (Vestibular)';
    
    -- Get Ensino Superior subject IDs
    SELECT id INTO calc1_id FROM public.flashcard_subjects WHERE name = 'Cálculo I';
    SELECT id INTO algorithms_id FROM public.flashcard_subjects WHERE name = 'Algoritmos e Estruturas de Dados';
    SELECT id INTO programming_id FROM public.flashcard_subjects WHERE name = 'Programação Orientada a Objetos';

    -- Insert topics for Matemática (Vestibular) if subject exists
    IF math_vest_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (math_vest_id, 'Álgebra Básica (Vest.)', 'Equações e inequações do 1º e 2º grau', 2),
        (math_vest_id, 'Funções (Vest.)', 'Função afim, quadrática, exponencial e logarítmica', 3),
        (math_vest_id, 'Geometria Plana (Vest.)', 'Áreas e perímetros de figuras planas', 2),
        (math_vest_id, 'Geometria Espacial (Vest.)', 'Volumes e áreas de sólidos geométricos', 4),
        (math_vest_id, 'Trigonometria (Vest.)', 'Razões trigonométricas e identidades', 3),
        (math_vest_id, 'Análise Combinatória (Vest.)', 'Permutações, arranjos e combinações', 4),
        (math_vest_id, 'Probabilidade (Vest.)', 'Cálculo de probabilidades', 3),
        (math_vest_id, 'Estatística (Vest.)', 'Medidas de tendência central e dispersão', 2)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Física (Vestibular) if subject exists
    IF physics_vest_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (physics_vest_id, 'Cinemática (Vest.)', 'Movimento uniforme e uniformemente variado', 2),
        (physics_vest_id, 'Dinâmica (Vest.)', 'Leis de Newton e aplicações', 3),
        (physics_vest_id, 'Energia (Vest.)', 'Trabalho, energia cinética e potencial', 3),
        (physics_vest_id, 'Hidrostática (Vest.)', 'Pressão e empuxo', 2),
        (physics_vest_id, 'Termologia (Vest.)', 'Temperatura, calor e dilatação', 3),
        (physics_vest_id, 'Óptica (Vest.)', 'Reflexão, refração e lentes', 3),
        (physics_vest_id, 'Eletrostática (Vest.)', 'Carga elétrica e campo elétrico', 4),
        (physics_vest_id, 'Eletrodinâmica (Vest.)', 'Corrente elétrica e circuitos', 4)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Química (Vestibular) if subject exists
    IF chemistry_vest_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (chemistry_vest_id, 'Estrutura Atômica (Vest.)', 'Modelos atômicos e configuração eletrônica', 3),
        (chemistry_vest_id, 'Tabela Periódica (Vest.)', 'Propriedades periódicas dos elementos', 2),
        (chemistry_vest_id, 'Ligações Químicas (Vest.)', 'Iônica, covalente e metálica', 3),
        (chemistry_vest_id, 'Funções Inorgânicas (Vest.)', 'Ácidos, bases, sais e óxidos', 2),
        (chemistry_vest_id, 'Reações Químicas (Vest.)', 'Balanceamento e tipos de reações', 3),
        (chemistry_vest_id, 'Estequiometria (Vest.)', 'Cálculos químicos', 4),
        (chemistry_vest_id, 'Química Orgânica (Vest.)', 'Hidrocarbonetos e funções orgânicas', 4),
        (chemistry_vest_id, 'Físico-Química (Vest.)', 'Termoquímica e cinética química', 5)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Biologia (Vestibular) if subject exists
    IF biology_vest_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (biology_vest_id, 'Citologia (Vest.)', 'Estrutura e função celular', 3),
        (biology_vest_id, 'Histologia (Vest.)', 'Tecidos animais e vegetais', 3),
        (biology_vest_id, 'Fisiologia Humana (Vest.)', 'Sistemas do corpo humano', 4),
        (biology_vest_id, 'Genética (Vest.)', 'Leis de Mendel e hereditariedade', 4),
        (biology_vest_id, 'Evolução (Vest.)', 'Teorias evolutivas e especiação', 4),
        (biology_vest_id, 'Ecologia (Vest.)', 'Ecossistemas e relações ecológicas', 3),
        (biology_vest_id, 'Botânica (Vest.)', 'Morfologia e fisiologia vegetal', 3),
        (biology_vest_id, 'Zoologia (Vest.)', 'Classificação e características dos animais', 3)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for História (Vestibular) if subject exists
    IF history_vest_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (history_vest_id, 'Brasil Colônia', 'Colonização portuguesa no Brasil', 2),
        (history_vest_id, 'Brasil Império', 'Independência e período imperial', 3),
        (history_vest_id, 'Brasil República', 'República Velha até os dias atuais', 3),
        (history_vest_id, 'Idade Média', 'Feudalismo e sociedade medieval', 2),
        (history_vest_id, 'Idade Moderna', 'Renascimento e grandes navegações', 3),
        (history_vest_id, 'Revolução Industrial', 'Transformações econômicas e sociais', 3),
        (history_vest_id, 'Guerras Mundiais', 'Primeira e Segunda Guerra Mundial', 4),
        (history_vest_id, 'Guerra Fria', 'Bipolarização mundial', 4)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Cálculo I (Ensino Superior) if subject exists
    IF calc1_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (calc1_id, 'Limites (Cálculo I)', 'Conceito e cálculo de limites', 3),
        (calc1_id, 'Continuidade (Cálculo I)', 'Funções contínuas e descontinuidades', 3),
        (calc1_id, 'Derivadas (Cálculo I)', 'Conceito e regras de derivação', 4),
        (calc1_id, 'Aplicações de Derivadas (Cálculo I)', 'Otimização e análise de funções', 4),
        (calc1_id, 'Integrais Indefinidas (Cálculo I)', 'Antiderivadas e técnicas de integração', 4),
        (calc1_id, 'Integrais Definidas (Cálculo I)', 'Teorema fundamental do cálculo', 5),
        (calc1_id, 'Aplicações de Integrais (Cálculo I)', 'Áreas e volumes', 5)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Algoritmos (Ensino Superior) if subject exists
    IF algorithms_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (algorithms_id, 'Complexidade de Algoritmos', 'Análise de algoritmos e notação Big O', 4),
        (algorithms_id, 'Estruturas Lineares de Dados', 'Arrays, listas, pilhas e filas', 3),
        (algorithms_id, 'Árvores (Estrutura de Dados)', 'Árvores binárias, de busca, balanceadas', 4),
        (algorithms_id, 'Grafos (Estrutura de Dados)', 'Representação e algoritmos em grafos', 5),
        (algorithms_id, 'Algoritmos de Ordenação', 'BubbleSort, MergeSort, QuickSort, etc.', 3),
        (algorithms_id, 'Algoritmos de Busca', 'Busca linear, binária, em árvores e grafos', 3),
        (algorithms_id, 'Programação Dinâmica', 'Otimização e memoização', 5)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

    -- Insert topics for Programação (Ensino Superior) if subject exists
    IF programming_id IS NOT NULL THEN
        INSERT INTO public.flashcard_topics (subject_id, name, description, difficulty_level) VALUES
        (programming_id, 'Lógica de Programação (POO)', 'Algoritmos e fluxogramas aplicados', 2),
        (programming_id, 'Conceitos de POO', 'Classes, objetos, encapsulamento, herança, polimorfismo', 4),
        (programming_id, 'Estruturas de Controle (POO)', 'Condicionais e loops em linguagens OO', 2),
        (programming_id, 'Funções e Métodos (POO)', 'Definição, uso e escopo', 3),
        (programming_id, 'Tratamento de Exceções (POO)', 'Try-catch, throwing exceptions', 3),
        (programming_id, 'Padrões de Projeto (POO)', 'Design patterns comuns como Singleton, Factory, Observer', 5)
        ON CONFLICT (subject_id, name) DO NOTHING;
    END IF;

END $$;

SELECT '002-populate-flashcard-subjects-topics.sql executed successfully.' AS status;
