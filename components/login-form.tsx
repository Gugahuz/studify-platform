"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { supabase, logLoginAttempt, checkUserProfile, createUserProfile, attemptTestLogin } from "@/lib/supabase"
import { useToastContext } from "@/components/toast-provider"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTestLogin, setShowTestLogin] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    lembrarMe: false,
  })
  const router = useRouter()
  const toast = useToastContext()
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleTestLogin = async () => {
    if (!formData.email || !formData.senha) {
      toast.error("Preencha email e senha.", "Erro")
      return
    }

    setIsLoading(true)

    try {
      const result = await attemptTestLogin(formData.email, formData.senha)

      if (result.success && result.user) {
        localStorage.setItem("testUser", JSON.stringify(result.user))

        toast.success("Login realizado!", "Bem-vindo de volta! Redirecionando para o dashboard...")

        await new Promise((resolve) => setTimeout(resolve, 1500))
        router.push("/dashboard")
      } else {
        toast.error("Credenciais inválidas", "Verifique seu email e senha e tente novamente.")
      }
    } catch (error) {
      toast.error("Erro no login.", "Erro inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.email.trim()) {
        toast.error("Email obrigatório", "Por favor, insira seu endereço de email.")
        setIsLoading(false)
        return
      }

      if (!formData.senha) {
        toast.error("Senha obrigatória", "Por favor, insira sua senha.")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.senha,
      })

      if (error) {
        await logLoginAttempt(formData.email, false, undefined, error.message)

        const errorMessage = "Erro desconhecido no login."

        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciais incorretas", "Email ou senha estão incorretos. Verifique e tente novamente.")
        } else if (error.message.includes("Email not confirmed")) {
          setShowTestLogin(true)
          toast.warning("Email não confirmado", "Seu email ainda não foi confirmado. Use a opção alternativa abaixo.")
        } else if (error.message.includes("Too many requests")) {
          toast.error("Muitas tentativas", "Aguarde alguns minutos antes de tentar novamente.")
        } else {
          toast.error("Erro no login", error.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        await logLoginAttempt(formData.email, true, data.user.id)

        const { data: profile } = await checkUserProfile(data.user.id)

        if (!profile) {
          const userData = data.user.user_metadata || {}

          try {
            await createUserProfile(data.user.id, {
              nome: userData.nome || data.user.email?.split("@")[0] || "Usuário",
              email: data.user.email || formData.email,
              telefone: userData.telefone || "",
              escolaridade: userData.escolaridade || "graduando",
              password: formData.senha,
            })
          } catch (createError) {
            // Continue even if profile creation fails
          }
        }

        toast.success("Login realizado com sucesso!", "Redirecionando para o dashboard...")

        await new Promise((resolve) => setTimeout(resolve, 1500))
        router.push("/dashboard")
      }
    } catch (error) {
      await logLoginAttempt(formData.email, false, undefined, "Erro inesperado")

      toast.error("Ocorreu um erro inesperado. Tente novamente.", "Erro inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">Bem-vindo de volta</CardTitle>
        <CardDescription>Entre para continuar sua jornada de estudos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="lembrar"
                type="checkbox"
                checked={formData.lembrarMe}
                onChange={(e) => setFormData({ ...formData, lembrarMe: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="lembrar" className="text-sm">
                Lembrar de mim
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-studify-green hover:text-studify-green/80"
            >
              Esqueceu a senha?
            </button>
          </div>

          <Button type="submit" className="w-full bg-studify-green hover:bg-studify-green/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          {showTestLogin && (
            <Button type="button" variant="outline" className="w-full" onClick={handleTestLogin} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar com credenciais locais"
              )}
            </Button>
          )}
        </form>

        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">Não tem uma conta? </span>
          <Link href="/cadastro" className="text-studify-green hover:text-studify-green/80 font-medium">
            Cadastre-se
          </Link>
        </div>
      </CardContent>
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </Card>
  )
}
