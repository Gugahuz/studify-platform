"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react"
import { useToastContext } from "@/components/toast-provider"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const toast = useToastContext()

  const resetForm = () => {
    setStep("email")
    setEmail("")
    setCode("")
    setNewPassword("")
    setConfirmPassword("")
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
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
        toast.success("Código enviado!", "Verifique seu email para o código de verificação.")
        setStep("code")
      } else {
        toast.error("Erro ao enviar código", data.error || "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "Verifique sua internet e tente novamente.")
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
      toast.error("Erro de conexão", "Verifique sua internet e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Senhas não coincidem", "As senhas devem ser iguais.")
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
        toast.success("Senha alterada!", "Sua senha foi alterada com sucesso. Faça login com a nova senha.")
        handleClose()
      } else {
        toast.error("Erro ao alterar senha", data.error || "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "Verifique sua internet e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            {step !== "email" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "code") setStep("email")
                  if (step === "password") setStep("code")
                }}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-xl text-studify-green">
                {step === "email" && "Recuperar Senha"}
                {step === "code" && "Verificar Código"}
                {step === "password" && "Nova Senha"}
              </CardTitle>
              <CardDescription>
                {step === "email" && "Digite seu email para receber o código de verificação"}
                {step === "code" && "Digite o código de 6 dígitos enviado para seu email"}
                {step === "password" && "Defina sua nova senha"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-1">
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Código"
                )}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-code">Código de Verificação</Label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">Código enviado para: {email}</p>
              </div>
              <Button type="submit" className="w-full bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Código"
                )}
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
