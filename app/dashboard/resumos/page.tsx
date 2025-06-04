"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, History, Loader2, Copy, Download, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ResumoModal } from "@/components/resumo-modal"
import jsPDF from "jspdf"

type Resumo = {
  id: number
  titulo: string
  conteudo: string
  textoOriginal?: string
  tipo: "conciso" | "detalhado"
  data: string
  nomeArquivo?: string
}

export default function ResumosPage() {
  const [texto, setTexto] = useState("")
  const [tipoResumo, setTipoResumo] = useState<"conciso" | "detalhado">("conciso")
  const [resumoGerado, setResumoGerado] = useState("")
  const [textoOriginalAtual, setTextoOriginalAtual] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resumosSalvos, setResumosSalvos] = useState<Resumo[]>([])
  const [selectedResumo, setSelectedResumo] = useState<Resumo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("gerar")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Carregar dados do localStorage
  useEffect(() => {
    const savedResumo = sessionStorage.getItem("resumo-gerado")
    const savedTextoOriginal = sessionStorage.getItem("texto-original")
    const savedResumos = localStorage.getItem("resumos-salvos")

    if (savedResumo) {
      setResumoGerado(savedResumo)
    }
    if (savedTextoOriginal) {
      setTextoOriginalAtual(savedTextoOriginal)
      setTexto(savedTextoOriginal)
    }
    if (savedResumos) {
      try {
        setResumosSalvos(JSON.parse(savedResumos))
      } catch (error) {
        console.error("Erro ao carregar resumos salvos:", error)
      }
    }
  }, [])

  // Salvar dados no storage
  useEffect(() => {
    if (resumoGerado) {
      sessionStorage.setItem("resumo-gerado", resumoGerado)
    }
  }, [resumoGerado])

  useEffect(() => {
    if (texto) {
      sessionStorage.setItem("texto-original", texto)
      setTextoOriginalAtual(texto)
    }
  }, [texto])

  useEffect(() => {
    localStorage.setItem("resumos-salvos", JSON.stringify(resumosSalvos))
  }, [resumosSalvos])

  const gerarResumo = async () => {
    if (!texto.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um texto para resumir.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/resumo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto: texto.trim(),
          tipo: tipoResumo,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao gerar resumo")
      }

      const data = await response.json()
      setResumoGerado(data.resumo)
      setTextoOriginalAtual(texto.trim())

      toast({
        title: "✅ Resumo gerado!",
        description: "Seu resumo foi criado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o resumo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const salvarResumo = () => {
    if (!resumoGerado) {
      toast({
        title: "❌ Nada para salvar",
        description: "Não há resumo para salvar.",
        variant: "destructive",
      })
      return
    }

    try {
      const novoResumo: Resumo = {
        id: Date.now(),
        titulo: `Resumo ${tipoResumo} - ${new Date().toLocaleDateString()}`,
        conteudo: resumoGerado,
        textoOriginal: textoOriginalAtual,
        tipo: tipoResumo,
        data: new Date().toLocaleDateString(),
      }

      const novosResumos = [novoResumo, ...resumosSalvos]
      setResumosSalvos(novosResumos)

      toast({
        title: "✅ Resumo salvo!",
        description: `Resumo adicionado ao histórico (${novosResumos.length} total). Acesse a aba 'Histórico' para visualizar.`,
      })

      console.log("Summary saved successfully")
    } catch (error) {
      console.error("Error saving summary:", error)
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar o resumo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const copiarResumo = () => {
    if (!resumoGerado) {
      toast({
        title: "❌ Nada para copiar",
        description: "Não há resumo para copiar.",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard
      .writeText(resumoGerado)
      .then(() => {
        toast({
          title: "✅ Copiado!",
          description: "Resumo copiado para a área de transferência.",
        })
      })
      .catch(() => {
        toast({
          title: "❌ Erro ao copiar",
          description: "Não foi possível copiar o texto. Tente selecionar e copiar manualmente.",
          variant: "destructive",
        })
      })
  }

  const baixarPDF = () => {
    if (!resumoGerado) {
      toast({
        title: "❌ Nada para baixar",
        description: "Não há resumo para baixar.",
        variant: "destructive",
      })
      return
    }

    // Immediate download notification
    toast({
      title: "📥 Iniciando download",
      description: "Gerando arquivo PDF...",
    })

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = 30

      // Title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`Resumo ${tipoResumo} - ${new Date().toLocaleDateString()}`, margin, yPosition)
      yPosition += 15

      // Info
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Tipo: ${tipoResumo === "detalhado" ? "Detalhado" : "Conciso"}`, margin, yPosition)
      yPosition += 10
      doc.text(`Data: ${new Date().toLocaleDateString()}`, margin, yPosition)
      yPosition += 20

      // Content
      doc.setFontSize(12)
      const splitText = doc.splitTextToSize(resumoGerado, maxWidth)

      for (let i = 0; i < splitText.length; i++) {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 30
        }
        doc.text(splitText[i], margin, yPosition)
        yPosition += 7
      }

      const fileName = `resumo-${tipoResumo}-${Date.now()}.pdf`
      doc.save(fileName)

      // Success notification
      toast({
        title: "✅ PDF baixado!",
        description: `Arquivo "${fileName}" salvo com sucesso.`,
      })

      console.log("PDF downloaded successfully:", fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "❌ Erro no download",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("File selected:", file.name, file.size, file.type)

    // Immediate upload notification
    toast({
      title: "📤 Upload iniciado",
      description: `Processando arquivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    })

    // File validation
    if (file.type !== "application/pdf") {
      toast({
        title: "❌ Erro de formato",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "❌ Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsUploadLoading(true)

    try {
      console.log("Creating FormData...")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", tipoResumo)

      console.log("Sending request to API...")
      const response = await fetch("/api/resumo-pdf", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.resumo && data.textoExtraido) {
        // Set the generated content
        setResumoGerado(data.resumo)
        setTexto(data.textoExtraido)
        setTextoOriginalAtual(data.textoExtraido)

        // Switch to "Gerar" tab to show results
        setActiveTab("gerar")

        // Success notification
        toast({
          title: "✅ PDF processado com sucesso!",
          description: `Resumo ${tipoResumo} gerado a partir de "${data.nomeArquivo}". Confira na aba 'Gerar'.`,
        })

        console.log("PDF processed successfully")
      } else {
        throw new Error("Resposta inválida do servidor")
      }
    } catch (error) {
      console.error("Upload error:", error)

      let errorMessage = "Não foi possível processar o PDF. Tente novamente."
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        } else if (error.message.includes("API")) {
          errorMessage = "Erro no serviço de resumo. Tente novamente em alguns minutos."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "❌ Erro no processamento",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploadLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const abrirResumoCompleto = (resumo: Resumo) => {
    setSelectedResumo(resumo)
    setIsModalOpen(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
        handleFileUpload({ target: { files: dataTransfer.files } } as any)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerador de Resumos</h1>
        <p className="text-gray-600">Transforme textos longos em resumos organizados e didáticos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="gerar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Gerar</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle>Texto para resumir</CardTitle>
                <CardDescription>Cole ou digite o conteúdo que deseja resumir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de resumo</Label>
                  <Select value={tipoResumo} onValueChange={(value: "conciso" | "detalhado") => setTipoResumo(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conciso">Conciso (pontos principais)</SelectItem>
                      <SelectItem value="detalhado">Detalhado (estruturado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="texto">Conteúdo</Label>
                  <Textarea
                    id="texto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Cole aqui o texto da aula, capítulo do livro, artigo ou qualquer conteúdo que deseja resumir..."
                    className="min-h-[300px] resize-none"
                  />
                  <p className="text-xs text-gray-500">{texto.length} caracteres</p>
                </div>

                <Button
                  onClick={gerarResumo}
                  disabled={isLoading || !texto.trim()}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando resumo...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar resumo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle>Resumo gerado</CardTitle>
                <CardDescription>Seu resumo aparecerá aqui</CardDescription>
              </CardHeader>
              <CardContent>
                {resumoGerado ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg min-h-[300px]">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{resumoGerado}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={copiarResumo} variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button onClick={salvarResumo} variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button onClick={baixarPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                    <FileText className="h-12 w-12 mb-4 text-gray-300" />
                    <p>Seu resumo aparecerá aqui</p>
                    <p className="text-sm">Insira um texto e clique em "Gerar resumo"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Upload de arquivo</CardTitle>
              <CardDescription>Envie um arquivo PDF para gerar resumo automaticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-upload">Tipo de resumo</Label>
                  <Select value={tipoResumo} onValueChange={(value: "conciso" | "detalhado") => setTipoResumo(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conciso">Conciso (pontos principais)</SelectItem>
                      <SelectItem value="detalhado">Detalhado (estruturado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => !isUploadLoading && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {isUploadLoading ? (
                    <>
                      <Loader2 className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                      <h3 className="text-lg font-medium mb-2">Processando PDF...</h3>
                      <p className="text-gray-500">Extraindo texto e gerando resumo</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Arraste e solte seu arquivo aqui</h3>
                      <p className="text-gray-500 mb-4">ou</p>
                      <Button type="button" disabled={isUploadLoading}>
                        Selecionar arquivo
                      </Button>
                      <p className="text-xs text-gray-500 mt-4">Formato suportado: PDF (máx. 10MB)</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploadLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Resumos salvos ({resumosSalvos.length})</CardTitle>
              <CardDescription>Acesse seus resumos anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              {resumosSalvos.length > 0 ? (
                <div className="space-y-4">
                  {resumosSalvos.map((resumo) => (
                    <div key={resumo.id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{resumo.titulo}</h4>
                        <span className="text-xs text-gray-500">{resumo.data}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{resumo.conteudo}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              resumo.tipo === "detalhado" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}
                          </span>
                          {resumo.nomeArquivo && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              PDF
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => abrirResumoCompleto(resumo)}>
                          Ver completo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum resumo salvo</p>
                  <p className="text-sm">Gere resumos para vê-los aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para visualizar resumo completo */}
      {selectedResumo && (
        <ResumoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} resumo={selectedResumo} />
      )}
    </div>
  )
}
