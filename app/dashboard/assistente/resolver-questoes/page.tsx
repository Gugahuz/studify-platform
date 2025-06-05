import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"

export default function ResolverQuestoesPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Resolver Questões por fotos</h1>
          <p className="text-gray-600">Tire foto de questões e receba soluções detalhadas</p>
        </div>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Upload de Questão
          </CardTitle>
          <CardDescription>Envie uma foto da questão para obter a resolução passo a passo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50">
            <Camera className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-gray-900">Arraste e solte sua imagem aqui</h3>
            <p className="text-gray-500 mb-4">ou</p>
            <Button className="bg-blue-600 hover:bg-blue-700">Selecionar arquivo</Button>
            <p className="text-xs text-gray-500 mt-4">Formatos suportados: JPG, PNG, PDF (máx. 10MB)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
