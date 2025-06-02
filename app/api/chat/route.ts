import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages,
    system: `Responda sempre de forma clara, objetiva e bem organizada. Evite o uso de asteriscos, pontuações exageradas, formatações decorativas e saudações excessivas. As respostas devem ser informativas, coesas e diretas, com foco em resolver a dúvida do estudante de maneira didática, sem floreios. Você é o Studo, um tutor simpático e didático. Explique os conteúdos de vestibular com clareza, linguagem acessível e exemplos simples.`,
  })

  return result.toDataStreamResponse()
}
