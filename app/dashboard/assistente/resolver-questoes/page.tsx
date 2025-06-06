"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import Image from "next/image"

interface ResolucaoResult {
  success: boolean
  resolucao: string
  nomeArquivo: string
  fallback?: boolean
}

export default function ResolverQuestoesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultado, setResultado] = useState<ResolucaoResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResultado(null)
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
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/resolver-questao", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResultado(data)
      } else {
        console.error("Erro:", data.error)
        // Mostrar erro para o usuário
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
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
          <p className="text-gray-600">Tire foto de questões e receba soluções detalhadas</p>
        </div>
      </div>

      {!selectedFile ? (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Upload de Questão
            </CardTitle>
            <CardDescription>Envie uma foto da questão para obter a resolução passo a passo</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Camera className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">Arraste e solte sua imagem aqui</h3>
              <p className="text-gray-500 mb-4">ou</p>

              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar arquivo
                </Button>

                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Usar câmera
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">Formatos suportados: JPG, PNG, WEBP (máx. 10MB)</p>
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
                <CardTitle>Imagem Selecionada</CardTitle>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative max-w-md w-full">
                  {previewUrl && (
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview da questão"
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg border shadow-sm"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>

                {!resultado && (
                  <Button onClick={processImage} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      "Resolver Questão"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultado da resolução */}
          {resultado && (
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-green-700">Resolução da Questão</CardTitle>
                {resultado.fallback && (
                  <CardDescription className="text-amber-600">Resolução gerada com método alternativo</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{resultado.resolucao}</div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={clearSelection} className="mr-3">
                    Resolver Nova Questão
                  </Button>
                  <Button onClick={processImage} disabled={isProcessing} variant="outline">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reprocessando...
                      </>
                    ) : (
                      "Reprocessar Imagem"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
