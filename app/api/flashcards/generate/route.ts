import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase"
import type { Flashcard } from "@/types/flashcards" // Ensure Flashcard type is imported

// Helper to create a standardized flashcard object
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
): Flashcard {
  return { id, question, answer, explanation, difficulty_level, tags, subject, topic, source }
}

async function generateFromCustomContent(content: string, count: number, difficulty: string): Promise<Flashcard[]> {
  if (!content?.trim()) {
    throw new Error("Conteúdo personalizado é obrigatório para geração com IA.")
  }

  const difficultyMap = {
    easy: "fácil, focado em conceitos básicos e definições diretas",
    medium: "de dificuldade média, explorando aplicações e relações entre conceitos",
    hard: "difícil, com foco em análise crítica, problemas complexos ou nuances do tema",
  }
  const difficultyPrompt = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.medium

  const prompt = `
    Você é um assistente educacional especialista em criar flashcards de alta qualidade.
    A partir do CONTEÚDO fornecido abaixo, crie exatamente ${count} flashcards em Português do Brasil.
    Os flashcards devem ter um nível de dificuldade ${difficultyPrompt}.

    CONTEÚDO:
    """
    ${content}
    """

    Para cada flashcard, forneça:
    1.  "question": Uma pergunta clara, específica e instigante que teste a compreensão do conteúdo. Evite perguntas triviais.
    2.  "answer": Uma resposta precisa, completa, mas concisa.
    3.  "explanation": (Obrigatório) Uma explicação detalhada que aprofunde o entendimento da resposta, conecte com outros conceitos ou forneça contexto. Deve ter pelo menos 20 palavras.
    4.  "difficulty_level": Um número inteiro de 1 (muito fácil) a 5 (muito difícil), consistente com o nível de dificuldade solicitado (${difficulty}).
    5.  "tags": Um array de 2 a 4 tags relevantes em letras minúsculas (ex: ["fisiologia", "sistema nervoso", "neurônio"]).
    6.  "subject": O assunto principal abordado no flashcard (inferido do conteúdo, ex: "Biologia").
    7.  "topic": O tópico específico dentro do assunto (inferido do conteúdo, ex: "Sistema Nervoso Central").

    Formato de Saída: Retorne APENAS um array JSON válido contendo os objetos dos flashcards.
    Exemplo de um objeto flashcard:
    {
      "question": "Qual a função principal das mitocôndrias?",
      "answer": "Produção de ATP através da respiração celular.",
      "explanation": "As mitocôndrias são organelas essenciais para o metabolismo energético da célula, convertendo nutrientes em ATP, a principal moeda energética celular. Esse processo envolve o ciclo de Krebs e a fosforilação oxidativa.",
      "difficulty_level": 3,
      "tags": ["biologia celular", "organelas", "respiração celular", "atp"],
      "subject": "Biologia",
      "topic": "Citologia"
    }

    Certifique-se de que cada flashcard seja único e cubra diferentes aspectos do conteúdo, se possível.
    A qualidade da explicação é crucial.
    `

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"), // Using a more capable model
      prompt,
      temperature: 0.6, // Slightly lower temperature for more focused output
    })

    let parsedFlashcards = JSON.parse(text)
    if (!Array.isArray(parsedFlashcards)) {
      // Attempt to find array within a potentially malformed response
      const match = text.match(/(\[[\s\S]*\])/)
      if (match && match[1]) {
        parsedFlashcards = JSON.parse(match[1])
      } else {
        throw new Error("Resposta da IA não é um array JSON válido.")
      }
    }

    return parsedFlashcards.map((card: any, index: number) =>
      createFlashcardObject(
        `ai-custom-${Date.now()}-${index}`,
        card.question || `Pergunta ${index + 1} não gerada`,
        card.answer || "Resposta não gerada",
        card.explanation || "Explicação não gerada.",
        card.difficulty_level || 3,
        Array.isArray(card.tags) ? card.tags : ["geral"],
        card.subject || "Personalizado",
        card.topic || "Conteúdo do Usuário",
        "IA Generativa",
      ),
    )
  } catch (error) {
    console.error("❌ Erro na geração com IA (customContent):", error)
    return [
      createFlashcardObject(
        `fallback-ai-${Date.now()}`,
        "Erro na Geração por IA",
        "Não foi possível gerar flashcards a partir do seu conteúdo.",
        `Detalhe do erro: ${error instanceof Error ? error.message : "Erro desconhecido"}. Por favor, tente refinar seu conteúdo ou tente novamente mais tarde.`,
        3,
        ["erro", "ia"],
        "Sistema",
        "Fallback",
      ),
    ]
  }
}

