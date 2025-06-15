import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Flashcard } from "@/types/flashcards"
import { getAdminFlashcards } from "@/lib/admin-flashcard-store"

// Helper to create Flashcard objects
function createFlashcardObject(
  id: string,
  question: string,
  answer: string,
  explanation: string | null = null,
  difficulty_level = 3,
  tags: string[] = [],
  subject = "Geral",
  topic = "Geral",
  source = "Sistema",
  created_at: string = new Date().toISOString(),
): Flashcard {
  return { id, question, answer, explanation, difficulty_level, tags, subject, topic, source, created_at }
}

// Mock database
const mockFlashcardDatabase: Record<
  string,
  Record<string, Omit<Flashcard, "id" | "subject" | "topic" | "source" | "created_at">[]>
> = {
  matematica: {
    "algebra-linear": [
      {
        question: "O que é uma matriz identidade?",
        answer: "Uma matriz quadrada onde todos os elementos da diagonal principal são 1 e os demais são 0.",
        explanation:
          "A matriz identidade é fundamental em álgebra linear pois funciona como o elemento neutro da multiplicação de matrizes.",
        difficulty_level: 2,
        tags: ["matriz", "identidade", "algebra-linear"],
      },
      {
        question: "Como calcular o determinante de uma matriz 2x2?",
        answer: "Para uma matriz [[a,b],[c,d]], o determinante é ad - bc.",
        explanation: "O determinante é uma função que associa um número real a uma matriz quadrada.",
        difficulty_level: 2,
        tags: ["determinante", "matriz", "calculo"],
      },
      {
        question: "O que são autovalores e autovetores?",
        answer:
          "Autovalores são escalares e autovetores são vetores não nulos que, quando multiplicados por uma matriz, resultam no próprio autovetor multiplicado pelo autovalor.",
        explanation: "São cruciais para entender transformações lineares e diagonalização de matrizes.",
        difficulty_level: 4,
        tags: ["autovalor", "autovetor", "transformacao-linear"],
      },
    ],
    "calculo-diferencial": [
      {
        question: "O que é o limite de uma função?",
        answer:
          "É o valor que uma função se aproxima quando a variável independente se aproxima de um determinado ponto.",
        explanation: "O conceito de limite é fundamental no cálculo diferencial e integral.",
        difficulty_level: 3,
        tags: ["limite", "funcao", "calculo"],
      },
      {
        question: "Como se calcula a derivada de x²?",
        answer: "A derivada de x² é 2x.",
        explanation: "Usando a regra da potência: se f(x) = x^n, então f'(x) = n·x^(n-1).",
        difficulty_level: 2,
        tags: ["derivada", "potencia", "regra"],
      },
      {
        question: "O que é o Teorema Fundamental do Cálculo?",
        answer: "Estabelece a relação entre diferenciação e integração, mostrando que são operações inversas.",
        explanation: "Permite calcular integrais definidas usando antiderivadas.",
        difficulty_level: 5,
        tags: ["teorema-fundamental", "integral", "derivada"],
      },
    ],
  },
  fisica: {
    "mecanica-classica": [
      {
        question: "Enuncie a Primeira Lei de Newton.",
        answer:
          "Um corpo em repouso permanece em repouso, e um corpo em movimento permanece em movimento retilíneo uniforme, a menos que uma força externa atue sobre ele.",
        explanation: "Também conhecida como Lei da Inércia.",
        difficulty_level: 2,
        tags: ["newton", "inercia", "movimento"],
      },
      {
        question: "O que é aceleração?",
        answer: "Aceleração é a taxa de variação da velocidade em relação ao tempo.",
        explanation: "Matematicamente, a = Δv/Δt.",
        difficulty_level: 2,
        tags: ["aceleracao", "velocidade", "cinematica"],
      },
      {
        question: "O que é energia cinética?",
        answer: "É a energia associada ao movimento de um corpo, calculada por Ec = (1/2)mv².",
        explanation: "Depende da massa (m) e da velocidade (v) do corpo.",
        difficulty_level: 3,
        tags: ["energia-cinetica", "movimento", "dinamica"],
      },
    ],
    termodinamica: [
      {
        question: "O que diz a Primeira Lei da Termodinâmica?",
        answer:
          "A variação da energia interna de um sistema é igual à diferença entre o calor trocado com o ambiente e o trabalho realizado.",
        explanation: "É uma forma da lei da conservação de energia.",
        difficulty_level: 4,
        tags: ["termodinamica", "energia-interna", "calor", "trabalho"],
      },
      {
        question: "O que é entropia?",
        answer: "É uma medida da desordem ou aleatoriedade de um sistema.",
        explanation:
          "A Segunda Lei da Termodinâmica afirma que a entropia total de um sistema isolado tende a aumentar com o tempo.",
        difficulty_level: 4,
        tags: ["entropia", "desordem", "segunda-lei"],
      },
    ],
  },
  historia: {
    "historia-brasil": [
      {
        question: "Em que ano o Brasil foi descoberto pelos portugueses?",
        answer: "1500, por Pedro Álvares Cabral.",
        explanation:
          "O descobrimento do Brasil em 22 de abril de 1500 marca o início da colonização portuguesa na América.",
        difficulty_level: 1,
        tags: ["descobrimento", "cabral", "1500"],
      },
    ],
  },
  biologia: {
    citologia: [
      {
        question: "Qual é a função principal das mitocôndrias?",
        answer: "Produção de ATP (energia) através da respiração celular.",
        explanation: "As mitocôndrias são as 'usinas de energia' da célula.",
        difficulty_level: 2,
        tags: ["mitocondria", "atp", "energia", "respiracao-celular"],
      },
    ],
  },
}

// Helper functions to get subject and topic names
function getSubjectName(subjectId: string | undefined): string {
  const subjectNames: { [key: string]: string } = {
    matematica: "Matemática",
    fisica: "Física",
    quimica: "Química",
    historia: "História",
    geografia: "Geografia",
    portugues: "Língua Portuguesa",
    biologia: "Biologia",
    filosofia: "Filosofia",
    sociologia: "Sociologia",
    ingles: "Inglês",
    literatura: "Literatura",
    redacao: "Redação",
    "educacao-fisica": "Educação Física",
    artes: "Artes",
    "admin-deck": "Admin Deck",
  }
  return subjectNames[subjectId || ""] || subjectId || "Matéria Geral"
}

function getTopicName(subjectId: string | undefined, topicId: string | undefined): string {
  if (!topicId || topicId === "all") return "Tópicos Gerais"

  const topicNames: { [key: string]: { [key: string]: string } } = {
    matematica: {
      "algebra-linear": "Álgebra Linear",
      "calculo-diferencial": "Cálculo Diferencial",
      "geometria-analitica": "Geometria Analítica",
      estatistica: "Estatística",
      trigonometria: "Trigonometria",
    },
    fisica: {
      "mecanica-classica": "Mecânica Clássica",
      termodinamica: "Termodinâmica",
      eletromagnetismo: "Eletromagnetismo",
      optica: "Óptica",
      "fisica-moderna": "Física Moderna",
    },
    quimica: {
      "quimica-organica": "Química Orgânica",
      "quimica-inorganica": "Química Inorgânica",
      "fisico-quimica": "Físico-Química",
      bioquimica: "Bioquímica",
    },
    historia: {
      "historia-brasil": "História do Brasil",
      "historia-geral": "História Geral",
      "historia-antiga": "História Antiga",
      "historia-medieval": "História Medieval",
      "historia-moderna": "História Moderna",
      "historia-contemporanea": "História Contemporânea",
    },
    biologia: {
      citologia: "Citologia",
      genetica: "Genética",
      ecologia: "Ecologia",
      evolucao: "Evolução",
      anatomia: "Anatomia",
      fisiologia: "Fisiologia",
    },
  }

  return (
    topicNames[subjectId || ""]?.[topicId] ||
    topicId?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Tópico Específico"
  )
}

