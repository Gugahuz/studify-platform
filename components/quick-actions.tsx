import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, FileText, BarChart2, Upload } from "lucide-react"
import { ComingSoonHover } from "@/components/coming-soon-hover"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Fazer uma pergunta",
      icon: MessageSquare,
      href: "/dashboard/assistente",
      available: true,
    },
    {
      title: "Gerar resumo",
      icon: FileText,
      href: "/dashboard/resumos",
      available: true,
    },
    {
      title: "Iniciar simulado",
      icon: BarChart2,
      href: "/dashboard/simulados",
      available: true, // Changed from false to true so it's clickable
      maintenance: true, // Added this new property
    },
    {
      title: "Enviar questão",
      icon: Upload,
      href: "/dashboard/assistente/upload",
      available: false,
    },
  ]

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle>Ações rápidas</CardTitle>
        <CardDescription>Acesse as principais funcionalidades</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const colors = [
              "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
              "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
              "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
              "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
            ]

            if (action.available) {
              if (action.maintenance) {
                // Maintenance mode styling
                return (
                  <Link key={action.title} href={action.href}>
                    <Button
                      variant="outline"
                      className={`flex flex-col h-20 w-full py-3 px-3 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 text-center justify-center items-center transition-all duration-200 hover:scale-105 hover:shadow-md`}
                    >
                      <action.icon className="h-5 w-5 mb-1.5 flex-shrink-0" />
                      <span className="text-xs font-medium leading-tight text-center">{action.title}</span>
                      <span className="text-[10px] mt-0.5">Em manutenção</span>
                    </Button>
                  </Link>
                )
              }
              return (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant="outline"
                    className={`flex flex-col h-20 w-full py-3 px-3 ${colors[index]} text-center justify-center items-center transition-all duration-200 hover:scale-105 hover:shadow-md`}
                  >
                    <action.icon className="h-5 w-5 mb-1.5 flex-shrink-0" />
                    <span className="text-xs font-medium leading-tight text-center">{action.title}</span>
                  </Button>
                </Link>
              )
            } else {
              return (
                <ComingSoonHover key={action.title}>
                  <Button
                    variant="outline"
                    className={`flex flex-col h-20 w-full py-3 px-3 ${colors[index]} text-center justify-center items-center opacity-60 cursor-not-allowed`}
                    disabled
                  >
                    <action.icon className="h-5 w-5 mb-1.5 flex-shrink-0" />
                    <span className="text-xs font-medium leading-tight text-center">{action.title}</span>
                  </Button>
                </ComingSoonHover>
              )
            }
          })}
        </div>
      </CardContent>
    </Card>
  )
}
