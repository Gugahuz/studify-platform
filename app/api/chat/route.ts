import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: openai("gpt-4-turbo"),
      messages,
      system: `Você é o Studo, um tutor simpático e didático especializado em vestibular e ENEM. 

INSTRUÇÕES IMPORTANTES:
- Responda sempre de forma clara, objetiva e bem organizada
- Use linguagem acessível e didática para estudantes
- Evite asteriscos, pontuações exageradas e formatações decorativas
- Seja direto e focado em resolver a dúvida do estudante
- Use exemplos práticos quando necessário
- Mantenha um tom amigável mas profissional
- Organize as respostas em tópicos quando apropriado
- Priorize clareza sobre extensão

Você está aqui para ajudar estudantes com:
- Dúvidas de matérias do ensino médio
- Preparação para vestibular e ENEM
- Explicações de conceitos complexos
- Resolução de exercícios
- Dicas de estudo e organização`,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Erro na API do chat:", error)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