// Helper function to distribute flashcards proportionally across topics
function distributeFlashcardsProportionally(
  selectedTopics: { id: string; estimated_cards: number }[],
  totalCards: number,
): { [topicId: string]: number } {
  const totalEstimated = selectedTopics.reduce((sum, topic) => sum + topic.estimated_cards, 0)
  const distribution: { [topicId: string]: number } = {}
  let remainingCards = totalCards

  // Calculate proportional distribution
  selectedTopics.forEach((topic, index) => {
    if (index === selectedTopics.length - 1) {
      // Last topic gets remaining cards to ensure exact total
      distribution[topic.id] = remainingCards
    } else {
      const proportion = topic.estimated_cards / totalEstimated
      const cardsForTopic = Math.max(1, Math.round(totalCards * proportion))
      distribution[topic.id] = cardsForTopic
      remainingCards -= cardsForTopic
    }
  })

  return distribution
}

// AI Generation for specific Subject/Topic using GPT-4-turbo
async function generateFlashcardsForSubjectTopic(
  subjectName: string,
  topicName: string,
  count: number,
  difficulty: string,
): Promise<Flashcard[]> {
  const difficultyMap = {
    easy: "básico e introdutório",
    medium: "intermediário",
    hard: "avançado e complexo",
    random: "variado (básico a avançado)",
  }
  const difficultyPrompt = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.medium

  const prompt = `
Você é um professor especialista em ${subjectName}, especificamente no tópico ${topicName}.
Crie exatamente ${count} flashcards educacionais de alta qualidade em Português do Brasil.

INSTRUÇÕES ESPECÍFICAS:
- Matéria: ${subjectName}
- Tópico: ${topicName}  
- Nível: ${difficultyPrompt}
- Cada flashcard deve ser específico e relevante para ${topicName} dentro de ${subjectName}

FORMATO OBRIGATÓRIO para cada flashcard:
{
  "question": "Pergunta clara e específica sobre ${topicName}",
  "answer": "Resposta precisa e educativa",
  "explanation": "Explicação detalhada com contexto e exemplos (mínimo 40 palavras)",
  "difficulty_level": [número de 1 a 5 baseado no nível ${difficultyPrompt}],
  "tags": ["tag1", "tag2", "tag3"] (3-4 tags relevantes em minúsculas)
}

EXEMPLOS DE QUALIDADE por matéria:

Se ${subjectName} = "Matemática" e ${topicName} = "Álgebra Linear":
- Pergunta: "O que caracteriza uma transformação linear?"
- Resposta: "Uma transformação T: V → W é linear se T(u+v) = T(u) + T(v) e T(cv) = cT(v) para quaisquer vetores u,v e escalar c."

Se ${subjectName} = "Física" e ${topicName} = "Mecânica Clássica":  
- Pergunta: "Como a Segunda Lei de Newton se aplica em sistemas com massa variável?"
- Resposta: "Para massa variável, F = dp/dt, onde p é o momento linear, resultando em F = ma + v(dm/dt)."

Se ${subjectName} = "História" e ${topicName} = "História do Brasil":
- Pergunta: "Quais foram as principais consequências econômicas da abolição da escravidão no Brasil?"
- Resposta: "A abolição causou crise na agricultura cafeeira, migração europeia subsidiada, início da industrialização e transformação das relações de trabalho."

IMPORTANTE:
- NÃO use termos genéricos como "Tópico Específico" ou "Matéria Desconhecida"
- Seja específico sobre ${topicName} dentro do contexto de ${subjectName}
- Garanta que cada pergunta teste conhecimento real sobre o tópico
- As explicações devem educar e contextualizar

Retorne APENAS um array JSON válido com os ${count} flashcards:
`

  try {
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
      temperature: 0.3, // Menor temperatura para mais consistência
      maxTokens: 4000, // Aumentar limite de tokens
    })

    // Melhor parsing do JSON
    let cleanedText = text.trim()

    // Remove markdown code blocks se existirem
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    // Tenta encontrar o array JSON
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }

    const parsedFlashcards = JSON.parse(cleanedText)

    if (!Array.isArray(parsedFlashcards)) {
      throw new Error("Resposta não é um array")
    }

    // Validação e limpeza dos flashcards
    const validFlashcards = parsedFlashcards
      .filter((card) => card.question && card.answer && card.explanation)
      .slice(0, count) // Garante o número correto
      .map((card: any, index: number) => {
        return createFlashcardObject(
          `ai-${subjectName.toLowerCase()}-${topicName.toLowerCase()}-${Date.now()}-${index}`,
          card.question.trim(),
          card.answer.trim(),
          card.explanation.trim(),
          Math.max(1, Math.min(5, card.difficulty_level || 3)),
          Array.isArray(card.tags) ? card.tags.slice(0, 4) : [subjectName.toLowerCase(), topicName.toLowerCase()],
          subjectName,
          topicName,
          "IA Generativa (GPT-4-turbo)",
        )
      })

    if (validFlashcards.length === 0) {
      throw new Error("Nenhum flashcard válido foi gerado")
    }

    return validFlashcards
  } catch (error) {
    console.error("❌ Erro na geração com IA:", error)

    // Fallback mais específico
    return [
      createFlashcardObject(
        `fallback-${Date.now()}`,
        `Conceitos Fundamentais de ${topicName}`,
        `${topicName} é um tópico importante dentro de ${subjectName} que requer estudo aprofundado.`,
        `Este flashcard foi gerado como fallback devido a um erro na geração automática. O tópico ${topicName} em ${subjectName} possui diversos conceitos que podem ser explorados através de flashcards específicos. Recomenda-se tentar gerar novamente para obter conteúdo mais detalhado.`,
        3,
        [subjectName.toLowerCase(), topicName.toLowerCase(), "conceitos", "estudo"],
        subjectName,
        topicName,
        "Sistema de Fallback",
      ),
    ]
  }
}

