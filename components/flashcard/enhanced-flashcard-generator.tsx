"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, UploadCloud, Wand2, BookOpen, Upload, FileText } from "lucide-react"
import type { Subject, FlashcardGenerationParams } from "@/types/flashcards"
import { useToast } from "@/components/ui/use-toast"

interface EnhancedFlashcardGeneratorProps {
  onGenerate: (params: FlashcardGenerationParams) => void
  isGenerating: boolean
}

export default function EnhancedFlashcardGenerator({ onGenerate, isGenerating }: EnhancedFlashcardGeneratorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>()
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>()
  const [customContent, setCustomContent] = useState("")
  const [numberOfFlashcards, setNumberOfFlashcards] = useState<number>(10)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/flashcards/subjects")
      const data = await response.json()

      if (data.subjects) {
        setSubjects(data.subjects)
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Erro ao carregar matérias",
        description: "Não foi possível carregar as matérias disponíveis.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileName(null)
      setCustomContent("")
      return
    }

    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "temp-user") // Replace with actual user ID

      const response = await fetch("/api/flashcards/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setCustomContent(result.content)
        toast({
          title: "Arquivo carregado!",
          description: "Seu arquivo foi processado com sucesso.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      })
      setFileName(null)
    }
  }

  const handleSubjectGenerate = () => {
    const params: FlashcardGenerationParams = {
      numberOfFlashcards,
      subjectId: selectedSubject,
      topicId: selectedTopic,
    }
    onGenerate(params)
  }

  const handleContentGenerate = () => {
    if (!customContent.trim()) {
      toast({
        title: "Conteúdo necessário",
        description: "Por favor, adicione algum conteúdo para gerar flashcards.",
        variant: "destructive",
      })
      return
    }

    const params: FlashcardGenerationParams = {
      numberOfFlashcards,
      customContent: customContent.trim(),
    }
    onGenerate(params)
  }

  const availableTopics = selectedSubject ? subjects.find((s) => s.id === selectedSubject)?.flashcard_topics || [] : []

  const groupedSubjects = subjects.reduce(
    (acc, subject) => {
      if (!acc[subject.category]) {
        acc[subject.category] = []
      }
      acc[subject.category].push(subject)
      return acc
    },
    {} as Record<string, Subject[]>,
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Por Matéria
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Gerar por Matéria e Tópico
              </CardTitle>
              <CardDescription>
                Selecione uma matéria e opcionalmente um tópico específico para gerar flashcards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSubjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Carregando matérias...</span>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="subject">Matéria *</Label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(value) => {
                        setSelectedSubject(value)
                        setSelectedTopic(undefined)
                      }}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Selecione uma matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-50">{category}</div>
                            {categorySubjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                                  {subject.name}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject && availableTopics.length > 0 && (
                    <div>
                      <Label htmlFor="topic">Tópico Específico (Opcional)</Label>
                      <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                        <SelectTrigger id="topic">
                          <SelectValue placeholder="Todos os tópicos" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{topic.name}</span>
                                <span className="text-xs text-gray-500 ml-2">Nível {topic.difficulty_level}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="num-flashcards-subject">Número de Flashcards</Label>
                    <Input
                      id="num-flashcards-subject"
                      type="number"
                      value={numberOfFlashcards}
                      onChange={(e) =>
                        setNumberOfFlashcards(Math.max(1, Math.min(50, Number.parseInt(e.target.value, 10))))
                      }
                      min="1"
                      max="50"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleSubjectGenerate}
                    disabled={isGenerating || !selectedSubject}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Gerar Flashcards
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Gerar por Conteúdo Personalizado
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo ou cole seu conteúdo para gerar flashcards personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload de Arquivo</Label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload">Arraste e solte um arquivo aqui ou clique para selecionar</label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="custom-content">Conteúdo Personalizado</Label>
                <Textarea
                  id="custom-content"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="num-flashcards-upload">Número de Flashcards</Label>
                <Input
                  id="num-flashcards-upload"
                  type="number"
                  value={numberOfFlashcards}
                  onChange={(e) =>
                    setNumberOfFlashcards(Math.max(1, Math.min(50, Number.parseInt(e.target.value, 10))))
                  }
                  min="1"
                  max="50"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleContentGenerate}
                disabled={isGenerating || !customContent.trim()}
                className="w-full"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Gerar Flashcards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
