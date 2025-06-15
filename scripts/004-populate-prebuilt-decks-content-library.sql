-- Purpose: Populates 'prebuilt_flashcard_decks', links them to existing flashcards,
-- and adds sample data to 'content_library'.
-- Based on 'populate-prebuilt-decks.sql'.

DO $$
DECLARE
    math_vest_subject_id UUID;
    physics_vest_subject_id UUID;
    chemistry_vest_subject_id UUID;
    calc1_subject_id UUID;
    algo_subject_id UUID;
    
    -- Deck IDs
    enem_math_deck_id UUID;
    physics_basics_deck_id UUID;
    chemistry_fundamentals_deck_id UUID;
    calc_essentials_deck_id UUID;
    algo_basics_deck_id UUID; -- Renamed from programming_basics_deck_id for clarity
    
    -- Flashcard IDs for linking
    fc_id_1 UUID; fc_id_2 UUID; fc_id_3 UUID; fc_id_4 UUID; fc_id_5 UUID;
    fc_id_6 UUID; fc_id_7 UUID; fc_id_8 UUID; fc_id_9 UUID; fc_id_10 UUID;

    -- Topic IDs
    math_algebra_topic_id UUID;
    math_functions_topic_id UUID;
    physics_kinematics_topic_id UUID;

BEGIN
    -- Get subject IDs (adjust names if they were changed in script 002)
    SELECT id INTO math_vest_subject_id FROM public.flashcard_subjects WHERE name = 'Matemática (Vestibular)';
    SELECT id INTO physics_vest_subject_id FROM public.flashcard_subjects WHERE name = 'Física (Vestibular)';
    SELECT id INTO chemistry_vest_subject_id FROM public.flashcard_subjects WHERE name = 'Química (Vestibular)';
    SELECT id INTO calc1_subject_id FROM public.flashcard_subjects WHERE name = 'Cálculo I';
    SELECT id INTO algo_subject_id FROM public.flashcard_subjects WHERE name = 'Algoritmos e Estruturas de Dados';

    -- Get Topic IDs for flashcard creation/linking
    SELECT id INTO math_algebra_topic_id FROM public.flashcard_topics WHERE name = 'Álgebra Básica (Vest.)' AND subject_id = math_vest_subject_id;
    SELECT id INTO math_functions_topic_id FROM public.flashcard_topics WHERE name = 'Funções (Vest.)' AND subject_id = math_vest_subject_id;
    SELECT id INTO physics_kinematics_topic_id FROM public.flashcard_topics WHERE name = 'Cinemática (Vest.)' AND subject_id = physics_vest_subject_id;

    -- Create pre-built decks
    INSERT INTO public.prebuilt_flashcard_decks (
        name, description, subject_id, category, difficulty_level, 
        estimated_time_minutes, tags, author_name, is_featured, total_cards, cover_image_url
    ) VALUES
    (
        'ENEM Matemática Essencial',
        'Deck completo com os conceitos mais cobrados em Matemática no ENEM. Inclui álgebra, geometria, estatística e funções.',
        math_vest_subject_id,
        'featured', 3, 45, ARRAY['enem', 'vestibular', 'matemática', 'essencial'], 'Studify Team', true, 0, -- total_cards will be updated later
        '/placeholder.svg?width=300&height=200'
    ),
    (
        'Física Básica - Mecânica (Vest.)',
        'Fundamentos de mecânica clássica para vestibular: cinemática, dinâmica e energia. Perfeito para iniciantes.',
        physics_vest_subject_id,
        'popular', 2, 30, ARRAY['física', 'mecânica', 'básico', 'cinemática', 'vestibular'], 'Prof. Silva', true, 0,
        '/placeholder.svg?width=300&height=200'
    ),
    (
        'Química Geral Fundamentos (Vest.)',
        'Conceitos fundamentais de química para vestibular: estrutura atômica, ligações químicas e estequiometria.',
        chemistry_vest_subject_id,
        'featured', 3, 40, ARRAY['química', 'fundamental', 'átomo', 'ligações', 'vestibular'], 'Studify Team', true, 0,
        '/placeholder.svg?width=300&height=200'
    ),
    (
        'Cálculo I - Limites e Derivadas Essenciais',
        'Introdução ao cálculo diferencial: conceitos chave de limite, continuidade e as primeiras regras de derivação.',
        calc1_subject_id,
        'new', 4, 60, ARRAY['cálculo', 'limites', 'derivadas', 'superior', 'engenharia'], 'Prof. Ada Byron', false, 0,
        '/placeholder.svg?width=300&height=200'
    ),
    (
        'Algoritmos - Fundamentos e Complexidade',
        'Estruturas de dados básicas e análise de complexidade de algoritmos fundamentais para iniciantes em computação.',
        algo_subject_id,
        'popular', 3, 35, ARRAY['programação', 'algoritmos', 'estruturas de dados', 'complexidade', 'básico'], 'Dev Team IA', true, 0,
        '/placeholder.svg?width=300&height=200'
    )
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        subject_id = EXCLUDED.subject_id,
        category = EXCLUDED.category,
        difficulty_level = EXCLUDED.difficulty_level,
        estimated_time_minutes = EXCLUDED.estimated_time_minutes,
        tags = EXCLUDED.tags,
        author_name = EXCLUDED.author_name,
        is_featured = EXCLUDED.is_featured,
        cover_image_url = EXCLUDED.cover_image_url;

    -- Get the deck IDs
    SELECT id INTO enem_math_deck_id FROM public.prebuilt_flashcard_decks WHERE name = 'ENEM Matemática Essencial';
    SELECT id INTO physics_basics_deck_id FROM public.prebuilt_flashcard_decks WHERE name = 'Física Básica - Mecânica (Vest.)';
    SELECT id INTO chemistry_fundamentals_deck_id FROM public.prebuilt_flashcard_decks WHERE name = 'Química Geral Fundamentos (Vest.)';
    SELECT id INTO calc_essentials_deck_id FROM public.prebuilt_flashcard_decks WHERE name = 'Cálculo I - Limites e Derivadas Essenciais';
    SELECT id INTO algo_basics_deck_id FROM public.prebuilt_flashcard_decks WHERE name = 'Algoritmos - Fundamentos e Complexidade';

    -- Link existing flashcards to ENEM Math deck (ensure these flashcards were created in script 003)
    IF enem_math_deck_id IS NOT NULL AND math_algebra_topic_id IS NOT NULL THEN
        FOR fc_id_1 IN SELECT id FROM public.flashcards WHERE topic_id = math_algebra_topic_id AND question LIKE '%Bhaskara%' LIMIT 1 LOOP
            INSERT INTO public.prebuilt_deck_flashcards (deck_id, flashcard_id, order_index) VALUES (enem_math_deck_id, fc_id_1, 0) ON CONFLICT DO NOTHING;
        END LOOP;
        FOR fc_id_2 IN SELECT id FROM public.flashcards WHERE topic_id = math_algebra_topic_id AND question LIKE '%discriminante%' LIMIT 1 LOOP
            INSERT INTO public.prebuilt_deck_flashcards (deck_id, flashcard_id, order_index) VALUES (enem_math_deck_id, fc_id_2, 1) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    IF enem_math_deck_id IS NOT NULL AND math_functions_topic_id IS NOT NULL THEN
        FOR fc_id_3 IN SELECT id FROM public.flashcards WHERE topic_id = math_functions_topic_id AND question LIKE '%função afim%' LIMIT 1 LOOP
            INSERT INTO public.prebuilt_deck_flashcards (deck_id, flashcard_id, order_index) VALUES (enem_math_deck_id, fc_id_3, 2) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Link existing flashcards to Physics deck
    IF physics_basics_deck_id IS NOT NULL AND physics_kinematics_topic_id IS NOT NULL THEN
        FOR fc_id_4 IN SELECT id FROM public.flashcards WHERE topic_id = physics_kinematics_topic_id AND question LIKE '%MUV%' AND question LIKE '%posição%' LIMIT 1 LOOP
            INSERT INTO public.prebuilt_deck_flashcards (deck_id, flashcard_id, order_index) VALUES (physics_basics_deck_id, fc_id_4, 0) ON CONFLICT DO NOTHING;
        END LOOP;
        FOR fc_id_5 IN SELECT id FROM public.flashcards WHERE topic_id = physics_kinematics_topic_id AND question LIKE '%Torricelli%' LIMIT 1 LOOP
            INSERT INTO public.prebuilt_deck_flashcards (deck_id, flashcard_id, order_index) VALUES (physics_basics_deck_id, fc_id_5, 1) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    -- Populate content library with rich educational content
    IF math_vest_subject_id IS NOT NULL THEN
        INSERT INTO public.content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
        ('Teorema de Pitágoras', 'Em um triângulo retângulo, o quadrado da hipotenusa (lado oposto ao ângulo reto) é igual à soma dos quadrados dos catetos (lados adjacentes ao ângulo reto): a² + b² = c², onde c é a hipotenusa.', 'theorem', math_vest_subject_id, 2, ARRAY['pitágoras', 'triângulo retângulo', 'hipotenusa', 'catetos', 'geometria'], ARRAY['geometria', 'teorema', 'fundamental'], 'Geometria Euclidiana Clássica', true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF physics_vest_subject_id IS NOT NULL THEN
        INSERT INTO public.content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
        ('Primeira Lei de Ohm', 'A corrente elétrica (I) que percorre um condutor é diretamente proporcional à diferença de potencial (V) aplicada entre suas extremidades e inversamente proporcional à resistência elétrica (R) do condutor: V = R × I.', 'formula', physics_vest_subject_id, 2, ARRAY['lei de ohm', 'corrente elétrica', 'tensão', 'resistência', 'eletrodinâmica'], ARRAY['eletricidade', 'lei', 'circuito elétrico'], 'Física Elétrica Básica', true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF chemistry_vest_subject_id IS NOT NULL THEN
        INSERT INTO public.content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
        ('Grupos da Tabela Periódica', 'Os elementos químicos são organizados em 18 grupos (colunas verticais) na tabela periódica. Elementos do mesmo grupo geralmente possuem configurações eletrônicas de valência semelhantes e, consequentemente, propriedades químicas similares.', 'concept', chemistry_vest_subject_id, 2, ARRAY['tabela periódica', 'grupos', 'famílias', 'propriedades periódicas', 'elementos químicos'], ARRAY['química geral', 'classificação periódica', 'elementos'], 'Química Inorgânica Fundamental', true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF calc1_subject_id IS NOT NULL THEN
        INSERT INTO public.content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
        ('Definição Intuitiva de Limite', 'O limite de uma função f(x) quando x tende a um valor "a" (denotado por lim(x→a) f(x) = L) é o valor L ao qual f(x) se aproxima à medida que x se aproxima cada vez mais de "a", por ambos os lados, sem necessariamente atingir "a".', 'definition', calc1_subject_id, 4, ARRAY['limite de função', 'aproximação', 'tendência', 'cálculo diferencial'], ARRAY['cálculo', 'análise matemática', 'fundamental'], 'Cálculo Diferencial e Integral Vol. 1', true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF algo_subject_id IS NOT NULL THEN
        INSERT INTO public.content_library (title, content, content_type, subject_id, difficulty_level, keywords, tags, source, is_verified) VALUES
        ('Notação Big O (Complexidade Assintótica)', 'A notação Big O é usada para descrever o comportamento assintótico de algoritmos, especificamente o limite superior do crescimento do tempo de execução ou uso de memória em função do tamanho da entrada (n), no pior caso. Ex: O(n), O(log n), O(n²).', 'concept', algo_subject_id, 4, ARRAY['big o notation', 'complexidade de algoritmos', 'análise assintótica', 'performance de algoritmos'], ARRAY['algoritmos', 'ciência da computação', 'análise', 'eficiência'], 'Introduction to Algorithms (CLRS)', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Update total_cards count for each prebuilt deck
    UPDATE public.prebuilt_flashcard_decks pfd
    SET total_cards = (
        SELECT COUNT(*) 
        FROM public.prebuilt_deck_flashcards pdfc 
        WHERE pdfc.deck_id = pfd.id
    )
    WHERE pfd.id IN (enem_math_deck_id, physics_basics_deck_id, chemistry_fundamentals_deck_id, calc_essentials_deck_id, algo_basics_deck_id);

END $$;

SELECT '004-populate-prebuilt-decks-content-library.sql executed successfully.' AS status;
