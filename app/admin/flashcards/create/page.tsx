"use client"

import type React from "react"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast" // Assumindo que você tem um hook de toast
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Subject as SubjectType, Topic as TopicType } from "@/types/flashcards"

interface FormData {
  question: string
  answer: string
  explanation: string
  difficulty_level: string
  tags: string
  subject: string // Subject ID
  topic: string // Topic ID
  source: string
}

export default function CreateFlashcardPage() {
  const [formData, setFormData] = useState<FormData>({
    question: "",
    answer: "",
    explanation: "",
    difficulty_level: "3",
    tags: "",
    subject: "",
    topic: "",
    source: "Admin",
  })
  const [subjects, setSubjects] = useState<SubjectType[]>([])
  const [topics, setTopics] = useState<TopicType[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSubjects() {
      setIsLoadingSubjects(true)
      try {
        const response = await fetch("/api/flashcards/subjects")
        const data = await response.json()
        const allSubjects: SubjectType[] = []
        if (data && typeof data === "object") {
          Object.values(data).forEach((categorySubjects: any) => {
            if (Array.isArray(categorySubjects)) {
              allSubjects.push(...categorySubjects)
            }
          })
        }
        setSubjects(allSubjects)
      } catch (error) {
        console.error("Erro ao buscar matérias:", error)
        toast({ title: "Erro", description: "Não foi possível carregar as matérias.", variant: "destructive" })
      } finally {
        setIsLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [toast])

  useEffect(() => {
    if (formData.subject) {
      const selectedSub = subjects.find((s) => s.id === formData.subject)
      setTopics(selectedSub?.flashcard_topics || [])
      setFormData((prev) => ({ ...prev, topic: "" })) // Reset topic when subject changes
    } else {
      setTopics([])
    }
  }, [formData.subject, subjects])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic validation
    if (!formData.question || !formData.answer || !formData.subject || !formData.topic) {
      toast({
        title: "Erro de Validação",
        description: "Pergunta, resposta, matéria e tópico são obrigatórios.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Find subject and topic names for sending to API, if API expects names
    // Or send IDs and let API resolve names if needed
    const selectedSubjectObj = subjects.find((s) => s.id === formData.subject)
    const selectedTopicObj = topics.find((t) => t.id === formData.topic)

    const payload = {
      ...formData,
      subject: selectedSubjectObj?.name || formData.subject, // Send name or ID
      topic: selectedTopicObj?.name || formData.topic, // Send name or ID
      difficulty_level: Number.parseInt(formData.difficulty_level, 10),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    try {
      const response = await fetch("/api/admin/flashcards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        toast({ title: "Sucesso!", description: result.message || "Flashcard criado com sucesso!" })
        setFormData({
          // Reset form
          question: "",
          answer: "",
          explanation: "",
          difficulty_level: "3",
          tags: "",
          subject: "",
          topic: "",
          source: "Admin",
        })
      } else {
        toast({
          title: "Erro ao Criar",
          description: result.error || "Não foi possível criar o flashcard.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro na submissão:", error)
      toast({ title: "Erro de Rede", description: "Falha ao conectar com o servidor.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-studify-white min-h-screen">
      <div className="flex items-center mb-6 gap-3">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="border-studify-gray hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-studify-gray" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-studify-green">Criar Novo Flashcard (Admin)</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-studify-green">Detalhes do Flashcard</CardTitle>
          <CardDescription className="text-studify-gray">
            Preencha os campos abaixo para adicionar um novo flashcard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="question" className="text-studify-gray">
                Pergunta
              </Label>
              <Textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                required
                className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
              />
            </div>
            <div>
              <Label htmlFor="answer" className="text-studify-gray">
                Resposta
              </Label>
              <Textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                required
                className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
              />
            </div>
            <div>
              <Label htmlFor="explanation" className="text-studify-gray">
                Explicação (Opcional)
              </Label>
              <Textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={4}
                className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="difficulty_level" className="text-studify-gray">
                  Nível de Dificuldade
                </Label>
                <Select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onValueChange={handleSelectChange("difficulty_level")}
                >
                  <SelectTrigger
                    id="difficulty_level"
                    className="mt-1 w-full border-gray-300 focus:border-studify-green focus:ring-studify-green"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        {level} - {["Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"][level - 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source" className="text-studify-gray">
                  Fonte
                </Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tags" className="text-studify-gray">
                Tags (separadas por vírgula)
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="ex: algebra, equacao, enem"
                className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="subject" className="text-studify-gray">
                  Matéria
                </Label>
                <Select
                  name="subject"
                  value={formData.subject}
                  onValueChange={handleSelectChange("subject")}
                  disabled={isLoadingSubjects}
                >
                  <SelectTrigger
                    id="subject"
                    className="mt-1 w-full border-gray-300 focus:border-studify-green focus:ring-studify-green"
                  >
                    <SelectValue placeholder={isLoadingSubjects ? "Carregando..." : "Selecione a matéria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="topic" className="text-studify-gray">
                  Tópico
                </Label>
                <Select
                  name="topic"
                  value={formData.topic}
                  onValueChange={handleSelectChange("topic")}
                  disabled={!formData.subject || topics.length === 0}
                >
                  <SelectTrigger
                    id="topic"
                    className="mt-1 w-full border-gray-300 focus:border-studify-green focus:ring-studify-green"
                  >
                    <SelectValue
                      placeholder={
                        !formData.subject
                          ? "Selecione uma matéria primeiro"
                          : topics.length === 0
                            ? "Nenhum tópico disponível"
                            : "Selecione o tópico"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Criar Flashcard
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
