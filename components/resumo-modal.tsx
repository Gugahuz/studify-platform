"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto)
    toast({
      title: "✅ Copiado!",
      description: "Texto copiado para área de transferência.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{resumo.titulo}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[70vh]">
          {/* Texto Original */}
          {resumo.textoOriginal && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Texto Original</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-y-auto">
                <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">{resumo.textoOriginal}</div>
                <Button onClick={() => copiarTexto(resumo.textoOriginal!)} className="mt-4" variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Original
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              <div className="bg-blue-50 p-4 rounded text-sm whitespace-pre-wrap">{resumo.conteudo}</div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => copiarTexto(resumo.conteudo)} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
