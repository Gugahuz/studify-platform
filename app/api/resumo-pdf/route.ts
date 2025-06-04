export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const tipo = (formData.get("tipo") as string) || "conciso"

    if (!file) {
      return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    // Simular extração de texto do PDF
    const textoExtraido = `Texto extraído do PDF: ${file.name}

A transformação digital representa uma mudança fundamental na forma como as organizações operam e entregam valor aos clientes. Este processo envolve a integração de tecnologias digitais em todas as áreas de negócio, resultando em mudanças fundamentais na forma como as empresas operam e como entregam valor aos clientes.

Principais aspectos da transformação digital:

1. Tecnologias Emergentes
- Inteligência Artificial e Machine Learning
- Internet das Coisas (IoT)
- Computação em Nuvem
- Big Data e Analytics
- Automação de Processos

2. Impactos Organizacionais
- Mudança na cultura empresarial
- Novos modelos de negócio
- Melhoria da experiência do cliente
- Otimização de processos internos
- Aumento da eficiência operacional

3. Desafios da Implementação
- Resistência à mudança
- Necessidade de capacitação
- Investimentos em tecnologia
- Segurança de dados
- Integração de sistemas

4. Benefícios Esperados
- Maior competitividade
- Redução de custos
- Melhoria na tomada de decisões
- Inovação acelerada
- Sustentabilidade empresarial

A implementação bem-sucedida da transformação digital requer uma abordagem estratégica que considere não apenas a tecnologia, mas também as pessoas e os processos organizacionais.`

    // Gerar resumo simples baseado no tipo
    let resumo = ""
    if (tipo === "detalhado") {
      resumo = `# Resumo Detalhado - ${file.name}

## Introdução
A transformação digital é um processo abrangente que revoluciona as operações empresariais através da integração de tecnologias avançadas.

## Tecnologias Principais
### Inteligência Artificial
- Machine Learning para análise preditiva
- Automação de processos cognitivos
- Personalização de experiências

### Internet das Coisas (IoT)
- Conectividade entre dispositivos
- Coleta de dados em tempo real
- Monitoramento inteligente

### Computação em Nuvem
- Escalabilidade de recursos
- Redução de custos de infraestrutura
- Acesso remoto e colaboração

## Impactos Organizacionais
A transformação digital gera mudanças profundas na cultura empresarial, exigindo adaptação de processos e capacitação de equipes.

## Conclusão
O sucesso da transformação digital depende de uma abordagem holística que integre tecnologia, pessoas e processos.`
    } else {
      resumo = `Resumo Conciso - ${file.name}

Pontos Principais:

• A transformação digital integra tecnologias avançadas em todas as áreas empresariais
• Principais tecnologias: IA, IoT, Nuvem, Big Data e Automação
• Impactos: mudança cultural, novos modelos de negócio, melhoria da experiência do cliente
• Desafios: resistência à mudança, necessidade de capacitação, investimentos em tecnologia
• Benefícios: maior competitividade, redução de custos, melhoria na tomada de decisões

A implementação requer abordagem estratégica considerando tecnologia, pessoas e processos.`
    }

    return Response.json({
      success: true,
      resumo: resumo,
      textoExtraido: textoExtraido,
      nomeArquivo: file.name,
    })
  } catch (error) {
    return Response.json({ error: "Erro ao processar PDF" }, { status: 500 })
  }
}
