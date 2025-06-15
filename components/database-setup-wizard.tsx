"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Loader2, Database, Play, RefreshCw } from "lucide-react"

interface DatabaseStatus {
  flashcard_subjects: boolean
  flashcard_topics: boolean
  flashcards: boolean
  user_flashcard_decks: boolean
  prebuilt_flashcard_decks: boolean
  hasData: boolean
  errors: string[]
}

export function DatabaseSetupWizard() {
  const [status, setStatus] = useState<"idle" | "checking" | "setting-up" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setStatus("checking")
    setMessage("Verificando status do banco de dados...")
    setProgress(20)

    try {
      const response = await fetch("/api/database/check-status")
      const data = await response.json()

      setDbStatus(data.status)
      setProgress(40)

      if (data.success && data.status.hasData) {
        setStatus("success")
        setMessage("Sistema de flashcards já está configurado!")
        setProgress(100)
      } else if (data.needsSetup) {
        setStatus("error")
        setMessage("Banco de dados precisa ser configurado")
        setProgress(60)
      } else {
        setStatus("success")
        setMessage("Tabelas criadas, mas sem dados iniciais")
        setProgress(80)
      }
    } catch (error) {
      setStatus("error")
      setMessage("Erro ao verificar banco de dados")
      setProgress(0)
      console.error("Erro na verificação:", error)
    }
  }

  const setupDatabase = async () => {
    setStatus("setting-up")
    setMessage("Configurando banco de dados automaticamente...")
    setProgress(0)

    try {
      // Simular progresso
      const progressSteps = [
        { progress: 20, message: "Criando tabelas principais..." },
        { progress: 40, message: "Criando tabelas de decks..." },
        { progress: 60, message: "Inserindo dados iniciais..." },
        { progress: 80, message: "Configurando políticas de segurança..." },
        { progress: 100, message: "Finalizando configuração..." },
      ]

      for (const step of progressSteps) {
        setProgress(step.progress)
        setMessage(step.message)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const response = await fetch("/api/database/setup-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Sistema configurado com sucesso!")
        setProgress(100)
        // Verificar status novamente
        setTimeout(() => {
          checkDatabaseStatus()
        }, 1000)
      } else {
        setStatus("error")
        setMessage(data.error || "Erro na configuração")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Erro de conexão durante a configuração")
      console.error("Erro na configuração:", error)
    }
  }

  const retry = () => {
    checkDatabaseStatus()
  }

  if (status === "success" && dbStatus?.hasData) {
    return null // Não mostrar se tudo está funcionando
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Configuração do Sistema</CardTitle>
          <CardDescription>Sistema de Flashcards precisa ser configurado</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(status === "checking" || status === "setting-up") && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">{message}</p>
            </div>
          )}

          {/* Status Message */}
          <Alert
            className={`${
              status === "error"
                ? "border-red-200 bg-red-50"
                : status === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-center gap-2">
              {status === "checking" || status === "setting-up" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : status === "error" ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className="flex-1">{message}</AlertDescription>
            </div>
          </Alert>

          {/* Database Status */}
          {dbStatus && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Status das Tabelas:</h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {Object.entries(dbStatus).map(([key, value]) => {
                  if (key === "errors" || key === "hasData") return null
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace("_", " ")}</span>
                      <span className={value ? "text-green-600" : "text-red-600"}>{value ? "✓" : "✗"}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status === "error" && (
              <Button onClick={setupDatabase} disabled={status === "setting-up"} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Configurar Automaticamente
              </Button>
            )}

            <Button
              variant="outline"
              onClick={retry}
              disabled={status === "checking" || status === "setting-up"}
              className={status === "error" ? "" : "flex-1"}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Novamente
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center">
            <p>Este assistente configurará automaticamente</p>
            <p>todas as tabelas necessárias no Supabase</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
