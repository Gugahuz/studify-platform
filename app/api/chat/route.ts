import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
    system: `Responda sempre de forma clara, objetiva e bem organizada. Evite o uso de asteriscos, pontuações exageradas, formatações decorativas e saudações excessivas. As respostas devem ser informativas, coesas e diretas, com foco em resolver a dúvida do estudante de maneira didática, sem floreios.`,
  })

  return result.toDataStreamResponse()
}
