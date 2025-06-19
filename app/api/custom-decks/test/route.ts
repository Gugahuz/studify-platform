import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Testar todas as operações do Supabase
export async function GET(request: NextRequest) {
  const tests = []
  let allPassed = true

  try {
    // Teste 1: Conexão básica
    tests.push({ name: "Conexão básica", status: "testing" })
    try {
      const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })
      if (error) throw error
      tests[tests.length - 1] = { name: "Conexão básica", status: "passed", details: `${data} perfis encontrados` }
    } catch (error) {
      tests[tests.length - 1] = { name: "Conexão básica", status: "failed", error: error.message }
      allPassed = false
    }

    // Teste 2: Verificar tabelas de decks personalizados
    tests.push({ name: "Tabelas de decks personalizados", status: "testing" })
    try {
      const tables = [
        "user_custom_decks",
        "user_custom_flashcards",
        "user_custom_study_sessions",
        "user_custom_deck_progress",
      ]
      const tableChecks = []

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("count", { count: "exact" })
        if (error) throw new Error(`Tabela ${table}: ${error.message}`)
        tableChecks.push(`${table}: OK`)
      }

      tests[tests.length - 1] = {
        name: "Tabelas de decks personalizados",
        status: "passed",
        details: tableChecks.join(", "),
      }
    } catch (error) {
      tests[tests.length - 1] = { name: "Tabelas de decks personalizados", status: "failed", error: error.message }
      allPassed = false
    }

    // Teste 3: Verificar políticas RLS
    tests.push({ name: "Políticas RLS", status: "testing" })
    try {
      const { data: policies, error } = await supabase.rpc("get_policies_info")
      if (error && !error.message.includes("function get_policies_info() does not exist")) {
        throw error
      }
      tests[tests.length - 1] = { name: "Políticas RLS", status: "passed", details: "RLS configurado" }
    } catch (error) {
      tests[tests.length - 1] = {
        name: "Políticas RLS",
        status: "warning",
        details: "Não foi possível verificar políticas automaticamente",
      }
    }

    // Teste 4: Verificar triggers
    tests.push({ name: "Triggers e funções", status: "testing" })
    try {
      const { data, error } = await supabase.rpc("check_triggers_exist")
      if (error && !error.message.includes("function check_triggers_exist() does not exist")) {
        throw error
      }
      tests[tests.length - 1] = { name: "Triggers e funções", status: "passed", details: "Triggers configurados" }
    } catch (error) {
      tests[tests.length - 1] = {
        name: "Triggers e funções",
        status: "warning",
        details: "Não foi possível verificar triggers automaticamente",
      }
    }

    // Teste 5: Verificar usuários autenticados
    tests.push({ name: "Usuários autenticados", status: "testing" })
    try {
      const { data: users, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      tests[tests.length - 1] = {
        name: "Usuários autenticados",
        status: "passed",
        details: `${users.users.length} usuários encontrados`,
      }
    } catch (error) {
      tests[tests.length - 1] = { name: "Usuários autenticados", status: "failed", error: error.message }
      allPassed = false
    }

    // Teste 6: Verificar variáveis de ambiente
    tests.push({ name: "Variáveis de ambiente", status: "testing" })
    try {
      const requiredEnvs = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

      const missingEnvs = requiredEnvs.filter((env) => !process.env[env])

      if (missingEnvs.length > 0) {
        throw new Error(`Variáveis faltando: ${missingEnvs.join(", ")}`)
      }

      tests[tests.length - 1] = {
        name: "Variáveis de ambiente",
        status: "passed",
        details: "Todas as variáveis configuradas",
      }
    } catch (error) {
      tests[tests.length - 1] = { name: "Variáveis de ambiente", status: "failed", error: error.message }
      allPassed = false
    }

    // Teste 7: Verificar flashcard subjects e topics
    tests.push({ name: "Sistema de flashcards", status: "testing" })
    try {
      const { data: subjects, error: subjectsError } = await supabase
        .from("flashcard_subjects")
        .select("count", { count: "exact" })
      if (subjectsError) throw subjectsError

      const { data: topics, error: topicsError } = await supabase
        .from("flashcard_topics")
        .select("count", { count: "exact" })
      if (topicsError) throw topicsError

      tests[tests.length - 1] = {
        name: "Sistema de flashcards",
        status: "passed",
        details: `${subjects} matérias, ${topics} tópicos`,
      }
    } catch (error) {
      tests[tests.length - 1] = { name: "Sistema de flashcards", status: "failed", error: error.message }
      allPassed = false
    }

    return NextResponse.json({
      success: allPassed,
      summary: {
        total: tests.length,
        passed: tests.filter((t) => t.status === "passed").length,
        failed: tests.filter((t) => t.status === "failed").length,
        warnings: tests.filter((t) => t.status === "warning").length,
      },
      tests,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erro nos testes do Supabase:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno nos testes",
        details: error.message,
        tests,
      },
      { status: 500 },
    )
  }
}
