export interface MockExamTemplate {
  id: string
  title: string
  description: string
  category: string
  difficulty: number
  timeLimit: number // em minutos
  totalQuestions: number
  passingScore: number
  questions: MockExamQuestion[]
}

export interface MockExamQuestion {
  id: string
  number: number
  text: string
  options: string[]
  correctAnswer: string
  explanation: string
  subject: string
  points: number
}

export interface MockExamAttempt {
  id: string
  templateId: string
  templateTitle: string
  startTime: number
  endTime?: number
  timeSpent: number
  responses: Record<string, string>
  score: number
  percentage: number
  totalQuestions: number
  correctAnswers: number
  status: "started" | "completed"
}

// Dados estáticos dos simulados
export const MOCK_EXAM_TEMPLATES: MockExamTemplate[] = [
  {
    id: "enem-matematica",
    title: "ENEM - Matemática Básica",
    description: "Simulado de matemática básica no estilo ENEM",
    category: "enem",
    difficulty: 2,
    timeLimit: 90,
    totalQuestions: 10,
    passingScore: 60,
    questions: [
      {
        id: "q1",
        number: 1,
        text: "Qual é o resultado de 2 + 2 × 3?",
        options: ["6", "8", "10", "12", "14"],
        correctAnswer: "8",
        explanation: "Primeiro multiplicação: 2 × 3 = 6, depois soma: 2 + 6 = 8",
        subject: "Matemática",
        points: 1,
      },
      {
        id: "q2",
        number: 2,
        text: "Se x + 5 = 12, qual é o valor de x?",
        options: ["5", "6", "7", "8", "9"],
        correctAnswer: "7",
        explanation: "x + 5 = 12, então x = 12 - 5 = 7",
        subject: "Álgebra",
        points: 1,
      },
      {
        id: "q3",
        number: 3,
        text: "Qual é a área de um quadrado com lado de 4 cm?",
        options: ["8 cm²", "12 cm²", "16 cm²", "20 cm²", "24 cm²"],
        correctAnswer: "16 cm²",
        explanation: "Área do quadrado = lado², então 4² = 16 cm²",
        subject: "Geometria",
        points: 1,
      },
      {
        id: "q4",
        number: 4,
        text: "Qual é 25% de 200?",
        options: ["25", "40", "50", "75", "100"],
        correctAnswer: "50",
        explanation: "25% de 200 = 0,25 × 200 = 50",
        subject: "Porcentagem",
        points: 1,
      },
      {
        id: "q5",
        number: 5,
        text: "Se um produto custa R$ 80 e tem desconto de 15%, qual o preço final?",
        options: ["R$ 65", "R$ 68", "R$ 70", "R$ 72", "R$ 75"],
        correctAnswer: "R$ 68",
        explanation: "Desconto: 15% de 80 = 12. Preço final: 80 - 12 = 68",
        subject: "Matemática Financeira",
        points: 1,
      },
      {
        id: "q6",
        number: 6,
        text: "Qual é o próximo número na sequência: 2, 4, 8, 16, ...?",
        options: ["24", "28", "30", "32", "36"],
        correctAnswer: "32",
        explanation: "Cada número é o dobro do anterior: 16 × 2 = 32",
        subject: "Sequências",
        points: 1,
      },
      {
        id: "q7",
        number: 7,
        text: "Em uma turma de 30 alunos, 18 são meninas. Qual a porcentagem de meninos?",
        options: ["30%", "40%", "50%", "60%", "70%"],
        correctAnswer: "40%",
        explanation: "Meninos: 30 - 18 = 12. Porcentagem: 12/30 = 0,4 = 40%",
        subject: "Estatística",
        points: 1,
      },
      {
        id: "q8",
        number: 8,
        text: "Qual é o valor de √64?",
        options: ["6", "7", "8", "9", "10"],
        correctAnswer: "8",
        explanation: "√64 = 8, pois 8² = 64",
        subject: "Radiciação",
        points: 1,
      },
      {
        id: "q9",
        number: 9,
        text: "Se 3x - 6 = 15, qual é o valor de x?",
        options: ["5", "6", "7", "8", "9"],
        correctAnswer: "7",
        explanation: "3x - 6 = 15, então 3x = 21, logo x = 7",
        subject: "Álgebra",
        points: 1,
      },
      {
        id: "q10",
        number: 10,
        text: "Qual é o perímetro de um retângulo com base 8 cm e altura 5 cm?",
        options: ["18 cm", "22 cm", "26 cm", "30 cm", "40 cm"],
        correctAnswer: "26 cm",
        explanation: "Perímetro = 2(base + altura) = 2(8 + 5) = 2 × 13 = 26 cm",
        subject: "Geometria",
        points: 1,
      },
    ],
  },
  {
    id: "vestibular-portugues",
    title: "Vestibular - Português",
    description: "Questões de português para vestibular",
    category: "vestibular",
    difficulty: 3,
    timeLimit: 60,
    totalQuestions: 8,
    passingScore: 70,
    questions: [
      {
        id: "p1",
        number: 1,
        text: 'Qual é a função da vírgula na frase: "João, venha aqui"?',
        options: [
          "Separar sujeito do predicado",
          "Indicar vocativo",
          "Separar adjuntos",
          "Indicar aposto",
          "Separar orações",
        ],
        correctAnswer: "Indicar vocativo",
        explanation: 'A vírgula separa o vocativo "João" do resto da frase',
        subject: "Gramática",
        points: 1,
      },
      {
        id: "p2",
        number: 2,
        text: 'Qual figura de linguagem está presente em "Seus olhos são duas estrelas"?',
        options: ["Metáfora", "Metonímia", "Hipérbole", "Personificação", "Ironia"],
        correctAnswer: "Metáfora",
        explanation: "Comparação implícita entre olhos e estrelas",
        subject: "Literatura",
        points: 1,
      },
      {
        id: "p3",
        number: 3,
        text: 'Qual é o plural de "cidadão"?',
        options: ["cidadões", "cidadãos", "cidadans", "cidadães", "cidadãoes"],
        correctAnswer: "cidadãos",
        explanation: "Palavras terminadas em -ão fazem plural em -ãos quando oxítonas",
        subject: "Gramática",
        points: 1,
      },
      {
        id: "p4",
        number: 4,
        text: "Em qual período literário se enquadra Machado de Assis?",
        options: ["Romantismo", "Realismo", "Parnasianismo", "Simbolismo", "Modernismo"],
        correctAnswer: "Realismo",
        explanation: "Machado de Assis é o principal autor do Realismo brasileiro",
        subject: "Literatura",
        points: 1,
      },
      {
        id: "p5",
        number: 5,
        text: 'Qual é a classe gramatical da palavra "muito" em "Ele correu muito"?',
        options: ["Adjetivo", "Substantivo", "Advérbio", "Pronome", "Verbo"],
        correctAnswer: "Advérbio",
        explanation: 'Modifica o verbo "correu", indicando intensidade',
        subject: "Gramática",
        points: 1,
      },
      {
        id: "p6",
        number: 6,
        text: 'Qual é o sujeito da oração "Choveu ontem à noite"?',
        options: ["Chuva", "Ontem", "Noite", "Oração sem sujeito", "Sujeito oculto"],
        correctAnswer: "Oração sem sujeito",
        explanation: "Verbos que indicam fenômenos da natureza são impessoais",
        subject: "Sintaxe",
        points: 1,
      },
      {
        id: "p7",
        number: 7,
        text: 'Qual é o antônimo de "efêmero"?',
        options: ["Passageiro", "Duradouro", "Rápido", "Momentâneo", "Breve"],
        correctAnswer: "Duradouro",
        explanation: "Efêmero significa passageiro, seu antônimo é duradouro",
        subject: "Semântica",
        points: 1,
      },
      {
        id: "p8",
        number: 8,
        text: 'Em "O livro que comprei é interessante", o termo "que" é:',
        options: ["Pronome relativo", "Conjunção", "Advérbio", "Preposição", "Interjeição"],
        correctAnswer: "Pronome relativo",
        explanation: 'Liga duas orações e substitui "o livro"',
        subject: "Sintaxe",
        points: 1,
      },
    ],
  },
  {
    id: "concurso-raciocinio",
    title: "Concurso Público - Raciocínio Lógico",
    description: "Questões de raciocínio lógico para concursos",
    category: "concurso",
    difficulty: 4,
    timeLimit: 45,
    totalQuestions: 6,
    passingScore: 65,
    questions: [
      {
        id: "r1",
        number: 1,
        text: "Se todos os A são B, e alguns B são C, então:",
        options: [
          "Todos os A são C",
          "Alguns A são C",
          "Nenhum A é C",
          "Todos os C são A",
          "Não é possível determinar",
        ],
        correctAnswer: "Não é possível determinar",
        explanation: "Não temos informação suficiente para relacionar A e C diretamente",
        subject: "Lógica",
        points: 1,
      },
      {
        id: "r2",
        number: 2,
        text: "Complete a sequência: 1, 4, 9, 16, 25, ?",
        options: ["30", "32", "36", "40", "42"],
        correctAnswer: "36",
        explanation: "Sequência dos quadrados perfeitos: 1², 2², 3², 4², 5², 6² = 36",
        subject: "Sequências",
        points: 1,
      },
      {
        id: "r3",
        number: 3,
        text: "Em um grupo de 100 pessoas, 60 gostam de futebol, 40 gostam de basquete e 20 gostam de ambos. Quantas não gostam de nenhum dos dois?",
        options: ["10", "15", "20", "25", "30"],
        correctAnswer: "20",
        explanation: "Futebol apenas: 40, Basquete apenas: 20, Ambos: 20. Total: 80. Nenhum: 100-80 = 20",
        subject: "Conjuntos",
        points: 1,
      },
      {
        id: "r4",
        number: 4,
        text: "Se P → Q é verdadeiro e Q é falso, então P é:",
        options: ["Verdadeiro", "Falso", "Indeterminado", "Pode ser V ou F", "Nenhuma das anteriores"],
        correctAnswer: "Falso",
        explanation: "Se P → Q é verdadeiro e Q é falso, então P deve ser falso (modus tollens)",
        subject: "Lógica Proposicional",
        points: 1,
      },
      {
        id: "r5",
        number: 5,
        text: "Três amigos têm idades que somam 60 anos. O mais velho tem o dobro da idade do mais novo. O do meio tem 5 anos a mais que o mais novo. Qual a idade do mais velho?",
        options: ["20", "25", "30", "35", "40"],
        correctAnswer: "30",
        explanation:
          "Seja x a idade do mais novo: x + (x+5) + 2x = 60. Logo 4x + 5 = 60, x = 13.75 ≈ 14. Mais velho: 2×14 = 28 ≈ 30",
        subject: "Problemas",
        points: 1,
      },
      {
        id: "r6",
        number: 6,
        text: "Qual é o próximo termo na sequência: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "46", "48"],
        correctAnswer: "42",
        explanation: "Diferenças: 4, 6, 8, 10, 12. Próximo termo: 30 + 12 = 42",
        subject: "Sequências",
        points: 1,
      },
    ],
  },
]

