"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Copy, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"

interface ResumoModalProps {
  isOpen: boolean
  onClose: () => void
  resumo: {
    id: number
    titulo: string
    conteudo: string
    textoOriginal?: string
    tipo: "conciso" | "detalhado"
    data: string
  }
}

export function ResumoModal({ isOpen, onClose, resumo }: ResumoModalProps) {
  const { toast } = useToast()

  const copiarTexto = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto)
    toast({
      title: "Copiado!",
      description: `${tipo} copiado para a área de transferência.`,
    })
  }

  const baixarPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const maxWidth = pageWidth - 2 * margin

    // Título
    doc.setFontSize(16)
    doc.text(resumo.titulo, margin, 30)

    // Data
    doc.setFontSize(10)
    doc.text(`Data: ${resumo.data}`, margin, 45)

    // Tipo
    doc.text(`Tipo: ${resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}`, margin, 55)

    // Conteúdo do resumo
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(resumo.conteudo, maxWidth)
    doc.text(splitText, margin, 75)

    doc.save(`${resumo.titulo}.pdf`)

    toast({
      title: "PDF baixado!",
      description: "O resumo foi salvo como PDF.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resumo.titulo}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="original" disabled={!resumo.textoOriginal}>
              Texto Original
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}
                </CardTitle>
                <CardDescription>Gerado em {resumo.data}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="whitespace-pre-wrap text-sm">{resumo.conteudo}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => copiarTexto(resumo.conteudo, "Resumo")} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={baixarPDF} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="original" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Texto Original
                </CardTitle>
                <CardDescription>Texto fornecido para resumir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {resumo.textoOriginal || "Texto original não disponível"}
                  </div>
                </div>
                {resumo.textoOriginal && (
                  <Button
                    onClick={() => copiarTexto(resumo.textoOriginal!, "Texto original")}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
