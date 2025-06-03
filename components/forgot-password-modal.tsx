"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, CheckCircle, Mail, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { toast } = useToast()

  // Generate a simple 6-digit code
  const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Validate password requirements
  const validatePassword = (password: string, confirmPassword: string) => {
    const errors: string[] = []

    if (password.length < 6) {
      errors.push("A senha deve ter pelo menos 6 caracteres")
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.push("As senhas não coincidem")
    }

    return errors
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const emailLowerCase = formData.email.trim().toLowerCase()

      if (!emailLowerCase) {
        toast({
          title: "Email obrigatório",
          description: "Por favor, informe seu email.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      // Check if email exists in profiles table (case-insensitive)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, id")
        .ilike("email", emailLowerCase)
        .single()

      if (profileError || !profile) {
        toast({
          title: "E-mail não registrado na plataforma",
          description: "Verifique o endereço de email e tente novamente.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      // Generate reset code
      const code = generateResetCode()
      setUserEmail(emailLowerCase)

      // Store the reset code temporarily in the profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          reset_code: code,
          reset_code_expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("Error storing reset code:", updateError)
        toast({
          title: "Erro interno",
          description: "Não foi possível gerar o código. Tente novamente.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      // Send email with reset code
      const response = await fetch("/api/send-reset-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailLowerCase,
          code: code,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar email")
      }

      toast({
        title: "Código enviado!",
        description: "Verifique sua caixa de entrada.",
        className: "bg-studify-green text-white border-studify-green",
        duration: 700,
      })

      setStep("code")
    } catch (error) {
      console.error("Error generating reset code:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 700,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.code || formData.code.length !== 6) {
        toast({
          title: "Código inválido",
          description: "O código deve ter 6 dígitos.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      // Verify the code
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("reset_code, reset_code_expires")
        .ilike("email", userEmail)
        .single()

      if (error || !profile) {
        toast({
          title: "Erro interno",
          description: "Não foi possível verificar o código.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      // Check if code matches and hasn't expired
      const now = new Date()
      const expiresAt = new Date(profile.reset_code_expires)

      if (profile.reset_code !== formData.code) {
        toast({
          title: "Verifique o código e tente novamente",
          description: "O código informado está incorreto.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      if (now > expiresAt) {
        toast({
          title: "Código expirado",
          description: "Solicite um novo código.",
          variant: "destructive",
          duration: 700,
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Código verificado!",
        description: "Agora defina sua nova senha.",
        className: "bg-studify-green text-white border-studify-green",
        duration: 700,
      })

      setStep("password")
    } catch (error) {
      console.error("Error verifying code:", error)
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 700,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password
    const errors = validatePassword(formData.newPassword, formData.confirmPassword)
    setValidationErrors(errors)

    if (errors.length > 0) {
      return
    }

    setIsLoading(true)

    try {
      // Call our dedicated API route for password reset
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          newPassword: formData.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao redefinir senha")
      }

      // Clear reset code from profiles table
      await supabase
        .from("profiles")
        .update({
          reset_code: null,
          reset_code_expires: null,
        })
        .ilike("email", userEmail)

      setStep("success")
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso.",
        className: "bg-studify-green text-white border-studify-green",
        duration: 700,
      })
    } catch (error) {
      console.error("❌ Erro ao redefinir senha:", error)
      toast({
        title: "Erro ao redefinir senha",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 700,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep("email")
    setFormData({
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    })
    setUserEmail("")
    setValidationErrors([])
    onClose()
  }

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar código por email
                </>
              )}
            </Button>
          </form>
        )

      case "code":
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-code">Código de verificação</Label>
              <Input
                id="reset-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, "") })}
                required
                className="text-center text-lg tracking-widest"
              />
              <p className="text-sm text-gray-600">
                Digite o código de 6 dígitos enviado para <strong>{userEmail}</strong>
              </p>
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setStep("email")} className="flex-1">
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </Button>
            </div>
          </form>
        )

      case "password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, newPassword: e.target.value })
                    // Clear validation errors when user types
                    if (validationErrors.length > 0) {
                      setValidationErrors([])
                    }
                  }}
                  required
                  className={validationErrors.length > 0 ? "border-red-300 focus:border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    // Clear validation errors when user types
                    if (validationErrors.length > 0) {
                      setValidationErrors([])
                    }
                  }}
                  required
                  className={validationErrors.length > 0 ? "border-red-300 focus:border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Validation Messages */}
            {validationErrors.length > 0 && (
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setStep("code")} className="flex-1">
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </div>
          </form>
        )

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Senha redefinida com sucesso!</h3>
              <p className="text-gray-600 mt-2">
                Sua senha foi alterada. Agora você pode fazer login com a nova senha.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fazer login
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  const getTitle = () => {
    switch (step) {
      case "email":
        return "Esqueceu sua senha?"
      case "code":
        return "Verificar código"
      case "password":
        return "Nova senha"
      case "success":
        return "Sucesso!"
      default:
        return "Recuperar senha"
    }
  }

  const getDescription = () => {
    switch (step) {
      case "email":
        return "Digite seu email para receber um código de recuperação"
      case "code":
        return "Digite o código de 6 dígitos enviado por email"
      case "password":
        return "Crie uma nova senha para sua conta"
      case "success":
        return ""
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {getDescription() && <DialogDescription>{getDescription()}</DialogDescription>}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}
