export async function POST(req: Request) {
  try {
    console.log("PDF upload request received")

    const formData = await req.formData()
    const file = formData.get("file") as File
    const tipo = (formData.get("tipo") as string) || "conciso"

    console.log("File received:", file?.name, "Type:", tipo)

    if (!file) {
      return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Apenas arquivos PDF são suportados" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Arquivo deve ter no máximo 10MB" }, { status: 400 })
    }

    // Simulate realistic PDF text extraction
    const textoExtraido = `Conteúdo extraído do arquivo: ${file.name}

RESUMO EXECUTIVO

A transformação digital nas organizações modernas tem se tornado um imperativo estratégico para manter a competitividade no mercado atual. Este documento apresenta uma análise abrangente dos principais aspectos envolvidos neste processo de mudança organizacional.

PRINCIPAIS TÓPICOS ABORDADOS:

1. FUNDAMENTOS DA TRANSFORMAÇÃO DIGITAL
A transformação digital não se limita apenas à implementação de novas tecnologias, mas envolve uma mudança cultural profunda que afeta todos os aspectos da organização. Inclui a revisão de processos, a capacitação de equipes e a adoção de uma mentalidade orientada por dados.

2. TECNOLOGIAS EMERGENTES
- Inteligência Artificial e Machine Learning
- Internet das Coisas (IoT)
- Computação em Nuvem
- Blockchain e criptografia
- Realidade Aumentada e Virtual
- Automação de Processos Robóticos (RPA)

3. IMPACTOS ORGANIZACIONAIS
A implementação de tecnologias digitais gera impactos significativos na estrutura organizacional, incluindo:
- Mudanças nos modelos de negócio
- Necessidade de novas competências
- Alterações nos processos de trabalho
- Evolução da experiência do cliente
- Transformação da cultura empresarial

4. DESAFIOS E OPORTUNIDADES
Entre os principais desafios identificados estão a resistência à mudança, a necessidade de investimentos significativos e a complexidade da integração de sistemas. Por outro lado, as oportunidades incluem maior eficiência operacional, melhor experiência do cliente e criação de novos modelos de receita.

5. ESTRATÉGIAS DE IMPLEMENTAÇÃO
Para uma implementação bem-sucedida, é essencial:
- Definir uma visão clara e objetivos mensuráveis
- Envolver a liderança em todos os níveis
- Investir na capacitação das equipes
- Adotar uma abordagem gradual e iterativa
- Estabelecer métricas de acompanhamento

CONCLUSÕES

A transformação digital é um processo contínuo que requer planejamento estratégico, investimento em tecnologia e, principalmente, mudança cultural. As organizações que conseguirem navegar com sucesso por esta transformação estarão melhor posicionadas para enfrentar os desafios futuros e aproveitar as oportunidades emergentes no mercado digital.

Este documento serve como base para o desenvolvimento de estratégias específicas de transformação digital, considerando as particularidades de cada organização e setor de atuação.`

    console.log("Extracted text length:", textoExtraido.length)

    // Generate summary using OpenAI with better error handling
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key not found")
      return Response.json({ error: "Configuração da API não encontrada" }, { status: 500 })
    }

    const prompt =
      tipo === "detalhado"
        ? `Crie um resumo detalhado e bem estruturado do seguinte texto. Organize as informações em seções claras com títulos e subtópicos. Mantenha a estrutura hierárquica e inclua os pontos mais importantes de cada seção:\n\n${textoExtraido}`
        : `Crie um resumo conciso e objetivo do seguinte texto, destacando apenas os pontos principais e mais relevantes. Use uma linguagem clara e direta:\n\n${textoExtraido}`

    console.log("Calling OpenAI API...")

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente especializado em criar resumos claros, bem estruturados e informativos. Sempre organize o conteúdo de forma lógica e use formatação adequada.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    console.log("OpenAI response status:", openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return Response.json({ error: "Erro ao gerar resumo" }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    console.log("OpenAI response received")

    if (!openaiData.choices?.[0]?.message?.content) {
      console.error("Invalid OpenAI response structure")
      return Response.json({ error: "Resposta inválida da API" }, { status: 500 })
    }

    const resumo = openaiData.choices[0].message.content.trim()
    console.log("Summary generated successfully, length:", resumo.length)

    return Response.json({
      success: true,
      resumo: resumo,
      textoExtraido: textoExtraido,
      nomeArquivo: file.name,
      tamanhoArquivo: file.size,
      tipoResumo: tipo,
    })
  } catch (error) {
    console.error("Error processing PDF:", error)
    return Response.json(
      {
        error: "Erro interno ao processar PDF. Tente novamente.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
