"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

export function DatabaseInitializer() {
  const [status, setStatus] = useState<"idle" | "checking" | "initializing" | "success" | "error" | "needs-setup">(
    "idle",
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    checkAndInitialize()
  }, [])

  const checkAndInitialize = async () => {
    setStatus("checking")
    setMessage("Verificando sistema...")

    try {
      const response = await fetch("/api/database/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Sistema inicializado com sucesso!")
      } else if (data.needsSetup) {
        setStatus("needs-setup")
        setMessage("Execute o script SQL no Supabase para criar as tabelas necessárias.")
      } else {
        setStatus("error")
        setMessage(data.error || "Erro na inicialização")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Erro de conexão com o servidor")
      console.error("Erro na inicialização:", error)
    }
  }

  const retry = () => {
    checkAndInitialize()
  }

  if (status === "idle" || status === "success") {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert
        className={`${
          status === "error" || status === "needs-setup"
            ? "border-red-200 bg-red-50"
            : status === "checking" || status === "initializing"
              ? "border-blue-200 bg-blue-50"
              : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex items-center gap-2">
          {status === "checking" || status === "initializing" ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : status === "error" || status === "needs-setup" ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className="flex-1">{message}</AlertDescription>
          {(status === "error" || status === "needs-setup") && (
            <Button size="sm" variant="outline" onClick={retry} className="ml-2">
              Tentar Novamente
            </Button>
          )}
        </div>

        {status === "needs-setup" && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="font-medium mb-2">Para configurar o sistema:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse o Supabase Dashboard</li>
              <li>Vá para SQL Editor</li>
              <li>Execute o script create-flashcard-system-supabase.sql</li>
              <li>Clique em "Tentar Novamente"</li>
            </ol>
          </div>
        )}
      </Alert>
    </div>
  )
}
