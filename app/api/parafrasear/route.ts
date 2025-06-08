import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { text, style } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 })
    }

    const stylePrompts = {
      academico: `
        Reescreva o texto de forma acadêmica e formal, usando:
        - Linguagem técnica e precisa
        - Estrutura formal e organizada
        - Vocabulário erudito mas acessível
        - Conectivos acadêmicos apropriados
        - Tom impessoal e objetivo
      `,
      informal: `
        Reescreva o texto de forma informal e descontraída, usando:
        - Linguagem casual e natural
        - Expressões do dia a dia
        - Tom conversacional e próximo
        - Estrutura mais flexível
        - Vocabulário acessível e direto
      `,
      criativo: `
        Reescreva o texto de forma criativa e expressiva, usando:
        - Linguagem rica e variada
        - Metáforas e figuras de linguagem
        - Estrutura dinâmica e envolvente
        - Vocabulário expressivo
        - Tom inspirador e cativante
      `,
      objetivo: `
        Reescreva o texto de forma objetiva e direta, usando:
        - Linguagem clara e concisa
        - Frases curtas e diretas
        - Eliminação de redundâncias
        - Foco nas informações essenciais
        - Tom direto e eficiente
      `,
      detalhado: `
        Reescreva o texto de forma detalhada e explicativa, usando:
        - Linguagem explicativa e completa
        - Exemplos e esclarecimentos
        - Estrutura bem desenvolvida
        - Vocabulário descritivo
        - Tom didático e esclarecedor
      `,
    }

    const selectedStylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.academico

    const prompt = `
${selectedStylePrompt}

INSTRUÇÕES IMPORTANTES:
- Mantenha EXATAMENTE o mesmo significado e informações do texto original
- Use linguagem COMPLETAMENTE NATURAL e humana
- Varie a estrutura das frases para soar natural
- Use sinônimos apropriados mas mantenha a clareza
- NÃO adicione informações que não estão no texto original
- NÃO remova informações importantes
- Evite padrões repetitivos que possam soar artificiais
- Use conectivos variados e naturais
- Mantenha o tom apropriado para o estilo escolhido
- NUNCA mencione que é uma paráfrase ou reescrita

TEXTO ORIGINAL:
${text}

TEXTO PARAFRASEADO:
`

    const { text: paraphrasedText } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 2000,
      temperature: 0.8,
    })

    return NextResponse.json({
      paraphrasedText: paraphrasedText.trim(),
    })
  } catch (error) {
    console.error("Erro ao parafrasear:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
