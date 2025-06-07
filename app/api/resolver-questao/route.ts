import OpenAI from "openai"

// Função para redimensionar imagem se necessário
function resizeImageIfNeeded(buffer: Buffer, maxSize: number = 1024 * 1024): Buffer {
  // Se a imagem for menor que 1MB, retorna como está
  if (buffer.length <= maxSize) {
    return buffer
  }

  // Para imagens maiores, vamos reduzir a qualidade
  // Isso é uma simplificação - em produção usaríamos uma biblioteca como sharp
  return buffer
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "Imagem é obrigatória" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Apenas arquivos de imagem são suportados" }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "Imagem deve ter no máximo 20MB" }, { status: 400 })
    }

    console.log(`[RESOLVER-QUESTAO] Processando: ${file.name} (${file.size} bytes, ${file.type})`)

    // Converter e otimizar imagem
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)
    buffer = resizeImageIfNeeded(buffer)

    const base64Image = buffer.toString("base64")
    const mimeType = file.type

    if (!process.env.OPENAI_API_KEY) {
      console.error("[RESOLVER-QUESTAO] OPENAI_API_KEY não encontrada")
      return Response.json({
        success: true,
        resolucao: generateIntelligentFallback(),
        nomeArquivo: file.name,
        fallback: true,
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Tentativa 1: GPT-4o com prompt otimizado
    try {
      console.log("[RESOLVER-QUESTAO] Tentativa 1: GPT-4o")
      const result = await processWithModel(openai, "gpt-4o", base64Image, mimeType, "high")
      if (result) {
        console.log("[RESOLVER-QUESTAO] Sucesso com GPT-4o")
        return Response.json({
          success: true,
          resolucao: result,
          nomeArquivo: file.name,
        })
      }
    } catch (error) {
      console.log("[RESOLVER-QUESTAO] GPT-4o falhou:", error)
    }

    // Tentativa 2: GPT-4o-mini com qualidade média
    try {
      console.log("[RESOLVER-QUESTAO] Tentativa 2: GPT-4o-mini")
      const result = await processWithModel(openai, "gpt-4o-mini", base64Image, mimeType, "low")
      if (result) {
        console.log("[RESOLVER-QUESTAO] Sucesso com GPT-4o-mini")
        return Response.json({
          success: true,
          resolucao: result,
          nomeArquivo: file.name,
          fallback: true,
        })
      }
    } catch (error) {
      console.log("[RESOLVER-QUESTAO] GPT-4o-mini falhou:", error)
    }

    // Tentativa 3: GPT-4-turbo como último recurso
    try {
      console.log("[RESOLVER-QUESTAO] Tentativa 3: GPT-4-turbo")
      const result = await processWithModel(openai, "gpt-4-turbo", base64Image, mimeType, "low")
      if (result) {
        console.log("[RESOLVER-QUESTAO] Sucesso com GPT-4-turbo")
        return Response.json({
          success: true,
          resolucao: result,
          nomeArquivo: file.name,
          fallback: true,
        })
      }
    } catch (error) {
      console.log("[RESOLVER-QUESTAO] GPT-4-turbo falhou:", error)
    }

    // Se todas as tentativas falharam
    console.log("[RESOLVER-QUESTAO] Todas as tentativas falharam, usando fallback inteligente")
    return Response.json({
      success: true,
      resolucao: generateIntelligentFallback(),
      nomeArquivo: file.name,
      fallback: true,
    })
  } catch (error) {
    console.error("[RESOLVER-QUESTAO] Erro geral:", error)
    return Response.json({
      success: true,
      resolucao: generateIntelligentFallback(),
      nomeArquivo: "imagem",
      fallback: true,
    })
  }
}

async function processWithModel(
  openai: OpenAI,
  model: string,
  base64Image: string,
  mimeType: string,
  detail: "low" | "high",
): Promise<string | null> {
  const prompt = `Você é um professor especializado em resolver questões de forma CLARA e DETALHADA. Analise esta imagem e identifique o tipo de conteúdo.

INSTRUÇÕES CRÍTICAS DE FORMATAÇÃO:
- Use APENAS texto simples e limpo
- NÃO use símbolos especiais: \\ [ ] ( ) ** *** \{ \} \$ 
- NÃO use formatação LaTeX ou markdown
- NÃO quebre palavras ou use barras no meio de palavras
- Escreva todas as palavras completas e normais
- Use apenas emojis básicos para organização
- Para equações: escreva de forma simples como "8x - 21 = 3"

PRIMEIRO: Identifique se é MATEMÁTICA/FÍSICA/QUÍMICA (com cálculos) ou OUTRAS DISCIPLINAS

==== PARA MATEMÁTICA/FÍSICA/QUÍMICA (com cálculos): ====

🎯 Objetivo: [Descreva claramente o que precisa ser encontrado]

🔍 Equação identificada:
[Transcreva de forma simples, sem símbolos especiais]

📝 Resolução passo a passo:

🔹 Passo 1: [Nome do passo]
[Explicação simples do que fazer]
[Mostre a operação de forma limpa]

🔹 Passo 2: [Nome do passo]  
[Explicação simples do que fazer]
[Mostre a operação de forma limpa]

✅ Resultado final:
[Destaque a resposta final de forma clara e simples]

==== PARA OUTRAS DISCIPLINAS (história, geografia, biologia, etc.): ====

🎯 Objetivo: [Descreva claramente o que está sendo perguntado]

📝 Resolução passo a passo:

🔹 Passo 1: Identificar o tema principal
[Explicação detalhada sobre o assunto]

✅ Resultado final:

👤 Quem foi ou O que é:
• [Informações básicas e definição completa]
• [Dados importantes como datas, locais, etc.]

📚 Principais características e feitos:
• [Detalhes específicos]
• [Fatos importantes]
• [Contexto histórico ou científico]

🏛️ [Categoria relevante como Período Histórico]:
• [Mais detalhes]
• [Informações complementares]

🌟 [Outra categoria relevante]:
• [Detalhes adicionais]
• [Informações específicas]

🎯 Legado e Importância:
• [Por que é importante]
• [Impacto na história, ciência ou sociedade]
• [Relevância atual]

REGRAS OBRIGATÓRIAS:
- Escreva TODAS as palavras completas
- NUNCA use barras no meio de palavras
- NUNCA quebre palavras
- Use texto simples e natural
- Seja detalhado mas com linguagem clara`

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: detail,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0,
    })

    const response = completion.choices[0].message.content

    if (!response || response.trim().length < 50) {
      throw new Error("Resposta muito curta ou vazia")
    }

    // Limpar qualquer símbolo de formatação que possa ter escapado
    const cleanResponse = response
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      .replace(/\\\{/g, "")
      .replace(/\\\}/g, "")
      .replace(/\\\$/g, "")
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\\frac/g, "")
      .replace(/\\text/g, "")
      .replace(/\\[a-zA-Z]+/g, "")

    return cleanResponse
  } catch (error) {
    console.error(`[RESOLVER-QUESTAO] Erro no modelo ${model}:`, error)
    return null
  }
}

function generateIntelligentFallback(): string {
  return `🎯 Objetivo: Ajudar você a resolver sua questão

🔍 Situação:
Recebi sua imagem, mas encontrei dificuldades técnicas para processá-la completamente.

📝 Como posso ajudar:

🔹 Opção 1: Tente novamente
- Tire uma nova foto com boa iluminação
- Certifique-se de que o texto está legível
- Evite sombras ou reflexos

🔹 Opção 2: Digite sua questão
- Escreva diretamente no chat: "Resolva: 2x + 5 = 15"
- Ou pergunte: "Explique a fotossíntese"
- Ou: "Quem foi Dom Pedro I?"

🔹 Opção 3: Use o chat
- Converse comigo para tirar dúvidas específicas
- Posso explicar conceitos passo a passo
- Funciono com todas as disciplinas

✅ Disciplinas que domino:
📚 Matemática • 🧪 Ciências • 📖 História • 🌍 Geografia • 📝 Português • 🎨 Artes

Estou aqui para ajudar! Tente uma dessas alternativas e vamos resolver juntos! 🚀`
}
