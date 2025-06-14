-- Populate comprehensive educational content for flashcard system

-- Insert subjects for Vestibular (High School Entrance Exams)
INSERT INTO flashcard_subjects (name, category, description, icon, color) VALUES
('Matemática', 'Vestibular', 'Álgebra, Geometria, Trigonometria e Análise', 'Calculator', '#3B82F6'),
('Física', 'Vestibular', 'Mecânica, Termodinâmica, Eletromagnetismo e Óptica', 'Zap', '#8B5CF6'),
('Química', 'Vestibular', 'Química Geral, Orgânica e Inorgânica', 'Flask', '#10B981'),
('Biologia', 'Vestibular', 'Citologia, Genética, Ecologia e Evolução', 'Leaf', '#059669'),
('História', 'Vestibular', 'História do Brasil e História Geral', 'Clock', '#DC2626'),
('Geografia', 'Vestibular', 'Geografia Física e Humana', 'Globe', '#2563EB'),
('Português', 'Vestibular', 'Gramática, Literatura e Redação', 'BookOpen', '#7C3AED'),
('Literatura', 'Vestibular', 'Literatura Brasileira e Portuguesa', 'Book', '#BE185D'),
('Inglês', 'Vestibular', 'Gramática, Vocabulário e Interpretação', 'Languages', '#0891B2'),
('Filosofia', 'Vestibular', 'História da Filosofia e Pensamento Crítico', 'Brain', '#7C2D12'),
('Sociologia', 'Vestibular', 'Teorias Sociológicas e Sociedade Contemporânea', 'Users', '#1F2937');

-- Insert subjects for Ensino Superior (Undergraduate)
INSERT INTO flashcard_subjects (name, category, description, icon, color) VALUES
('Cálculo I', 'Ensino Superior', 'Limites, Derivadas e Integrais', 'TrendingUp', '#3B82F6'),
('Cálculo II', 'Ensino Superior', 'Integrais Múltiplas e Séries', 'BarChart', '#3B82F6'),
('Álgebra Linear', 'Ensino Superior', 'Matrizes, Vetores e Transformações', 'Grid', '#8B5CF6'),
('Algoritmos', 'Ensino Superior', 'Estruturas de Dados e Complexidade', 'Code', '#10B981'),
('Programação', 'Ensino Superior', 'Linguagens e Paradigmas de Programação', 'Terminal', '#059669'),
('Banco de Dados', 'Ensino Superior', 'Modelagem e SQL', 'Database', '#DC2626'),
('Redes de Computadores', 'Ensino Superior', 'Protocolos e Arquiteturas', 'Wifi', '#2563EB'),
('Engenharia de Software', 'Ensino Superior', 'Metodologias e Qualidade', 'Settings', '#7C3AED'),
('Estatística', 'Ensino Superior', 'Probabilidade e Inferência', 'PieChart', '#BE185D'),
('Física I', 'Ensino Superior', 'Mecânica Clássica', 'Atom', '#0891B2'),
('Química Geral', 'Ensino Superior', 'Estrutura Atômica e Ligações', 'Beaker', '#7C2D12');