// Enhanced AI Generation for multiple topics with proportional distribution
async function generateFlashcardsForMultipleTopics(
  subjectName: string,
  topicsWithCards: { id: string; name: string; cards: number }[],
  difficulty: string,
): Promise<Flashcard[]> {
  const allFlashcards: Flashcard[] = []

  for (const topicInfo of topicsWithCards) {
    if (topicInfo.cards > 0) {
      try {
        const topicFlashcards = await generateFlashcardsForSubjectTopic(
          subjectName,
          topicInfo.name,
          topicInfo.cards,
          difficulty,
        )
        allFlashcards.push(...topicFlashcards)
      } catch (error) {
        console.error(`Error generating flashcards for topic ${topicInfo.name}:`, error)
        // Add fallback card for failed topic
        allFlashcards.push(
          createFlashcardObject(
            `fallback-topic-${topicInfo.id}-${Date.now()}`,
            `Erro no Tópico: ${topicInfo.name}`,
            "Não foi possível gerar flashcards para este tópico.",
            `Erro ao gerar ${topicInfo.cards} flashcards para ${topicInfo.name}. Tente novamente.`,
            3,
            ["erro", "topico"],
            subjectName,
            topicInfo.name,
          ),
        )
      }
    }
  }

  return allFlashcards
}

// AI Generation from Custom Content using GPT-4-turbo
async function generateFromCustomContent(content: string, count: number, difficulty: string): Promise<Flashcard[]> {
  if (!content?.trim()) {
    throw new Error("Conteúdo personalizado é obrigatório para geração com IA.")
  }

  const difficultyMap = {
    easy: "básico e introdutório",
    medium: "intermediário",
    hard: "avançado e complexo",
    random: "variado",
  }
  const difficultyPrompt = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.medium

  const prompt = `
Você é um especialista em educação. Analise o CONTEÚDO fornecido e crie exatamente ${count} flashcards educacionais de alta qualidade em Português do Brasil.

CONTEÚDO PARA ANÁLISE:
"""
${content}
"""

INSTRUÇÕES:
- Nível de dificuldade: ${difficultyPrompt}
- Extraia os conceitos mais importantes do conteúdo
- Crie perguntas que testem compreensão real
- Baseie-se EXCLUSIVAMENTE no conteúdo fornecido

FORMATO OBRIGATÓRIO para cada flashcard:
{
  "question": "Pergunta específica baseada no conteúdo",
  "answer": "Resposta precisa extraída do conteúdo", 
  "explanation": "Explicação detalhada com contexto (mínimo 40 palavras)",
  "difficulty_level": [número de 1 a 5],
  "tags": ["tag1", "tag2", "tag3"],
  "subject": "Matéria inferida do conteúdo",
  "topic": "Tópico específico inferido"
}

Retorne APENAS um array JSON válido com os ${count} flashcards:
`

  try {
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
      temperature: 0.3,
      maxTokens: 4000,
    })

    let cleanedText = text.trim()
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }

    const parsedFlashcards = JSON.parse(cleanedText)

    if (!Array.isArray(parsedFlashcards)) {
      throw new Error("Resposta não é um array")
    }

    return parsedFlashcards
      .filter((card) => card.question && card.answer && card.explanation)
      .slice(0, count)
      .map((card: any, index: number) =>
        createFlashcardObject(
          `ai-custom-${Date.now()}-${index}`,
          card.question.trim(),
          card.answer.trim(),
          card.explanation.trim(),
          Math.max(1, Math.min(5, card.difficulty_level || 3)),
          Array.isArray(card.tags) ? card.tags.slice(0, 4) : ["personalizado"],
          card.subject || "Conteúdo Personalizado",
          card.topic || "Tópico Personalizado",
          "IA Generativa (Conteúdo Personalizado)",
        ),
      )
  } catch (error) {
    console.error("❌ Erro na geração com IA (conteúdo personalizado):", error)
    return [
      createFlashcardObject(
        `fallback-custom-${Date.now()}`,
        "Erro na Geração Personalizada",
        "Não foi possível processar o conteúdo fornecido adequadamente.",
        `Houve um problema ao analisar o conteúdo personalizado fornecido. Verifique se o texto está bem formatado e tente novamente. O sistema utiliza GPT-4-turbo para análise inteligente do conteúdo.`,
        3,
        ["erro", "personalizado", "conteudo"],
        "Sistema",
        "Erro de Processamento",
        "Sistema de Fallback",
      ),
    ]
  }
}

// Generation from "Database" (Mock or AI Fallback) - Updated for multiple topics
async function generateFromDatabase(
  subjectId: string | undefined,
  topicIds: string[] | undefined,
  topicEstimatedCards: { [topicId: string]: number } | undefined,
  count: number,
  difficulty: string,
): Promise<Flashcard[]> {
  if (!subjectId) {
    throw new Error("Matéria (subjectId) é obrigatória para geração do banco de dados.")
  }

  const subjectName = getSubjectName(subjectId)
  let flashcards: Flashcard[] = []

  // Handle multiple topics with proportional distribution
  if (topicIds && topicIds.length > 0 && topicEstimatedCards) {
    const selectedTopics = topicIds.map((id) => ({
      id,
      estimated_cards: topicEstimatedCards[id] || 10,
    }))

    const distribution = distributeFlashcardsProportionally(selectedTopics, count)

    const topicsWithCards = topicIds.map((topicId) => ({
      id: topicId,
      name: getTopicName(subjectId, topicId),
      cards: distribution[topicId] || 0,
    }))

    flashcards = await generateFlashcardsForMultipleTopics(subjectName, topicsWithCards, difficulty)
  } else {
    // Fallback to single topic or all topics logic
    const topicName = getTopicName(subjectId, topicIds?.[0])
    flashcards = await generateFlashcardsForSubjectTopic(subjectName, topicName, count, difficulty)
  }

  return flashcards
}

