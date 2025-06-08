"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Quote, Upload, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CitacoesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [citacoes, setCitacoes] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setCitacoes(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extrair-citacoes", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setCitacoes(result.citacoes)
      } else {
        setCitacoes("Erro ao extrair citações. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro no upload:", error)
      setCitacoes("Erro ao processar arquivo. Tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setCitacoes(null)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription>Faça upload de um documento PDF ou imagem para extrair citações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Clique para selecionar um arquivo</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG ou WEBP (máx. 20MB)</p>
              </label>
            </div>

            {file && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">{file.name}</p>
                    <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button onClick={resetUpload} variant="outline" size="sm">
                    Remover
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extraindo citações...
                </>
              ) : (
                <>
                  <Quote className="h-4 w-4 mr-2" />
                  Extrair Citações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-green-600" />
              Citações Extraídas
            </CardTitle>
            <CardDescription>Citações importantes encontradas no documento</CardDescription>
          </CardHeader>
          <CardContent>
            {citacoes ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-sm text-green-900">{citacoes}</div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Quote className="h-16 w-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma citação extraída ainda</h3>
                <p className="text-gray-600">Faça upload de um documento para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
