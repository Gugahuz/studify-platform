-- Populate sample flashcards with comprehensive educational content

DO $$
DECLARE
    math_algebra_topic_id UUID;
    math_functions_topic_id UUID;
    physics_kinematics_topic_id UUID;
    chemistry_atomic_topic_id UUID;
    calc_limits_topic_id UUID;
    algo_complexity_topic_id UUID;
BEGIN
    -- Get topic IDs
    SELECT t.id INTO math_algebra_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Matemática' AND t.name = 'Álgebra Básica';
    
    SELECT t.id INTO math_functions_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Matemática' AND t.name = 'Funções';
    
    SELECT t.id INTO physics_kinematics_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Física' AND t.name = 'Cinemática';
    
    SELECT t.id INTO chemistry_atomic_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Química' AND t.name = 'Estrutura Atômica';
    
    SELECT t.id INTO calc_limits_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Cálculo I' AND t.name = 'Limites';
    
    SELECT t.id INTO algo_complexity_topic_id 
    FROM flashcard_topics t 
    JOIN flashcard_subjects s ON t.subject_id = s.id 
    WHERE s.name = 'Algoritmos' AND t.name = 'Complexidade';

    -- Insert Matemática - Álgebra Básica flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (math_algebra_topic_id, 'Qual é a fórmula para resolver uma equação do 2º grau?', 'x = (-b ± √(b² - 4ac)) / 2a', 'Esta é a fórmula de Bhaskara, onde a, b e c são os coeficientes da equação ax² + bx + c = 0', 2, ARRAY['equação', 'bhaskara', 'segundo grau'], 'Matemática Básica'),
    (math_algebra_topic_id, 'O que é o discriminante (Δ) de uma equação do 2º grau?', 'Δ = b² - 4ac', 'O discriminante determina a natureza das raízes: Δ > 0 (duas raízes reais), Δ = 0 (uma raiz real), Δ < 0 (raízes complexas)', 2, ARRAY['discriminante', 'delta', 'raízes'], 'Matemática Básica'),
    (math_algebra_topic_id, 'Como resolver a inequação x² - 5x + 6 > 0?', 'x < 2 ou x > 3', 'Primeiro encontre as raízes (x = 2 e x = 3), depois analise o sinal da parábola. Como a > 0, a parábola é positiva fora das raízes.', 3, ARRAY['inequação', 'segundo grau', 'sinal'], 'Exercícios'),
    (math_algebra_topic_id, 'Qual é o produto das raízes de uma equação ax² + bx + c = 0?', 'c/a', 'Pelas relações de Girard, o produto das raízes é igual a c/a, onde a é o coeficiente de x² e c é o termo independente.', 3, ARRAY['girard', 'produto', 'raízes'], 'Teoria');

    -- Insert Matemática - Funções flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (math_functions_topic_id, 'Qual é a forma geral de uma função afim?', 'f(x) = ax + b', 'Onde a é o coeficiente angular (inclinação da reta) e b é o coeficiente linear (ponto onde a reta corta o eixo y)', 2, ARRAY['função afim', 'linear', 'reta'], 'Funções Básicas'),
    (math_functions_topic_id, 'Como encontrar o vértice de uma parábola y = ax² + bx + c?', 'V = (-b/2a, -Δ/4a)', 'O vértice tem coordenadas x = -b/2a e y = -Δ/4a, onde Δ = b² - 4ac', 3, ARRAY['parábola', 'vértice', 'função quadrática'], 'Geometria Analítica'),
    (math_functions_topic_id, 'Qual é a propriedade fundamental da função exponencial f(x) = aˣ?', 'f(x + y) = f(x) · f(y)', 'Esta propriedade significa que aˣ⁺ʸ = aˣ · aʸ, que é a base das propriedades dos logaritmos', 3, ARRAY['exponencial', 'propriedade', 'logaritmo'], 'Funções Especiais');

    -- Insert Física - Cinemática flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (physics_kinematics_topic_id, 'Qual é a equação horária do movimento uniformemente variado?', 'S = S₀ + v₀t + ½at²', 'Onde S é a posição final, S₀ é a posição inicial, v₀ é a velocidade inicial, a é a aceleração e t é o tempo', 2, ARRAY['MUV', 'equação horária', 'aceleração'], 'Cinemática Básica'),
    (physics_kinematics_topic_id, 'Como calcular a velocidade final no MUV?', 'v = v₀ + at', 'A velocidade final é igual à velocidade inicial mais o produto da aceleração pelo tempo', 2, ARRAY['velocidade', 'MUV', 'aceleração'], 'Cinemática Básica'),
    (physics_kinematics_topic_id, 'Qual é a equação de Torricelli?', 'v² = v₀² + 2aΔS', 'Esta equação relaciona velocidades e deslocamento sem envolver o tempo, útil quando o tempo não é conhecido', 3, ARRAY['torricelli', 'velocidade', 'deslocamento'], 'Cinemática Avançada');

    -- Insert Química - Estrutura Atômica flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (chemistry_atomic_topic_id, 'Quantos elétrons cabem no orbital s?', '2 elétrons', 'O orbital s tem formato esférico e pode acomodar no máximo 2 elétrons com spins opostos (Princípio de Pauli)', 2, ARRAY['orbital', 'elétrons', 'pauli'], 'Estrutura Atômica'),
    (chemistry_atomic_topic_id, 'Qual é a configuração eletrônica do oxigênio (Z=8)?', '1s² 2s² 2p⁴', 'O oxigênio tem 8 elétrons distribuídos nos orbitais seguindo o diagrama de Linus Pauling', 3, ARRAY['configuração eletrônica', 'oxigênio', 'pauling'], 'Distribuição Eletrônica'),
    (chemistry_atomic_topic_id, 'O que determina o número de massa de um átomo?', 'A soma de prótons e nêutrons', 'O número de massa (A) é igual ao número de prótons (Z) mais o número de nêutrons (N): A = Z + N', 2, ARRAY['número de massa', 'prótons', 'nêutrons'], 'Estrutura Nuclear');

    -- Insert Cálculo I - Limites flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (calc_limits_topic_id, 'Qual é a definição formal de limite?', 'Para todo ε > 0, existe δ > 0 tal que se 0 < |x - a| < δ, então |f(x) - L| < ε', 'Esta é a definição épsilon-delta de limite, que formaliza a ideia de que f(x) se aproxima de L quando x se aproxima de a', 4, ARRAY['limite', 'epsilon-delta', 'definição'], 'Análise Real'),
    (calc_limits_topic_id, 'Como calcular lim(x→0) (sen x)/x?', '1', 'Este é um limite fundamental. Pode ser demonstrado usando o teorema do sanduíche ou a regra de L\'Hôpital', 3, ARRAY['limite fundamental', 'seno', 'lhopital'], 'Limites Especiais'),
    (calc_limits_topic_id, 'Quando uma função é contínua em um ponto?', 'Quando lim(x→a) f(x) = f(a)', 'Uma função é contínua em x = a se o limite existe, a função está definida no ponto e o limite é igual ao valor da função', 3, ARRAY['continuidade', 'limite', 'função'], 'Continuidade');

    -- Insert Algoritmos - Complexidade flashcards
    INSERT INTO flashcards (topic_id, question, answer, explanation, difficulty_level, tags, source) VALUES
    (algo_complexity_topic_id, 'O que significa complexidade O(n)?', 'Complexidade linear', 'Significa que o tempo de execução cresce proporcionalmente ao tamanho da entrada. Se dobrar a entrada, dobra o tempo', 3, ARRAY['big-o', 'linear', 'complexidade'], 'Análise de Algoritmos'),
    (algo_complexity_topic_id, 'Qual é a complexidade do algoritmo de busca binária?', 'O(log n)', 'A busca binária divide o espaço de busca pela metade a cada iteração, resultando em complexidade logarítmica', 4, ARRAY['busca binária', 'logarítmica', 'eficiência'], 'Algoritmos de Busca'),
    (algo_complexity_topic_id, 'O que é melhor: O(n log n) ou O(n²)?', 'O(n log n)', 'Para valores grandes de n, n log n cresce muito mais lentamente que n². Por exemplo, para n=1000: n log n ≈ 10000, n² = 1000000', 4, ARRAY['comparação', 'eficiência', 'crescimento'], 'Análise Comparativa');

END $$;
