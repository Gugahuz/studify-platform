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
import { ResumoModal } from "@/components/resumo-modal"
import { NotificationSystem, useNotifications } from "@/components/notification-system"
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

  // Estados específicos para upload
  const [uploadResumo, setUploadResumo] = useState("")
  const [uploadTextoOriginal, setUploadTextoOriginal] = useState("")
  const [tipoResumoUpload, setTipoResumoUpload] = useState<"conciso" | "detalhado">("conciso")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notifications, addNotification, removeNotification } = useNotifications()

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
      addNotification({
        type: "error",
        title: "Texto obrigatório",
        description: "Por favor, insira um texto para resumir.",
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

      addNotification({
        type: "success",
        title: "Resumo gerado!",
        description: "Seu resumo foi criado com sucesso.",
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const salvarResumo = () => {
    if (!resumoGerado) {
      addNotification({
        type: "error",
        title: "Nada para salvar",
        description: "Não há resumo para salvar.",
      })
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
    addNotification({
      type: "success",
      title: "Resumo salvo!",
      description: "Adicionado ao histórico com sucesso.",
    })
  }

  const salvarResumoUpload = () => {
    if (!uploadResumo) {
      addNotification({
        type: "error",
        title: "Nada para salvar",
        description: "Não há resumo para salvar.",
      })
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
    addNotification({
      type: "success",
      title: "Resumo salvo!",
      description: "Adicionado ao histórico com sucesso.",
    })
  }

  const copiarResumo = () => {
    if (!resumoGerado) {
      addNotification({
        type: "error",
        title: "Nada para copiar",
        description: "Não há resumo para copiar.",
      })
      return
    }

    navigator.clipboard.writeText(resumoGerado)
    addNotification({
      type: "success",
      title: "Copiado!",
      description: "Resumo copiado para área de transferência.",
    })
  }

  const copiarResumoUpload = () => {
    if (!uploadResumo) {
      addNotification({
        type: "error",
        title: "Nada para copiar",
        description: "Não há resumo para copiar.",
      })
      return
    }

    navigator.clipboard.writeText(uploadResumo)
    addNotification({
      type: "success",
      title: "Copiado!",
      description: "Resumo copiado para área de transferência.",
    })
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
      addNotification({
        type: "success",
        title: "PDF baixado!",
        description: "Arquivo salvo com sucesso.",
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erro no download",
        description: "Não foi possível gerar o PDF.",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validações iniciais
    if (file.type !== "application/pdf") {
      addNotification({
        type: "error",
        title: "Formato inválido",
        description: "Apenas arquivos PDF são aceitos.",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      addNotification({
        type: "error",
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
      })
      return
    }

    setIsUploadLoading(true)

    // Notificação de carregamento
    const loadingId = addNotification({
      type: "loading",
      title: "Processando PDF...",
      description: `Analisando: ${file.name}`,
      duration: 0, // Não remove automaticamente
    })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tipo", tipoResumoUpload)

      const response = await fetch("/api/resumo-pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      // Remove notificação de carregamento
      removeNotification(loadingId)

      if (response.ok && data.success) {
        setUploadResumo(data.resumo)
        setUploadTextoOriginal(data.textoExtraido)

        addNotification({
          type: "success",
          title: "PDF processado com sucesso!",
          description: data.fallback ? "Resumo gerado com método alternativo." : "Resumo gerado com IA avançada.",
        })
      } else {
        throw new Error(data.error || "Erro no processamento")
      }
    } catch (error) {
      // Remove notificação de carregamento
      removeNotification(loadingId)

      let errorMessage = "Falha ao processar PDF. Tente novamente."
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet."
        } else if (error.message.includes("503")) {
          errorMessage = "Serviço temporariamente indisponível."
        } else {
          errorMessage = error.message
        }
      }

      addNotification({
        type: "error",
        title: "Erro no processamento",
        description: errorMessage,
      })
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
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card className="border-green-200">
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
                    className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-400 transition-colors min-h-[300px]"
                    onClick={() => !isUploadLoading && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isUploadLoading ? (
                      <>
                        <Loader2 className="h-12 w-12 text-green-500 mb-4 animate-spin" />
                        <h3 className="text-lg font-medium mb-2">Processando PDF...</h3>
                        <p className="text-gray-500">Extraindo texto e gerando resumo</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-green-400 mb-4" />
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
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
                <CardDescription>O resumo do seu PDF aparecerá aqui</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadResumo ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg min-h-[300px]">
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
                    <FileText className="h-12 w-12 mb-4 text-green-300" />
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
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
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
