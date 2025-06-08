"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Upload, X, Loader2, AlertCircle, CheckCircle, RefreshCw, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface ResolucaoResult {
  success: boolean
  resolucao: string
  nomeArquivo: string
  fallback?: boolean
  error?: string
}

// Função para processar o texto e destacar APENAS equações matemáticas COMPLETAS
const processTextWithEquations = (text: string) => {
  const parts = text.split("\n").map((line, lineIndex) => {
    // Regex para capturar equações matemáticas COMPLETAS
    const completeEquationRegex =
      /([0-9]*[a-zA-Z][²³⁴⁵⁶⁷⁸⁹¹⁰]?(?:\s*[+\-×*/]\s*[0-9]*[a-zA-Z]?[²³⁴⁵⁶⁷⁸⁹¹⁰]?)*(?:\s*[+\-×*/]\s*[0-9]+[a-zA-Z]?[²³⁴⁵⁶⁷⁸⁹¹⁰]?)*\s*=\s*[0-9]+(?:\s*[+\-×*/]\s*[0-9]+)*|[a-zA-Z]\s*=\s*[0-9]+(?:\s*\/\s*[0-9]+)?(?:\s*[+\-×*/]\s*[0-9]+)*|[a-zA-Z]\s*=\s*[0-9]+(?:\s*e\s*[a-zA-Z]\s*=\s*[0-9]+)*)/g

    // Verifica se a linha contém uma equação matemática
    const hasEquation = completeEquationRegex.test(line)

    if (hasEquation) {
      // Reset regex para usar novamente
      completeEquationRegex.lastIndex = 0

      const parts = []
      let lastIndex = 0
      let match

      while ((match = completeEquationRegex.exec(line)) !== null) {
        // Adiciona texto antes da equação
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index))
        }

        // Adiciona a equação completa destacada
        parts.push(
          <span
            key={`${lineIndex}-${match.index}`}
            className="math-equation"
            style={{
              fontFamily: '"Edu NSW ACT Foundation", "Edu NSW ACT Hand Cursive", cursive',
              fontWeight: "bold",
              fontSize: "1.1em",
              color: "#1f2937",
              letterSpacing: "0.5px",
            }}
          >
            {match[0].trim()}
          </span>,
        )

        lastIndex = match.index + match[0].length
      }

      // Adiciona texto restante
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex))
      }

      return (
        <div key={lineIndex} className="mb-2">
          {parts.length > 0 ? parts : line}
        </div>
      )
    }

    // Para linhas sem equações matemáticas, retorna texto normal
    return (
      <div key={lineIndex} className="mb-2">
        {line}
      </div>
    )
  })

  return parts
}

export default function ResolverQuestoesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultado, setResultado] = useState<ResolucaoResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Carregar a fonte do Google Fonts
  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Edu+NSW+ACT+Foundation:wght@400;500;600;700&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [])

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      // Validar tamanho
      if (file.size > 20 * 1024 * 1024) {
        setError("Arquivo muito grande. Máximo 20MB permitido.")
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResultado(null)
      setError(null)
      setProcessingStep("")
    } else {
      setError("Por favor, selecione apenas arquivos de imagem (JPG, PNG, WEBP)")
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setResultado(null)
    setError(null)
    setProcessingStep("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    setProcessingStep("Preparando imagem...")

    try {
      console.log("🚀 Iniciando processamento da imagem...")
      setProcessingStep("Enviando para análise...")

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/resolver-questao", {
        method: "POST",
        body: formData,
      })

      setProcessingStep("Processando resposta...")

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Dados recebidos:", data)

      if (data.success) {
        setResultado(data)
        setProcessingStep("Concluído!")
        console.log("✅ Resultado definido com sucesso")
      } else {
        throw new Error(data.error || "Erro desconhecido ao processar imagem")
      }
    } catch (error) {
      console.error("❌ Erro ao processar imagem:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
      setProcessingStep("")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Edu+NSW+ACT+Foundation:wght@400;500;600;700&display=swap');
        
        .math-equation {
          font-family: "Edu NSW ACT Foundation", "Edu NSW ACT Hand Cursive", cursive !important;
          font-weight: bold !important;
          font-size: 1.1em !important;
          color: #1f2937 !important;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assistente">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resolver Questões por Fotos</h1>
            <p className="text-gray-600">Tecnologia similar ao Photomath e Google Lens</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedFile ? (
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Análise Inteligente de Imagens
              </CardTitle>
              <CardDescription>
                Tecnologia avançada para resolver questões de qualquer disciplina através de fotos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : "border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative">
                  <Camera className="h-16 w-16 text-blue-400 mb-4" />
                  {dragActive && <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-pulse" />}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {dragActive ? "Solte a imagem aqui!" : "Envie sua questão"}
                </h3>
                <p className="text-gray-500 mb-6">Arraste e solte ou clique para selecionar uma imagem</p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher Arquivo
                  </Button>

                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      cameraInputRef.current?.click()
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Usar Câmera
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>📱 Formatos: JPG, PNG, WEBP (máx. 20MB)</p>
                  <p>🎯 Funciona com: Matemática, História, Ciências, Português e mais!</p>
                  <p>💡 Dica: Use boa iluminação para melhores resultados</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna da esquerda - Imagem e Informações */}
            <div className="md:col-span-1 space-y-6">
              <Card className="border-blue-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Imagem Carregada
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-full">
                      {previewUrl && (
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview da questão"
                          width={400}
                          height={300}
                          className="w-full h-auto rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações */}
              <Card className="border-blue-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Nome do arquivo</p>
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Tamanho</p>
                    <p className="text-sm text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <div className="flex items-center gap-2">
                      {isProcessing ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-sm">{processingStep}</span>
                        </div>
                      ) : resultado ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-sm">Processado com sucesso</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-sm">Aguardando processamento</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!resultado && !isProcessing && (
                    <Button onClick={processImage} className="w-full bg-blue-600 hover:bg-blue-700 mt-4" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver Questão
                    </Button>
                  )}

                  {isProcessing && (
                    <div className="w-full bg-blue-50 text-blue-700 rounded-md p-2 text-xs text-center">
                      Processando sua imagem, aguarde um momento...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna da direita - Resolução */}
            <div className="md:col-span-2">
              <Card
                className={`h-full border ${resultado ? (resultado.fallback ? "border-green-200" : "border-green-200") : "border-gray-200"} shadow-sm`}
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-lg ${resultado ? (resultado.fallback ? "text-green-700" : "text-green-700") : "text-gray-700"}`}
                  >
                    {resultado ? "Resolução" : "Aguardando processamento..."}
                  </CardTitle>
                  {resultado && resultado.fallback && (
                    <CardDescription className="text-green-600 text-xs">
                      Processamento com método alternativo
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {resultado ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-800 leading-relaxed">
                        {processTextWithEquations(resultado.resolucao)}
                      </div>
                    </div>
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <p className="text-gray-500 text-sm">{processingStep}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-gray-400">
                      <Camera className="h-12 w-12 opacity-20" />
                      <p className="text-center">
                        Clique em "Resolver Questão" para processar a imagem e obter a resolução detalhada.
                      </p>
                    </div>
                  )}

                  {resultado && (
                    <div className="mt-6 pt-4 border-t flex flex-wrap gap-3">
                      <Button variant="outline" onClick={clearSelection} className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Nova Questão
                      </Button>

                      <Button
                        onClick={processImage}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Reprocessando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Tentar Novamente
                          </>
                        )}
                      </Button>

                      <Link href="/dashboard/assistente/chat">
                        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat com Studo
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
