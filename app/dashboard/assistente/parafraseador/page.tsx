"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, RefreshCw, Copy, Check, Wand2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ParafraseadorPage() {
  const [inputText, setInputText] = useState("")
  const [paraphrasedText, setParaphrasedText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState("neutro")
  const [style, setStyle] = useState("academico")
  const [complexity, setComplexity] = useState("medio")
  const [error, setError] = useState("")

  const handleParaphrase = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError("")
    setParaphrasedText("")

    try {
      console.log("Enviando requisição para paráfrase...")

      const response = await fetch("/api/parafrasear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          tone,
          style,
          complexity,
        }),
      })

      console.log("Status da resposta:", response.status)

      const data = await response.json()
      console.log("Dados recebidos:", data)

      if (!response.ok && !data.paraphrasedText) {
        throw new Error(data.error || "Erro desconhecido")
      }

      if (data.paraphrasedText) {
        setParaphrasedText(data.paraphrasedText)
      } else {
        throw new Error("Resposta inválida do servidor")
      }

      if (data.error) {
        setError(data.error)
      }
    } catch (error: any) {
      console.error("Erro no handleParaphrase:", error)
      setError(error.message || "Erro ao parafrasear texto")
      setParaphrasedText("Ocorreu um erro ao processar sua solicitação. Verifique sua conexão e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paraphrasedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
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
          <h1 className="text-2xl font-bold text-gray-900">Parafraseador Inteligente</h1>
          <p className="text-gray-600">Reescreva textos com precisão e personalização avançada</p>
        </div>
      </div>

      {/* Erro Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações */}
      <Card className="border-teal-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-teal-600" />
            Configurações de Paráfrase
          </CardTitle>
          <CardDescription>Personalize como você deseja que o texto seja reescrito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tom do Texto</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                  <SelectItem value="persuasivo">Persuasivo</SelectItem>
                  <SelectItem value="explicativo">Explicativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Estilo de Escrita</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academico">Acadêmico</SelectItem>
                  <SelectItem value="jornalistico">Jornalístico</SelectItem>
                  <SelectItem value="criativo">Criativo</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="conversacional">Conversacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Nível de Complexidade</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a complexidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal-600" />
              Texto Original
            </CardTitle>
            <CardDescription>Cole ou digite o texto que deseja parafrasear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole seu texto aqui para ser parafraseado com as configurações selecionadas..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {inputText.length} caracteres • {inputText.split(" ").filter((word) => word.length > 0).length} palavras
              </span>
              <Button
                onClick={handleParaphrase}
                disabled={!inputText.trim() || isLoading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Parafrasear Texto
                  </>
                )}
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
            <CardDescription>
              Resultado personalizado: {tone} • {style} • {complexity}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[300px] p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-lg border border-teal-200">
              {paraphrasedText ? (
                <div className="space-y-3">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{paraphrasedText}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 text-teal-300 mx-auto mb-3" />
                    <p className="text-gray-500 italic">O texto parafraseado aparecerá aqui...</p>
                    <p className="text-sm text-gray-400 mt-1">Configure as opções e clique em "Parafrasear Texto"</p>
                  </div>
                </div>
              )}
            </div>
            {paraphrasedText && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {paraphrasedText.length} caracteres •{" "}
                  {paraphrasedText.split(" ").filter((word) => word.length > 0).length} palavras
                </span>
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Texto
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card className="border-teal-100 bg-gradient-to-r from-teal-50 to-green-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-teal-700 mb-1">🎯 Precisão</div>
              <div className="text-gray-600">Mantém o significado original com alta fidelidade</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-teal-700 mb-1">⚡ Personalização</div>
              <div className="text-gray-600">Adapta tom, estilo e complexidade conforme necessário</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-teal-700 mb-1">🔒 Qualidade</div>
              <div className="text-gray-600">Resultado profissional com IA avançada</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
