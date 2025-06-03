"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase, checkUserProfile, createUserProfile } from "@/lib/supabase"
import { useToastContext } from "@/components/toast-provider"

// Função para formatar telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return value.slice(0, 15) // Máximo 15 caracteres
}

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    escolaridade: "",
  })
  const router = useRouter()
  const toast = useToastContext()
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })

  const validateEmail = async (email: string) => {
    if (!email) {
      setFieldErrors((prev) => ({ ...prev, email: "" }))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: "Formato de email inválido" }))
      return
    }

    // Verificar se email já existe
    const { data: existingEmail } = await supabase.from("profiles").select("email").eq("email", email.trim()).single()

    if (existingEmail) {
      setFieldErrors((prev) => ({ ...prev, email: "Este email já está cadastrado" }))
    } else {
      setFieldErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const validatePhone = async (phone: string) => {
    if (!phone) {
      setFieldErrors((prev) => ({ ...prev, telefone: "" }))
      return
    }

    const numbers = phone.replace(/\D/g, "")
    if (numbers.length < 10) {
      setFieldErrors((prev) => ({ ...prev, telefone: "Telefone deve ter pelo menos 10 dígitos" }))
      return
    }

    // Verificar se telefone já existe
    const { data: existingPhone } = await supabase
      .from("profiles")
      .select("telefone")
      .eq("telefone", phone.trim())
      .single()

    if (existingPhone) {
      setFieldErrors((prev) => ({ ...prev, telefone: "Este telefone já está cadastrado" }))
    } else {
      setFieldErrors((prev) => ({ ...prev, telefone: "" }))
    }
  }

  const validatePassword = (senha: string, confirmarSenha: string) => {
    if (senha && senha.length < 6) {
      setFieldErrors((prev) => ({ ...prev, senha: "Senha deve ter pelo menos 6 caracteres" }))
    } else {
      setFieldErrors((prev) => ({ ...prev, senha: "" }))
    }

    if (confirmarSenha && senha !== confirmarSenha) {
      setFieldErrors((prev) => ({ ...prev, confirmarSenha: "As senhas não coincidem" }))
    } else {
      setFieldErrors((prev) => ({ ...prev, confirmarSenha: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validações
      if (!formData.nome.trim()) {
        toast.error("Nome obrigatório", "Por favor, insira seu nome completo.")
        setIsLoading(false)
        return
      }

      if (!formData.email.trim()) {
        toast.error("Email obrigatório", "Por favor, insira um endereço de email válido.")
        setIsLoading(false)
        return
      }

      if (!formData.telefone.trim()) {
        toast.error("Telefone obrigatório", "Por favor, insira seu número de telefone.")
        setIsLoading(false)
        return
      }

      if (!formData.escolaridade) {
        toast.error("Escolaridade obrigatória", "Por favor, selecione seu nível de escolaridade.")
        setIsLoading(false)
        return
      }

      if (!formData.senha) {
        toast.error("Senha obrigatória", "Por favor, crie uma senha para sua conta.")
        setIsLoading(false)
        return
      }

      if (formData.senha !== formData.confirmarSenha) {
        toast.error("Senhas não coincidem", "As senhas digitadas são diferentes. Verifique e tente novamente.")
        setIsLoading(false)
        return
      }

      if (formData.senha.length < 6) {
        toast.error("Senha muito curta", "A senha deve ter pelo menos 6 caracteres.")
        setIsLoading(false)
        return
      }

      // Verificar se email já existe
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", formData.email.trim())
        .single()

      if (existingEmail) {
        toast.error("Email já cadastrado", "Este email já possui uma conta. Tente fazer login ou use outro email.")
        setIsLoading(false)
        return
      }

      // Verificar se telefone já existe
      const phoneNumbers = formData.telefone.replace(/\D/g, "")
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("telefone")
        .eq("telefone", formData.telefone.trim())
        .single()

      if (existingPhone) {
        toast.error("Telefone já cadastrado", "Este número de telefone já está em uso. Use outro número.")
        setIsLoading(false)
        return
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Erro no cadastro",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Preparar dados para o signup
      const signupData = {
        email: formData.email.trim(),
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome.trim(),
            telefone: formData.telefone.trim(),
            escolaridade: formData.escolaridade,
            password: formData.senha,
          },
        },
      }

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp(signupData)

      if (error) {
        const errorMessage = "Erro desconhecido no cadastro."

        if (error.message.includes("User already registered")) {
          toast.error("Usuário já existe", "Este email já possui uma conta. Tente fazer login.")
        } else if (error.message.includes("Password should be at least")) {
          toast.error("Senha inválida", "A senha deve ter pelo menos 6 caracteres.")
        } else if (error.message.includes("Invalid email")) {
          toast.error("Email inválido", "Por favor, insira um endereço de email válido.")
        } else if (error.message.includes("Signup is disabled")) {
          toast.error("Cadastro indisponível", "O cadastro está temporariamente desabilitado.")
        } else if (error.message.includes("Email rate limit exceeded")) {
          toast.error("Limite excedido", "Muitas tentativas de cadastro. Aguarde alguns minutos.")
        } else {
          toast.error("Erro no cadastro", error.message)
        }

        setIsLoading(false)
        return
      }

      if (data.user) {
        // Mostrar notificação de progresso
        toast.info("Processando cadastro", "Criando sua conta e perfil de usuário...")

        // Aguardar para o trigger funcionar
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Verificar se o perfil foi criado pelo trigger
        const { data: profile } = await checkUserProfile(data.user.id)

        if (!profile) {
          // Criar perfil manualmente
          try {
            const profileData = {
              nome: formData.nome.trim(),
              email: formData.email.trim(),
              telefone: formData.telefone.trim(),
              escolaridade: formData.escolaridade,
              password: formData.senha,
            }

            await createUserProfile(data.user.id, profileData)
          } catch (createError) {
            // Continue even if manual creation fails
          }
        }

        // Mostrar popup de sucesso
        setShowSuccessPopup(true)
        toast.success("Cadastro realizado!", "Sua conta foi criada com sucesso. Redirecionando...")

        // Esconder popup após 1 segundo e redirecionar
        setTimeout(() => {
          setShowSuccessPopup(false)
          router.push("/")
        }, 1000)
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente em alguns minutos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-studify-green to-studify-green text-studify-white p-6 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto md:mx-0">
          <div className="mb-8 flex items-center">
            <span className="studify-logo text-studify-white text-3xl">studify</span>
          </div>

          <h2 className="text-4xl font-bold mb-6">Junte-se à nossa comunidade de estudantes</h2>
          <p className="text-lg mb-8 text-studify-white/90">
            Crie sua conta e tenha acesso a todas as funcionalidades da plataforma de estudos mais inteligente do
            Brasil.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <CheckCircle className="h-5 w-5 text-studify-white" />
              </div>
              <span>Assistente de estudos personalizado</span>
            </div>
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <CheckCircle className="h-5 w-5 text-studify-white" />
              </div>
              <span>Geração de resumos inteligentes</span>
            </div>
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <CheckCircle className="h-5 w-5 text-studify-white" />
              </div>
              <span>Cronogramas otimizados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cadastro Section */}
      <div className="flex-1 bg-studify-white p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-studify-green hover:text-studify-green/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para login
            </Link>
          </div>

          <Card className="bg-studify-white border-studify-gray/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-studify-gray">Criar conta</CardTitle>
              <CardDescription className="text-studify-gray">
                Preencha seus dados para começar a estudar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-studify-gray">
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="border-studify-gray/30 focus-visible:ring-studify-green"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-studify-gray">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={`border-studify-gray/30 focus-visible:ring-studify-green ${
                      fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-studify-gray">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      setFormData({ ...formData, telefone: formatted })
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    className={`border-studify-gray/30 focus-visible:ring-studify-green ${
                      fieldErrors.telefone ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    maxLength={15}
                    required
                  />
                  {fieldErrors.telefone && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.telefone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escolaridade" className="text-studify-gray">
                    Escolaridade
                  </Label>
                  <Select
                    value={formData.escolaridade}
                    onValueChange={(value) => setFormData({ ...formData, escolaridade: value })}
                  >
                    <SelectTrigger className="border-studify-gray/30 focus:ring-studify-green">
                      <SelectValue placeholder="Selecione sua escolaridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ensino-fundamental">Ensino Fundamental</SelectItem>
                      <SelectItem value="ensino-medio">Ensino Médio</SelectItem>
                      <SelectItem value="vestibulando">Vestibulando</SelectItem>
                      <SelectItem value="graduando">Graduando</SelectItem>
                      <SelectItem value="pos-graduando">Pós-graduando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-studify-gray">
                    Senha
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={formData.senha}
                    onChange={(e) => {
                      setFormData({ ...formData, senha: e.target.value })
                      validatePassword(e.target.value, formData.confirmarSenha)
                    }}
                    className={`border-studify-gray/30 focus-visible:ring-studify-green ${
                      fieldErrors.senha ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    required
                  />
                  {fieldErrors.senha && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.senha}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="text-studify-gray">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmarSenha}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmarSenha: e.target.value })
                      validatePassword(formData.senha, e.target.value)
                    }}
                    className={`border-studify-gray/30 focus-visible:ring-studify-green ${
                      fieldErrors.confirmarSenha ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    required
                  />
                  {fieldErrors.confirmarSenha && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.confirmarSenha}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-studify-green hover:bg-studify-green/90 text-studify-white"
                  disabled={isLoading || Object.values(fieldErrors).some((error) => error !== "")}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>

              <div className="text-center text-sm mt-4">
                <span className="text-studify-gray">Já tem uma conta? </span>
                <Link href="/" className="text-studify-green hover:text-studify-green/80 font-medium">
                  Faça login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed bottom-4 right-4 bg-studify-green text-studify-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Cadastro realizado com sucesso!</span>
          </div>
        </div>
      )}
    </div>
  )
}
