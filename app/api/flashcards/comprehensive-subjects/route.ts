import { NextResponse } from "next/server"
import { COMPREHENSIVE_SUBJECTS, getAllCategories } from "@/lib/comprehensive-subjects-data"

// Dados completos dos comprehensive subjects
const comprehensiveSubjectsData = {
  "Ciências Exatas": [
    {
      id: "matematica",
      name: "Matemática",
      category: "Ciências Exatas",
      description: "Álgebra, Geometria, Cálculo, Estatística e Matemática Aplicada",
      icon: "Calculator",
      color: "#3B82F6",
      topics: [
        {
          id: "algebra-linear",
          name: "Álgebra Linear",
          description: "Matrizes, determinantes, sistemas lineares, autovalores e autovetores",
          difficulty_level: 4,
          estimated_cards: 20,
        },
        {
          id: "calculo-diferencial",
          name: "Cálculo Diferencial",
          description: "Limites, derivadas, aplicações de derivadas e otimização",
          difficulty_level: 4,
          estimated_cards: 25,
        },
        {
          id: "geometria-analitica",
          name: "Geometria Analítica",
          description: "Coordenadas, retas, circunferências, cônicas e geometria espacial",
          difficulty_level: 3,
          estimated_cards: 18,
        },
        {
          id: "estatistica",
          name: "Estatística",
          description: "Probabilidade, distribuições, inferência e análise de dados",
          difficulty_level: 3,
          estimated_cards: 22,
        },
        {
          id: "trigonometria",
          name: "Trigonometria",
          description: "Funções trigonométricas, identidades e aplicações",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "matematica-financeira",
          name: "Matemática Financeira",
          description: "Juros, descontos, amortização e análise de investimentos",
          difficulty_level: 2,
          estimated_cards: 12,
        },
        {
          id: "numeros-complexos",
          name: "Números Complexos",
          description: "Operações, forma polar, exponencial e aplicações",
          difficulty_level: 4,
          estimated_cards: 8,
        },
      ],
    },
    {
      id: "fisica",
      name: "Física",
      category: "Ciências Exatas",
      description: "Mecânica, Termodinâmica, Eletromagnetismo, Óptica e Física Moderna",
      icon: "Atom",
      color: "#10B981",
      topics: [
        {
          id: "mecanica-classica",
          name: "Mecânica Clássica",
          description: "Cinemática, dinâmica, trabalho, energia e quantidade de movimento",
          difficulty_level: 3,
          estimated_cards: 25,
        },
        {
          id: "termodinamica",
          name: "Termodinâmica",
          description: "Leis da termodinâmica, máquinas térmicas e entropia",
          difficulty_level: 4,
          estimated_cards: 18,
        },
        {
          id: "eletromagnetismo",
          name: "Eletromagnetismo",
          description: "Eletrostática, magnetismo, indução e ondas eletromagnéticas",
          difficulty_level: 4,
          estimated_cards: 22,
        },
        {
          id: "optica",
          name: "Óptica",
          description: "Reflexão, refração, lentes, espelhos e interferência",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "fisica-moderna",
          name: "Física Moderna",
          description: "Relatividade, física quântica e física nuclear",
          difficulty_level: 5,
          estimated_cards: 12,
        },
        {
          id: "ondas-acustica",
          name: "Ondas e Acústica",
          description: "Movimento ondulatório, som e fenômenos acústicos",
          difficulty_level: 3,
          estimated_cards: 8,
        },
      ],
    },
    {
      id: "quimica",
      name: "Química",
      category: "Ciências Exatas",
      description: "Química Geral, Orgânica, Inorgânica e Físico-Química",
      icon: "Activity",
      color: "#8B5CF6",
      topics: [
        {
          id: "quimica-organica",
          name: "Química Orgânica",
          description: "Hidrocarbonetos, funções orgânicas, reações e mecanismos",
          difficulty_level: 4,
          estimated_cards: 25,
        },
        {
          id: "quimica-inorganica",
          name: "Química Inorgânica",
          description: "Tabela periódica, ligações químicas e compostos inorgânicos",
          difficulty_level: 3,
          estimated_cards: 20,
        },
        {
          id: "fisico-quimica",
          name: "Físico-Química",
          description: "Termoquímica, cinética, equilíbrio e eletroquímica",
          difficulty_level: 4,
          estimated_cards: 22,
        },
        {
          id: "quimica-analitica",
          name: "Química Analítica",
          description: "Análise qualitativa, quantitativa e métodos instrumentais",
          difficulty_level: 4,
          estimated_cards: 15,
        },
        {
          id: "bioquimica",
          name: "Bioquímica",
          description: "Biomoléculas, metabolismo e processos bioquímicos",
          difficulty_level: 4,
          estimated_cards: 8,
        },
      ],
    },
  ],
  "Ciências Humanas": [
    {
      id: "historia",
      name: "História",
      category: "Ciências Humanas",
      description: "História do Brasil, História Geral, Antiga, Medieval, Moderna e Contemporânea",
      icon: "BookOpen",
      color: "#F59E0B",
      topics: [
        {
          id: "historia-brasil",
          name: "História do Brasil",
          description: "Período colonial, imperial, republicano e Brasil contemporâneo",
          difficulty_level: 3,
          estimated_cards: 30,
        },
        {
          id: "historia-geral",
          name: "História Geral",
          description: "Civilizações antigas, revoluções e história mundial",
          difficulty_level: 3,
          estimated_cards: 25,
        },
        {
          id: "historia-antiga",
          name: "História Antiga",
          description: "Mesopotâmia, Egito, Grécia, Roma e civilizações orientais",
          difficulty_level: 3,
          estimated_cards: 20,
        },
        {
          id: "historia-medieval",
          name: "História Medieval",
          description: "Feudalismo, Igreja, Cruzadas e formação dos Estados nacionais",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "historia-moderna",
          name: "História Moderna",
          description: "Renascimento, Reforma, Absolutismo e Iluminismo",
          difficulty_level: 3,
          estimated_cards: 12,
        },
        {
          id: "historia-contemporanea",
          name: "História Contemporânea",
          description: "Revoluções industriais, guerras mundiais e século XX",
          difficulty_level: 3,
          estimated_cards: 8,
        },
      ],
    },
    {
      id: "geografia",
      name: "Geografia",
      category: "Ciências Humanas",
      description: "Geografia Física, Humana, do Brasil e Geopolítica",
      icon: "TrendingUp",
      color: "#06B6D4",
      topics: [
        {
          id: "geografia-fisica",
          name: "Geografia Física",
          description: "Relevo, clima, hidrografia, vegetação e geologia",
          difficulty_level: 3,
          estimated_cards: 20,
        },
        {
          id: "geografia-humana",
          name: "Geografia Humana",
          description: "População, urbanização, migração e geografia econômica",
          difficulty_level: 3,
          estimated_cards: 18,
        },
        {
          id: "geografia-brasil",
          name: "Geografia do Brasil",
          description: "Regiões brasileiras, recursos naturais e economia",
          difficulty_level: 2,
          estimated_cards: 22,
        },
        {
          id: "geopolitica",
          name: "Geopolítica",
          description: "Relações internacionais, blocos econômicos e conflitos",
          difficulty_level: 4,
          estimated_cards: 15,
        },
        {
          id: "cartografia",
          name: "Cartografia",
          description: "Mapas, projeções, coordenadas e interpretação cartográfica",
          difficulty_level: 3,
          estimated_cards: 10,
        },
      ],
    },
    {
      id: "filosofia",
      name: "Filosofia",
      category: "Ciências Humanas",
      description: "História da Filosofia, Ética, Política, Estética e Lógica",
      icon: "User",
      color: "#EF4444",
      topics: [
        {
          id: "filosofia-antiga",
          name: "Filosofia Antiga",
          description: "Pré-socráticos, Sócrates, Platão, Aristóteles e helenismo",
          difficulty_level: 4,
          estimated_cards: 18,
        },
        {
          id: "filosofia-medieval",
          name: "Filosofia Medieval",
          description: "Patrística, Escolástica, Santo Agostinho e São Tomás de Aquino",
          difficulty_level: 4,
          estimated_cards: 12,
        },
        {
          id: "filosofia-moderna",
          name: "Filosofia Moderna",
          description: "Racionalismo, empirismo, Kant e Iluminismo",
          difficulty_level: 4,
          estimated_cards: 15,
        },
        {
          id: "filosofia-contemporanea",
          name: "Filosofia Contemporânea",
          description: "Existencialismo, fenomenologia, filosofia analítica",
          difficulty_level: 5,
          estimated_cards: 15,
        },
        {
          id: "etica-politica",
          name: "Ética e Política",
          description: "Teorias éticas, filosofia política e direitos humanos",
          difficulty_level: 3,
          estimated_cards: 10,
        },
      ],
    },
    {
      id: "sociologia",
      name: "Sociologia",
      category: "Ciências Humanas",
      description: "Teorias Sociológicas, Sociedade, Cultura e Movimentos Sociais",
      icon: "Users",
      color: "#84CC16",
      topics: [
        {
          id: "teorias-sociologicas",
          name: "Teorias Sociológicas",
          description: "Durkheim, Weber, Marx e teorias sociológicas clássicas",
          difficulty_level: 4,
          estimated_cards: 18,
        },
        {
          id: "sociedade-cultura",
          name: "Sociedade e Cultura",
          description: "Socialização, cultura, identidade e diversidade cultural",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "movimentos-sociais",
          name: "Movimentos Sociais",
          description: "Movimentos sociais, cidadania e participação política",
          difficulty_level: 3,
          estimated_cards: 12,
        },
        {
          id: "sociologia-contemporanea",
          name: "Sociologia Contemporânea",
          description: "Globalização, tecnologia, trabalho e sociedade moderna",
          difficulty_level: 4,
          estimated_cards: 15,
        },
      ],
    },
  ],
  "Ciências Biológicas": [
    {
      id: "biologia",
      name: "Biologia",
      category: "Ciências Biológicas",
      description: "Citologia, Genética, Ecologia, Evolução, Anatomia e Fisiologia",
      icon: "Activity",
      color: "#22C55E",
      topics: [
        {
          id: "citologia",
          name: "Citologia",
          description: "Estrutura celular, organelas, metabolismo celular e divisão",
          difficulty_level: 3,
          estimated_cards: 18,
        },
        {
          id: "genetica",
          name: "Genética",
          description: "Hereditariedade, DNA, RNA, mutações e engenharia genética",
          difficulty_level: 4,
          estimated_cards: 20,
        },
        {
          id: "ecologia",
          name: "Ecologia",
          description: "Ecossistemas, cadeias alimentares, ciclos biogeoquímicos",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "evolucao",
          name: "Evolução",
          description: "Teorias evolutivas, seleção natural, especiação",
          difficulty_level: 4,
          estimated_cards: 12,
        },
        {
          id: "anatomia",
          name: "Anatomia",
          description: "Sistemas do corpo humano, órgãos e estruturas",
          difficulty_level: 3,
          estimated_cards: 18,
        },
        {
          id: "fisiologia",
          name: "Fisiologia",
          description: "Funcionamento dos sistemas corporais e homeostase",
          difficulty_level: 4,
          estimated_cards: 15,
        },
        {
          id: "botanica",
          name: "Botânica",
          description: "Morfologia vegetal, fisiologia vegetal e classificação",
          difficulty_level: 3,
          estimated_cards: 7,
        },
      ],
    },
  ],
  Linguagens: [
    {
      id: "portugues",
      name: "Língua Portuguesa",
      category: "Linguagens",
      description: "Gramática, Literatura, Interpretação de Textos e Redação",
      icon: "BookOpen",
      color: "#DC2626",
      topics: [
        {
          id: "gramatica",
          name: "Gramática",
          description: "Morfologia, sintaxe, semântica e fonética",
          difficulty_level: 3,
          estimated_cards: 25,
        },
        {
          id: "literatura",
          name: "Literatura",
          description: "Escolas literárias, autores e obras da literatura brasileira",
          difficulty_level: 3,
          estimated_cards: 20,
        },
        {
          id: "interpretacao-textos",
          name: "Interpretação de Textos",
          description: "Compreensão textual, gêneros textuais e análise crítica",
          difficulty_level: 2,
          estimated_cards: 15,
        },
        {
          id: "redacao",
          name: "Redação",
          description: "Técnicas de escrita, dissertação e gêneros textuais",
          difficulty_level: 3,
          estimated_cards: 12,
        },
        {
          id: "linguistica",
          name: "Linguística",
          description: "Variação linguística, pragmática e análise do discurso",
          difficulty_level: 4,
          estimated_cards: 8,
        },
      ],
    },
    {
      id: "ingles",
      name: "Inglês",
      category: "Linguagens",
      description: "Grammar, Vocabulary, Reading Comprehension and Writing",
      icon: "Code",
      color: "#7C3AED",
      topics: [
        {
          id: "grammar",
          name: "Grammar",
          description: "Tempos verbais, estruturas gramaticais e sintaxe",
          difficulty_level: 3,
          estimated_cards: 20,
        },
        {
          id: "vocabulary",
          name: "Vocabulary",
          description: "Vocabulário geral, expressões idiomáticas e phrasal verbs",
          difficulty_level: 2,
          estimated_cards: 15,
        },
        {
          id: "reading-comprehension",
          name: "Reading Comprehension",
          description: "Interpretação de textos em inglês e estratégias de leitura",
          difficulty_level: 3,
          estimated_cards: 15,
        },
        {
          id: "writing",
          name: "Writing",
          description: "Técnicas de escrita, essays and formal writing",
          difficulty_level: 4,
          estimated_cards: 10,
        },
      ],
    },
  ],
}

export async function GET() {
  try {
    // Group subjects by category
    const subjectsByCategory: { [category: string]: any[] } = {}
    const categories = getAllCategories()

    categories.forEach((category) => {
      const categorySubjects = COMPREHENSIVE_SUBJECTS.filter((subject) => subject.category === category).map(
        (subject) => ({
          ...subject,
          topicCount: subject.topics.length,
          totalEstimatedCards: subject.topics.reduce((sum, topic) => sum + topic.estimated_cards, 0),
        }),
      )

      subjectsByCategory[category] = categorySubjects
    })

    return NextResponse.json({
      success: true,
      subjects: subjectsByCategory,
      categories,
      totalSubjects: COMPREHENSIVE_SUBJECTS.length,
    })
  } catch (error) {
    console.error("Error loading comprehensive subjects:", error)
    return NextResponse.json({ success: false, error: "Failed to load subjects" }, { status: 500 })
  }
}
