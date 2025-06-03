import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const { texto, tipo } = await req.json()

    if (!texto) {
      return Response.json({ error: "Texto é obrigatório" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não encontrada")
      return Response.json({ error: "Configuração da API não encontrada" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const basePrompt = `Você é um assistente especializado em criar resumos educacionais claros e objetivos. 

INSTRUÇÕES IMPORTANTES:
- Use linguagem simples e direta
- Evite formatações excessivas como asteriscos, hífens desnecessários ou acentuações decorativas
- Organize o conteúdo de forma natural e fluida
- Use apenas pontuação padrão (pontos, vírgulas, dois pontos)
- Mantenha um tom didático e acessível
- Não use marcadores visuais como **, --, *** ou símbolos especiais
- Estruture o texto em parágrafos bem organizados`

    const prompt =
      tipo === "detalhado"
        ? `${basePrompt}

Crie um resumo detalhado e bem estruturado do seguinte conteúdo educacional. Organize as informações em parágrafos claros, usando linguagem natural e didática:

${texto}`
        : `${basePrompt}

Crie um resumo conciso e objetivo do seguinte conteúdo educacional. Foque nos pontos principais e conceitos essenciais, usando linguagem clara e natural:

${texto}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: tipo === "detalhado" ? 1500 : 800,
    })

    return Response.json({ resumo: completion.choices[0].message.content })
  } catch (error) {
    console.error("Erro ao gerar resumo:", error)
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
