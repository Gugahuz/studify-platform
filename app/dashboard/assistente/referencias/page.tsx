import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function ReferenciasPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Gerador de referências</h1>
          <p className="text-gray-600">Gere referências bibliográficas automaticamente</p>
        </div>
      </div>

      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Gerador de Referências
          </CardTitle>
          <CardDescription>Esta funcionalidade está em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-orange-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Em breve!</h3>
            <p className="text-gray-600">Estamos trabalhando para trazer esta funcionalidade em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
