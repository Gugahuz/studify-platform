"use client"

import { useSchedule } from "@/hooks/use-schedule"
import { useUserData } from "@/hooks/use-user-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ScheduleDebug() {
  const { schedule, isLoading, error } = useSchedule()
  const { userProfile } = useUserData()

  if (!userProfile) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debug: Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">❌ Usuário não autenticado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">Debug: Cronograma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={userProfile ? "default" : "destructive"}>
            Usuário: {userProfile?.nome || "Não encontrado"}
          </Badge>
          <Badge variant={userProfile?.id ? "default" : "destructive"}>ID: {userProfile?.id || "Sem ID"}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isLoading ? "secondary" : "default"}>{isLoading ? "Carregando..." : "Carregado"}</Badge>
          <Badge variant={error ? "destructive" : "default"}>{error ? `Erro: ${error}` : "Sem erros"}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">Total de itens: {schedule.length}</Badge>
        </div>

        {schedule.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-blue-800 mb-2">Itens do cronograma:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {schedule.map((item) => (
                <div key={item.id} className="text-xs bg-white p-2 rounded border">
                  <strong>{item.subject}</strong> - {item.day} às {item.startTime} ({item.duration}min)
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-blue-600">
          <p>localStorage key: schedule_{userProfile?.id}</p>
          <p>Dados locais: {localStorage.getItem(`schedule_${userProfile?.id}`) ? "Existem" : "Não existem"}</p>
        </div>
      </CardContent>
    </Card>
  )
}
