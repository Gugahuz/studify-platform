-- Purpose: Populates 'flashcards' table with sample data.
-- Based on 'populate-sample-flashcards.sql'.

DO $$
DECLARE
    math_algebra_topic_id UUID;
    math_functions_topic_id UUID;
    physics_kinematics_topic_id UUID;
    chemistry_atomic_topic_id UUID;
    calc_limits_topic_id UUID;
    algo_complexity_topic_id UUID;
BEGIN
    -- Get topic IDs (adjust names if they were changed in script 002)
    SELECT t.id INTO math_algebra_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Matemática (Vestibular)' AND t.name = 'Álgebra Básica (Vest.)';
    
    SELECT t.id INTO math_functions_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Matemática (Vestibular)' AND t.name = 'Funções (Vest.)';
    
    SELECT t.id INTO physics_kinematics_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Física (Vestibular)' AND t.name = 'Cinemática (Vest.)';
    
    SELECT t.id INTO chemistry_atomic_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Química (Vestibular)' AND t.name = 'Estrutura Atômica (Vest.)';
    
    SELECT t.id INTO calc_limits_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Cálculo I' AND t.name = 'Limites (Cálculo I)';
    
    SELECT t.id INTO algo_complexity_topic_id 
    FROM public.flashcard_topics t JOIN public.flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Algoritmos e Estruturas de Dados' AND t.name = 'Complexidade de Algoritmos';

    -- Insert Matemática - Álgebra Básica flashcards
    IF math_algebra_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (math_algebra_topic_id, 'Qual é a fórmula para resolver uma equação do 2º grau (Fórmula de Bhaskara)?', 'x = (-b ± √(b² - 4ac)) / 2a', 'Esta é a fórmula de Bhaskara, onde a, b e c são os coeficientes da equação ax² + bx + c = 0.', 2, ARRAY['equação', 'bhaskara', 'segundo grau'], 'Matemática Básica (Vest.)'),
        (math_algebra_topic_id, 'O que é o discriminante (Δ) de uma equação do 2º grau e o que ele indica?', 'Δ = b² - 4ac. O discriminante determina a natureza das raízes: Δ > 0 (duas raízes reais distintas), Δ = 0 (uma raiz real dupla), Δ < 0 (duas raízes complexas conjugadas).', 2, ARRAY['discriminante', 'delta', 'raízes'], 'Matemática Básica (Vest.)'),
        (math_algebra_topic_id, 'Como resolver a inequação x² - 5x + 6 > 0?', 'As raízes da equação x² - 5x + 6 = 0 são x=2 e x=3. Como a parábola tem concavidade para cima (a=1 > 0), ela é positiva para valores de x fora das raízes, ou seja, x < 2 ou x > 3.', 'Primeiro encontre as raízes (x=2 e x=3), depois analise o sinal da parábola. Como a > 0, a parábola é positiva fora das raízes.', 3, ARRAY['inequação', 'segundo grau', 'sinal'], 'Exercícios de Álgebra (Vest.)'),
        (math_algebra_topic_id, 'Qual é o produto das raízes de uma equação ax² + bx + c = 0, segundo as Relações de Girard?', 'Produto = c/a', 'Pelas Relações de Girard, a soma das raízes é -b/a e o produto das raízes é c/a.', 3, ARRAY['girard', 'produto', 'raízes'], 'Teoria de Equações (Vest.)')
        ON CONFLICT DO NOTHING; -- Avoids re-inserting if question/topic is somehow unique and already there
    END IF;

    -- Insert Matemática - Funções flashcards
    IF math_functions_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (math_functions_topic_id, 'Qual é a forma geral de uma função afim (ou função polinomial do 1º grau)?', 'f(x) = ax + b, onde a ≠ 0.', 'Onde "a" é o coeficiente angular (inclinação da reta) e "b" é o coeficiente linear (ponto onde a reta corta o eixo y). Se a=0, é uma função constante.', 2, ARRAY['função afim', 'linear', 'reta'], 'Funções Básicas (Vest.)'),
        (math_functions_topic_id, 'Como encontrar as coordenadas do vértice de uma parábola dada por y = ax² + bx + c?', 'V = (Xv, Yv), onde Xv = -b/2a e Yv = -Δ/4a (sendo Δ = b² - 4ac).', 'O vértice é o ponto de máximo ou mínimo da função quadrática.', 3, ARRAY['parábola', 'vértice', 'função quadrática'], 'Geometria Analítica (Vest.)'),
        (math_functions_topic_id, 'Qual é a propriedade fundamental da função exponencial f(x) = aˣ (com a > 0 e a ≠ 1)?', 'f(x + y) = f(x) · f(y), ou seja, a^(x+y) = a^x · a^y.', 'Esta propriedade é crucial e leva a outras, como a^(x-y) = a^x / a^y e (a^x)^y = a^(xy).', 3, ARRAY['exponencial', 'propriedade', 'logaritmo'], 'Funções Especiais (Vest.)')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert Física - Cinemática flashcards
    IF physics_kinematics_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (physics_kinematics_topic_id, 'Qual é a equação horária da posição para o Movimento Uniformemente Variado (MUV)?', 'S = S₀ + v₀t + (1/2)at²', 'Onde S é a posição final, S₀ é a posição inicial, v₀ é a velocidade inicial, a é a aceleração constante e t é o tempo.', 2, ARRAY['MUV', 'equação horária', 'posição', 'aceleração'], 'Cinemática Básica (Vest.)'),
        (physics_kinematics_topic_id, 'Qual é a equação da velocidade em função do tempo para o MUV?', 'v = v₀ + at', 'A velocidade final (v) é igual à velocidade inicial (v₀) mais o produto da aceleração (a) pelo tempo (t).', 2, ARRAY['velocidade', 'MUV', 'aceleração'], 'Cinemática Básica (Vest.)'),
        (physics_kinematics_topic_id, 'O que é a Equação de Torricelli e quando ela é útil?', 'v² = v₀² + 2aΔS. É útil quando não se conhece o tempo e se quer relacionar velocidades, aceleração e deslocamento.', 'Esta equação relaciona velocidades (final v e inicial v₀), aceleração (a) e deslocamento (ΔS) sem envolver o tempo.', 3, ARRAY['torricelli', 'velocidade', 'deslocamento', 'MUV'], 'Cinemática Avançada (Vest.)')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert Química - Estrutura Atômica flashcards
    IF chemistry_atomic_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (chemistry_atomic_topic_id, 'Quantos elétrons um orbital do tipo "s" pode acomodar no máximo?', '2 elétrons.', 'Um orbital "s" tem formato esférico e, de acordo com o Princípio de Exclusão de Pauli, pode acomodar no máximo 2 elétrons com spins opostos.', 2, ARRAY['orbital s', 'elétrons', 'pauli'], 'Estrutura Atômica (Vest.)'),
        (chemistry_atomic_topic_id, 'Qual é a configuração eletrônica do átomo de Oxigênio (Z=8) em seu estado fundamental?', '1s² 2s² 2p⁴.', 'O Oxigênio tem 8 elétrons. A distribuição segue o Diagrama de Linus Pauling: K=2 (1s²), L=6 (2s² 2p⁴).', 3, ARRAY['configuração eletrônica', 'oxigênio', 'pauling'], 'Distribuição Eletrônica (Vest.)'),
        (chemistry_atomic_topic_id, 'O que o número de massa (A) de um átomo representa?', 'A soma do número de prótons (Z) e o número de nêutrons (N) no núcleo do átomo (A = Z + N).', 'O número de massa indica a massa aproximada do átomo em unidades de massa atômica.', 2, ARRAY['número de massa', 'prótons', 'nêutrons', 'núcleo'], 'Estrutura Nuclear (Vest.)')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert Cálculo I - Limites flashcards
    IF calc_limits_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (calc_limits_topic_id, 'Qual é a definição formal (ε e δ) de limite: lim(x→a) f(x) = L?', 'Para todo ε > 0, existe um δ > 0 tal que, se 0 < |x - a| < δ, então |f(x) - L| < ε.', 'Esta definição formaliza a ideia de que f(x) se aproxima arbitrariamente de L quando x se aproxima suficientemente de a (mas x ≠ a).', 4, ARRAY['limite', 'epsilon-delta', 'definição formal'], 'Análise Real (Cálculo I)'),
        (calc_limits_topic_id, 'Qual é o valor do limite fundamental lim(x→0) (sen x)/x?', '1.', 'Este é um limite trigonométrico fundamental. Pode ser demonstrado usando o Teorema do Confronto (Sanduíche) ou a Regra de L\'Hôpital (após verificar as condições).', 3, ARRAY['limite fundamental', 'seno', 'lhopital'], 'Limites Especiais (Cálculo I)'),
        (calc_limits_topic_id, 'Quando uma função f(x) é dita contínua em um ponto x=a?', 'Uma função f é contínua em x=a se três condições são satisfeitas: 1) f(a) está definida; 2) lim(x→a) f(x) existe; 3) lim(x→a) f(x) = f(a).', 'Intuitivamente, uma função é contínua se seu gráfico pode ser desenhado sem levantar o lápis do papel.', 3, ARRAY['continuidade', 'limite', 'função definida'], 'Continuidade (Cálculo I)')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert Algoritmos - Complexidade flashcards
    IF algo_complexity_topic_id IS NOT NULL THEN
        INSERT INTO public.flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
        (algo_complexity_topic_id, 'O que significa a notação Big O, como O(n)?', 'A notação Big O descreve o limite superior do comportamento assintótico de uma função, geralmente o tempo de execução ou espaço de memória de um algoritmo, em relação ao tamanho da entrada (n). O(n) significa complexidade linear.', 'O(n) indica que o tempo de execução cresce linearmente com o tamanho da entrada. Se a entrada dobra, o tempo de execução aproximadamente dobra.', 3, ARRAY['big-o', 'complexidade de tempo', 'linear', 'análise assintótica'], 'Análise de Algoritmos'),
        (algo_complexity_topic_id, 'Qual é a complexidade de tempo (pior caso) do algoritmo de Busca Binária em um array ordenado?', 'O(log n).', 'A Busca Binária divide o espaço de busca pela metade a cada iteração, resultando em uma complexidade logarítmica, o que é muito eficiente para grandes volumes de dados.', 4, ARRAY['busca binária', 'complexidade logarítmica', 'eficiência'], 'Algoritmos de Busca'),
        (algo_complexity_topic_id, 'Comparando complexidades, qual é geralmente melhor para grandes entradas: O(n log n) ou O(n²)? Por quê?', 'O(n log n) é melhor. A função n log n cresce mais lentamente que n² para valores grandes de n.', 'Por exemplo, para n=1.000.000: n log n ≈ 20.000.000, enquanto n² = 1.000.000.000.000. Algoritmos O(n log n) são significativamente mais escaláveis.', 4, ARRAY['comparação de complexidade', 'eficiência', 'escalabilidade', 'n log n vs n^2'], 'Análise Comparativa de Algoritmos')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

SELECT '003-populate-sample-flashcards.sql executed successfully.' AS status;
