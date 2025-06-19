import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// POST - Registrar sessão de estudo
export async function POST(request: NextRequest, { params }: { params: { deckId: string } }) {
  try {
    const { deckId } = params
    const body = await request.json()
    const { userId, cardsStudied, cardsCorrect, durationMinutes, cardResults } = body

    console.log("📚 Registrando sessão de estudo:", { deckId, userId, cardsStudied, cardsCorrect })

    if (!userId) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    // Verificar se o deck pertence ao usuário
    const { data: deck, error: deckError } = await supabase
      .from("user_custom_decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single()

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 })
    }

    // Registrar sessão de estudo
    const { data: session, error: sessionError } = await supabase
      .from("user_custom_study_sessions")
      .insert({
        user_id: userId,
        deck_id: deckId,
        cards_studied: cardsStudied || 0,
        cards_correct: cardsCorrect || 0,
        duration_minutes: durationMinutes || 0,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("❌ Erro ao registrar sessão:", sessionError)
      return NextResponse.json({ error: "Erro ao registrar sessão de estudo" }, { status: 500 })
    }

    // Atualizar progresso individual dos flashcards se fornecido
    if (cardResults && Array.isArray(cardResults)) {
      for (const result of cardResults) {
        const { flashcardId, correct } = result

        // Buscar progresso existente
        const { data: existingProgress } = await supabase
          .from("user_custom_deck_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("deck_id", deckId)
          .eq("flashcard_id", flashcardId)
          .single()

        if (existingProgress) {
          // Atualizar progresso existente
          const newCorrectCount = correct ? existingProgress.correct_count + 1 : existingProgress.correct_count
          const newIncorrectCount = correct ? existingProgress.incorrect_count : existingProgress.incorrect_count + 1
          const totalReviews = newCorrectCount + newIncorrectCount

          let newStatus = existingProgress.status
          if (totalReviews >= 3 && newCorrectCount / totalReviews >= 0.8) {
            newStatus = "mastered"
          } else if (totalReviews >= 1) {
            newStatus = "learning"
          }

          await supabase
            .from("user_custom_deck_progress")
            .update({
              correct_count: newCorrectCount,
              incorrect_count: newIncorrectCount,
              status: newStatus,
              last_studied_at: new Date().toISOString(),
              next_review_date: new Date(Date.now() + (correct ? 3 : 1) * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProgress.id)
        } else {
          // Criar novo progresso
          await supabase.from("user_custom_deck_progress").insert({
            user_id: userId,
            deck_id: deckId,
            flashcard_id: flashcardId,
            correct_count: correct ? 1 : 0,
            incorrect_count: correct ? 0 : 1,
            status: "learning",
            last_studied_at: new Date().toISOString(),
            next_review_date: new Date(Date.now() + (correct ? 3 : 1) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          })
        }
      }
    }

    console.log("✅ Sessão de estudo registrada com sucesso")

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error("❌ Erro ao registrar sessão de estudo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// GET - Buscar estatísticas de estudo do deck
export async function GET(request: NextRequest, { params }: { params: { deckId: string } }) {
  try {
    const { deckId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    // Buscar estatísticas de sessões
    const { data: sessions, error: sessionsError } = await supabase
      .from("user_custom_study_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("❌ Erro ao buscar sessões:", sessionsError)
      return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
    }

    // Buscar progresso dos flashcards
    const { data: progress, error: progressError } = await supabase
      .from("user_custom_deck_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("deck_id", deckId)

    if (progressError) {
      console.error("❌ Erro ao buscar progresso:", progressError)
      return NextResponse.json({ error: "Erro ao buscar progresso" }, { status: 500 })
    }

    // Calcular estatísticas
    const totalSessions = sessions?.length || 0
    const totalCardsStudied = sessions?.reduce((sum, s) => sum + (s.cards_studied || 0), 0) || 0
    const totalCardsCorrect = sessions?.reduce((sum, s) => sum + (s.cards_correct || 0), 0) || 0
    const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
    const accuracy = totalCardsStudied > 0 ? Math.round((totalCardsCorrect / totalCardsStudied) * 100) : 0

    const masteredCards = progress?.filter((p) => p.status === "mastered").length || 0
    const learningCards = progress?.filter((p) => p.status === "learning").length || 0
    const newCards = progress?.filter((p) => p.status === "new").length || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalCardsStudied,
        totalCardsCorrect,
        totalDuration,
        accuracy,
        masteredCards,
        learningCards,
        newCards,
      },
      recentSessions: sessions?.slice(0, 5) || [],
    })
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
