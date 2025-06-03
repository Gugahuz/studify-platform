"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react"
import { useToastContext } from "@/components/toast-provider"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "email" | "code" | "password"

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const toast = useToastContext()

  const resetModal = () => {
    setStep("email")
    setEmail("")
    setCode("")
    setNewPassword("")
    setConfirmPassword("")
    setIsLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Código enviado!", "Verifique sua caixa de entrada e spam.")
        setStep("code")
      } else {
        toast.error("Erro ao enviar código", data.error || "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro inesperado", "Não foi possível enviar o código.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Código verificado!", "Agora defina sua nova senha.")
        setStep("password")
      } else {
        toast.error("Código inválido", data.error || "Verifique o código e tente novamente.")
      }
    } catch (error) {
      toast.error("Erro inesperado", "Não foi possível verificar o código.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Senhas não coincidem", "As senhas devem ser idênticas.")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Senha muito curta", "A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Senha alterada!", "Sua senha foi atualizada com sucesso.")
        handleClose()
      } else {
        toast.error("Erro ao alterar senha", data.error || "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro inesperado", "Não foi possível alterar a senha.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderEmailStep = () => (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-studify-green/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-studify-green" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Recuperar senha</h3>
        <p className="text-sm text-gray-600 mt-2">Digite seu email para receber um código de verificação</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar código"
        )}
      </Button>
    </form>
  )

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Verificar código</h3>
        <p className="text-sm text-gray-600 mt-2">
          Digite o código de 6 dígitos enviado para <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Código de verificação</Label>
        <Input
          id="code"
          type="text"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          className="text-center text-lg tracking-widest"
          required
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep("email")} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-studify-green hover:bg-studify-green/90"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar"
          )}
        </Button>
      </div>
    </form>
  )

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Nova senha</h3>
        <p className="text-sm text-gray-600 mt-2">Defina uma nova senha para sua conta</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep("code")} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" className="flex-1 bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Alterando...
            </>
          ) : (
            "Alterar senha"
          )}
        </Button>
      </div>
    </form>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Recuperação de senha</DialogTitle>
          <DialogDescription className="sr-only">Processo de recuperação de senha em etapas</DialogDescription>
        </DialogHeader>

        {step === "email" && renderEmailStep()}
        {step === "code" && renderCodeStep()}
        {step === "password" && renderPasswordStep()}
      </DialogContent>
    </Dialog>
  )
}
