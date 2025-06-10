import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Verificar se a API key existe
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY não encontrada nas variáveis de ambiente")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "fake-key-for-development",
})

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando paráfrase...")

    const body = await request.json()
    console.log("Body recebido:", body)

    const { text, tone = "neutro", style = "academico", complexity = "medio" } = body

    if (!text || typeof text !== "string") {
      console.error("Texto inválido:", text)
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key não configurada")
      return NextResponse.json(
        {
          error: "Serviço temporariamente indisponível",
          paraphrasedText:
            "Esta funcionalidade requer configuração da API OpenAI. Por favor, tente novamente mais tarde.",
        },
        { status: 200 },
      )
    }

    // Configurações baseadas nas seleções do usuário
    const toneInstructions = {
      formal: "Use linguagem formal, respeitosa e profissional",
      neutro: "Mantenha um tom equilibrado e objetivo",
      informal: "Use linguagem casual e acessível",
      persuasivo: "Torne o texto mais convincente e envolvente",
      explicativo: "Foque em clareza e didática na explicação",
    }

    const styleInstructions = {
      academico: "Use estrutura acadêmica com vocabulário técnico apropriado",
      jornalistico: "Adote estilo jornalístico claro e direto",
      criativo: "Use linguagem criativa e expressiva",
      tecnico: "Mantenha precisão técnica e terminologia especializada",
      conversacional: "Use estilo natural como uma conversa",
    }

    const complexityInstructions = {
      simples: "Use vocabulário simples e frases curtas",
      medio: "Equilibre simplicidade com riqueza vocabular",
      avancado: "Use vocabulário sofisticado e estruturas complexas",
    }

    console.log("Configurações:", { tone, style, complexity })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em paráfrase de textos em português brasileiro com alta precisão e qualidade profissional.

CONFIGURAÇÕES SOLICITADAS:
- Tom: ${tone} - ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.neutro}
- Estilo: ${style} - ${styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.academico}
- Complexidade: ${complexity} - ${complexityInstructions[complexity as keyof typeof complexityInstructions] || complexityInstructions.medio}

INSTRUÇÕES OBRIGATÓRIAS:
1. Reescreva o texto mantendo EXATAMENTE o mesmo significado
2. Aplique as configurações de tom, estilo e complexidade solicitadas
3. Preserve todas as informações importantes e dados específicos
4. Use sinônimos apropriados e reestruture as frases
5. Mantenha a coerência e fluidez do texto
6. Adapte o vocabulário ao nível de complexidade escolhido
7. Respeite o contexto e propósito original do texto
8. Garanta que o resultado seja natural e bem escrito

IMPORTANTE: Retorne APENAS o texto parafraseado, sem explicações, comentários ou formatação adicional.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    })

    const paraphrasedText = completion.choices[0]?.message?.content?.trim()

    if (!paraphrasedText) {
      console.error("Resposta vazia da OpenAI")
      throw new Error("Não foi possível gerar a paráfrase")
    }

    console.log("Paráfrase gerada com sucesso")
    return NextResponse.json({
      paraphrasedText,
    })
  } catch (error: any) {
    console.error("Erro detalhado na API de paráfrase:", error)

    // Tratamento específico para diferentes tipos de erro
    if (error?.code === "insufficient_quota") {
      return NextResponse.json(
        {
          error: "Limite de uso atingido",
          paraphrasedText: "O serviço atingiu o limite de uso. Tente novamente mais tarde.",
        },
        { status: 200 },
      )
    }

    if (error?.code === "invalid_api_key") {
      return NextResponse.json(
        {
          error: "Configuração inválida",
          paraphrasedText: "Erro de configuração do serviço. Entre em contato com o suporte.",
        },
        { status: 200 },
      )
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        paraphrasedText: "Ocorreu um erro ao processar sua solicitação. Tente novamente em alguns instantes.",
      },
      { status: 200 },
    )
  }
}
