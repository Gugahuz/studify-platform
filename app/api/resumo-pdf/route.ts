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

A transformação digital representa uma mudança fundamental na forma como as organizações operam e entregam valor aos clientes. Este processo envolve a integração de tecnologias digitais em todas as áreas de negócio, resultando em mudanças fundamentais na forma como as empresas operam e como entregam valor aos clientes.

A transformação digital não se trata apenas de implementar novas tecnologias, mas sim de repensar completamente os modelos de negócio, processos organizacionais e a experiência do cliente. É uma jornada que exige mudanças culturais profundas e uma nova mentalidade empresarial.

As principais tecnologias que impulsionam essa transformação incluem a Inteligência Artificial e Machine Learning, que permitem automação inteligente e análise preditiva; a Internet das Coisas (IoT), que conecta dispositivos e gera dados em tempo real; a Computação em Nuvem, que oferece escalabilidade e flexibilidade; Big Data e Analytics, que transformam dados em insights estratégicos; e a Automação de Processos Robóticos (RPA), que otimiza operações repetitivas.

Os impactos organizacionais são significativos e abrangem múltiplas dimensões. A cultura empresarial precisa evoluir para abraçar a inovação e a experimentação. Novos modelos de negócio emergem, baseados em plataformas digitais e ecossistemas colaborativos. A experiência do cliente é revolucionada através de interfaces digitais personalizadas e jornadas omnichannel. Os processos internos são otimizados através da automação e digitalização, resultando em maior eficiência operacional.

Os principais desafios incluem a resistência à mudança por parte dos colaboradores, que pode ser superada através de programas de capacitação e comunicação efetiva. A necessidade de investimentos significativos em tecnologia e infraestrutura representa outro obstáculo importante. A integração de sistemas legados com novas tecnologias pode ser complexa e demorada. Questões de segurança de dados e privacidade tornam-se críticas em um ambiente cada vez mais conectado.

Por outro lado, os benefícios são substanciais. A competitividade no mercado aumenta significativamente através da capacidade de responder rapidamente às mudanças. A redução de custos operacionais é alcançada através da automação e otimização de processos. A melhoria na tomada de decisões resulta do acesso a dados em tempo real e analytics avançados. A inovação é acelerada através de metodologias ágeis e experimentação contínua. A sustentabilidade empresarial é fortalecida através de operações mais eficientes e modelos de negócio adaptativos.

A implementação bem-sucedida da transformação digital requer uma abordagem estratégica e holística. É fundamental estabelecer uma visão clara e objetivos mensuráveis que orientem todo o processo. O envolvimento da liderança em todos os níveis é crucial para garantir o apoio necessário e superar resistências. Investir na capacitação das equipes é essencial para desenvolver as competências digitais necessárias. Adotar uma abordagem gradual e iterativa permite aprender com os erros e ajustar a estratégia conforme necessário. Estabelecer métricas de acompanhamento garante que o progresso seja monitorado e os resultados sejam mensurados.

Em conclusão, a transformação digital é mais do que uma tendência tecnológica; é uma necessidade estratégica para a sobrevivência e prosperidade das organizações no século XXI. Aquelas que conseguirem navegar com sucesso por esta transformação estarão melhor posicionadas para enfrentar os desafios futuros e aproveitar as oportunidades emergentes no mercado digital globalizado.`

    // Gerar resumo usando OpenAI
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Configuração da API não encontrada" }, { status: 500 })
    }

    const prompt =
      tipo === "detalhado"
        ? `Crie um resumo detalhado e bem estruturado do seguinte texto. Organize as informações em seções claras com títulos e subtópicos. Mantenha a estrutura hierárquica e inclua os pontos mais importantes de cada seção. Use formatação em markdown quando apropriado:

${textoExtraido}`
        : `Crie um resumo conciso e objetivo do seguinte texto, destacando apenas os pontos principais e mais relevantes. Use uma linguagem clara e direta. Organize em tópicos quando necessário:

${textoExtraido}`

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
              "Você é um assistente especializado em criar resumos claros, bem estruturados e informativos. Sempre organize o conteúdo de forma lógica e use formatação adequada. Não inclua títulos com nomes de arquivos no resumo.",
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
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
    console.error("Error processing PDF:", error)
    return Response.json({ error: "Erro interno ao processar PDF" }, { status: 500 })
  }
}
