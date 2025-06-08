import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "Arquivo deve ter no máximo 20MB" }, { status: 400 })
    }

    console.log(`[EXTRAIR-CITACOES] Processando: ${file.name} (${file.size} bytes, ${file.type})`)

    // Para PDFs, retornar mensagem informativa por enquanto
    if (file.type === "application/pdf") {
      return Response.json({
        success: true,
        citacoes: `📚 Extração de Citações - ${file.name}

🎯 Funcionalidade em Desenvolvimento

Esta funcionalidade está sendo desenvolvida para extrair automaticamente:

📝 Citações Diretas:
• Trechos entre aspas com referência ao autor
• Citações longas em parágrafo separado
• Citações com página específica

📖 Citações Indiretas:
• Paráfrases de ideias de autores
• Referências a conceitos específicos
• Menções a teorias e estudos

🔍 Informações Extraídas:
• Nome do autor
• Ano de publicação
• Página da citação
• Contexto da citação

✅ Em breve você poderá:
• Extrair citações automaticamente
• Organizar por autor ou tema
• Exportar em formato ABNT
• Verificar formatação das referências

🚀 Continue usando outras funcionalidades do Studify enquanto desenvolvemos esta feature!`,
        nomeArquivo: file.name,
      })
    }

    // Para imagens, processar com OpenAI
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Apenas arquivos PDF e imagens são suportados" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")

    if (!process.env.OPENAI_API_KEY) {
      console.error("[EXTRAIR-CITACOES] OPENAI_API_KEY não encontrada")
      return Response.json({
        success: true,
        citacoes: generateFallbackCitacoes(file.name),
        nomeArquivo: file.name,
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta imagem e extraia todas as citações acadêmicas encontradas. 

FORMATO DE RESPOSTA:

📚 Citações Extraídas

🔍 Citações Diretas Encontradas:
• [Transcreva exatamente como aparece, com aspas]
• [Autor, ano, página se disponível]

📖 Citações Indiretas Identificadas:
• [Paráfrases ou referências a autores]
• [Contexto da citação]

📝 Referências Mencionadas:
• [Liste autores e obras citadas]
• [Anos de publicação quando visíveis]

✅ Resumo:
• Total de citações diretas: [número]
• Total de citações indiretas: [número]
• Principais autores citados: [lista]

Se não houver citações acadêmicas na imagem, informe que não foram encontradas citações no texto analisado.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      })

      const citacoes = completion.choices[0].message.content

      return Response.json({
        success: true,
        citacoes: citacoes || "Não foi possível extrair citações desta imagem.",
        nomeArquivo: file.name,
      })
    } catch (error) {
      console.error("[EXTRAIR-CITACOES] Erro na API:", error)
      return Response.json({
        success: true,
        citacoes: generateFallbackCitacoes(file.name),
        nomeArquivo: file.name,
      })
    }
  } catch (error) {
    console.error("[EXTRAIR-CITACOES] Erro geral:", error)
    return Response.json({
      success: true,
      citacoes: generateFallbackCitacoes("documento"),
      nomeArquivo: "documento",
    })
  }
}

function generateFallbackCitacoes(fileName: string): string {
  return `📚 Extração de Citações - ${fileName}

🔍 Status: Processamento com dificuldades técnicas

📝 Como extrair citações manualmente:

🎯 Citações Diretas:
• Procure por texto entre "aspas"
• Identifique o autor antes ou depois da citação
• Anote a página se disponível
• Formato: "Texto citado" (AUTOR, ano, p. X)

📖 Citações Indiretas:
• Identifique paráfrases de ideias
• Procure por "segundo", "conforme", "de acordo com"
• Note referências a teorias ou conceitos
• Formato: Segundo Autor (ano), [paráfrase]

✅ Dicas para organizar:
• Separe por autor ou tema
• Mantenha o contexto original
• Verifique a formatação ABNT
• Anote a fonte completa

🚀 Continue usando o chat do Studify para tirar dúvidas sobre citações e referências!`
}
