"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, RefreshCw, Copy, Download, Wand2 } from "lucide-react"
import Link from "next/link"
import { useCustomToast } from "@/hooks/use-custom-toast"

export default function ParafraseadorPage() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState("academico")
  const { showToast } = useCustomToast()

  const styles = [
    { id: "academico", name: "Acadêmico", description: "Linguagem formal e técnica" },
    { id: "informal", name: "Informal", description: "Linguagem casual e descontraída" },
    { id: "criativo", name: "Criativo", description: "Linguagem expressiva e original" },
    { id: "objetivo", name: "Objetivo", description: "Linguagem direta e concisa" },
    { id: "detalhado", name: "Detalhado", description: "Linguagem explicativa e completa" },
  ]

  const handleParaphrase = async () => {
    if (!inputText.trim()) {
      showToast("Por favor, insira um texto para parafrasear.", "error")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/parafrasear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          style: selectedStyle,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao parafrasear texto")
      }

      const data = await response.json()
      setOutputText(data.paraphrasedText)
      showToast("Texto parafraseado com sucesso!", "success")
    } catch (error) {
      console.error("Erro:", error)
      showToast("Erro ao parafrasear texto. Tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      showToast("Texto copiado para a área de transferência!", "success")
    } catch (error) {
      showToast("Erro ao copiar texto.", "error")
    }
  }

  const downloadText = () => {
    const element = document.createElement("a")
    const file = new Blob([outputText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "texto-parafraseado.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    showToast("Arquivo baixado com sucesso!", "success")
  }

  const clearAll = () => {
    setInputText("")
    setOutputText("")
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
          <h1 className="text-2xl font-bold text-gray-900">Parafraseador</h1>
          <p className="text-gray-600">Reescreva textos de forma inteligente e natural</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-teal-600" />
              Texto Original
            </CardTitle>
            <CardDescription>Cole ou digite o texto que deseja parafrasear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole seu texto aqui..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[300px] resize-none"
            />

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{inputText.length} caracteres</span>
              <span>
                {
                  inputText
                    .trim()
                    .split(/\s+/)
                    .filter((word) => word.length > 0).length
                }{" "}
                palavras
              </span>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Estilo de Escrita:</label>
              <div className="grid grid-cols-1 gap-2">
                {styles.map((style) => (
                  <label key={style.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="style"
                      value={style.id}
                      checked={selectedStyle === style.id}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{style.name}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleParaphrase}
                disabled={isLoading || !inputText.trim()}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Parafraseando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Parafrasear
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearAll} disabled={!inputText && !outputText}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal-600" />
              Texto Parafraseado
            </CardTitle>
            <CardDescription>Resultado da paráfrase com linguagem natural</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="O texto parafraseado aparecerá aqui..."
              value={outputText}
              readOnly
              className="min-h-[300px] resize-none bg-gray-50"
            />

            {outputText && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{outputText.length} caracteres</span>
                  <span>
                    {
                      outputText
                        .trim()
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length
                    }{" "}
                    palavras
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" onClick={downloadText} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="border-teal-100 bg-teal-50">
        <CardHeader>
          <CardTitle className="text-teal-800">💡 Dicas para Melhores Resultados</CardTitle>
        </CardHeader>
        <CardContent className="text-teal-700">
          <ul className="space-y-2 text-sm">
            <li>
              • <strong>Textos claros:</strong> Use textos bem estruturados para melhores resultados
            </li>
            <li>
              • <strong>Estilo adequado:</strong> Escolha o estilo que melhor se adapta ao seu contexto
            </li>
            <li>
              • <strong>Revisão:</strong> Sempre revise o texto parafraseado antes de usar
            </li>
            <li>
              • <strong>Originalidade:</strong> O parafraseador mantém o sentido original com linguagem natural
            </li>
            <li>
              • <strong>Contexto:</strong> Considere o público-alvo ao escolher o estilo de escrita
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
