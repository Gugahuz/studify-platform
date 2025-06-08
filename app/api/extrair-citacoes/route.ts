import { NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { text, style, count } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Texto não fornecido" }, { status: 400 })
    }

    // Validar estilo
    const validStyles = ["abnt", "apa", "chicago", "vancouver"]
    if (!validStyles.includes(style)) {
      return NextResponse.json({ error: "Estilo de citação inválido" }, { status: 400 })
    }

    // Validar contagem
    const citationCount = Number(count) || 5
    if (citationCount < 1 || citationCount > 10) {
      return NextResponse.json({ error: "Número de citações deve estar entre 1 e 10" }, { status: 400 })
    }

    // Construir prompt baseado no estilo
    let styleDescription = ""
    switch (style) {
      case "abnt":
        styleDescription = "Associação Brasileira de Normas Técnicas (ABNT), usado no Brasil"
        break
      case "apa":
        styleDescription = "American Psychological Association (APA), usado internacionalmente"
        break
      case "chicago":
        styleDescription = "Chicago Manual of Style, usado em humanidades"
        break
      case "vancouver":
        styleDescription = "Estilo Vancouver, usado em ciências médicas"
        break
    }

    const prompt = `
      Extraia ${citationCount} citações relevantes do seguinte texto acadêmico.
      Formate as citações no estilo ${style.toUpperCase()} (${styleDescription}).
      
      Para cada citação:
      1. Identifique trechos importantes e citáveis
      2. Crie uma referência bibliográfica fictícia mas realista no formato correto
      3. Formate a citação completa seguindo rigorosamente o padrão ${style.toUpperCase()}
      4. Inclua número de página fictício quando aplicável
      
      Retorne apenas as citações formatadas, uma por linha, sem explicações adicionais.
      
      Texto:
      ${text.substring(0, 4000)} // Limitando para evitar tokens excessivos
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em extrair e formatar citações acadêmicas. Você conhece perfeitamente os estilos ABNT, APA, Chicago e Vancouver.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const citations =
      response.choices[0].message.content
        ?.split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, citationCount) || []

    return NextResponse.json({ citations })
  } catch (error) {
    console.error("Erro ao extrair citações:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
