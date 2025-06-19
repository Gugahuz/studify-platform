"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface FinishExamModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  answeredCount: number
  totalQuestions: number
  timeRemaining: number
  examTitle: string
}

export function FinishExamModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  answeredCount,
  totalQuestions,
  timeRemaining,
  examTitle,
}: FinishExamModalProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const unansweredCount = totalQuestions - answeredCount
  const completionPercentage = Math.round((answeredCount / totalQuestions) * 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finalizar Simulado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{examTitle}</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questões respondidas:</span>
                  <Badge variant={answeredCount === totalQuestions ? "default" : "secondary"}>
                    {answeredCount}/{totalQuestions}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progresso:</span>
                  <Badge variant={completionPercentage === 100 ? "default" : "outline"}>{completionPercentage}%</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tempo restante:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção!</p>
                <p className="text-yellow-700">
                  Você ainda tem {unansweredCount} questão{unansweredCount > 1 ? "ões" : ""} sem resposta. Tem certeza
                  que deseja finalizar o simulado?
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Após finalizar, você não poderá mais alterar suas respostas. Seus resultados serão calculados
            automaticamente.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Continuar Respondendo
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : (
              "Finalizar Simulado"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
