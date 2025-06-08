"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Quote, Upload, Copy, Download, Trash2, FileText, Check } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

export default function CitacoesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [text, setText] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [citationStyle, setCitationStyle] = useState("abnt")
  const [citationCount, setCitationCount] = useState(5)
  const [copied, setCopied] = useState<number | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      toast.error("Por favor, insira algum texto para extrair citações")
      return
    }

    setIsLoading(true)

    try {
      // Simulando processamento de API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulando resultados baseados no estilo selecionado
      const sampleCitations = generateSampleCitations(text, citationStyle, citationCount)
      setResults(sampleCitations)
      toast.success("Citações extraídas com sucesso!")
    } catch (error) {
      toast.error("Erro ao extrair citações. Tente novamente.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.")
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo é muito grande. O tamanho máximo é 10MB.")
      return
    }

    setFileName(file.name)
    setIsLoading(true)

    try {
      // Simulando processamento de arquivo
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulando texto extraído do arquivo
      const extractedText = `Este é um texto extraído do arquivo ${file.name}. 
      A educação é um processo de desenvolvimento da capacidade física, intelectual e moral do ser humano.
      Segundo Paulo Freire, "Educação não transforma o mundo. Educação muda pessoas. Pessoas transformam o mundo."
      De acordo com Vygotsky, o aprendizado é um processo social que ocorre através da interação.
      Piaget afirma que o conhecimento é construído através da interação do sujeito com o meio.
      A teoria construtivista propõe que o conhecimento é ativamente construído pelo aprendiz.
      Conforme Bourdieu, a escola reproduz as desigualdades sociais existentes na sociedade.
      A pedagogia crítica busca desenvolver a consciência crítica dos estudantes.`

      setText(extractedText)

      // Gerar citações baseadas no texto extraído
      const sampleCitations = generateSampleCitations(extractedText, citationStyle, citationCount)
      setResults(sampleCitations)
      toast.success("Arquivo processado e citações extraídas com sucesso!")
    } catch (error) {
      toast.error("Erro ao processar o arquivo. Tente novamente.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (index: number) => {
    navigator.clipboard.writeText(results[index])
    setCopied(index)
    toast.success("Citação copiada para a área de transferência!")
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = () => {
    if (results.length === 0) return

    const content = results.join("\n\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `citacoes-${citationStyle}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Citações baixadas com sucesso!")
  }

  const handleClear = () => {
    setText("")
    setResults([])
    setFileName(null)
    toast.info("Conteúdo limpo!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assistente">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extrator de citações</h1>
          <p className="text-gray-600">Extraia citações importantes de textos acadêmicos</p>
        </div>
      </div>

      <Tabs defaultValue="texto" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="texto">Inserir Texto</TabsTrigger>
          <TabsTrigger value="arquivo">Upload de Arquivo</TabsTrigger>
        </TabsList>

        <TabsContent value="texto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-green-600" />
                Insira seu texto
              </CardTitle>
              <CardDescription>Cole o texto do qual deseja extrair citações</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <Textarea
                  placeholder="Cole seu texto aqui..."
                  className="min-h-[200px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Estilo de Citação</h3>
                      <RadioGroup
                        value={citationStyle}
                        onValueChange={setCitationStyle}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="abnt" id="abnt" />
                          <Label htmlFor="abnt">ABNT</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="apa" id="apa" />
                          <Label htmlFor="apa">APA</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="chicago" id="chicago" />
                          <Label htmlFor="chicago">Chicago</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vancouver" id="vancouver" />
                          <Label htmlFor="vancouver">Vancouver</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Número de Citações: {citationCount}</h3>
                      <Slider
                        value={[citationCount]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setCitationCount(value[0])}
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={isLoading || (!text && results.length === 0)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                      <Button type="submit" disabled={isLoading || !text.trim()}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Quote className="h-4 w-4 mr-2" />
                            Extrair Citações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                Upload de Arquivo
              </CardTitle>
              <CardDescription>Faça upload de um arquivo PDF, DOC, DOCX ou TXT</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    {fileName ? (
                      <>
                        <FileText className="h-12 w-12 text-green-500 mb-2" />
                        <p className="text-sm font-medium text-gray-900">{fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">Clique para trocar o arquivo</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-900">Clique para fazer upload</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, TXT (max. 10MB)</p>
                      </>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Estilo de Citação</h3>
                      <RadioGroup
                        value={citationStyle}
                        onValueChange={setCitationStyle}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="abnt" id="abnt-file" />
                          <Label htmlFor="abnt-file">ABNT</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="apa" id="apa-file" />
                          <Label htmlFor="apa-file">APA</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="chicago" id="chicago-file" />
                          <Label htmlFor="chicago-file">Chicago</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vancouver" id="vancouver-file" />
                          <Label htmlFor="vancouver-file">Vancouver</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Número de Citações: {citationCount}</h3>
                      <Slider
                        value={[citationCount]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setCitationCount(value[0])}
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={isLoading || (!fileName && results.length === 0)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-green-600" />
                Citações Extraídas
              </CardTitle>
              <CardDescription>
                {results.length} citações no formato {citationStyle.toUpperCase()}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((citation, index) => (
                <div key={index} className="p-4 border rounded-md bg-gray-50 relative">
                  <p className="pr-10 text-gray-800">{citation}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(index)}
                  >
                    {copied === index ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Função auxiliar para gerar citações de exemplo
function generateSampleCitations(text: string, style: string, count: number): string[] {
  // Autores fictícios para demonstração
  const authors = [
    "Silva, J.",
    "Oliveira, M.",
    "Santos, A.",
    "Pereira, C.",
    "Ferreira, R.",
    "Costa, L.",
    "Rodrigues, P.",
    "Almeida, T.",
    "Martins, B.",
    "Souza, G.",
  ]

  // Anos fictícios
  const years = [2018, 2019, 2020, 2021, 2022, 2023]

  // Títulos fictícios baseados no texto
  const generateTitle = () => {
    const words = text
      .split(" ")
      .filter((word) => word.length > 3)
      .filter((word) => !["para", "como", "este", "esta", "pelo", "pela"].includes(word.toLowerCase()))

    const randomStart = Math.floor(Math.random() * Math.max(1, words.length - 5))
    const titleWords = words.slice(randomStart, randomStart + Math.floor(Math.random() * 3) + 3)
    return titleWords.join(" ").replace(/[.,;:!?]/g, "") + (Math.random() > 0.5 ? ": uma análise" : "")
  }

  // Gerar frases do texto
  const sentences = text
    .replace(/([.!?])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .filter((sentence) => sentence.length > 30)

  // Gerar citações baseadas no estilo
  const citations = []

  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const author = authors[Math.floor(Math.random() * authors.length)]
    const year = years[Math.floor(Math.random() * years.length)]
    const title = generateTitle()
    const sentence = sentences[i] || "Este é um exemplo de citação extraída do texto."

    let citation = ""

    switch (style) {
      case "abnt":
        citation = `"${sentence}" (${author.split(",")[0].toUpperCase()}, ${year}, p. ${Math.floor(Math.random() * 100) + 1}).`
        break
      case "apa":
        citation = `${author} (${year}) afirma que "${sentence}" (p. ${Math.floor(Math.random() * 100) + 1}).`
        break
      case "chicago":
        citation = `${author.split(",").reverse().join(" ")}, ${title}, (São Paulo: Editora Acadêmica, ${year}), ${Math.floor(Math.random() * 100) + 1}.`
        break
      case "vancouver":
        citation = `${i + 1}. ${author.split(",").reverse().join(" ")}. ${title}. Rev Acad Bras. ${year};${Math.floor(Math.random() * 20) + 1}(${Math.floor(Math.random() * 4) + 1}):${Math.floor(Math.random() * 100) + 1}-${Math.floor(Math.random() * 100) + 101}.`
        break
      default:
        citation = `${author} (${year}). ${title}. "${sentence}".`
    }

    citations.push(citation)
  }

  return citations
}
