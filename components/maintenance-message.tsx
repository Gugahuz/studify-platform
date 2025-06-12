import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MaintenanceMessageProps {
  title?: string
  message?: string
  showBackButton?: boolean
  backUrl?: string
  backText?: string
}

export function MaintenanceMessage({
  title = "Simulados em Manutenção",
  message = "Estamos trabalhando para melhorar a experiência dos simulados. Esta funcionalidade está temporariamente indisponível.",
  showBackButton = true,
  backUrl = "/dashboard",
  backText = "Voltar ao Dashboard",
}: MaintenanceMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-blue-200 shadow-lg">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-800">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 space-y-6">
          <p className="text-gray-700">{message}</p>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
              <AlertCircle className="h-4 w-4" />
              <span>Status da Manutenção</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              Estamos implementando melhorias significativas no sistema de simulados para oferecer uma experiência mais
              completa e personalizada.
            </p>
          </div>

          {showBackButton && (
            <div className="pt-2">
              <Link href={backUrl}>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {backText}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
