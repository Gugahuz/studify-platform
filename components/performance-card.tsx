import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2 } from "lucide-react"
import { ComingSoonHover } from "@/components/coming-soon-hover"

export function PerformanceCard() {
  const subjects = [
    { name: "Matemática", progress: 78, color: "bg-blue-500" },
    { name: "Física", progress: 65, color: "bg-purple-500" },
    { name: "Química", progress: 82, color: "bg-green-500" },
    { name: "Biologia", progress: 45, color: "bg-orange-500" },
  ]

  return (
    <ComingSoonHover>
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="mr-2 h-5 w-5" />
            Seu desempenho
          </CardTitle>
          <CardDescription>Progresso nas principais matérias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-gray-500">{subject.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${subject.color}`}
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ComingSoonHover>
  )
}