-- Get subject IDs for topic insertion
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
    SELECT id INTO math_vest_id FROM flashcard_subjects WHERE name = 'Matemática' AND category = 'Vestibular';
    SELECT id INTO physics_vest_id FROM flashcard_subjects WHERE name = 'Física' AND category = 'Vestibular';
    SELECT id INTO chemistry_vest_id FROM flashcard_subjects WHERE name = 'Química' AND category = 'Vestibular';
    SELECT id INTO biology_vest_id FROM flashcard_subjects WHERE name = 'Biologia' AND category = 'Vestibular';
    SELECT id INTO history_vest_id FROM flashcard_subjects WHERE name = 'História' AND category = 'Vestibular';
    
    -- Get Ensino Superior subject IDs
    SELECT id INTO calc1_id FROM flashcard_subjects WHERE name = 'Cálculo I' AND category = 'Ensino Superior';
    SELECT id INTO algorithms_id FROM flashcard_subjects WHERE name = 'Algoritmos' AND category = 'Ensino Superior';
    SELECT id INTO programming_id FROM flashcard_subjects WHERE name = 'Programação' AND category = 'Ensino Superior';

    -- Insert topics for Matemática (Vestibular)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (math_vest_id, 'Álgebra Básica', 'Equações e inequações do 1º e 2º grau', 2),
    (math_vest_id, 'Funções', 'Função afim, quadrática, exponencial e logarítmica', 3),
    (math_vest_id, 'Geometria Plana', 'Áreas e perímetros de figuras planas', 2),
    (math_vest_id, 'Geometria Espacial', 'Volumes e áreas de sólidos geométricos', 4),
    (math_vest_id, 'Trigonometria', 'Razões trigonométricas e identidades', 3),
    (math_vest_id, 'Análise Combinatória', 'Permutações, arranjos e combinações', 4),
    (math_vest_id, 'Probabilidade', 'Cálculo de probabilidades', 3),
    (math_vest_id, 'Estatística', 'Medidas de tendência central e dispersão', 2);

    -- Insert topics for Física (Vestibular)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (physics_vest_id, 'Cinemática', 'Movimento uniforme e uniformemente variado', 2),
    (physics_vest_id, 'Dinâmica', 'Leis de Newton e aplicações', 3),
    (physics_vest_id, 'Energia', 'Trabalho, energia cinética e potencial', 3),
    (physics_vest_id, 'Hidrostática', 'Pressão e empuxo', 2),
    (physics_vest_id, 'Termologia', 'Temperatura, calor e dilatação', 3),
    (physics_vest_id, 'Óptica', 'Reflexão, refração e lentes', 3),
    (physics_vest_id, 'Eletrostática', 'Carga elétrica e campo elétrico', 4),
    (physics_vest_id, 'Eletrodinâmica', 'Corrente elétrica e circuitos', 4);

    -- Insert topics for Química (Vestibular)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (chemistry_vest_id, 'Estrutura Atômica', 'Modelos atômicos e configuração eletrônica', 3),
    (chemistry_vest_id, 'Tabela Periódica', 'Propriedades periódicas dos elementos', 2),
    (chemistry_vest_id, 'Ligações Químicas', 'Iônica, covalente e metálica', 3),
    (chemistry_vest_id, 'Funções Inorgânicas', 'Ácidos, bases, sais e óxidos', 2),
    (chemistry_vest_id, 'Reações Químicas', 'Balanceamento e tipos de reações', 3),
    (chemistry_vest_id, 'Estequiometria', 'Cálculos químicos', 4),
    (chemistry_vest_id, 'Química Orgânica', 'Hidrocarbonetos e funções orgânicas', 4),
    (chemistry_vest_id, 'Físico-Química', 'Termoquímica e cinética química', 5);

    -- Insert topics for Biologia (Vestibular)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (biology_vest_id, 'Citologia', 'Estrutura e função celular', 3),
    (biology_vest_id, 'Histologia', 'Tecidos animais e vegetais', 3),
    (biology_vest_id, 'Fisiologia Humana', 'Sistemas do corpo humano', 4),
    (biology_vest_id, 'Genética', 'Leis de Mendel e hereditariedade', 4),
    (biology_vest_id, 'Evolução', 'Teorias evolutivas e especiação', 4),
    (biology_vest_id, 'Ecologia', 'Ecossistemas e relações ecológicas', 3),
    (biology_vest_id, 'Botânica', 'Morfologia e fisiologia vegetal', 3),
    (biology_vest_id, 'Zoologia', 'Classificação e características dos animais', 3);

    -- Insert topics for História (Vestibular)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (history_vest_id, 'Brasil Colônia', 'Colonização portuguesa no Brasil', 2),
    (history_vest_id, 'Brasil Império', 'Independência e período imperial', 3),
    (history_vest_id, 'Brasil República', 'República Velha até os dias atuais', 3),
    (history_vest_id, 'Idade Média', 'Feudalismo e sociedade medieval', 2),
    (history_vest_id, 'Idade Moderna', 'Renascimento e grandes navegações', 3),
    (history_vest_id, 'Revolução Industrial', 'Transformações econômicas e sociais', 3),
    (history_vest_id, 'Guerras Mundiais', 'Primeira e Segunda Guerra Mundial', 4),
    (history_vest_id, 'Guerra Fria', 'Bipolarização mundial', 4);

    -- Insert topics for Cálculo I (Ensino Superior)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (calc1_id, 'Limites', 'Conceito e cálculo de limites', 3),
    (calc1_id, 'Continuidade', 'Funções contínuas e descontinuidades', 3),
    (calc1_id, 'Derivadas', 'Conceito e regras de derivação', 4),
    (calc1_id, 'Aplicações de Derivadas', 'Otimização e análise de funções', 4),
    (calc1_id, 'Integrais Indefinidas', 'Antiderivadas e técnicas de integração', 4),
    (calc1_id, 'Integrais Definidas', 'Teorema fundamental do cálculo', 5),
    (calc1_id, 'Aplicações de Integrais', 'Áreas e volumes', 5);

    -- Insert topics for Algoritmos (Ensino Superior)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (algorithms_id, 'Complexidade', 'Análise de algoritmos e notação Big O', 4),
    (algorithms_id, 'Estruturas Lineares', 'Arrays, listas, pilhas e filas', 3),
    (algorithms_id, 'Árvores', 'Árvores binárias e de busca', 4),
    (algorithms_id, 'Grafos', 'Representação e algoritmos em grafos', 5),
    (algorithms_id, 'Ordenação', 'Algoritmos de ordenação', 3),
    (algorithms_id, 'Busca', 'Algoritmos de busca', 3),
    (algorithms_id, 'Programação Dinâmica', 'Otimização e memoização', 5);

    -- Insert topics for Programação (Ensino Superior)
    INSERT INTO flashcard_topics (subject_id, name, description, difficulty_level) VALUES
    (programming_id, 'Lógica de Programação', 'Algoritmos e fluxogramas', 2),
    (programming_id, 'Estruturas de Controle', 'Condicionais e loops', 2),
    (programming_id, 'Funções', 'Definição e uso de funções', 3),
    (programming_id, 'Orientação a Objetos', 'Classes, objetos e herança', 4),
    (programming_id, 'Estruturas de Dados', 'Arrays, listas e dicionários', 3),
    (programming_id, 'Tratamento de Erros', 'Exceções e debugging', 3),
    (programming_id, 'Padrões de Projeto', 'Design patterns comuns', 5);

END $$;
