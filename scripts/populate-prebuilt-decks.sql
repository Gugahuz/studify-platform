-- Populate pre-built flashcard decks with showcase content

DO $$
DECLARE
    math_subject_id UUID;
    physics_subject_id UUID;
    chemistry_subject_id UUID;
    calc_subject_id UUID;
    algo_subject_id UUID;
    
    -- Deck IDs
    enem_math_deck_id UUID;
    physics_basics_deck_id UUID;
    chemistry_fundamentals_deck_id UUID;
    calc_essentials_deck_id UUID;
    programming_basics_deck_id UUID;
    
    -- Flashcard IDs for organization
    current_flashcard_id UUID;
BEGIN
    -- Get subject IDs
    SELECT id INTO math_subject_id FROM flashcard_subjects WHERE name = 'Matemática';
    SELECT id INTO physics_subject_id FROM flashcard_subjects WHERE name = 'Física';
    SELECT id INTO chemistry_subject_id FROM flashcard_subjects WHERE name = 'Química';
    SELECT id INTO calc_subject_id FROM flashcard_subjects WHERE name = 'Cálculo I';
    SELECT id INTO algo_subject_id FROM flashcard_subjects WHERE name = 'Algoritmos';

    -- Create pre-built decks
    INSERT INTO prebuilt_flashcard_decks (
        name, description, subject_id, category, difficulty_level, 
        estimated_time_minutes, tags, author_name, is_featured, total_cards
    ) VALUES
    (
        'ENEM Matemática Essencial',
        'Deck completo com os conceitos mais cobrados em Matemática no ENEM. Inclui álgebra, geometria, estatística e funções.',
        math_subject_id,
        'featured',
        3,
        45,
        ARRAY['enem', 'vestibular', 'matemática', 'essencial'],
        'Studify Team',
        true,
        25
    ),
    (
        'Física Básica - Mecânica',
        'Fundamentos de mecânica clássica: cinemática, dinâmica e energia. Perfeito para iniciantes.',
        physics_subject_id,
        'popular',
        2,
        30,
        ARRAY['física', 'mecânica', 'básico', 'cinemática'],
        'Prof. Silva',
        true,
        20
    ),
    (
        'Química Geral Fundamentals',
        'Conceitos fundamentais de química: estrutura atômica, ligações químicas e estequiometria.',
        chemistry_subject_id,
        'featured',
        3,
        40,
        ARRAY['química', 'fundamental', 'átomo', 'ligações'],
        'Studify Team',
        true,
        22
    ),
    (
        'Cálculo I - Limites e Derivadas',
        'Introdução ao cálculo diferencial: conceitos de limite, continuidade e derivação.',
        calc_subject_id,
        'new',
        4,
        60,
        ARRAY['cálculo', 'limites', 'derivadas', 'superior'],
        'Prof. Mathematics',
        false,
        18
    ),
    (
        'Programação - Algoritmos Básicos',
        'Estruturas de dados básicas e algoritmos fundamentais para iniciantes em programação.',
        algo_subject_id,
        'popular',
        3,
        35,
        ARRAY['programação', 'algoritmos', 'estruturas', 'básico'],
        'Dev Team',
        true,
        15
    )
    RETURNING id INTO enem_math_deck_id;

    -- Get the deck IDs (since we can only return one in the above query)
    SELECT id INTO enem_math_deck_id FROM prebuilt_flashcard_decks WHERE name = 'ENEM Matemática Essencial';
    SELECT id INTO physics_basics_deck_id FROM prebuilt_flashcard_decks WHERE name = 'Física Básica - Mecânica';
    SELECT id INTO chemistry_fundamentals_deck_id FROM prebuilt_flashcard_decks WHERE name = 'Química Geral Fundamentals';
    SELECT id INTO calc_essentials_deck_id FROM prebuilt_flashcard_decks WHERE name = 'Cálculo I - Limites e Derivadas';
    SELECT id INTO programming_basics_deck_id FROM prebuilt_flashcard_decks WHERE name = 'Programação - Algoritmos Básicos';

    -- Create showcase flashcards for ENEM Math deck
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (
        (SELECT id FROM flashcard_topics WHERE name = 'Álgebra Básica' LIMIT 1),
        'Qual é o valor de x na equação 2x + 8 = 20?',
        'x = 6',
        'Isolando x: 2x = 20 - 8 → 2x = 12 → x = 6',
        2,
        ARRAY['equação', 'álgebra', 'enem'],
        'ENEM 2023'
    ),
    (
        (SELECT id FROM flashcard_topics WHERE name = 'Funções' LIMIT 1),
        'Se f(x) = 2x + 3, qual é o valor de f(5)?',
        'f(5) = 13',
        'Substituindo x = 5: f(5) = 2(5) + 3 = 10 + 3 = 13',
        2,
        ARRAY['função', 'substituição', 'enem'],
        'Exercício Modelo'
    ),
    (
        (SELECT id FROM flashcard_topics WHERE name = 'Álgebra Básica' LIMIT 1),
        'Qual é a forma fatorada de x² - 9?',
        '(x + 3)(x - 3)',
        'Diferença de quadrados: a² - b² = (a + b)(a - b), onde a = x e b = 3',
        3,
        ARRAY['fatoração', 'diferença de quadrados', 'álgebra'],
        'Matemática Básica'
    )
    RETURNING id INTO current_flashcard_id;

    -- Link flashcards to ENEM Math deck
    INSERT INTO prebuilt_deck_flashcards (deck_id, flashcard_id, order_index)
    SELECT enem_math_deck_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM flashcards 
    WHERE tags && ARRAY['enem', 'álgebra', 'função']
    LIMIT 10;

    -- Create showcase flashcards for Physics deck
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (
        (SELECT id FROM flashcard_topics WHERE name = 'Cinemática' LIMIT 1),
        'Um carro acelera de 0 a 60 km/h em 10 segundos. Qual é sua aceleração média?',
        '1,67 m/s²',
        'Convertendo: 60 km/h = 16,67 m/s. Aceleração = Δv/Δt = 16,67/10 = 1,67 m/s²',
        3,
        ARRAY['cinemática', 'aceleração', 'conversão'],
        'Física Básica'
    ),
    (
        (SELECT id FROM flashcard_topics WHERE name = 'Cinemática' LIMIT 1),
        'Qual é a unidade de velocidade no Sistema Internacional?',
        'm/s (metros por segundo)',
        'No SI, distância é medida em metros (m) e tempo em segundos (s), logo velocidade é m/s',
        1,
        ARRAY['unidades', 'SI', 'velocidade'],
        'Conceitos Básicos'
    );

    -- Link physics flashcards to deck
    INSERT INTO prebuilt_deck_flashcards (deck_id, flashcard_id, order_index)
    SELECT physics_basics_deck_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM flashcards 
    WHERE tags && ARRAY['cinemática', 'velocidade', 'aceleração']
    LIMIT 8;

    -- Populate content library with rich educational content
    INSERT INTO content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
    (
        'Teorema de Pitágoras',
        'Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: a² + b² = c²',
        'theorem',
        math_subject_id,
        2,
        ARRAY['pitágoras', 'triângulo', 'hipotenusa', 'catetos'],
        ARRAY['geometria', 'teorema', 'fundamental'],
        'Geometria Clássica',
        true
    ),
    (
        'Lei de Ohm',
        'A corrente elétrica em um condutor é diretamente proporcional à tensão aplicada: V = R × I',
        'formula',
        physics_subject_id,
        2,
        ARRAY['ohm', 'corrente', 'tensão', 'resistência'],
        ARRAY['eletricidade', 'lei', 'fundamental'],
        'Física Elétrica',
        true
    ),
    (
        'Tabela Periódica - Grupos',
        'Os elementos químicos são organizados em 18 grupos (colunas) na tabela periódica, cada grupo representa elementos com propriedades químicas similares',
        'concept',
        chemistry_subject_id,
        2,
        ARRAY['tabela periódica', 'grupos', 'propriedades', 'elementos'],
        ARRAY['química', 'classificação', 'elementos'],
        'Química Geral',
        true
    ),
    (
        'Definição de Limite',
        'O limite de uma função f(x) quando x tende a um valor a é o valor que f(x) se aproxima conforme x se aproxima de a',
        'definition',
        calc_subject_id,
        4,
        ARRAY['limite', 'função', 'aproximação', 'tendência'],
        ARRAY['cálculo', 'análise', 'fundamental'],
        'Cálculo Diferencial',
        true
    ),
    (
        'Complexidade Big O',
        'Big O notation descreve o comportamento assintótico de algoritmos, indicando como o tempo de execução cresce com o tamanho da entrada',
        'concept',
        algo_subject_id,
        4,
        ARRAY['big o', 'complexidade', 'algoritmo', 'performance'],
        ARRAY['algoritmos', 'análise', 'eficiência'],
        'Análise de Algoritmos',
        true
    );

    -- Update deck total_cards count
    UPDATE prebuilt_flashcard_decks 
    SET total_cards = (
        SELECT COUNT(*) 
        FROM prebuilt_deck_flashcards 
        WHERE deck_id = prebuilt_flashcard_decks.id
    );

    RAISE NOTICE 'Pre-built decks and content library populated successfully!';
END $$;
