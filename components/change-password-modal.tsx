"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const resetModal = () => {
    setStep("email")
    setCode("")
    setNewPassword("")
    setConfirmPassword("")
    setValidationErrors({})
    setIsLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSendCode = async () => {
    setIsLoading(true)
    setValidationErrors({})

    try {
      const response = await fetch("/api/send-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar código")
      }

      toast({
        title: "Código enviado",
        description: "Verifique seu e-mail para o código de verificação.",
        variant: "default",
      })
      setStep("code")
    } catch (error: any) {
      console.error("Erro ao enviar código:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar código de verificação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setValidationErrors({ code: "Código é obrigatório" })
      return
    }

    setIsLoading(true)
    setValidationErrors({})

    try {
      const response = await fetch("/api/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Código inválido")
      }

      toast({
        title: "Código verificado",
        description: "Agora você pode definir sua nova senha.",
        variant: "default",
      })
      setStep("password")
    } catch (error: any) {
      console.error("Erro ao verificar código:", error)
      setValidationErrors({ code: error.message || "Código inválido" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = "Nova senha é obrigatória"
    } else if (newPassword.length < 6) {
      errors.newPassword = "Senha deve ter pelo menos 6 caracteres"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirmação de senha é obrigatória"
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Senhas não coincidem"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)
    setValidationErrors({})

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          code: code.trim(),
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar senha")
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
        variant: "default",
      })
      handleClose()
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case "email":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Alterar senha</h3>
              <p className="text-sm text-gray-600 mt-2">
                Enviaremos um código de verificação para o seu e-mail para confirmar a alteração da senha.
              </p>
            </div>
            <div className="space-y-2">
              <Label>E-mail da conta</Label>
              <Input value={userEmail} disabled className="bg-gray-50" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSendCode} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </div>
          </div>
        )

      case "code":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Código enviado</h3>
              <p className="text-sm text-gray-600 mt-2">
                Digite o código de 6 dígitos que enviamos para <strong>{userEmail}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código de verificação</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  if (validationErrors.code) {
                    setValidationErrors((prev) => ({ ...prev, code: "" }))
                  }
                }}
                placeholder="000000"
                className={`text-center text-lg tracking-widest ${validationErrors.code ? "border-red-500" : ""}`}
                maxLength={6}
              />
              {validationErrors.code && <p className="text-xs text-red-500">{validationErrors.code}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("email")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </Button>
            </div>
          </div>
        )

      case "password":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Definir nova senha</h3>
              <p className="text-sm text-gray-600 mt-2">Escolha uma senha segura para sua conta.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (validationErrors.newPassword) {
                      setValidationErrors((prev) => ({ ...prev, newPassword: "" }))
                    }
                  }}
                  placeholder="Digite sua nova senha"
                  className={validationErrors.newPassword ? "border-red-500" : ""}
                />
                {validationErrors.newPassword && <p className="text-xs text-red-500">{validationErrors.newPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (validationErrors.confirmPassword) {
                      setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }))
                    }
                  }}
                  placeholder="Confirme sua nova senha"
                  className={validationErrors.confirmPassword ? "border-red-500" : ""}
                />
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("code")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar senha"
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Modal para alteração de senha</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={handleClose} className="absolute -top-2 -right-2 h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
