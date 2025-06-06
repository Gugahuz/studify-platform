import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "Imagem é obrigatória" }, { status: 400 })
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Apenas arquivos de imagem são suportados" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Imagem deve ter no máximo 10MB" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não encontrada")
      return Response.json({ error: "Configuração da API não encontrada" }, { status: 500 })
    }

    // Converter imagem para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")
    const mimeType = file.type

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Você é um professor de matemática especializado. Analise esta imagem e resolva TODAS as questões matemáticas que encontrar.

IMPORTANTE: 
- Identifique e transcreva EXATAMENTE o que está escrito na imagem
- Resolva cada questão passo a passo de forma detalhada
- Use formatação clara com títulos e numeração
- Se não conseguir ler algo, mencione especificamente

FORMATO OBRIGATÓRIO:
## 📝 QUESTÃO IDENTIFICADA:
[Transcreva exatamente o que está escrito]

## 🔍 ANÁLISE:
[Explique o tipo de problema e estratégia]

## ✏️ RESOLUÇÃO PASSO A PASSO:
[Desenvolva a solução completa]

## ✅ RESPOSTA FINAL:
[Destaque a resposta]

Se houver múltiplas questões, repita este formato para cada uma.
Se não conseguir identificar questões matemáticas, descreva detalhadamente o que vê na imagem.`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 3000,
      })

      const resolucao = completion.choices[0].message.content

      return Response.json({
        success: true,
        resolucao: resolucao,
        nomeArquivo: file.name,
      })
    } catch (apiError) {
      console.error("OpenAI API error:", apiError)

      return Response.json(
        {
          error:
            "Não foi possível processar a imagem no momento. Verifique se a imagem contém questões matemáticas legíveis e tente novamente.",
          details: apiError instanceof Error ? apiError.message : "Erro na API de visão",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return Response.json(
      {
        error: "Erro interno ao processar imagem. Verifique o arquivo e tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
