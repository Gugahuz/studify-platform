"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Copy, Download, X } from "lucide-react"
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
    nomeArquivo?: string
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
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = 30

      // Título
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(resumo.titulo, margin, yPosition)
      yPosition += 15

      // Informações do resumo
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Data: ${resumo.data}`, margin, yPosition)
      yPosition += 10
      doc.text(`Tipo: ${resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}`, margin, yPosition)
      if (resumo.nomeArquivo) {
        yPosition += 10
        doc.text(`Arquivo: ${resumo.nomeArquivo}`, margin, yPosition)
      }
      yPosition += 20

      // Conteúdo do resumo
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      const splitText = doc.splitTextToSize(resumo.conteudo, maxWidth)

      for (let i = 0; i < splitText.length; i++) {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 30
        }
        doc.text(splitText[i], margin, yPosition)
        yPosition += 7
      }

      // Se houver texto original, adicionar em nova página
      if (resumo.textoOriginal) {
        doc.addPage()
        yPosition = 30

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Texto Original", margin, yPosition)
        yPosition += 20

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const splitOriginal = doc.splitTextToSize(resumo.textoOriginal, maxWidth)

        for (let i = 0; i < splitOriginal.length; i++) {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = 30
          }
          doc.text(splitOriginal[i], margin, yPosition)
          yPosition += 6
        }
      }

      const fileName = `${resumo.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF baixado!",
        description: "O resumo foi salvo como PDF com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{resumo.titulo}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Data: {resumo.data}</span>
            <span>Tipo: {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}</span>
            {resumo.nomeArquivo && <span>Arquivo: {resumo.nomeArquivo}</span>}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {resumo.textoOriginal ? (
            // Side-by-side layout when original text exists
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Original Text Panel */}
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Texto Original
                  </CardTitle>
                  <CardDescription>Conteúdo fornecido para resumir</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col">
                  <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto mb-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{resumo.textoOriginal}</div>
                  </div>
                  <Button
                    onClick={() => copiarTexto(resumo.textoOriginal!, "Texto original")}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Original
                  </Button>
                </CardContent>
              </Card>

              {/* Summary Panel */}
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Resumo {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}
                  </CardTitle>
                  <CardDescription>Resumo gerado automaticamente</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col">
                  <div className="bg-blue-50 p-4 rounded-lg flex-1 overflow-y-auto mb-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{resumo.conteudo}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button onClick={() => copiarTexto(resumo.conteudo, "Resumo")} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Resumo
                    </Button>
                    <Button onClick={baixarPDF} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Single panel layout when no original text
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo {resumo.tipo === "detalhado" ? "Detalhado" : "Conciso"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto mb-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{resumo.conteudo}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
