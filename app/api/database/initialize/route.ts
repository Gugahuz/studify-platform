import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🚀 Inicializando sistema de flashcards...")

    // Verificar se as tabelas existem tentando fazer uma consulta simples
    const { data: existingSubjects, error: checkError } = await supabase
      .from("flashcard_subjects")
      .select("id")
      .limit(1)

    if (checkError) {
      console.log("⚠️ Tabelas não encontradas. Execute o script SQL no Supabase primeiro.")
      return NextResponse.json(
        {
          success: false,
          error: "Tabelas não encontradas. Execute o script SQL no Supabase primeiro.",
          needsSetup: true,
        },
        { status: 400 },
      )
    }

    // Se chegou aqui, as tabelas existem, vamos popular os dados
    await populateInitialData()

    console.log("✅ Sistema de flashcards inicializado com sucesso")
    return NextResponse.json({ success: true, message: "Sistema inicializado com sucesso" })
  } catch (error) {
    console.error("❌ Erro na inicialização:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Falha na inicialização. Verifique se as tabelas foram criadas no Supabase.",
        needsSetup: true,
      },
      { status: 500 },
    )
  }
}

async function populateInitialData() {
  try {
    console.log("📚 Verificando e populando dados iniciais...")

    // Verificar se já existem dados
    const { data: existingSubjects, error: checkError } = await supabase
      .from("flashcard_subjects")
      .select("id")
      .limit(1)

    if (checkError) {
      throw new Error("Erro ao verificar dados existentes")
    }

    if (existingSubjects && existingSubjects.length > 0) {
      console.log("✅ Dados já existem, pulando inicialização")
      return
    }

    console.log("📝 Inserindo matérias...")
    // Inserir matérias
    const { data: subjects, error: subjectsError } = await supabase
      .from("flashcard_subjects")
      .insert([
        {
          name: "Matemática",
          category: "Vestibular",
          description: "Álgebra, Geometria, Trigonometria e Análise",
          icon: "Calculator",
          color: "#3B82F6",
        },
        {
          name: "Física",
          category: "Vestibular",
          description: "Mecânica, Termodinâmica, Eletromagnetismo e Óptica",
          icon: "Zap",
          color: "#8B5CF6",
        },
        {
          name: "Química",
          category: "Vestibular",
          description: "Química Geral, Orgânica e Inorgânica",
          icon: "Flask",
          color: "#10B981",
        },
        {
          name: "Biologia",
          category: "Vestibular",
          description: "Citologia, Genética, Ecologia e Evolução",
          icon: "Leaf",
          color: "#059669",
        },
        {
          name: "História",
          category: "Vestibular",
          description: "História do Brasil e História Geral",
          icon: "Clock",
          color: "#DC2626",
        },
        {
          name: "Geografia",
          category: "Vestibular",
          description: "Geografia Física e Humana",
          icon: "Globe",
          color: "#2563EB",
        },
        {
          name: "Português",
          category: "Vestibular",
          description: "Gramática, Literatura e Redação",
          icon: "BookOpen",
          color: "#7C3AED",
        },
        {
          name: "Literatura",
          category: "Vestibular",
          description: "Literatura Brasileira e Portuguesa",
          icon: "Book",
          color: "#BE185D",
        },
        {
          name: "Inglês",
          category: "Vestibular",
          description: "Gramática, Vocabulário e Interpretação",
          icon: "Languages",
          color: "#0891B2",
        },
        {
          name: "Filosofia",
          category: "Vestibular",
          description: "História da Filosofia e Pensamento Crítico",
          icon: "Brain",
          color: "#7C2D12",
        },
        {
          name: "Sociologia",
          category: "Vestibular",
          description: "Teorias Sociológicas e Sociedade Contemporânea",
          icon: "Users",
          color: "#1F2937",
        },
        {
          name: "Cálculo I",
          category: "Ensino Superior",
          description: "Limites, Derivadas e Integrais",
          icon: "TrendingUp",
          color: "#3B82F6",
        },
        {
          name: "Algoritmos",
          category: "Ensino Superior",
          description: "Estruturas de Dados e Complexidade",
          icon: "Code",
          color: "#10B981",
        },
        {
          name: "Programação",
          category: "Ensino Superior",
          description: "Linguagens e Paradigmas de Programação",
          icon: "Terminal",
          color: "#059669",
        },
      ])
      .select()

    if (subjectsError) {
      console.error("❌ Erro ao inserir matérias:", subjectsError)
      throw subjectsError
    }

    console.log("✅ Matérias inseridas:", subjects?.length)

    // Inserir tópicos para Matemática
    const mathSubject = subjects?.find((s) => s.name === "Matemática")
    if (mathSubject) {
      console.log("📝 Inserindo tópicos de Matemática...")
      const { data: mathTopics, error: mathTopicsError } = await supabase
        .from("flashcard_topics")
        .insert([
          {
            subject_id: mathSubject.id,
            name: "Álgebra Básica",
            description: "Equações e inequações do 1º e 2º grau",
            difficulty_level: 2,
          },
          {
            subject_id: mathSubject.id,
            name: "Funções",
            description: "Função afim, quadrática, exponencial e logarítmica",
            difficulty_level: 3,
          },
          {
            subject_id: mathSubject.id,
            name: "Geometria Plana",
            description: "Áreas e perímetros de figuras planas",
            difficulty_level: 2,
          },
          {
            subject_id: mathSubject.id,
            name: "Trigonometria",
            description: "Razões trigonométricas e identidades",
            difficulty_level: 3,
          },
        ])
        .select()

      if (mathTopicsError) {
        console.error("❌ Erro ao inserir tópicos de Matemática:", mathTopicsError)
      } else {
        console.log("✅ Tópicos de Matemática inseridos:", mathTopics?.length)

        // Inserir flashcards para Álgebra Básica
        const algebraTopic = mathTopics?.find((t) => t.name === "Álgebra Básica")
        if (algebraTopic) {
          console.log("📝 Inserindo flashcards de exemplo...")
          const { error: flashcardsError } = await supabase.from("flashcards").insert([
            {
              topic_id: algebraTopic.id,
              question: "Qual é a fórmula para resolver uma equação do 2º grau?",
              answer: "x = (-b ± √(b² - 4ac)) / 2a",
              explanation:
                "Esta é a fórmula de Bhaskara, onde a, b e c são os coeficientes da equação ax² + bx + c = 0",
              difficulty_level: 2,
              tags: ["equação", "bhaskara", "segundo grau"],
              source: "Matemática Básica",
            },
            {
              topic_id: algebraTopic.id,
              question: "O que é o discriminante (Δ) de uma equação do 2º grau?",
              answer: "Δ = b² - 4ac",
              explanation:
                "O discriminante determina a natureza das raízes: Δ > 0 (duas raízes reais), Δ = 0 (uma raiz real), Δ < 0 (raízes complexas)",
              difficulty_level: 2,
              tags: ["discriminante", "delta", "raízes"],
              source: "Matemática Básica",
            },
            {
              topic_id: algebraTopic.id,
              question: "Como resolver a equação x² - 5x + 6 = 0?",
              answer: "x = 2 ou x = 3",
              explanation: "Usando a fórmula de Bhaskara: Δ = 25 - 24 = 1, então x = (5 ± 1)/2",
              difficulty_level: 2,
              tags: ["equação", "resolução", "exemplo"],
              source: "Matemática Básica",
            },
          ])

          if (!flashcardsError) {
            console.log("✅ Flashcards de exemplo inseridos")
          } else {
            console.error("❌ Erro ao inserir flashcards:", flashcardsError)
          }
        }
      }
    }

    // Inserir tópicos para Física
    const physicsSubject = subjects?.find((s) => s.name === "Física")
    if (physicsSubject) {
      console.log("📝 Inserindo tópicos de Física...")
      const { data: physicsTopics, error: physicsTopicsError } = await supabase
        .from("flashcard_topics")
        .insert([
          {
            subject_id: physicsSubject.id,
            name: "Cinemática",
            description: "Movimento uniforme e uniformemente variado",
            difficulty_level: 2,
          },
          {
            subject_id: physicsSubject.id,
            name: "Dinâmica",
            description: "Leis de Newton e aplicações",
            difficulty_level: 3,
          },
          {
            subject_id: physicsSubject.id,
            name: "Energia",
            description: "Trabalho, energia cinética e potencial",
            difficulty_level: 3,
          },
        ])
        .select()

      if (!physicsTopicsError && physicsTopics) {
        console.log("✅ Tópicos de Física inseridos:", physicsTopics.length)

        // Inserir alguns flashcards de Física
        const cinematicaTopic = physicsTopics.find((t) => t.name === "Cinemática")
        if (cinematicaTopic) {
          await supabase.from("flashcards").insert([
            {
              topic_id: cinematicaTopic.id,
              question: "Qual é a fórmula da velocidade média?",
              answer: "v = Δs/Δt",
              explanation: "A velocidade média é a razão entre o deslocamento (Δs) e o tempo (Δt)",
              difficulty_level: 1,
              tags: ["velocidade", "cinemática", "básico"],
              source: "Física Básica",
            },
            {
              topic_id: cinematicaTopic.id,
              question: "No movimento uniformemente variado, qual é a equação horária da posição?",
              answer: "s = s₀ + v₀t + ½at²",
              explanation: "Onde s₀ é a posição inicial, v₀ é a velocidade inicial, a é a aceleração e t é o tempo",
              difficulty_level: 2,
              tags: ["MUV", "equação horária", "posição"],
              source: "Física Básica",
            },
          ])
        }
      }
    }

    // Inserir tópicos para Cálculo I
    const calculusSubject = subjects?.find((s) => s.name === "Cálculo I")
    if (calculusSubject) {
      console.log("📝 Inserindo tópicos de Cálculo I...")
      await supabase.from("flashcard_topics").insert([
        {
          subject_id: calculusSubject.id,
          name: "Limites",
          description: "Conceito e cálculo de limites",
          difficulty_level: 3,
        },
        {
          subject_id: calculusSubject.id,
          name: "Derivadas",
          description: "Conceito e regras de derivação",
          difficulty_level: 4,
        },
        {
          subject_id: calculusSubject.id,
          name: "Integrais",
          description: "Antiderivadas e técnicas de integração",
          difficulty_level: 4,
        },
      ])
    }

    // Inserir decks pré-construídos
    console.log("📝 Inserindo decks pré-construídos...")
    const prebuiltDecks = []

    if (mathSubject) {
      prebuiltDecks.push({
        name: "ENEM Matemática Essencial",
        description: "Conceitos fundamentais de matemática para o ENEM com foco em álgebra e funções",
        subject_id: mathSubject.id,
        difficulty_level: 3,
        estimated_time_minutes: 45,
        total_cards: 25,
        is_featured: true,
        rating: 4.8,
        download_count: 1250,
      })
    }

    if (physicsSubject) {
      prebuiltDecks.push({
        name: "Física Básica - Mecânica",
        description: "Fundamentos de mecânica clássica: cinemática, dinâmica e energia",
        subject_id: physicsSubject.id,
        difficulty_level: 3,
        estimated_time_minutes: 40,
        total_cards: 20,
        is_featured: true,
        rating: 4.6,
        download_count: 890,
      })
    }

    if (calculusSubject) {
      prebuiltDecks.push({
        name: "Cálculo I - Fundamentos",
        description: "Conceitos essenciais de limites e derivadas para iniciantes",
        subject_id: calculusSubject.id,
        difficulty_level: 4,
        estimated_time_minutes: 60,
        total_cards: 30,
        is_featured: true,
        rating: 4.9,
        download_count: 567,
      })
    }

    if (prebuiltDecks.length > 0) {
      const { error: decksError } = await supabase.from("prebuilt_flashcard_decks").insert(prebuiltDecks)

      if (!decksError) {
        console.log("✅ Decks pré-construídos inseridos:", prebuiltDecks.length)
      } else {
        console.error("❌ Erro ao inserir decks:", decksError)
      }
    }

    // Inserir conteúdo na biblioteca
    console.log("📝 Inserindo conteúdo na biblioteca...")
    if (mathSubject) {
      await supabase.from("content_library").insert([
        {
          subject_id: mathSubject.id,
          title: "Fórmula de Bhaskara",
          content:
            "A fórmula de Bhaskara é usada para resolver equações quadráticas da forma ax² + bx + c = 0. A fórmula é: x = (-b ± √(b² - 4ac)) / 2a",
          content_type: "formula",
          keywords: ["bhaskara", "equação quadrática", "raízes"],
          difficulty_level: 2,
        },
        {
          subject_id: mathSubject.id,
          title: "Teorema de Pitágoras",
          content:
            "Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: a² + b² = c²",
          content_type: "theorem",
          keywords: ["pitágoras", "triângulo retângulo", "hipotenusa"],
          difficulty_level: 1,
        },
      ])
    }

    console.log("✅ Dados iniciais populados com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao popular dados iniciais:", error)
    throw error
  }
}
