"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Upload, X, Loader2, AlertCircle, CheckCircle, RefreshCw, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import Image from "next/image"

interface ResolucaoResult {
  success: boolean
  resolucao: string
  nomeArquivo: string
  fallback?: boolean
  error?: string
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
        <div className="space-y-6">
          {/* Preview da imagem */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Imagem Carregada
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative max-w-lg w-full">
                  {previewUrl && (
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview da questão"
                      width={500}
                      height={400}
                      className="w-full h-auto rounded-lg border shadow-lg"
                    />
                  )}
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                {!resultado && (
                  <div className="flex flex-col items-center space-y-3">
                    {isProcessing && processingStep && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{processingStep}</span>
                      </div>
                    )}

                    <Button
                      onClick={processImage}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Resolver Questão
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultado da resolução */}
          {resultado && (
            <Card className={resultado.fallback ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 ${resultado.fallback ? "text-amber-700" : "text-green-700"}`}
                >
                  {resultado.fallback ? (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      Resolução Alternativa
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Questão Resolvida
                    </>
                  )}
                </CardTitle>
                {resultado.fallback && (
                  <CardDescription className="text-amber-600">
                    Processamento com método alternativo - tente uma nova foto para melhor precisão
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                    {resultado.resolucao}
                  </div>
                </div>

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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
