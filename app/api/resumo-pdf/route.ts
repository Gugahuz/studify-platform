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
    const textoExtraido = `Texto extraído do PDF: ${file.name}

Este é um exemplo de texto que seria extraído do PDF enviado. Em uma implementação real, você usaria uma biblioteca como pdf-parse para extrair o texto real do documento PDF.

O arquivo ${file.name} foi processado com sucesso e o texto foi extraído para gerar o resumo solicitado.

A Indústria 4.0, originada como parte de uma estratégia de alta tecnologia do governo alemão, representa a quarta revolução industrial. Ela incorpora avanços tecnológicos significativos, que têm transformado a maneira como as fábricas operam, criando o conceito de "Fábricas Inteligentes". Essas fábricas, através da automação e interconexão digital, combinam o mundo físico, digital e biológico, permitindo um monitoramento em tempo real e tomadas de decisão descentralizadas e eficazes.

Os principais componentes da Indústria 4.0, conforme destacado pelos pesquisadores Hermann, Pentek e Otto (2015), incluem Sistemas Ciber-Físicos, a Internet das Coisas (IoT), Internet dos Serviços (IoS) e as próprias Fábricas Inteligentes. Os Sistemas Ciber-Físicos integram computação e processos físicos para adaptar-se a novas condições em tempo real. A Internet das Coisas refere-se à conexão de dispositivos através da internet, facilitando a coleta e compartilhamento de dados.`

    // Gerar resumo diretamente usando a lógica da OpenAI
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("Chave da API OpenAI não configurada")
    }

    const prompt =
      tipo === "detalhado"
        ? `Crie um resumo detalhado e estruturado do seguinte texto, organizando as informações em tópicos claros e hierárquicos:\n\n${textoExtraido}`
        : `Crie um resumo conciso destacando apenas os pontos principais do seguinte texto:\n\n${textoExtraido}`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro da API OpenAI: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Resposta inválida da API OpenAI")
    }

    const resumo = data.choices[0].message.content

    return Response.json({
      resumo: resumo,
      textoExtraido: textoExtraido,
    })
  } catch (error) {
    console.error("Erro ao processar PDF:", error)
    return Response.json(
      {
        error: "Erro ao processar PDF. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
