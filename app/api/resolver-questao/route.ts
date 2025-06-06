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
  const prompt = `Você é um assistente educacional avançado, similar ao Photomath e Google Lens. Analise esta imagem e identifique EXATAMENTE o que está escrito.

INSTRUÇÕES CRÍTICAS:
1. Leia e transcreva PALAVRA POR PALAVRA todo o texto visível na imagem
2. Identifique se é: matemática, física, química, história, geografia, português, biologia, etc.
3. Resolva ou responda de forma COMPLETA e DETALHADA
4. Use formatação clara e organizada
5. Se for equação matemática, mostre TODOS os passos
6. Se for pergunta de conhecimento, dê resposta COMPLETA com contexto

FORMATO OBRIGATÓRIO:
🔍 **TEXTO IDENTIFICADO:**
[Transcreva EXATAMENTE tudo que conseguir ler]

📚 **DISCIPLINA:** [Nome da matéria]

✅ **RESPOSTA COMPLETA:**
[Resolução passo a passo OU resposta detalhada]

💡 **EXPLICAÇÃO ADICIONAL:**
[Contexto, dicas ou informações extras relevantes]

IMPORTANTE: Seja PRECISO na transcrição e COMPLETO na resposta. Se não conseguir ler algo, mencione especificamente o que não está claro.`

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

    return response
  } catch (error) {
    console.error(`[RESOLVER-QUESTAO] Erro no modelo ${model}:`, error)
    return null
  }
}

function generateIntelligentFallback(): string {
  return `🔍 **ANÁLISE DA IMAGEM**

Recebi sua imagem, mas encontrei dificuldades técnicas para processá-la completamente. Vou te ajudar da melhor forma possível!

📚 **COMO POSSO AJUDAR:**

**MATEMÁTICA:**
• Equações e sistemas lineares
• Geometria e trigonometria
• Cálculo (derivadas, integrais)
• Estatística e probabilidade
• Álgebra e funções

**CIÊNCIAS:**
• Física (mecânica, eletricidade, óptica)
• Química (reações, estequiometria, orgânica)
• Biologia (células, genética, ecologia)

**HUMANAS:**
• História (eventos, personagens, períodos)
• Geografia (países, climas, relevo)
• Português (gramática, literatura, interpretação)
• Filosofia e sociologia

✅ **PRÓXIMOS PASSOS:**

1. **TENTE NOVAMENTE:** Envie uma nova foto com:
   - Boa iluminação (evite sombras)
   - Texto bem legível
   - Enquadramento completo da questão
   - Imagem nítida (sem tremor)

2. **DIGITE SUA PERGUNTA:** Escreva diretamente no chat:
   - "Resolva: 2x + 5 = 15"
   - "Quem foi Dom Pedro I?"
   - "Explique a fotossíntese"

3. **USE O CHAT:** Converse comigo para tirar dúvidas específicas

💡 **DICA IMPORTANTE:**
Funciono melhor com imagens claras e bem iluminadas. Se a questão for complexa, posso resolver passo a passo quando você digitar no chat!

**Estou aqui para ajudar! Tente uma dessas alternativas e vamos resolver sua questão juntos! 🚀**`
}
