"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, History, Loader2, Copy, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Resumo = {
  id: number
  titulo: string
  conteudo: string
  tipo: "conciso" | "detalhado"
  data: string
}

export default function ResumosPage() {
  const [texto, setTexto] = useState("")
  const [tipoResumo, setTipoResumo] = useState<"conciso" | "detalhado">("conciso")
  const [resumoGerado, setResumoGerado] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resumosSalvos, setResumosSalvos] = useState<Resumo[]>([])
  const { toast } = useToast()

  // Carregar resumo gerado do sessionStorage
  useEffect(() => {
    const savedResumo = sessionStorage.getItem("resumo-gerado")
    if (savedResumo) {
      setResumoGerado(savedResumo)
    }
  }, [])

  // Salvar resumo gerado no sessionStorage
  useEffect(() => {
    if (resumoGerado) {
      sessionStorage.setItem("resumo-gerado", resumoGerado)
    }
  }, [resumoGerado])

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

      toast({
        title: "Resumo gerado!",
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
    if (!resumoGerado) return

    const novoResumo: Resumo = {
      id: Date.now(),
      titulo: `Resumo ${tipoResumo} - ${new Date().toLocaleDateString()}`,
      conteudo: resumoGerado,
      tipo: tipoResumo,
      data: new Date().toLocaleDateString(),
    }

    setResumosSalvos([novoResumo, ...resumosSalvos])
    toast({
      title: "Resumo salvo!",
      description: "O resumo foi adicionado ao seu histórico.",
    })
  }

  const copiarResumo = () => {
    navigator.clipboard.writeText(resumoGerado)
    toast({
      title: "Copiado!",
      description: "Resumo copiado para a área de transferência.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerador de Resumos</h1>
        <p className="text-gray-600">Transforme textos longos em resumos organizados e didáticos</p>
      </div>

      <Tabs defaultValue="gerar">
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
                      <div className="whitespace-pre-wrap text-sm">{resumoGerado}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={copiarResumo} variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button onClick={salvarResumo} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Salvar
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
              <CardDescription>Envie um arquivo PDF ou documento para gerar resumo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Arraste e solte seu arquivo aqui</h3>
                <p className="text-gray-500 mb-4">ou</p>
                <Button>Selecionar arquivo</Button>
                <p className="text-xs text-gray-500 mt-4">Formatos suportados: PDF, DOC, DOCX (máx. 10MB)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Resumos salvos</CardTitle>
              <CardDescription>Acesse seus resumos anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              {resumosSalvos.length > 0 ? (
                <div className="space-y-4">
                  {resumosSalvos.map((resumo) => (
                    <div key={resumo.id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{resumo.titulo}</h4>
                        <span className="text-xs text-gray-500">{resumo.data}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{resumo.conteudo}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            resumo.tipo === "detalhado" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}
                        </span>
                        <Button size="sm" variant="ghost">
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
    </div>
  )
}
