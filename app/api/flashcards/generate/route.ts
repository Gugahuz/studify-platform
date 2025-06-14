import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subjectId, topicId, customContent, numberOfFlashcards = 10, userId } = body

    console.log("🎯 Generating flashcards with params:", {
      subjectId,
      topicId,
      customContent: !!customContent,
      numberOfFlashcards,
    })

    let flashcards = []

    if (customContent) {
      // Generate flashcards from custom content using AI
      flashcards = await generateFlashcardsFromContent(customContent, numberOfFlashcards)
    } else if (subjectId || topicId) {
      // Generate flashcards from database content
      flashcards = await generateFlashcardsFromDatabase(subjectId, topicId, numberOfFlashcards)
    } else {
      return NextResponse.json({ error: "Either subjectId/topicId or customContent is required" }, { status: 400 })
    }

    // If user is provided, save to user's deck
    if (userId && flashcards.length > 0) {
      await saveFlashcardsToDeck(userId, flashcards, subjectId, topicId)
    }

    return NextResponse.json({
      flashcards,
      message: `Successfully generated ${flashcards.length} flashcards`,
    })
  } catch (error) {
    console.error("❌ Error generating flashcards:", error)
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 })
  }
}

async function generateFlashcardsFromContent(content: string, count: number) {
  try {
    console.log("🤖 Generating flashcards from custom content using AI...")

    const prompt = `
    Analyze the following educational content and create exactly ${count} high-quality flashcards.
    Each flashcard should have a clear question and a comprehensive answer.
    
    Content to analyze:
    ${content}
    
    Return the flashcards in the following JSON format:
    {
      "flashcards": [
        {
          "question": "Clear, specific question",
          "answer": "Comprehensive answer",
          "explanation": "Additional context or explanation if needed",
          "difficulty": 1-5,
          "tags": ["tag1", "tag2"]
        }
      ]
    }
    
    Guidelines:
    - Questions should test understanding, not just memorization
    - Answers should be complete but concise
    - Include explanations for complex concepts
    - Vary difficulty levels appropriately
    - Use relevant tags for categorization
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    })

    const result = JSON.parse(text)

    return result.flashcards.map((card: any, index: number) => ({
      id: `ai-generated-${Date.now()}-${index}`,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || null,
      difficulty_level: card.difficulty || 3,
      tags: card.tags || [],
      subject: "Personalizado",
      topic: "Conteúdo do Usuário",
      source: "AI Generated",
    }))
  } catch (error) {
    console.error("❌ Error generating AI flashcards:", error)
    throw new Error("Failed to generate flashcards from content")
  }
}

async function generateFlashcardsFromDatabase(subjectId?: string, topicId?: string, count = 10) {
  try {
    console.log("📚 Generating flashcards from database...")

    let query = supabase.from("flashcards").select(`
        *,
        flashcard_topics!inner(
          name,
          flashcard_subjects!inner(name, category)
        )
      `)

    if (topicId) {
      query = query.eq("topic_id", topicId)
    } else if (subjectId) {
      query = query.eq("flashcard_topics.subject_id", subjectId)
    }

    const { data: dbFlashcards, error } = await query.limit(count * 2) // Get more to allow for randomization

    if (error) {
      console.error("❌ Database error:", error)
      throw error
    }

    if (!dbFlashcards || dbFlashcards.length === 0) {
      console.log("⚠️ No flashcards found in database, generating sample cards...")
      return generateSampleFlashcards(count)
    }

    // Randomize and limit results
    const shuffled = dbFlashcards.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count)

    return selected.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation,
      difficulty_level: card.difficulty_level,
      tags: card.tags || [],
      subject: card.flashcard_topics.flashcard_subjects.name,
      topic: card.flashcard_topics.name,
      source: card.source || "Database",
    }))
  } catch (error) {
    console.error("❌ Error fetching from database:", error)
    return generateSampleFlashcards(count)
  }
}

function generateSampleFlashcards(count: number) {
  const sampleCards = [
    {
      question: "Qual é a fórmula da equação do 2º grau?",
      answer: "ax² + bx + c = 0",
      explanation: "Onde a ≠ 0, e a, b, c são coeficientes reais",
      subject: "Matemática",
      topic: "Álgebra",
    },
    {
      question: "O que é a Lei de Newton da Inércia?",
      answer:
        "Um corpo em repouso tende a permanecer em repouso, e um corpo em movimento tende a permanecer em movimento, a menos que uma força externa atue sobre ele",
      explanation: "Esta é a Primeira Lei de Newton, também conhecida como Lei da Inércia",
      subject: "Física",
      topic: "Mecânica",
    },
    {
      question: "Qual é a configuração eletrônica do carbono?",
      answer: "1s² 2s² 2p²",
      explanation: "O carbono tem 6 elétrons distribuídos nos orbitais seguindo o princípio de Aufbau",
      subject: "Química",
      topic: "Estrutura Atômica",
    },
  ]

  return Array.from({ length: count }, (_, i) => {
    const baseCard = sampleCards[i % sampleCards.length]
    return {
      id: `sample-${Date.now()}-${i}`,
      question: `${baseCard.question} (Card ${i + 1})`,
      answer: baseCard.answer,
      explanation: baseCard.explanation,
      difficulty_level: Math.floor(Math.random() * 3) + 2,
      tags: [baseCard.topic.toLowerCase()],
      subject: baseCard.subject,
      topic: baseCard.topic,
      source: "Sample",
    }
  })
}

async function saveFlashcardsToDeck(userId: string, flashcards: any[], subjectId?: string, topicId?: string) {
  try {
    console.log("💾 Saving flashcards to user deck...")

    // Create a new deck for the user
    const deckName = `Deck ${new Date().toLocaleDateString()} - ${flashcards[0]?.subject || "Personalizado"}`

    const { data: deck, error: deckError } = await supabase
      .from("user_flashcard_decks")
      .insert({
        user_id: userId,
        name: deckName,
        description: `Deck gerado automaticamente com ${flashcards.length} flashcards`,
        subject_id: subjectId,
        total_cards: flashcards.length,
      })
      .select()
      .single()

    if (deckError) {
      console.error("❌ Error creating deck:", deckError)
      return
    }

    console.log("✅ Deck created successfully:", deck.id)
  } catch (error) {
    console.error("❌ Error saving to deck:", error)
  }
}