// Funções para gerenciar dados no localStorage
export class MockExamStorage {
  private static ATTEMPTS_KEY = "mock_exam_attempts"
  private static CURRENT_ATTEMPT_KEY = "current_mock_exam_attempt"

  static saveAttempt(attempt: MockExamAttempt): void {
    const attempts = this.getAttempts()
    const existingIndex = attempts.findIndex((a) => a.id === attempt.id)

    if (existingIndex >= 0) {
      attempts[existingIndex] = attempt
    } else {
      attempts.push(attempt)
    }

    localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(attempts))
  }

  static getAttempts(): MockExamAttempt[] {
    const data = localStorage.getItem(this.ATTEMPTS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getAttempt(id: string): MockExamAttempt | null {
    const attempts = this.getAttempts()
    return attempts.find((a) => a.id === id) || null
  }

  static setCurrentAttempt(attempt: MockExamAttempt | null): void {
    if (attempt) {
      localStorage.setItem(this.CURRENT_ATTEMPT_KEY, JSON.stringify(attempt))
    } else {
      localStorage.removeItem(this.CURRENT_ATTEMPT_KEY)
    }
  }

  static getCurrentAttempt(): MockExamAttempt | null {
    const data = localStorage.getItem(this.CURRENT_ATTEMPT_KEY)
    return data ? JSON.parse(data) : null
  }

  static clearCurrentAttempt(): void {
    localStorage.removeItem(this.CURRENT_ATTEMPT_KEY)
  }

  static getCompletedAttempts(): MockExamAttempt[] {
    return this.getAttempts().filter((a) => a.status === "completed")
  }

  static getAttemptsByTemplate(templateId: string): MockExamAttempt[] {
    return this.getAttempts().filter((a) => a.templateId === templateId)
  }
}

// Funções utilitárias
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function calculateResults(template: MockExamTemplate, responses: Record<string, string>) {
  let correctAnswers = 0
  let totalPoints = 0

  template.questions.forEach((question) => {
    const userAnswerLetter = responses[question.id]
    if (userAnswerLetter) {
      // Convert letter to option index (A=0, B=1, C=2, etc.)
      const optionIndex = userAnswerLetter.charCodeAt(0) - 65
      const userAnswerValue = question.options[optionIndex]

      if (userAnswerValue === question.correctAnswer) {
        correctAnswers++
        totalPoints += question.points
      }
    }
  })

  const percentage = Math.round((correctAnswers / template.totalQuestions) * 100)

  return {
    correctAnswers,
    totalPoints,
    percentage,
    passed: percentage >= template.passingScore,
  }
}
