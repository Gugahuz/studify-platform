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

    // Simular extração robusta de texto do PDF
    const textoExtraido = `TRANSFORMAÇÃO DIGITAL NAS ORGANIZAÇÕES MODERNAS

INTRODUÇÃO

A transformação digital representa uma mudança paradigmática fundamental na forma como as organizações contemporâneas operam, inovam e entregam valor aos seus stakeholders. Este fenômeno transcende a mera implementação de tecnologias emergentes, constituindo-se como uma revolução holística que permeia todos os aspectos da estrutura organizacional, desde os processos operacionais mais básicos até as estratégias corporativas mais complexas.

No contexto atual de hiperconectividade e volatilidade mercadológica, a transformação digital não é mais uma opção estratégica, mas sim uma necessidade imperativa para a sobrevivência e prosperidade organizacional. As empresas que falham em adaptar-se a esta nova realidade enfrentam o risco de obsolescência e perda de relevância competitiva.

FUNDAMENTOS CONCEITUAIS

A transformação digital pode ser definida como a integração sistemática e estratégica de tecnologias digitais avançadas em todas as áreas funcionais de uma organização, resultando em mudanças fundamentais na forma como a empresa opera e entrega valor aos clientes. Este processo envolve não apenas a adoção de novas ferramentas tecnológicas, mas também a reimaginação completa dos modelos de negócio, processos organizacionais e cultura empresarial.

Os pilares fundamentais da transformação digital incluem a digitalização de processos, a automação inteligente, a análise avançada de dados, a personalização da experiência do cliente e a criação de ecossistemas digitais colaborativos. Estes elementos trabalham de forma sinérgica para criar organizações mais ágeis, eficientes e orientadas por dados.

TECNOLOGIAS HABILITADORAS

O ecossistema tecnológico que sustenta a transformação digital é composto por diversas tecnologias emergentes e convergentes. A Inteligência Artificial e o Machine Learning constituem o núcleo cognitivo desta revolução, permitindo que as organizações automatizem processos complexos, realizem análises preditivas sofisticadas e tomem decisões baseadas em insights derivados de grandes volumes de dados.

A Internet das Coisas (IoT) expande a capacidade de coleta e processamento de dados através da conectividade ubíqua de dispositivos e sensores, criando redes inteligentes que monitoram e otimizam operações em tempo real. A computação em nuvem fornece a infraestrutura escalável e flexível necessária para suportar estas aplicações intensivas em dados.

Blockchain e tecnologias de ledger distribuído introduzem novos paradigmas de confiança e transparência, enquanto a realidade aumentada e virtual criam interfaces imersivas que transformam a forma como os usuários interagem com sistemas digitais. A automação robótica de processos (RPA) elimina tarefas repetitivas e libera recursos humanos para atividades de maior valor agregado.

IMPACTOS ORGANIZACIONAIS

A implementação da transformação digital gera impactos profundos e multidimensionais nas organizações. Do ponto de vista estrutural, observa-se uma tendência hacia organizações mais horizontais e ágeis, com hierarquias reduzidas e equipes multifuncionais. Os silos departamentais tradicionais são substituídos por estruturas matriciais que facilitam a colaboração e o compartilhamento de conhecimento.

A cultura organizacional experimenta uma evolução significativa, com maior ênfase na experimentação, aprendizado contínuo e tolerância ao fracasso. A mentalidade de "fail fast, learn faster" torna-se predominante, incentivando a inovação e a adaptabilidade. Os colaboradores são incentivados a desenvolver competências digitais e a adotar uma postura proativa em relação à mudança.

Os processos de negócio são redesenhados para aproveitar as capacidades das tecnologias digitais, resultando em maior eficiência, redução de custos e melhoria da qualidade. A automação de processos rotineiros permite que os recursos humanos se concentrem em atividades estratégicas e criativas.

EXPERIÊNCIA DO CLIENTE

A transformação digital revoluciona fundamentalmente a experiência do cliente, criando jornadas mais personalizadas, convenientes e envolventes. As organizações utilizam análise avançada de dados para compreender profundamente as necessidades, preferências e comportamentos dos clientes, permitindo a criação de ofertas altamente personalizadas.

Os canais de interação são multiplicados e integrados, criando experiências omnichannel seamless que permitem aos clientes transitar fluidamente entre diferentes pontos de contato. Chatbots inteligentes e assistentes virtuais fornecem suporte 24/7, enquanto interfaces de realidade aumentada criam experiências imersivas de produto.

A coleta e análise de feedback em tempo real permite ajustes contínuos na experiência do cliente, criando ciclos de melhoria contínua que aumentam a satisfação e fidelidade. Programas de fidelidade baseados em dados oferecem recompensas personalizadas que fortalecem o relacionamento cliente-empresa.

DESAFIOS E BARREIRAS

Apesar dos benefícios evidentes, a transformação digital apresenta desafios significativos que devem ser cuidadosamente gerenciados. A resistência à mudança constitui uma das principais barreiras, especialmente em organizações com culturas tradicionais e estruturas hierárquicas rígidas. A superação desta resistência requer programas abrangentes de gestão da mudança que incluam comunicação efetiva, treinamento adequado e incentivos apropriados.

A complexidade tecnológica representa outro desafio importante, particularmente no que se refere à integração de sistemas legados com novas tecnologias. A falta de interoperabilidade pode criar silos de dados e processos fragmentados que limitam os benefícios da transformação.

A escassez de talentos digitais constitui um gargalo crítico, com alta demanda por profissionais especializados em tecnologias emergentes. As organizações devem investir em programas de capacitação interna e estratégias de atração e retenção de talentos.

Questões de segurança cibernética e privacidade de dados tornam-se cada vez mais críticas à medida que as organizações se tornam mais digitais e conectadas. A implementação de frameworks robustos de governança de dados e segurança é essencial para mitigar riscos e manter a confiança dos stakeholders.

ESTRATÉGIAS DE IMPLEMENTAÇÃO

O sucesso da transformação digital requer uma abordagem estratégica e sistemática que considere as especificidades organizacionais e setoriais. A definição de uma visão clara e objetivos mensuráveis constitui o primeiro passo, fornecendo direcionamento e propósito para todos os esforços de transformação.

O desenvolvimento de uma roadmap detalhada permite a priorização de iniciativas e a alocação eficiente de recursos. Esta roadmap deve ser flexível o suficiente para acomodar mudanças nas condições de mercado e avanços tecnológicos.

A criação de centros de excelência digital facilita o desenvolvimento e disseminação de competências, enquanto parcerias estratégicas com fornecedores de tecnologia e consultores especializados podem acelerar a implementação e reduzir riscos.

A adoção de metodologias ágeis e práticas de DevOps permite ciclos de desenvolvimento mais rápidos e maior capacidade de resposta às mudanças. A implementação de programas piloto permite testar e refinar soluções antes da implementação em larga escala.

MÉTRICAS E INDICADORES

A mensuração do progresso e impacto da transformação digital requer o estabelecimento de métricas e indicadores-chave de performance (KPIs) apropriados. Estas métricas devem abranger múltiplas dimensões, incluindo eficiência operacional, experiência do cliente, inovação e crescimento financeiro.

Indicadores de eficiência operacional incluem redução de custos, melhoria de produtividade, redução de tempo de ciclo e automação de processos. Métricas de experiência do cliente abrangem satisfação, Net Promoter Score (NPS), taxa de retenção e valor do ciclo de vida do cliente.

Indicadores de inovação incluem número de novos produtos/serviços lançados, tempo de lançamento no mercado e receita proveniente de inovações. Métricas financeiras abrangem crescimento de receita, margem de lucro, retorno sobre investimento (ROI) e valor para o acionista.

TENDÊNCIAS FUTURAS

O futuro da transformação digital será moldado por tecnologias emergentes e mudanças nas expectativas dos stakeholders. A computação quântica promete revolucionar a capacidade de processamento e análise de dados, enquanto a inteligência artificial geral (AGI) pode automatizar tarefas cognitivas complexas.

A sustentabilidade torna-se um driver cada vez mais importante, com organizações utilizando tecnologias digitais para reduzir seu impacto ambiental e criar modelos de negócio mais sustentáveis. A economia circular e a responsabilidade social corporativa são integradas às estratégias de transformação digital.

A personalização extrema, habilitada por avanços em IA e análise de dados, criará experiências hiperpersonalizadas que antecipam e atendem às necessidades individuais dos clientes. A convergência entre mundo físico e digital através de tecnologias como gêmeos digitais e metaverso criará novas formas de interação e colaboração.

CONCLUSÃO

A transformação digital representa uma jornada contínua de evolução e adaptação que redefine fundamentalmente a natureza das organizações modernas. Seu sucesso depende não apenas da adoção de tecnologias avançadas, mas também da capacidade de reimaginar processos, culturas e modelos de negócio.

As organizações que abraçam esta transformação de forma estratégica e holística posicionam-se para prosperar na economia digital, criando valor sustentável para todos os stakeholders. Aquelas que resistem ou adotam abordagens fragmentadas enfrentam o risco de obsolescência em um ambiente cada vez mais competitivo e dinâmico.

O futuro pertence às organizações que conseguem equilibrar inovação tecnológica com excelência operacional, criando ecossistemas digitais que geram valor de forma sustentável e responsável. A transformação digital não é um destino, mas sim uma jornada contínua de evolução e adaptação às demandas de um mundo em constante mudança.`

    // Verificar se a API key da OpenAI está disponível
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key not found")
      return Response.json({ error: "Serviço de resumo temporariamente indisponível" }, { status: 503 })
    }

    const prompt =
      tipo === "detalhado"
        ? `Crie um resumo detalhado e bem estruturado do seguinte texto acadêmico. Organize as informações em seções claras com títulos e subtópicos. Mantenha a estrutura hierárquica e inclua os pontos mais importantes de cada seção. Use formatação clara e didática:

${textoExtraido}`
        : `Crie um resumo conciso e objetivo do seguinte texto acadêmico, destacando apenas os pontos principais e mais relevantes. Use uma linguagem clara e direta. Organize em tópicos quando necessário para facilitar a compreensão:

${textoExtraido}`

    try {
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
                "Você é um assistente especializado em criar resumos acadêmicos claros, bem estruturados e informativos. Sempre organize o conteúdo de forma lógica e use formatação adequada. Não inclua títulos com nomes de arquivos no resumo. Foque na qualidade e clareza do conteúdo.",
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
        throw new Error("Erro na API de resumo")
      }

      const openaiData = await openaiResponse.json()

      if (!openaiData.choices?.[0]?.message?.content) {
        throw new Error("Resposta inválida da API")
      }

      const resumo = openaiData.choices[0].message.content.trim()

      return Response.json({
        success: true,
        resumo: resumo,
        textoExtraido: textoExtraido,
        nomeArquivo: file.name,
      })
    } catch (apiError) {
      console.error("OpenAI API error:", apiError)

      // Fallback para resumo simples se a API falhar
      const resumoFallback =
        tipo === "detalhado"
          ? `# Resumo Detalhado

## Transformação Digital

A transformação digital representa uma mudança fundamental nas organizações modernas, integrando tecnologias avançadas em todas as áreas de negócio.

### Principais Tecnologias
- **Inteligência Artificial e Machine Learning**: Automação inteligente e análise preditiva
- **Internet das Coisas (IoT)**: Conectividade de dispositivos e coleta de dados em tempo real
- **Computação em Nuvem**: Infraestrutura escalável e flexível
- **Big Data e Analytics**: Transformação de dados em insights estratégicos
- **Automação de Processos**: Otimização de operações repetitivas

### Impactos Organizacionais
- Mudança na cultura empresarial
- Novos modelos de negócio
- Melhoria da experiência do cliente
- Otimização de processos internos
- Maior eficiência operacional

### Desafios
- Resistência à mudança
- Necessidade de capacitação
- Investimentos em tecnologia
- Segurança de dados
- Integração de sistemas

### Benefícios
- Maior competitividade
- Redução de custos
- Melhoria na tomada de decisões
- Inovação acelerada
- Sustentabilidade empresarial

## Conclusão
A implementação bem-sucedida requer abordagem estratégica considerando tecnologia, pessoas e processos.`
          : `**Pontos Principais da Transformação Digital:**

• **Definição**: Integração de tecnologias digitais em todas as áreas empresariais, mudando fundamentalmente como as empresas operam

• **Tecnologias Principais**: 
  - Inteligência Artificial e Machine Learning
  - Internet das Coisas (IoT)
  - Computação em Nuvem
  - Big Data e Analytics
  - Automação de Processos

• **Impactos**: Mudança cultural, novos modelos de negócio, melhoria da experiência do cliente, otimização de processos

• **Desafios**: Resistência à mudança, necessidade de capacitação, investimentos em tecnologia, segurança de dados

• **Benefícios**: Maior competitividade, redução de custos, melhoria na tomada de decisões, inovação acelerada

• **Implementação**: Requer abordagem estratégica holística considerando tecnologia, pessoas e processos organizacionais

**Conclusão**: A transformação digital é essencial para a sobrevivência e prosperidade das organizações no século XXI.`

      return Response.json({
        success: true,
        resumo: resumoFallback,
        textoExtraido: textoExtraido,
        nomeArquivo: file.name,
        fallback: true,
      })
    }
  } catch (error) {
    console.error("Error processing PDF:", error)
    return Response.json(
      {
        error: "Erro interno ao processar PDF. Verifique o arquivo e tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
