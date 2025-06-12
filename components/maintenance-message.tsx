import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface MaintenanceMessageProps {
  title?: string
  message?: string
  showBackButton?: boolean
  backUrl?: string
  backText?: string
}

export function MaintenanceMessage({
  title = "Funcionalidade em Manutenção",
  message = "Estamos trabalhando para melhorar esta funcionalidade. Por favor, tente novamente mais tarde.",
  showBackButton = true,
  backUrl = "/dashboard",
  backText = "Voltar ao Dashboard",
}: MaintenanceMessageProps) {
  return (
    <Card className="border-studify-green/20 shadow-md max-w-3xl mx-auto">
      <CardHeader className="bg-studify-lightgreen/10 border-b border-studify-green/10">
        <CardTitle className="flex items-center gap-3 text-studify-green">
          <AlertCircle className="h-6 w-6" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <p className="text-gray-700 mb-6">{message}</p>
        {showBackButton && (
          <Link href={backUrl}>
            <Button variant="default" className="bg-studify-green hover:bg-studify-green/90">
              {backText}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