// Prebuilt deck data and function
const prebuiltDeckFlashcards: { [key: string]: any[] } = {
  "matematica-basica": [
    // Álgebra
    {
      question: "Qual é a fórmula da área de um círculo?",
      answer: "A = π × r²",
      explanation: "A área de um círculo é calculada multiplicando π (pi ≈ 3,14159) pelo quadrado do raio.",
      difficulty_level: 2,
      tags: ["geometria", "circulo", "area", "formula"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "Como resolver uma equação do segundo grau?",
      answer: "Usando a fórmula de Bhaskara: x = (-b ± √(b²-4ac)) / 2a",
      explanation: "A fórmula de Bhaskara resolve equações do tipo ax² + bx + c = 0, onde a ≠ 0.",
      difficulty_level: 3,
      tags: ["algebra", "equacao", "bhaskara", "segundo-grau"],
      subject: "Matemática",
      topic: "Álgebra",
    },
    {
      question: "O que é um número primo?",
      answer: "Um número natural maior que 1 que tem exatamente dois divisores distintos: 1 e ele mesmo.",
      explanation: "Exemplos: 2, 3, 5, 7, 11, 13. O número 1 não é primo pois tem apenas um divisor.",
      difficulty_level: 2,
      tags: ["numeros-primos", "teoria-dos-numeros", "aritmetica"],
      subject: "Matemática",
      topic: "Aritmética",
    },
    {
      question: "Qual é a fórmula da área de um triângulo?",
      answer: "A = (base × altura) / 2",
      explanation: "A área de qualquer triângulo é calculada multiplicando a base pela altura e dividindo por 2.",
      difficulty_level: 1,
      tags: ["geometria", "triangulo", "area"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "O que é uma progressão aritmética (PA)?",
      answer: "Uma sequência numérica onde cada termo é obtido somando uma constante (razão) ao termo anterior.",
      explanation: "Exemplo: 2, 5, 8, 11, 14... (razão = 3). Fórmula do termo geral: an = a1 + (n-1)r",
      difficulty_level: 3,
      tags: ["progressao-aritmetica", "sequencias", "algebra"],
      subject: "Matemática",
      topic: "Sequências",
    },
    {
      question: "Como calcular a média aritmética?",
      answer: "Soma todos os valores e divide pela quantidade de valores.",
      explanation: "Fórmula: Média = (x1 + x2 + ... + xn) / n. É uma medida de tendência central.",
      difficulty_level: 1,
      tags: ["estatistica", "media", "tendencia-central"],
      subject: "Matemática",
      topic: "Estatística",
    },
    {
      question: "O que é o teorema de Pitágoras?",
      answer: "Em um triângulo retângulo: a² + b² = c², onde c é a hipotenusa.",
      explanation:
        "A soma dos quadrados dos catetos é igual ao quadrado da hipotenusa. Fundamental para cálculos de distância.",
      difficulty_level: 2,
      tags: ["pitagoras", "triangulo-retangulo", "geometria"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "Como calcular porcentagem?",
      answer: "Multiplica o valor pela porcentagem e divide por 100, ou usa a fórmula: (parte/todo) × 100%",
      explanation:
        "Exemplo: 20% de 150 = (20 × 150) / 100 = 30. Ou para encontrar que porcentagem 30 é de 150: (30/150) × 100% = 20%",
      difficulty_level: 2,
      tags: ["porcentagem", "proporcao", "matematica-basica"],
      subject: "Matemática",
      topic: "Proporção",
    },
    {
      question: "O que é uma função do primeiro grau?",
      answer: "Uma função da forma f(x) = ax + b, onde a ≠ 0.",
      explanation:
        "Representa uma reta no plano cartesiano. 'a' é o coeficiente angular (inclinação) e 'b' é o coeficiente linear (onde a reta corta o eixo y).",
      difficulty_level: 3,
      tags: ["funcao", "primeiro-grau", "algebra"],
      subject: "Matemática",
      topic: "Funções",
    },
    {
      question: "Como calcular o volume de um cubo?",
      answer: "V = a³, onde 'a' é a medida da aresta.",
      explanation: "O volume de um cubo é a aresta elevada ao cubo. Se a aresta mede 3 cm, o volume é 3³ = 27 cm³.",
      difficulty_level: 2,
      tags: ["geometria", "cubo", "volume"],
      subject: "Matemática",
      topic: "Geometria Espacial",
    },
    {
      question: "O que é moda em estatística?",
      answer: "O valor que aparece com maior frequência em um conjunto de dados.",
      explanation:
        "Em um conjunto como {2, 3, 3, 4, 5, 3, 6}, a moda é 3 pois aparece 3 vezes. Pode haver mais de uma moda.",
      difficulty_level: 1,
      tags: ["estatistica", "moda", "frequencia"],
      subject: "Matemática",
      topic: "Estatística",
    },
    {
      question: "Como converter fração em decimal?",
      answer: "Divide o numerador pelo denominador.",
      explanation: "Exemplo: 3/4 = 3 ÷ 4 = 0,75. Algumas frações geram dízimas periódicas, como 1/3 = 0,333...",
      difficulty_level: 2,
      tags: ["fracoes", "decimais", "conversao"],
      subject: "Matemática",
      topic: "Números",
    },
    {
      question: "O que é mediana?",
      answer: "O valor central de um conjunto de dados ordenados.",
      explanation:
        "Se há número ímpar de valores, é o do meio. Se par, é a média dos dois centrais. Exemplo: {1,3,5,7,9} → mediana = 5",
      difficulty_level: 2,
      tags: ["estatistica", "mediana", "tendencia-central"],
      subject: "Matemática",
      topic: "Estatística",
    },
    {
      question: "Como calcular juros simples?",
      answer: "J = C × i × t, onde C=capital, i=taxa, t=tempo",
      explanation:
        "Juros simples incidem apenas sobre o capital inicial. Exemplo: R$1000 a 5% ao mês por 3 meses = 1000×0,05×3 = R$150",
      difficulty_level: 3,
      tags: ["matematica-financeira", "juros-simples", "porcentagem"],
      subject: "Matemática",
      topic: "Matemática Financeira",
    },
    {
      question: "O que são ângulos complementares?",
      answer: "Dois ângulos cuja soma é 90°.",
      explanation:
        "Se um ângulo mede 30°, seu complementar mede 60°, pois 30° + 60° = 90°. Muito usado em trigonometria.",
      difficulty_level: 2,
      tags: ["geometria", "angulos", "complementares"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "Como calcular a área de um retângulo?",
      answer: "A = base × altura",
      explanation:
        "Multiplica-se o comprimento pela largura. Se um retângulo tem 5m de base e 3m de altura, sua área é 5×3 = 15m².",
      difficulty_level: 1,
      tags: ["geometria", "retangulo", "area"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "O que é uma progressão geométrica (PG)?",
      answer: "Uma sequência onde cada termo é obtido multiplicando o anterior por uma constante (razão).",
      explanation: "Exemplo: 2, 6, 18, 54... (razão = 3). Fórmula do termo geral: an = a1 × r^(n-1)",
      difficulty_level: 3,
      tags: ["progressao-geometrica", "sequencias", "algebra"],
      subject: "Matemática",
      topic: "Sequências",
    },
    {
      question: "Como resolver uma regra de três simples?",
      answer: "Estabelece uma proporção: a/b = c/x, então x = (b×c)/a",
      explanation: "Se 3 laranjas custam R$6, quanto custam 5 laranjas? 3/6 = 5/x → x = (6×5)/3 = R$10",
      difficulty_level: 2,
      tags: ["regra-de-tres", "proporcao", "matematica-basica"],
      subject: "Matemática",
      topic: "Proporção",
    },
    {
      question: "O que é o perímetro de uma figura?",
      answer: "A soma de todos os lados da figura.",
      explanation:
        "Para um quadrado de lado 4cm, o perímetro é 4+4+4+4 = 16cm. Para um círculo, o perímetro é a circunferência: 2πr.",
      difficulty_level: 1,
      tags: ["geometria", "perimetro", "medidas"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "Como calcular o desconto?",
      answer: "Desconto = Valor original × (porcentagem de desconto / 100)",
      explanation:
        "Um produto de R$200 com 15% de desconto: desconto = 200 × (15/100) = R$30. Preço final = R$200 - R$30 = R$170",
      difficulty_level: 2,
      tags: ["porcentagem", "desconto", "matematica-financeira"],
      subject: "Matemática",
      topic: "Matemática Financeira",
    },
    {
      question: "O que são números inteiros?",
      answer: "O conjunto {..., -3, -2, -1, 0, 1, 2, 3, ...}, incluindo positivos, negativos e zero.",
      explanation: "Representado por Z. Inclui os números naturais (positivos), seus opostos (negativos) e o zero.",
      difficulty_level: 1,
      tags: ["numeros-inteiros", "conjuntos-numericos", "matematica-basica"],
      subject: "Matemática",
      topic: "Conjuntos Numéricos",
    },
    {
      question: "Como calcular a diagonal de um quadrado?",
      answer: "d = l√2, onde l é o lado do quadrado.",
      explanation:
        "Usando o teorema de Pitágoras: d² = l² + l² = 2l², então d = l√2. Para um quadrado de lado 5cm, d = 5√2 ≈ 7,07cm.",
      difficulty_level: 3,
      tags: ["geometria", "quadrado", "diagonal", "pitagoras"],
      subject: "Matemática",
      topic: "Geometria",
    },
    {
      question: "O que é amplitude em estatística?",
      answer: "A diferença entre o maior e o menor valor de um conjunto de dados.",
      explanation: "No conjunto {2, 5, 8, 12, 15}, a amplitude é 15 - 2 = 13. Indica a dispersão dos dados.",
      difficulty_level: 2,
      tags: ["estatistica", "amplitude", "dispersao"],
      subject: "Matemática",
      topic: "Estatística",
    },
    {
      question: "Como simplificar uma fração?",
      answer: "Divide numerador e denominador pelo maior divisor comum (MDC).",
      explanation: "Para simplificar 12/18: MDC(12,18) = 6. Então 12/18 = (12÷6)/(18÷6) = 2/3.",
      difficulty_level: 2,
      tags: ["fracoes", "simplificacao", "mdc"],
      subject: "Matemática",
      topic: "Frações",
    },
    {
      question: "O que é uma equação do primeiro grau?",
      answer: "Uma equação da forma ax + b = 0, onde a ≠ 0.",
      explanation: "Exemplo: 2x + 6 = 0. Para resolver: 2x = -6, então x = -3. Tem sempre uma única solução.",
      difficulty_level: 2,
      tags: ["algebra", "equacao", "primeiro-grau"],
      subject: "Matemática",
      topic: "Álgebra",
    },
  ],
  "fisica-mecanica": [
    {
      question: "O que é velocidade média?",
      answer: "É a razão entre o deslocamento e o tempo gasto: v = Δs/Δt",
      explanation: "A velocidade média indica quão rápido um objeto se desloca em média durante um intervalo de tempo.",
      difficulty_level: 2,
      tags: ["cinematica", "velocidade", "movimento", "tempo"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "Enuncie a Segunda Lei de Newton.",
      answer: "A força resultante é igual ao produto da massa pela aceleração: F = ma",
      explanation: "Esta lei estabelece a relação quantitativa entre força, massa e aceleração.",
      difficulty_level: 3,
      tags: ["newton", "forca", "massa", "aceleracao", "dinamica"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é trabalho na física?",
      answer:
        "É a transferência de energia que ocorre quando uma força atua sobre um objeto e causa um deslocamento. W = F × d × cos(θ).",
      explanation: "O trabalho é medido em Joules (J).",
      difficulty_level: 3,
      tags: ["trabalho", "energia", "forca", "deslocamento"],
      subject: "Física",
      topic: "Trabalho e Energia",
    },
    {
      question: "Enuncie a Primeira Lei de Newton.",
      answer:
        "Um corpo em repouso permanece em repouso, e um corpo em movimento permanece em movimento retilíneo uniforme, a menos que uma força externa atue sobre ele.",
      explanation: "Também conhecida como Lei da Inércia. Define o conceito de inércia dos corpos.",
      difficulty_level: 2,
      tags: ["newton", "inercia", "movimento", "repouso"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é aceleração?",
      answer: "Aceleração é a taxa de variação da velocidade em relação ao tempo.",
      explanation: "Matematicamente, a = Δv/Δt. Pode ser positiva (aceleração) ou negativa (desaceleração).",
      difficulty_level: 2,
      tags: ["aceleracao", "velocidade", "cinematica"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é energia cinética?",
      answer: "É a energia associada ao movimento de um corpo, calculada por Ec = (1/2)mv².",
      explanation:
        "Depende da massa (m) e da velocidade (v) do corpo. Quanto maior a velocidade, maior a energia cinética.",
      difficulty_level: 3,
      tags: ["energia-cinetica", "movimento", "dinamica"],
      subject: "Física",
      topic: "Energia",
    },
    {
      question: "Enuncie a Terceira Lei de Newton.",
      answer: "Para toda ação há uma reação de mesma intensidade, mesma direção e sentido oposto.",
      explanation: "Também conhecida como Lei da Ação e Reação. As forças sempre aparecem aos pares.",
      difficulty_level: 2,
      tags: ["newton", "acao-reacao", "forcas"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é movimento retilíneo uniforme (MRU)?",
      answer: "Movimento em linha reta com velocidade constante.",
      explanation: "No MRU, a aceleração é zero e a posição varia linearmente com o tempo: s = s₀ + vt",
      difficulty_level: 2,
      tags: ["mru", "movimento-uniforme", "cinematica"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é energia potencial gravitacional?",
      answer: "É a energia armazenada em um corpo devido à sua posição em um campo gravitacional: Ep = mgh",
      explanation: "Depende da massa (m), aceleração da gravidade (g) e altura (h) em relação a um referencial.",
      difficulty_level: 3,
      tags: ["energia-potencial", "gravitacao", "altura"],
      subject: "Física",
      topic: "Energia",
    },
    {
      question: "O que é impulso?",
      answer: "É o produto da força pelo tempo de aplicação: I = F × Δt",
      explanation: "O impulso é igual à variação da quantidade de movimento: I = Δp = m × Δv",
      difficulty_level: 3,
      tags: ["impulso", "forca", "tempo", "quantidade-movimento"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é movimento retilíneo uniformemente variado (MRUV)?",
      answer: "Movimento em linha reta com aceleração constante.",
      explanation: "No MRUV, a velocidade varia uniformemente: v = v₀ + at e s = s₀ + v₀t + (1/2)at²",
      difficulty_level: 3,
      tags: ["mruv", "aceleracao-constante", "cinematica"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é peso?",
      answer: "É a força gravitacional exercida sobre um corpo: P = mg",
      explanation: "O peso varia conforme a gravidade local, enquanto a massa permanece constante.",
      difficulty_level: 2,
      tags: ["peso", "gravidade", "massa", "forca"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é atrito?",
      answer: "É a força que se opõe ao movimento relativo entre superfícies em contato.",
      explanation:
        "Existem dois tipos principais: atrito estático (impede o início do movimento) e atrito cinético (atua durante o movimento).",
      difficulty_level: 2,
      tags: ["atrito", "forca", "superficies", "movimento"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é quantidade de movimento?",
      answer: "É o produto da massa pela velocidade: p = mv",
      explanation: "Também chamada de momento linear. É uma grandeza vetorial conservada em sistemas isolados.",
      difficulty_level: 3,
      tags: ["quantidade-movimento", "momento-linear", "massa", "velocidade"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é queda livre?",
      answer: "É o movimento de um corpo sob ação exclusiva da gravidade.",
      explanation: "Na queda livre, a aceleração é constante e igual a g ≈ 9,8 m/s². A resistência do ar é desprezada.",
      difficulty_level: 2,
      tags: ["queda-livre", "gravidade", "aceleracao", "cinematica"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é força centrípeta?",
      answer: "É a força que mantém um corpo em movimento circular, sempre direcionada para o centro da trajetória.",
      explanation: "Calculada por Fc = mv²/r, onde v é a velocidade e r é o raio da trajetória circular.",
      difficulty_level: 4,
      tags: ["forca-centripeta", "movimento-circular", "centro"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é velocidade angular?",
      answer: "É a taxa de variação do ângulo em relação ao tempo no movimento circular: ω = Δθ/Δt",
      explanation: "Medida em rad/s. Relaciona-se com a velocidade linear por v = ωr, onde r é o raio.",
      difficulty_level: 3,
      tags: ["velocidade-angular", "movimento-circular", "angulo"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é conservação da energia mecânica?",
      answer: "Em sistemas conservativos, a energia mecânica total (cinética + potencial) permanece constante.",
      explanation: "Em = Ec + Ep = constante. Aplica-se quando não há forças dissipativas como atrito.",
      difficulty_level: 4,
      tags: ["conservacao-energia", "energia-mecanica", "sistemas-conservativos"],
      subject: "Física",
      topic: "Energia",
    },
    {
      question: "O que é força elástica?",
      answer: "É a força exercida por uma mola deformada, dada pela Lei de Hooke: F = -kx",
      explanation:
        "k é a constante elástica da mola e x é a deformação. O sinal negativo indica que a força se opõe à deformação.",
      difficulty_level: 3,
      tags: ["forca-elastica", "lei-hooke", "mola", "deformacao"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é lançamento oblíquo?",
      answer: "É o movimento de um projétil lançado com velocidade inicial formando um ângulo com a horizontal.",
      explanation: "A trajetória é parabólica. O movimento pode ser decomposto em horizontal (MRU) e vertical (MRUV).",
      difficulty_level: 4,
      tags: ["lancamento-obliquo", "projetil", "trajetoria-parabolica"],
      subject: "Física",
      topic: "Cinemática",
    },
    {
      question: "O que é potência?",
      answer: "É a taxa de realização de trabalho ou transferência de energia: P = W/Δt",
      explanation: "Medida em Watts (W). Também pode ser calculada por P = F × v para força constante.",
      difficulty_level: 3,
      tags: ["potencia", "trabalho", "energia", "tempo"],
      subject: "Física",
      topic: "Energia",
    },
    {
      question: "O que é colisão elástica?",
      answer: "É uma colisão onde há conservação tanto da quantidade de movimento quanto da energia cinética.",
      explanation:
        "Após a colisão, os corpos se separam sem deformação permanente. Rara na natureza, mas aproximada em algumas situações.",
      difficulty_level: 4,
      tags: ["colisao-elastica", "conservacao", "quantidade-movimento", "energia-cinetica"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é centro de massa?",
      answer: "É o ponto onde se pode considerar concentrada toda a massa de um sistema.",
      explanation:
        "Para um sistema de partículas, o centro de massa se move como se toda a massa estivesse concentrada nele e todas as forças externas atuassem sobre ele.",
      difficulty_level: 4,
      tags: ["centro-massa", "sistema-particulas", "massa"],
      subject: "Física",
      topic: "Dinâmica",
    },
    {
      question: "O que é torque?",
      answer: "É a tendência de uma força causar rotação em torno de um eixo: τ = F × d × sen(θ)",
      explanation: "Também chamado de momento de uma força. d é a distância do eixo à linha de ação da força.",
      difficulty_level: 4,
      tags: ["torque", "momento-forca", "rotacao", "eixo"],
      subject: "Física",
      topic: "Dinâmica Rotacional",
    },
    {
      question: "O que é equilíbrio estático?",
      answer: "É quando um corpo está em repouso e a resultante das forças e dos torques é zero.",
      explanation: "Condições: ΣF = 0 (equilíbrio de translação) e Στ = 0 (equilíbrio de rotação).",
      difficulty_level: 3,
      tags: ["equilibrio-estatico", "repouso", "forcas", "torques"],
      subject: "Física",
      topic: "Estática",
    },
    {
      question: "O que é movimento harmônico simples?",
      answer: "É um movimento periódico onde a força restauradora é proporcional ao deslocamento.",
      explanation:
        "Exemplo: movimento de uma massa presa a uma mola. A equação é F = -kx, resultando em movimento senoidal.",
      difficulty_level: 4,
      tags: ["movimento-harmonico", "periodico", "forca-restauradora"],
      subject: "Física",
      topic: "Oscilações",
    },
    {
      question: "O que é densidade?",
      answer: "É a razão entre a massa e o volume de um material: ρ = m/V",
      explanation: "Medida em kg/m³. É uma propriedade específica de cada material e varia com a temperatura.",
      difficulty_level: 2,
      tags: ["densidade", "massa", "volume", "material"],
      subject: "Física",
      topic: "Propriedades da Matéria",
    },
    {
      question: "O que é pressão?",
      answer: "É a força aplicada perpendicularmente sobre uma área: P = F/A",
      explanation: "Medida em Pascal (Pa). Quanto menor a área, maior a pressão para a mesma força aplicada.",
      difficulty_level: 2,
      tags: ["pressao", "forca", "area", "pascal"],
      subject: "Física",
      topic: "Mecânica dos Fluidos",
    },
    {
      question: "O que é empuxo?",
      answer: "É a força vertical para cima exercida por um fluido sobre um corpo nele imerso.",
      explanation: "Princípio de Arquimedes: E = ρ_fluido × V_imerso × g. Explica por que objetos flutuam ou afundam.",
      difficulty_level: 3,
      tags: ["empuxo", "arquimedes", "fluido", "flutuacao"],
      subject: "Física",
      topic: "Mecânica dos Fluidos",
    },
    {
      question: "O que é período no movimento circular?",
      answer: "É o tempo necessário para completar uma volta completa: T = 2π/ω",
      explanation: "Relaciona-se com a frequência por T = 1/f. Medido em segundos.",
      difficulty_level: 3,
      tags: ["periodo", "movimento-circular", "volta-completa", "frequencia"],
      subject: "Física",
      topic: "Cinemática",
    },
  ],
  "historia-brasil-colonial": [
    {
      question: "O que foram as Capitanias Hereditárias?",
      answer:
        "Sistema de divisão territorial do Brasil colonial em faixas de terra doadas pela Coroa portuguesa a donatários.",
      explanation:
        "Criadas em 1534, as Capitanias Hereditárias foram uma tentativa de colonizar o Brasil de forma descentralizada.",
      difficulty_level: 3,
      tags: ["capitanias", "colonial", "donatarios", "territorio"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "Qual foi a principal atividade econômica do Brasil colonial?",
      answer: "A produção de açúcar, especialmente no Nordeste.",
      explanation:
        "O açúcar foi o primeiro grande produto de exportação do Brasil colonial, baseado no trabalho escravo e no latifúndio.",
      difficulty_level: 2,
      tags: ["acucar", "economia", "colonial", "nordeste", "exportacao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "Em que ano o Brasil foi descoberto pelos portugueses?",
      answer: "1500, por Pedro Álvares Cabral.",
      explanation:
        "O descobrimento do Brasil em 22 de abril de 1500 marca o início da colonização portuguesa na América.",
      difficulty_level: 1,
      tags: ["descobrimento", "cabral", "1500"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Governo-Geral?",
      answer: "Sistema administrativo criado em 1549 para centralizar o governo do Brasil colonial.",
      explanation:
        "Tomé de Sousa foi o primeiro governador-geral. O sistema foi criado devido ao fracasso de muitas capitanias hereditárias.",
      difficulty_level: 3,
      tags: ["governo-geral", "tome-sousa", "administracao", "centralizacao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foram as entradas e bandeiras?",
      answer:
        "Expedições que adentravam o interior do Brasil em busca de ouro, pedras preciosas e índios para escravizar.",
      explanation:
        "As entradas partiam do litoral, enquanto as bandeiras saíam principalmente de São Paulo. Contribuíram para a expansão territorial.",
      difficulty_level: 3,
      tags: ["entradas", "bandeiras", "expansao", "ouro", "escravizacao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Pacto Colonial?",
      answer: "Sistema que obrigava as colônias a comercializar exclusivamente com a metrópole.",
      explanation:
        "Também chamado de exclusivo metropolitano, garantia que o Brasil só pudesse vender para e comprar de Portugal.",
      difficulty_level: 3,
      tags: ["pacto-colonial", "exclusivo-metropolitano", "comercio", "metropole"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "Quem eram os jesuítas no Brasil colonial?",
      answer: "Religiosos da Companhia de Jesus responsáveis pela catequização dos índios e educação.",
      explanation:
        "Chegaram em 1549 com Tomé de Sousa. Criaram aldeamentos e colégios, sendo expulsos em 1759 pelo Marquês de Pombal.",
      difficulty_level: 2,
      tags: ["jesuitas", "catequizacao", "educacao", "aldeamentos"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a União Ibérica?",
      answer: "Período (1580-1640) em que Portugal e suas colônias ficaram sob domínio espanhol.",
      explanation:
        "Iniciou com Filipe II da Espanha assumindo o trono português. Permitiu a expansão territorial brasileira além do Tratado de Tordesilhas.",
      difficulty_level: 4,
      tags: ["uniao-iberica", "filipe-ii", "dominio-espanhol", "tordesilhas"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foram as Câmaras Municipais no Brasil colonial?",
      answer: "Órgãos administrativos locais compostos por 'homens bons' (elite colonial).",
      explanation:
        "Responsáveis pela administração das vilas e cidades. Só participavam proprietários de terras e escravos, excluindo a maioria da população.",
      difficulty_level: 3,
      tags: ["camaras-municipais", "homens-bons", "administracao-local", "elite"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Guerra dos Mascates?",
      answer: "Conflito (1710-1711) entre a aristocracia rural de Olinda e os comerciantes do Recife.",
      explanation:
        "Os 'mascates' (comerciantes) de Recife queriam autonomia política de Olinda. Refletia tensões entre diferentes grupos da elite colonial.",
      difficulty_level: 4,
      tags: ["guerra-mascates", "olinda", "recife", "comerciantes", "aristocracia"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Quilombo dos Palmares?",
      answer: "Maior quilombo do Brasil colonial, localizado em Alagoas, liderado por Zumbi.",
      explanation:
        "Existiu por quase um século (1597-1695). Representou a resistência negra à escravidão e chegou a ter cerca de 30 mil habitantes.",
      difficulty_level: 3,
      tags: ["quilombo-palmares", "zumbi", "resistencia-negra", "escravidao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Revolta de Beckman?",
      answer: "Revolta (1684) no Maranhão contra o monopólio da Companhia de Comércio do Estado do Maranhão.",
      explanation:
        "Liderada pelos irmãos Beckman, protestava contra os altos preços e a má qualidade dos produtos da Companhia.",
      difficulty_level: 4,
      tags: ["revolta-beckman", "maranhao", "monopolio", "companhia-comercio"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foram as Missões Jesuíticas?",
      answer: "Aldeamentos criados pelos jesuítas para catequizar e 'civilizar' os índios.",
      explanation:
        "Concentravam índios de diferentes tribos, ensinando o cristianismo, agricultura e ofícios. Geraram conflitos com colonos que queriam escravizar índios.",
      difficulty_level: 3,
      tags: ["missoes-jesuiticas", "aldeamentos", "catequizacao", "civilizacao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Casa da Torre?",
      answer: "Latifúndio da família Garcia d'Ávila que se estendia da Bahia ao Piauí.",
      explanation:
        "Maior latifúndio do Brasil colonial, baseado na criação de gado. Simboliza a concentração de terras no período colonial.",
      difficulty_level: 4,
      tags: ["casa-torre", "garcia-avila", "latifundio", "gado"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Tratado de Tordesilhas?",
      answer: "Acordo (1494) entre Portugal e Espanha que dividia as terras do Novo Mundo.",
      explanation:
        "Estabelecia uma linha imaginária 370 léguas a oeste de Cabo Verde. Terras a leste seriam portuguesas, a oeste espanholas.",
      difficulty_level: 2,
      tags: ["tordesilhas", "portugal", "espanha", "divisao-terras"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Insurreição Pernambucana?",
      answer: "Movimento (1645-1654) que expulsou os holandeses de Pernambuco.",
      explanation:
        "Liderada por figuras como João Fernandes Vieira e Henrique Dias, restaurou o domínio português no Nordeste.",
      difficulty_level: 3,
      tags: ["insurreicao-pernambucana", "holandeses", "joao-fernandes-vieira", "restauracao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Brasil Holandês?",
      answer: "Período (1630-1654) em que os holandeses ocuparam parte do Nordeste brasileiro.",
      explanation:
        "Centrado em Pernambuco, foi administrado por Maurício de Nassau (1637-1644), que promoveu desenvolvimento urbano e tolerância religiosa.",
      difficulty_level: 3,
      tags: ["brasil-holandes", "mauricio-nassau", "pernambuco", "ocupacao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foram as Ordenações Filipinas?",
      answer: "Código de leis portuguesas que vigorou no Brasil colonial a partir de 1603.",
      explanation:
        "Regulamentavam aspectos civis, criminais e administrativos. Mantiveram-se em vigor mesmo após a independência, até 1916.",
      difficulty_level: 4,
      tags: ["ordenacoes-filipinas", "codigo-leis", "administracao", "direito"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Conjuração Mineira?",
      answer: "Movimento separatista (1789) em Minas Gerais contra a dominação portuguesa.",
      explanation:
        "Liderada por intelectuais e mineradores, foi motivada pela cobrança da derrama. Tiradentes foi o único executado.",
      difficulty_level: 3,
      tags: ["conjuracao-mineira", "tiradentes", "separatismo", "derrama"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Conjuração Baiana?",
      answer: "Movimento (1798) na Bahia que pregava a independência e o fim da escravidão.",
      explanation:
        "Também chamada de Revolta dos Alfaiates, teve participação popular e ideais mais radicais que a Inconfidência Mineira.",
      difficulty_level: 4,
      tags: ["conjuracao-baiana", "revolta-alfaiates", "independencia", "fim-escravidao"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Revolta de Vila Rica?",
      answer: "Revolta (1720) em Minas Gerais contra a criação das Casas de Fundição.",
      explanation:
        "Liderada por Filipe dos Santos, protestava contra o controle português sobre o ouro. Foi duramente reprimida.",
      difficulty_level: 4,
      tags: ["revolta-vila-rica", "filipe-santos", "casas-fundicao", "controle-ouro"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi o Ciclo do Ouro?",
      answer: "Período (séc. XVIII) de intensa exploração aurífera em Minas Gerais, Goiás e Mato Grosso.",
      explanation:
        "Provocou grande migração interna, desenvolvimento urbano e aumento do controle português através de impostos como o quinto.",
      difficulty_level: 2,
      tags: ["ciclo-ouro", "minas-gerais", "exploracao-aurifera", "quinto"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Transferência da Corte Portuguesa?",
      answer: "Mudança (1808) da família real portuguesa para o Brasil devido às invasões napoleônicas.",
      explanation:
        "D. João VI e a corte se estabeleceram no Rio de Janeiro, transformando a cidade na capital do Império Português.",
      difficulty_level: 2,
      tags: ["transferencia-corte", "d-joao-vi", "napoleao", "rio-janeiro"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Abertura dos Portos?",
      answer: "Decreto (1808) de D. João VI que permitiu o comércio do Brasil com nações amigas.",
      explanation: "Rompeu o Pacto Colonial, permitindo comércio direto com outros países, especialmente a Inglaterra.",
      difficulty_level: 3,
      tags: ["abertura-portos", "d-joao-vi", "comercio", "pacto-colonial"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Revolução Pernambucana de 1817?",
      answer: "Movimento republicano em Pernambuco que proclamou independência temporária do Brasil.",
      explanation:
        "Durou 75 dias, foi influenciada por ideais iluministas e republicanos. Foi duramente reprimida pelas tropas reais.",
      difficulty_level: 4,
      tags: ["revolucao-pernambucana", "1817", "republicano", "independencia"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foram os Tratados de Santo Ildefonso e São Lourenço?",
      answer: "Acordos que substituíram o Tratado de Tordesilhas, reconhecendo a expansão territorial brasileira.",
      explanation:
        "Santo Ildefonso (1777) e São Lourenço (1801) legitimaram as conquistas bandeirantes e estabeleceram fronteiras mais próximas às atuais.",
      difficulty_level: 4,
      tags: ["santo-ildefonso", "sao-lourenco", "fronteiras", "expansao-territorial"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a Intendência das Minas?",
      answer: "Órgão criado para administrar e fiscalizar a exploração aurífera no Brasil colonial.",
      explanation:
        "Controlava a distribuição de datas (lotes de mineração), cobrava impostos e combatia o contrabando de ouro.",
      difficulty_level: 4,
      tags: ["intendencia-minas", "fiscalizacao", "exploracao-aurifera", "datas"],
      subject: "História",
      topic: "Brasil Colonial",
    },
    {
      question: "O que foi a sociedade estamental no Brasil colonial?",
      answer: "Organização social hierárquica baseada no nascimento, cor da pele e condição jurídica.",
      explanation:
        "No topo estavam os brancos proprietários, no meio os mestiços livres, e na base os escravos negros e índios.",
      difficulty_level: 3,
      tags: ["sociedade-estamental", "hierarquia", "cor-pele", "condicao-juridica"],
      subject: "História",
      topic: "Brasil Colonial",
    },
  ],
}
async function getPrebuiltDeckCards(deckId: string | undefined): Promise<Flashcard[]> {
  if (!deckId) {
    throw new Error("ID do deck é obrigatório para carregar deck pré-construído.")
  }

  if (deckId === "admin-created-deck") {
    const adminCards = getAdminFlashcards()
    if (adminCards.length === 0) {
      return [
        createFlashcardObject(
          `admin-empty-${Date.now()}`,
          "Deck do Admin Vazio",
          "Nenhum flashcard foi criado pelo admin ainda.",
          "Use a página de administração para adicionar novos flashcards a este deck.",
          1,
          ["admin", "vazio"],
          "Admin",
          "Geral",
          "Sistema",
        ),
      ]
    }
    return adminCards
  }

  try {
    const deckFlashcardsData = prebuiltDeckFlashcards[deckId]
    if (!deckFlashcardsData || deckFlashcardsData.length === 0) {
      console.warn(`Deck '${deckId}' não possui flashcards definidos em prebuiltDeckFlashcards ou está vazio.`)
      return [
        createFlashcardObject(
          `empty-deck-${deckId}-${Date.now()}`,
          `Deck Vazio: ${getSubjectName(deckId.split("-")[0])}`,
          "Este deck pré-construído não possui flashcards no momento.",
          "Verifique a configuração dos dados mockados para este deck.",
          1,
          ["vazio", "deck"],
          getSubjectName(deckId.split("-")[0]) || "Deck",
          "Conteúdo Indisponível",
          "Sistema",
        ),
      ]
    }

    return deckFlashcardsData.map((card, index) =>
      createFlashcardObject(
        `deck-${deckId}-${index}`,
        card.question,
        card.answer,
        card.explanation,
        card.difficulty_level,
        card.tags,
        card.subject || getSubjectName(deckId.split("-")[0]),
        card.topic || "Geral do Deck",
        "Deck Pré-construído",
      ),
    )
  } catch (error) {
    console.error("❌ Erro ao buscar flashcards do deck (mock):", error)
    return [
      createFlashcardObject(
        `fallback-deck-${deckId}`,
        "Erro ao Carregar Deck",
        "Não foi possível carregar os flashcards deste deck.",
        `Detalhe: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        3,
        ["erro", "deck"],
        "Deck",
        "Erro Interno",
        "Sistema de Fallback",
      ),
    ]
  }
}

// Main POST Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      method,
      numberOfFlashcards = 10,
      subjectId,
      topicId,
      topicIds, // New: array of topic IDs
      topicEstimatedCards, // New: estimated cards per topic
      customContent,
      difficulty = "medium",
      deckId,
    } = body

    if (!method || !["ai-custom", "database", "prebuilt"].includes(method)) {
      throw new Error(`Método de geração inválido: ${method}. Use: ai-custom, database ou prebuilt`)
    }

    let flashcards: Flashcard[] = []

    switch (method) {
      case "ai-custom":
        flashcards = await generateFromCustomContent(customContent, numberOfFlashcards, difficulty)
        break
      case "database": // "By Subject" - Updated to handle multiple topics
        flashcards = await generateFromDatabase(
          subjectId,
          topicIds || (topicId ? [topicId] : undefined),
          topicEstimatedCards,
          numberOfFlashcards,
          difficulty,
        )
        break
      case "prebuilt":
        flashcards = await getPrebuiltDeckCards(deckId)
        break
    }

    return NextResponse.json({
      success: true,
      flashcards,
      count: flashcards.length,
      method,
      parameters: { subjectId, topicId, topicIds, deckId, difficulty, numberOfFlashcards },
    })
  } catch (error) {
    console.error("❌ Erro GERAL ao gerar flashcards:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar sua solicitação."
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        flashcards: [
          createFlashcardObject(
            `fallback-geral-${Date.now()}`,
            "Erro na Geração",
            "Tente novamente.",
            `Detalhe: ${errorMessage}`,
            3,
            ["erro"],
          ),
        ],
        count: 1,
      },
      { status: 500 },
    )
  }
}
