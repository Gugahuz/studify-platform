import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileQuestion } from "lucide-react"
import Link from "next/link"

export default function SimuladosPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Simulados</h1>
          <p className="text-gray-600">Pratique com simulados personalizados</p>
        </div>
      </div>

      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-red-600" />
            Simulados Personalizados
          </CardTitle>
          <CardDescription>Esta funcionalidade está em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileQuestion className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Em breve!</h3>
            <p className="text-gray-600">Estamos trabalhando para trazer esta funcionalidade em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
