"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, History, Loader2, Copy, Download, CheckCircle, AlertCircle } from "lucide-react"
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

type NotificationState = {
  type: "success" | "error" | "info" | null
  message: string
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
  const [notification, setNotification] = useState<NotificationState>({ type: null, message: "" })

  // Estados específicos para upload
  const [uploadResumo, setUploadResumo] = useState("")
  const [uploadTextoOriginal, setUploadTextoOriginal] = useState("")
  const [uploadNotification, setUploadNotification] = useState<NotificationState>({ type: null, message: "" })
  const [tipoResumoUpload, setTipoResumoUpload] = useState<"conciso" | "detalhado">("conciso")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para mostrar notificação
  const showNotification = (type: "success" | "error" | "info", message: string, isUpload = false) => {
    if (isUpload) {
      setUploadNotification({ type, message })
      setTimeout(() => setUploadNotification({ type: null, message: "" }), 5000)
    } else {
      setNotification({ type, message })
      setTimeout(() => setNotification({ type: null, message: "" }), 5000)
    }
  }

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
      showNotification("error", "Por favor, insira um texto para resumir.")
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

      showNotification("success", "✅ Resumo gerado com sucesso!")
    } catch (error) {
      showNotification("error", "❌ Erro ao gerar resumo. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const salvarResumo = () => {
    if (!resumoGerado) {
      showNotification("error", "❌ Nenhum resumo para salvar.")
      return
    }

    const novoResumo: Resumo = {
      id: Date.now(),
      titulo: `Resumo ${tipoResumo} - ${new Date().toLocaleDateString()}`,
      conteudo: resumoGerado,
      textoOriginal: textoOriginalAtual,
      tipo: tipoResumo,
      data: new Date().toLocaleDateString(),
    }

    setResumosSalvos([novoResumo, ...resumosSalvos])
    showNotification("success", "✅ Resumo salvo no histórico!")
  }

  const salvarResumoUpload = () => {
    if (!uploadResumo) {
      showNotification("error", "❌ Nenhum resumo para salvar.", true)
      return
    }

    const novoResumo: Resumo = {
      id: Date.now(),
      titulo: `Resumo ${tipoResumoUpload} - ${new Date().toLocaleDateString()}`,
      conteudo: uploadResumo,
      textoOriginal: uploadTextoOriginal,
      tipo: tipoResumoUpload,
      data: new Date().toLocaleDateString(),
      nomeArquivo: "PDF Upload",
    }

    setResumosSalvos([novoResumo, ...resumosSalvos])
    showNotification("success", "✅ Resumo salvo no histórico!", true)
  }

  const copiarResumo = () => {
    if (!resumoGerado) {
      showNotification("error", "❌ Nenhum resumo para copiar.")
      return
    }

    navigator.clipboard.writeText(resumoGerado)
    showNotification("success", "✅ Resumo copiado!")
  }

  const copiarResumoUpload = () => {
    if (!uploadResumo) {
      showNotification("error", "❌ Nenhum resumo para copiar.", true)
      return
    }

    navigator.clipboard.writeText(uploadResumo)
    showNotification("success", "✅ Resumo copiado!", true)
  }

  const baixarPDF = (resumoParaBaixar: string, tipoParaBaixar: string) => {
    if (!resumoParaBaixar) return

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      const maxWidth = pageWidth - 2 * margin

      doc.setFontSize(16)
      doc.text(`Resumo ${tipoParaBaixar}`, margin, 30)

      doc.setFontSize(12)
      const splitText = doc.splitTextToSize(resumoParaBaixar, maxWidth)
      doc.text(splitText, margin, 50)

      doc.save(`resumo-${Date.now()}.pdf`)
      showNotification("success", "✅ PDF baixado com sucesso!")
    } catch (error) {
      showNotification("error", "❌ Erro ao gerar PDF.")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    showNotification("info", "📤 Processando arquivo...", true)

    if (file.type !== "application/pdf") {
      showNotification("error", "❌ Apenas arquivos PDF são aceitos.", true)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification("error", "❌ Arquivo muito grande (máx. 10MB).", true)
      return
    }

    setIsUploadLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", tipoResumoUpload)

      const response = await fetch("/api/resumo-pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUploadResumo(data.resumo)
        setUploadTextoOriginal(data.textoExtraido)
        showNotification("success", "✅ PDF processado com sucesso!", true)
      } else {
        throw new Error(data.error || "Erro no processamento")
      }
    } catch (error) {
      showNotification("error", "❌ Falha ao processar PDF. Tente novamente.", true)
    } finally {
      setIsUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
          {notification.type && (
            <Alert
              className={`mb-4 ${notification.type === "success" ? "border-green-200 bg-green-50" : notification.type === "error" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          )}

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
                      <Button onClick={() => baixarPDF(resumoGerado, tipoResumo)} variant="outline" size="sm">
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
          {uploadNotification.type && (
            <Alert
              className={`mb-4 ${uploadNotification.type === "success" ? "border-green-200 bg-green-50" : uploadNotification.type === "error" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadNotification.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Upload de arquivo</CardTitle>
                <CardDescription>Envie um arquivo PDF para gerar resumo automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-upload">Tipo de resumo</Label>
                    <Select
                      value={tipoResumoUpload}
                      onValueChange={(value: "conciso" | "detalhado") => setTipoResumoUpload(value)}
                    >
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
                    className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-lg p-12 text-center cursor-pointer hover:border-orange-400 transition-colors min-h-[300px]"
                    onClick={() => !isUploadLoading && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isUploadLoading ? (
                      <>
                        <Loader2 className="h-12 w-12 text-orange-500 mb-4 animate-spin" />
                        <h3 className="text-lg font-medium mb-2">Processando PDF...</h3>
                        <p className="text-gray-500">Extraindo texto e gerando resumo</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-orange-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Arraste e solte seu arquivo aqui</h3>
                        <p className="text-gray-500 mb-4">ou</p>
                        <Button type="button" disabled={isUploadLoading} className="bg-green-600 hover:bg-green-700">
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

            {/* Resumo Section */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
                <CardDescription>O resumo do seu PDF aparecerá aqui</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadResumo ? (
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg min-h-[300px]">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{uploadResumo}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={copiarResumoUpload} variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button onClick={salvarResumoUpload} variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button onClick={() => baixarPDF(uploadResumo, tipoResumoUpload)} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                    <FileText className="h-12 w-12 mb-4 text-orange-300" />
                    <p>Seu resumo aparecerá aqui</p>
                    <p className="text-sm">Faça upload de um PDF para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
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
