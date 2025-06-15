import { NextResponse } from "next/server"
import type { Subject, Topic } from "@/types/flashcards"

function createTopic(id: string, name: string, description: string, difficulty: number): Topic {
  return { id, name, description, difficulty_level: difficulty }
}

function createSubject(
  id: string,
  name: string,
  category: string,
  color: string,
  description: string,
  topics: Topic[],
): Subject {
  return { id, name, category, color, description, flashcard_topics: topics }
}

function getMockSubjectsWithTopics() {
  const subjectsData = {
    Exatas: [
      createSubject(
        "math",
        "Matemática",
        "Exatas",
        "#3B82F6", // Original color, can be changed
        "Estudo de números, quantidades, espaço, estrutura, e mudança.",
        [
          createTopic("math-algebra", "Álgebra Fundamental", "Equações, inequações, polinômios, funções.", 3),
          createTopic(
            "math-linear-algebra",
            "Álgebra Linear",
            "Vetores, matrizes, sistemas lineares, espaços vetoriais.",
            4,
          ),
          createTopic("math-geometry", "Geometria Plana e Espacial", "Formas, áreas, volumes, teoremas.", 3),
          createTopic("math-trigonometry", "Trigonometria", "Funções trigonométricas, identidades, equações.", 4),
          createTopic("math-calculus1", "Cálculo Diferencial", "Limites, derivadas, aplicações de derivadas.", 4),
          createTopic(
            "math-calculus2",
            "Cálculo Integral",
            "Integrais indefinidas e definidas, técnicas de integração.",
            4,
          ),
          createTopic(
            "math-statistics",
            "Estatística e Probabilidade",
            "Análise de dados, distribuições, inferência.",
            3,
          ),
          createTopic("math-logic", "Lógica Matemática", "Proposições, tabelas verdade, quantificadores.", 2),
          createTopic("math-number-theory", "Teoria dos Números", "Divisibilidade, primos, congruências.", 4),
          createTopic(
            "math-financial",
            "Matemática Financeira",
            "Juros simples e compostos, anuidades, amortização.",
            3,
          ),
        ],
      ),
      createSubject(
        "physics",
        "Física",
        "Exatas",
        "#10B981",
        "Ciência que estuda a natureza e seus fenômenos em seus aspectos mais gerais.",
        [
          createTopic(
            "physics-mechanics",
            "Mecânica Clássica",
            "Leis de Newton, cinemática, dinâmica, trabalho e energia.",
            3,
          ),
          createTopic(
            "physics-thermodynamics",
            "Termodinâmica",
            "Calor, temperatura, leis da termodinâmica, máquinas térmicas.",
            4,
          ),
          createTopic(
            "physics-electromagnetism",
            "Eletromagnetismo",
            "Eletrostática, eletrodinâmica, ondas eletromagnéticas.",
            4,
          ),
          createTopic(
            "physics-optics",
            "Óptica Geométrica e Física",
            "Reflexão, refração, lentes, interferência, difração.",
            3,
          ),
          createTopic("physics-modern", "Física Moderna", "Relatividade, mecânica quântica, física nuclear.", 5),
          createTopic("physics-waves", "Ondulatória", "Tipos de ondas, MHS, som, efeito Doppler.", 3),
          createTopic(
            "physics-fluid-mechanics",
            "Mecânica dos Fluidos",
            "Hidrostática, hidrodinâmica, viscosidade.",
            4,
          ),
          createTopic("physics-astrophysics", "Astrofísica Básica", "Corpos celestes, leis de Kepler, cosmologia.", 3),
        ],
      ),
      createSubject(
        "chemistry",
        "Química",
        "Exatas",
        "#F59E0B",
        "Ciência que estuda a composição, estrutura, propriedades da matéria.",
        [
          createTopic(
            "chemistry-general",
            "Química Geral",
            "Átomos, moléculas, tabela periódica, ligações químicas.",
            2,
          ),
          createTopic("chemistry-inorganic", "Química Inorgânica", "Funções inorgânicas, reações, estequiometria.", 3),
          createTopic("chemistry-organic1", "Química Orgânica I", "Hidrocarbonetos, funções oxigenadas, isomeria.", 4),
          createTopic("chemistry-organic2", "Química Orgânica II", "Funções nitrogenadas, polímeros, biomoléculas.", 4),
          createTopic("chemistry-physical", "Físico-Química", "Termoquímica, cinética química, equilíbrio químico.", 4),
          createTopic(
            "chemistry-analytical",
            "Química Analítica",
            "Técnicas de separação, espectroscopia, titulometria.",
            4,
          ),
          createTopic(
            "chemistry-environmental",
            "Química Ambiental",
            "Ciclos biogeoquímicos, poluição, tratamento.",
            3,
          ),
          createTopic("chemistry-electrochemistry", "Eletroquímica", "Pilhas, eletrólise, corrosão.", 4),
        ],
      ),
    ],
    Biológicas: [
      createSubject(
        "biology",
        "Biologia",
        "Biológicas",
        "#EF4444",
        "Ciência que estuda a vida em suas variadas formas e níveis de organização.",
        [
          createTopic(
            "biology-cytology",
            "Citologia",
            "Células procarióticas e eucarióticas, organelas, metabolismo celular.",
            3,
          ),
          createTopic(
            "biology-genetics",
            "Genética e Hereditariedade",
            "Leis de Mendel, DNA, RNA, mutações, engenharia genética.",
            4,
          ),
          createTopic("biology-evolution", "Evolução", "Teorias evolutivas, seleção natural, especiação.", 4),
          createTopic(
            "biology-ecology",
            "Ecologia",
            "Ecossistemas, cadeias alimentares, ciclos biogeoquímicos, poluição.",
            3,
          ),
          createTopic(
            "biology-botany",
            "Botânica",
            "Classificação vegetal, fisiologia vegetal, reprodução das plantas.",
            3,
          ),
          createTopic(
            "biology-zoology",
            "Zoologia",
            "Classificação animal, fisiologia comparada, diversidade animal.",
            3,
          ),
          createTopic(
            "biology-human-physiology",
            "Fisiologia Humana",
            "Sistemas do corpo humano (digestório, nervoso, etc.).",
            4,
          ),
          createTopic(
            "biology-microbiology",
            "Microbiologia",
            "Vírus, bactérias, fungos, protozoários, importância e doenças.",
            3,
          ),
          createTopic(
            "biology-biochemistry",
            "Bioquímica",
            "Proteínas, carboidratos, lipídios, enzimas, metabolismo.",
            4,
          ),
        ],
      ),
    ],
    Humanas: [
      createSubject(
        "history",
        "História",
        "Humanas",
        "#8B5CF6",
        "Estudo das ações humanas ao longo do tempo e do espaço.",
        [
          createTopic("history-ancient", "História Antiga", "Egito, Grécia, Roma, Mesopotâmia.", 3),
          createTopic(
            "history-medieval",
            "História Medieval",
            "Feudalismo, Cruzadas, Império Bizantino, Islamismo.",
            3,
          ),
          createTopic(
            "history-modern",
            "História Moderna",
            "Renascimento, Reformas Religiosas, Absolutismo, Iluminismo.",
            4,
          ),
          createTopic(
            "history-contemporary",
            "História Contemporânea",
            "Revolução Francesa, Guerras Mundiais, Guerra Fria.",
            4,
          ),
          createTopic(
            "history-brazil-colonial",
            "História do Brasil Colonial",
            "Descobrimento, capitanias, economia açucareira.",
            3,
          ),
          createTopic(
            "history-brazil-empire",
            "História do Brasil Império",
            "Independência, Reinados, Crise do Império.",
            3,
          ),
          createTopic(
            "history-brazil-republic",
            "História do Brasil República",
            "República Velha, Era Vargas, Ditadura, Nova República.",
            4,
          ),
        ],
      ),
      createSubject(
        "geography",
        "Geografia",
        "Humanas",
        "#06B6D4",
        "Ciência que estuda o espaço geográfico, a superfície terrestre e suas relações.",
        [
          createTopic("geography-physical", "Geografia Física", "Relevo, clima, vegetação, hidrografia.", 3),
          createTopic("geography-human", "Geografia Humana", "População, urbanização, migrações, cultura.", 3),
          createTopic(
            "geography-economic",
            "Geografia Econômica",
            "Agricultura, indústria, comércio, globalização.",
            4,
          ),
          createTopic(
            "geography-brazil",
            "Geografia do Brasil",
            "Aspectos físicos, humanos e econômicos do Brasil.",
            3,
          ),
          createTopic("geography-world", "Geografia Mundial", "Continentes, países, questões geopolíticas.", 4),
          createTopic("geography-cartography", "Cartografia", "Mapas, escalas, projeções, geotecnologias.", 2),
          createTopic(
            "geography-environmental",
            "Questões Ambientais",
            "Desmatamento, aquecimento global, sustentabilidade.",
            3,
          ),
        ],
      ),
      createSubject(
        "philosophy",
        "Filosofia",
        "Humanas",
        "#A855F7",
        "Busca do conhecimento da realidade através da razão e da lógica.",
        [
          createTopic("philosophy-ancient", "Filosofia Antiga", "Pré-socráticos, Sócrates, Platão, Aristóteles.", 4),
          createTopic(
            "philosophy-medieval",
            "Filosofia Medieval",
            "Patrística, Escolástica, Santo Agostinho, Tomás de Aquino.",
            3,
          ),
          createTopic("philosophy-modern", "Filosofia Moderna", "Racionalismo, Empirismo, Kant, Iluminismo.", 4),
          createTopic(
            "philosophy-contemporary",
            "Filosofia Contemporânea",
            "Existencialismo, Fenomenologia, Escola de Frankfurt.",
            4,
          ),
          createTopic("philosophy-ethics", "Ética e Moral", "Teorias éticas, dilemas morais, bioética.", 3),
          createTopic(
            "philosophy-politics",
            "Filosofia Política",
            "Contratualismo, democracia, teorias de justiça.",
            4,
          ),
          createTopic(
            "philosophy-epistemology",
            "Teoria do Conhecimento",
            "Origens e limites do conhecimento, verdade.",
            4,
          ),
        ],
      ),
      createSubject(
        "sociology",
        "Sociologia",
        "Humanas",
        "#84CC16",
        "Estudo científico da sociedade, suas estruturas e relações.",
        [
          createTopic("sociology-classical", "Sociologia Clássica", "Comte, Durkheim, Weber, Marx.", 4),
          createTopic(
            "sociology-contemporary",
            "Sociologia Contemporânea",
            "Globalização, pós-modernidade, movimentos sociais.",
            4,
          ),
          createTopic(
            "sociology-culture",
            "Cultura e Sociedade",
            "Indústria cultural, identidade, diversidade cultural.",
            3,
          ),
          createTopic("sociology-work", "Sociologia do Trabalho", "Taylorismo, Fordismo, reestruturação produtiva.", 3),
          createTopic("sociology-politics", "Sociologia Política", "Estado, poder, democracia, cidadania.", 3),
          createTopic(
            "sociology-brazil",
            "Sociologia Brasileira",
            "Formação social, desigualdade, questões raciais.",
            4,
          ),
        ],
      ),
    ],
    Linguagens: [
      createSubject(
        "portuguese",
        "Português",
        "Linguagens",
        "#EC4899",
        "Estudo da língua portuguesa e suas manifestações literárias.",
        [
          createTopic("portuguese-grammar", "Gramática Normativa", "Morfologia, sintaxe, fonologia, semântica.", 3),
          createTopic(
            "portuguese-interpretation",
            "Interpretação de Texto",
            "Compreensão textual, inferência, tipos textuais.",
            3,
          ),
          createTopic(
            "portuguese-literature-brazil",
            "Literatura Brasileira",
            "Escolas literárias, autores, obras.",
            4,
          ),
          createTopic(
            "portuguese-literature-portugal",
            "Literatura Portuguesa",
            "Trovadorismo, Camões, Eça de Queiroz.",
            4,
          ),
          createTopic(
            "portuguese-writing",
            "Redação e Produção Textual",
            "Argumentação, coesão, coerência, gêneros.",
            3,
          ),
          createTopic(
            "portuguese-linguistics",
            "Linguística Aplicada",
            "Variação linguística, pragmática, análise do discurso.",
            4,
          ),
        ],
      ),
      createSubject(
        "english",
        "Inglês",
        "Linguagens",
        "#F97316",
        "Estudo da língua inglesa para comunicação e acesso a informações.",
        [
          createTopic("english-grammar1", "Gramática Básica", "Verbo 'to be', tempos presentes, artigos.", 2),
          createTopic(
            "english-grammar2",
            "Gramática Intermediária",
            "Tempos passados e futuros, modais, condicionais.",
            3,
          ),
          createTopic(
            "english-vocabulary",
            "Vocabulário Essencial",
            "Palavras comuns, falsos cognatos, expressões idiomáticas.",
            3,
          ),
          createTopic("english-reading", "Interpretação de Textos em Inglês", "Skimming, scanning, inferência.", 3),
          createTopic("english-listening", "Compreensão Auditiva", "Entender diálogos, palestras, notícias.", 4),
        ],
      ),
    ],
  }
  return subjectsData
}

export async function GET() {
  // Simulating a delay and potential error for robustness testing
  // await new Promise(resolve => setTimeout(resolve, 500));
  // if (Math.random() < 0.1) {
  //   return NextResponse.json({ error: "Falha simulada ao buscar matérias" }, { status: 500 });
  // }
  const subjectsWithTopics = getMockSubjectsWithTopics()
  return NextResponse.json(subjectsWithTopics)
}
