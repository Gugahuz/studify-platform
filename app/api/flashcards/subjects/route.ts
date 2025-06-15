import { NextResponse } from "next/server"

export const revalidate = 0

export async function GET() {
  console.log("[API /api/flashcards/subjects] TESTE MÍNIMO: Tentando retornar JSON fixo.")
  try {
    const hardcodedData = {
      message: "Esta é uma resposta JSON fixa da API de teste mínimo.",
      timestamp: new Date().toISOString(),
      status: "success_minimal_test",
      // Adicionando uma estrutura similar ao que o cliente espera, mas vazia
      Exatas: [],
      Humanas: [],
      Linguagens: [],
      Biológicas: [],
    }
    return NextResponse.json(hardcodedData)
  } catch (e) {
    // Este catch idealmente nunca deveria ser alcançado se estamos apenas retornando JSON.
    console.error("[API /api/flashcards/subjects] TESTE MÍNIMO: Erro mesmo ao retornar JSON fixo:", e)
    return NextResponse.json(
      {
        error: "Erro crítico na API mínima",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    )
  }
}
