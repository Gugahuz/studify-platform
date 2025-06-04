export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const tipo = (formData.get("tipo") as string) || "conciso"

    if (!file) {
      return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Apenas arquivos PDF são suportados" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Arquivo deve ter no máximo 10MB" }, { status: 400 })
    }

    // Simular extração de texto do PDF
    const textoExtraido = `Conteúdo extraído do PDF: ${file.name}

A Indústria 4.0, também conhecida como a quarta revolução industrial, representa uma transformação fundamental na forma como produzimos e gerenciamos produtos e serviços. Esta revolução é caracterizada pela integração de tecnologias digitais avançadas nos processos de manufatura e produção.

Os principais pilares da Indústria 4.0 incluem:

1. Internet das Coisas (IoT): Conectividade entre dispositivos e máquinas
2. Inteligência Artificial: Sistemas capazes de aprender e tomar decisões
3. Big Data e Analytics: Análise de grandes volumes de dados para insights
4. Computação em Nuvem: Armazenamento e processamento distribuído
5. Robótica Avançada: Automação inteligente de processos
6. Realidade Aumentada: Sobreposição de informações digitais ao mundo real

Benefícios da Implementação:
- Maior eficiência operacional
- Redução de custos de produção
- Melhoria na qualidade dos produtos
- Personalização em massa
- Manutenção preditiva
- Sustentabilidade ambiental

Desafios e Considerações:
- Necessidade de investimento em tecnologia
- Capacitação da força de trabalho
- Segurança cibernética
- Integração de sistemas legados
- Mudanças organizacionais

A implementação bem-sucedida da Indústria 4.0 requer uma abordagem estratégica que considere não apenas a tecnologia, mas também os aspectos humanos e organizacionais da transformação digital.`

    // Gerar resumo usando OpenAI
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Configuração da API não encontrada" }, { status: 500 })
    }

    const prompt =
      tipo === "detalhado"
        ? `Crie um resumo detalhado e bem estruturado do seguinte texto, organizando as informações em tópicos claros e hierárquicos com subtítulos:\n\n${textoExtraido}`
        : `Crie um resumo conciso destacando apenas os pontos principais e mais importantes do seguinte texto:\n\n${textoExtraido}`

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
            content: "Você é um assistente especializado em criar resumos claros e bem estruturados.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error("Erro da OpenAI:", errorData)
      return Response.json({ error: "Erro ao gerar resumo" }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()

    if (!openaiData.choices?.[0]?.message?.content) {
      return Response.json({ error: "Resposta inválida da API" }, { status: 500 })
    }

    const resumo = openaiData.choices[0].message.content.trim()

    return Response.json({
      success: true,
      resumo: resumo,
      textoExtraido: textoExtraido,
      nomeArquivo: file.name,
    })
  } catch (error) {
    console.error("Erro ao processar PDF:", error)
    return Response.json(
      {
        error: "Erro interno ao processar PDF. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