async function generateFromDatabase(
  subjectId: string | undefined,
  topicId: string | undefined,
  count: number,
  difficulty: string, // Added difficulty for potential AI generation from topic descriptions
): Promise<Flashcard[]> {
  if (!subjectId) {
    throw new Error("Matéria (subjectId) é obrigatória para geração do banco de dados.")
  }

  try {
    let query = supabase.from("flashcards").select(
      `
        id, question, answer, explanation, difficulty_level, tags, source,
        flashcard_topics!inner(
          name,
          flashcard_subjects!inner(name, color)
        )
      `,
      { count: "exact" },
    )

    if (topicId && topicId !== "all") {
      query = query.eq("topic_id", topicId)
    } else {
      query = query.eq("flashcard_topics.subject_id", subjectId)
    }

    // Add difficulty filter if applicable, though flashcards table might not have it directly linked this way
    // query = query.gte('difficulty_level', difficultyRange.min).lte('difficulty_level', difficultyRange.max);

    const { data, error, count: totalCount } = await query.limit(count)

    if (error) throw error

    if (data && data.length > 0) {
      return data.map((card: any) =>
        createFlashcardObject(
          card.id,
          card.question,
          card.answer,
          card.explanation,
          card.difficulty_level,
          card.tags || [],
          card.flashcard_topics?.flashcard_subjects?.name || subjectId,
          card.flashcard_topics?.name || topicId || "Geral",
          card.source || "Banco de Dados",
        ),
      )
    }

    // Fallback: If no specific flashcards, try to generate from topic/subject description using AI
    console.log(
      `⚠️ Nenhum flashcard encontrado para ${subjectId}/${topicId}. Tentando gerar com IA a partir da descrição do tópico...`,
    )
    const { data: topicData, error: topicError } = await supabase
      .from(topicId && topicId !== "all" ? "flashcard_topics" : "flashcard_subjects")
      .select("name, description")
      .eq("id", topicId && topicId !== "all" ? topicId : subjectId)
      .single()

    if (topicError || !topicData) {
      console.error("Erro ao buscar descrição do tópico/matéria:", topicError)
      throw new Error("Conteúdo não encontrado para gerar flashcards.")
    }

    const contentForAI = `Matéria: ${topicData.name}. ${topicData.description || "Sem descrição detalhada."}`
    return generateFromCustomContent(contentForAI, count, difficulty)
  } catch (error) {
    console.error("❌ Erro ao buscar do banco ou gerar por descrição:", error)
    return [
      createFlashcardObject(
        `fallback-db-${Date.now()}`,
        `Flashcards para ${subjectId}`,
        "Conteúdo indisponível no momento.",
        `Não foi possível carregar ou gerar flashcards para esta matéria/tópico. Detalhe: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        3,
        ["fallback", subjectId?.toLowerCase() || "geral"],
        subjectId || "Sistema",
        topicId || "Geral",
      ),
    ]
  }
}

async function getPrebuiltDeckCards(deckId: string | undefined): Promise<Flashcard[]> {
  if (!deckId) {
    throw new Error("ID do deck é obrigatório para carregar deck pré-construído.")
  }

  try {
    const { data: deckFlashcards, error } = await supabase
      .from("prebuilt_deck_flashcards")
      .select(
        `
        flashcards (
          id, question, answer, explanation, difficulty_level, tags, source,
          flashcard_topics (
            name,
            flashcard_subjects (name, color)
          )
        )
      `,
      )
      .eq("deck_id", deckId)

    if (error) throw error

    if (deckFlashcards && deckFlashcards.length > 0) {
      return deckFlashcards
        .map((item: any) => item.flashcards)
        .filter(Boolean) // Filter out null/undefined flashcards
        .map((card: any) =>
          createFlashcardObject(
            card.id,
            card.question,
            card.answer,
            card.explanation,
            card.difficulty_level,
            card.tags || [],
            card.flashcard_topics?.flashcard_subjects?.name || "Deck",
            card.flashcard_topics?.name || "Variados",
            card.source || "Deck Pré-construído",
          ),
        )
    }
    // Fallback if deck has no cards (should ideally not happen for prebuilt decks)
    console.warn(`Deck pré-construído ${deckId} não possui flashcards associados.`)
    return [
      createFlashcardObject(
        `fallback-deck-${deckId}`,
        "Deck Vazio?",
        "Este deck pré-construído parece não ter flashcards.",
        "Por favor, verifique a configuração do deck ou contate o suporte.",
        3,
        ["deck", "vazio"],
        "Sistema",
        "Deck Pré-construído",
      ),
    ]
  } catch (error) {
    console.error("❌ Erro ao buscar flashcards do deck pré-construído:", error)
    throw error // Re-throw to be caught by the main handler
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, numberOfFlashcards = 10, subjectId, topicId, customContent, difficulty = "medium", deckId } = body

    if (!method || !["ai-custom", "database", "prebuilt"].includes(method)) {
      throw new Error(`Método de geração inválido: ${method}. Use: ai-custom, database ou prebuilt`)
    }

    let flashcards: Flashcard[] = []

    switch (method) {
      case "ai-custom":
        flashcards = await generateFromCustomContent(customContent, numberOfFlashcards, difficulty)
        break
      case "database":
        flashcards = await generateFromDatabase(subjectId, topicId, numberOfFlashcards, difficulty)
        break
      case "prebuilt":
        flashcards = await getPrebuiltDeckCards(deckId)
        break
    }

    return NextResponse.json({
      success: true,
      flashcards,
      count: flashcards.length,
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
            "Ocorreu um Erro",
            "Não foi possível completar sua solicitação de flashcards.",
            `Detalhe: ${errorMessage}. Tente novamente.`,
            3,
            ["erro", "sistema"],
          ),
        ],
        count: 1,
      },
      { status: 500 },
    )
  }
}
