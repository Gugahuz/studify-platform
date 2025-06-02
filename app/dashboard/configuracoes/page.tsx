"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Phone, Mail, GraduationCap, Loader2, LogOut } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { supabase, signOut } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ConfiguracoesPage() {
  const { userProfile, userEmail, refreshUserData } = useUserData()
  const { toast } = useToast()
  const router = useRouter()

  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    apelido: "",
    email: "",
    telefone: "",
    escolaridade: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize form data when user profile loads
  useEffect(() => {
    if (userProfile) {
      console.log("📋 Carregando dados do perfil:", userProfile)
      const initialData = {
        nome: userProfile.nome || "",
        apelido: userProfile.apelido || "",
        email: userProfile.email || "",
        telefone: userProfile.telefone || "",
        escolaridade: userProfile.escolaridade || "",
      }
      setFormData(initialData)
    }
  }, [userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, escolaridade: value }))
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as (XX) XXXXX-XXXX
    if (digits.length <= 2) {
      return digits
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData((prev) => ({ ...prev, telefone: formatted }))

    // Clear validation error when user types
    if (validationErrors.telefone) {
      setValidationErrors((prev) => ({ ...prev, telefone: "" }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido"
    }

    // Phone validation (Brazilian format) - Fixed regex
    if (formData.telefone && !/^$$\d{2}$$ \d{5}-\d{4}$/.test(formData.telefone)) {
      errors.telefone = "Formato inválido. Use (99) 99999-9999"
    }

    // Name validation
    if (!formData.nome.trim()) {
      errors.nome = "Nome é obrigatório"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("💾 Iniciando salvamento do perfil...")
    console.log("📋 Dados do formulário:", formData)

    if (!validateForm()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, corrija os erros antes de salvar.",
        variant: "destructive",
      })
      return
    }

    if (!userProfile?.id) {
      toast({
        title: "Erro",
        description: "Perfil do usuário não encontrado.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      // Check if email already exists (if changed)
      if (formData.email !== userProfile?.email) {
        console.log("📧 Verificando se email já existe:", formData.email)
        const { data: emailExists } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email)
          .neq("id", userProfile?.id)
          .single()

        if (emailExists) {
          setValidationErrors((prev) => ({
            ...prev,
            email: "Este email já está sendo usado por outro usuário",
          }))
          throw new Error("Email já cadastrado")
        }
      }

      // Check if phone already exists (if changed and not empty)
      if (formData.telefone && formData.telefone !== userProfile?.telefone) {
        console.log("📱 Verificando se telefone já existe:", formData.telefone)
        const { data: phoneExists } = await supabase
          .from("profiles")
          .select("id")
          .eq("telefone", formData.telefone)
          .neq("id", userProfile?.id)
          .single()

        if (phoneExists) {
          setValidationErrors((prev) => ({
            ...prev,
            telefone: "Este telefone já está sendo usado por outro usuário",
          }))
          throw new Error("Telefone já cadastrado")
        }
      }

      // Update profile
      console.log("💾 Atualizando perfil no banco de dados...")
      const updateData = {
        nome: formData.nome.trim(),
        apelido: formData.apelido.trim() || null,
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || null,
        escolaridade: formData.escolaridade,
        updated_at: new Date().toISOString(),
      }

      console.log("📤 Dados para atualização:", updateData)

      const { error, data } = await supabase.from("profiles").update(updateData).eq("id", userProfile?.id).select()

      if (error) {
        console.error("❌ Erro ao atualizar perfil:", error)
        throw error
      }

      console.log("✅ Perfil atualizado com sucesso:", data)

      // Refresh user data
      await refreshUserData()

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      console.error("❌ Erro ao atualizar perfil:", error)

      // Don't show validation errors as toast
      if (!error.message.includes("já cadastrado")) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message || "Ocorreu um erro ao salvar suas informações.",
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      console.log("🚪 Iniciando logout...")
      const result = await signOut()

      if (result.success) {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        })

        // Redirect to home page
        router.push("/")
      } else {
        throw new Error("Erro no logout")
      }
    } catch (error) {
      console.error("❌ Erro no logout:", error)
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getEscolaridadeLabel = (value: string) => {
    const opcoes: Record<string, string> = {
      "ensino-fundamental": "Ensino Fundamental",
      "ensino-medio": "Ensino Médio",
      vestibulando: "Vestibulando",
      graduando: "Graduando",
      "pos-graduando": "Pós-graduando",
    }
    return opcoes[value] || value
  }

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="perfil">Editar Perfil</TabsTrigger>
          <TabsTrigger value="conta">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card className="border-blue-100">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>Atualize suas informações pessoais</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                      {formData.nome?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-600">Foto de perfil</p>
                    <p className="text-xs text-gray-500 mt-1">Upload de imagens em breve</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      className={validationErrors.nome ? "border-red-500" : ""}
                    />
                    {validationErrors.nome && <p className="text-xs text-red-500">{validationErrors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apelido">Apelido</Label>
                    <Input
                      id="apelido"
                      name="apelido"
                      value={formData.apelido}
                      onChange={handleInputChange}
                      placeholder="Como prefere ser chamado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className={validationErrors.telefone ? "border-red-500" : ""}
                      maxLength={15}
                    />
                    {validationErrors.telefone && <p className="text-xs text-red-500">{validationErrors.telefone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escolaridade">Escolaridade</Label>
                    <Select value={formData.escolaridade} onValueChange={handleSelectChange}>
                      <SelectTrigger>
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
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="conta" className="mt-6">
          <div className="space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Detalhes da sua conta no Studify</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{userProfile.nome}</p>
                    <p className="text-sm text-gray-500">Nome completo</p>
                  </div>
                </div>

                {userProfile.apelido && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{userProfile.apelido}</p>
                      <p className="text-sm text-gray-500">Apelido</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{userProfile.email}</p>
                    <p className="text-sm text-gray-500">E-mail</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{userProfile.telefone || "Não informado"}</p>
                    <p className="text-sm text-gray-500">Telefone</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{getEscolaridadeLabel(userProfile.escolaridade)}</p>
                    <p className="text-sm text-gray-500">Escolaridade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle>Desempenho</CardTitle>
                <CardDescription>Seu progresso nos estudos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Progresso geral</span>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Aulas concluídas</span>
                      <span className="text-sm font-medium">24/36</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "67%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Simulados realizados</span>
                      <span className="text-sm font-medium">8/12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Características do estudante</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Consistente
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Organizado
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Analítico
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Dedicado
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-100">
              <CardHeader>
                <CardTitle className="text-red-700">Sair da Conta</CardTitle>
                <CardDescription>Fazer logout da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full sm:w-auto"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saindo...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Fazer logout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
