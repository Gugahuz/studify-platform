"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UploadCloud, Wand2 } from "lucide-react"
import type { Subject, Topic, FlashcardGenerationParams } from "@/types/flashcards"

// Mock data - replace with API calls later
const MOCK_SUBJECTS: Subject[] = [
  { id: "math-vest", name: "Matemática (Vestibular)", category: "Vestibular" },
  { id: "hist-vest", name: "História (Vestibular)", category: "Vestibular" },
  { id: "calc-uni", name: "Cálculo I (Ensino Superior)", category: "Ensino Superior" },
  { id: "prog-uni", name: "Algoritmos (Ensino Superior)", category: "Ensino Superior" },
]

const MOCK_TOPICS: { [subjectId: string]: Topic[] } = {
  "math-vest": [
    { id: "algebra", name: "Álgebra Básica", subjectId: "math-vest" },
    { id: "geometry", name: "Geometria Plana", subjectId: "math-vest" },
  ],
  "hist-vest": [
    { id: "brazil-colony", name: "Brasil Colônia", subjectId: "hist-vest" },
    { id: "world-war-1", name: "Primeira Guerra Mundial", subjectId: "hist-vest" },
  ],
  "calc-uni": [
    { id: "limits", name: "Limites", subjectId: "calc-uni" },
    { id: "derivatives", name: "Derivadas", subjectId: "calc-uni" },
  ],
  "prog-uni": [
    { id: "logic", name: "Lógica de Programação", subjectId: "prog-uni" },
    { id: "data-structures", name: "Estruturas de Dados Básicas", subjectId: "prog-uni" },
  ],
}

interface FlashcardGeneratorOptionsProps {
  onGenerate: (params: FlashcardGenerationParams) => void
  isGenerating: boolean
}

export default function FlashcardGeneratorOptions({ onGenerate, isGenerating }: FlashcardGeneratorOptionsProps) {
  const [generationType, setGenerationType] = useState<"subject" | "upload">("subject")
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>()
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>()
  const [customContent, setCustomContent] = useState("")
  const [numberOfFlashcards, setNumberOfFlashcards] = useState<number>(10)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCustomContent(e.target?.result as string)
      }
      reader.readAsText(file)
    } else {
      setFileName(null)
      setCustomContent("")
    }
  }

  const handleSubmit = () => {
    const params: FlashcardGenerationParams = { numberOfFlashcards }
    if (generationType === "subject") {
      params.subjectId = selectedSubject
      params.topicId = selectedTopic
    } else {
      params.customContent = customContent
    }
    onGenerate(params)
  }

  const availableTopics = selectedSubject ? MOCK_TOPICS[selectedSubject] || [] : []

  return (
    <div className="space-y-6 p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex gap-4 mb-6">
        <Button
          variant={generationType === "subject" ? "default" : "outline"}
          onClick={() => setGenerationType("subject")}
          className="flex-1"
        >
          Gerar por Matéria
        </Button>
        <Button
          variant={generationType === "upload" ? "default" : "outline"}
          onClick={() => setGenerationType("upload")}
          className="flex-1"
        >
          Gerar por Upload de Conteúdo
        </Button>
      </div>

      {generationType === "subject" && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <Label htmlFor="subject">Matéria</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Selecione uma matéria" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_SUBJECTS.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSubject && availableTopics.length > 0 && (
            <div>
              <Label htmlFor="topic">Tópico (Opcional)</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Selecione um tópico específico" />
                </SelectTrigger>
                <SelectContent>
                  {availableTopics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {generationType === "upload" && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <Label htmlFor="file-upload">Upload de Arquivo (.txt, .md)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload-input"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                  >
                    <span>Carregar um arquivo</span>
                    <input
                      id="file-upload-input"
                      name="file-upload-input"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".txt,.md,application/pdf"
                    />
                  </label>
                  <p className="pl-1">ou cole o texto abaixo</p>
                </div>
                {fileName && <p className="text-xs text-gray-500">{fileName} carregado</p>}
                <p className="text-xs text-gray-500">TXT, MD, PDF até 5MB</p>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="custom-content">Ou Cole seu Conteúdo Aqui</Label>
            <Textarea
              id="custom-content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Cole seu material de estudo, resumo, ou anotações aqui..."
              rows={8}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        <Label htmlFor="num-flashcards">Número de Flashcards (1-50)</Label>
        <Input
          id="num-flashcards"
          type="number"
          value={numberOfFlashcards}
          onChange={(e) => setNumberOfFlashcards(Math.max(1, Math.min(50, Number.parseInt(e.target.value, 10))))}
          min="1"
          max="50"
          className="mt-1"
        />
      </div>

      <Button onClick={handleSubmit} disabled={isGenerating} className="w-full mt-6 py-3">
        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Gerar Flashcards
      </Button>
    </div>
  )
}
