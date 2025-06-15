import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Verificando status do banco de dados...")

    const status = {
      flashcard_subjects: false,
      flashcard_topics: false,
      flashcards: false,
      user_flashcard_decks: false,
      prebuilt_flashcard_decks: false,
      hasData: false,
      errors: [] as string[],
    }

    // Verificar cada tabela
    const tables = [
      "flashcard_subjects",
      "flashcard_topics",
      "flashcards",
      "user_flashcard_decks",
      "prebuilt_flashcard_decks",
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1)

        if (error) {
          status.errors.push(`${table}: ${error.message}`)
          status[table as keyof typeof status] = false
        } else {
          status[table as keyof typeof status] = true
          if (data && data.length > 0) {
            status.hasData = true
          }
        }
      } catch (err) {
        status.errors.push(`${table}: Erro de conexão`)
        status[table as keyof typeof status] = false
      }
    }

    const allTablesExist = tables.every((table) => status[table as keyof typeof status] === true)

    return NextResponse.json({
      success: allTablesExist,
      status,
      message: allTablesExist ? "Todas as tabelas estão funcionando!" : "Algumas tabelas precisam ser criadas",
      needsSetup: !allTablesExist,
    })
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar banco de dados",
        needsSetup: true,
      },
      { status: 500 },
    )
  }
}
