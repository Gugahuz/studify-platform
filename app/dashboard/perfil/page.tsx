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
import { User, Phone, Mail, GraduationCap, Loader2, LogOut, ArrowLeft, Key } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { supabase, signOut } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { ComingSoonHover } from "@/components/coming-soon-hover"

// Add this after the imports
const notificationStyles = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(100%); }
    10% { opacity: 1; transform: translateX(0); }
    90% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(100%); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  
  .animate-fade-in-out {
    animation: fadeInOut 1.5s ease-in-out;
  }
  
  .animate-fade-out {
    animation: fadeOut 0.3s ease-in-out;
  }
`

export default function PerfilPage() {
  const { userProfile, userEmail, refreshUserData } = useUserData()
  const { toast } = useToast()
  const router = useRouter()

  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    escolaridade: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  // Initialize form data when user profile loads
  useEffect(() => {
    if (userProfile) {
      console.log("📋 Carregando dados do perfil:", userProfile)
      const initialData = {
        nome: userProfile.nome || "",
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

  // Function to strip formatting from phone number
  const stripPhoneFormatting = (phone: string) => {
    return phone ? phone.replace(/\D/g, "") : ""
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido"
    }

    // Phone validation - now just check if it has enough digits
    const phoneDigits = stripPhoneFormatting(formData.telefone)
    if (phoneDigits && phoneDigits.length < 10) {
      errors.telefone = "Telefone deve ter pelo menos 10 dígitos"
    }

    // Name validation
    if (!formData.nome.trim()) {
      errors.nome = "Nome é obrigatório"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile?.id) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      console.log("📸 Convertendo imagem para base64...")

      // Convert file to base64
      const reader = new FileReader()

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result)
          } else {
            reject(new Error("Erro ao converter imagem"))
          }
        }
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
      })

      reader.readAsDataURL(file)
      const base64Data = await base64Promise

      console.log("✅ Imagem convertida para base64")

      // Update profile with base64 image
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: base64Data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id)

      if (updateError) {
        console.error("❌ Erro ao atualizar perfil:", updateError)
        throw updateError
      }

      // Refresh user data
      await refreshUserData()

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
        variant: "success",
      })
    } catch (error: any) {
      console.error("❌ Erro no upload do avatar:", error)
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao fazer upload da imagem.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      // Clear the input
      e.target.value = ""
    }
  }

  const handleRemoveAvatar = async () => {
    if (!userProfile?.id || !userProfile.avatar_url) return

    setIsUpdating(true)

    try {
      console.log("🗑️ Removendo avatar...")

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id)

      if (updateError) {
        console.error("❌ Erro ao atualizar perfil:", updateError)
        throw updateError
      }

      // Refresh user data
      await refreshUserData()

      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida com sucesso.",
        variant: "success",
      })
    } catch (error: any) {
      console.error("❌ Erro ao remover avatar:", error)
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("💾 Iniciando salvamento do perfil...")
    console.log("📋 Dados do formulário:", formData)
    console.log("🆔 ID do usuário:", userProfile?.id)

    if (!validateForm()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, corrija os erros antes de salvar.",
        variant: "destructive",
      })
      return
    }

    if (!userProfile?.id) {
      console.error("❌ ID do usuário não encontrado")
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
        const { data: emailExists, error: emailCheckError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email)
          .neq("id", userProfile?.id)
          .maybeSingle()

        if (emailCheckError) {
          console.error("❌ Erro ao verificar email:", emailCheckError)
        }

        if (emailExists) {
          setValidationErrors((prev) => ({
            ...prev,
            email: "Este email já está sendo usado por outro usuário",
          }))
          throw new Error("Email já cadastrado")
        }
      }

      // Check if phone already exists (if changed and not empty)
      const strippedPhone = stripPhoneFormatting(formData.telefone)
      const strippedCurrentPhone = stripPhoneFormatting(userProfile?.telefone || "")

      if (strippedPhone && strippedPhone !== strippedCurrentPhone) {
        console.log("📱 Verificando se telefone já existe:", strippedPhone)

        // Check all profiles for phone duplicates
        const { data: allProfiles, error: phoneCheckError } = await supabase
          .from("profiles")
          .select("id, telefone")
          .neq("id", userProfile?.id)

        if (phoneCheckError) {
          console.error("❌ Erro ao verificar telefone:", phoneCheckError)
        }

        // Compare stripped versions
        const phoneAlreadyExists = allProfiles?.some(
          (profile) => stripPhoneFormatting(profile.telefone || "") === strippedPhone,
        )

        if (phoneAlreadyExists) {
          setValidationErrors((prev) => ({
            ...prev,
            telefone: "Este telefone já está sendo usado por outro usuário",
          }))
          throw new Error("Telefone já cadastrado")
        }
      }

      // Update profile with explicit user ID
      console.log("💾 Atualizando perfil no banco de dados...")
      const updateData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || null,
        escolaridade: formData.escolaridade,
        updated_at: new Date().toISOString(),
      }

      console.log("📤 Dados para atualização:", updateData)
      console.log("🎯 Atualizando para o ID:", userProfile.id)

      // Use explicit where clause with user ID
      const { error: updateError, data: updatedData } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userProfile.id)
        .select("*")

      if (updateError) {
        console.error("❌ Erro ao atualizar perfil:", updateError)
        console.error("❌ Detalhes do erro:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        throw updateError
      }

      console.log("✅ Perfil atualizado com sucesso:", updatedData)

      if (!updatedData || updatedData.length === 0) {
        console.warn("⚠️ Nenhum registro foi atualizado")
        throw new Error("Nenhum registro foi atualizado no banco de dados")
      }

      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userProfile.id)
        .single()

      if (verifyError) {
        console.error("❌ Erro ao verificar atualização:", verifyError)
      } else {
        console.log("✅ Dados verificados após atualização:", verifyData)
      }

      // Refresh user data to reflect changes
      console.log("🔄 Atualizando dados do usuário...")
      await refreshUserData()

      // Show toast notification
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
        variant: "success",
        duration: 1500,
      })

      // Show small pop-up notification
      const notification = document.createElement("div")
      notification.className =
        "fixed bottom-6 right-6 bg-white border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg z-[200] flex items-center gap-3 max-w-sm animate-fade-in-out"
      notification.innerHTML = `
  <div class="flex-shrink-0">
    <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
  </div>
  <div>
    <p class="text-sm font-medium text-green-800">Perfil atualizado</p>
    <p class="text-xs text-green-600 mt-1">Suas informações foram salvas com sucesso</p>
  </div>
`
      document.body.appendChild(notification)

      // Remove notification after 1.5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.classList.add("animate-fade-out")
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, 1500)
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
        </div>
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
                    {userProfile.avatar_url ? (
                      <img
                        src={userProfile.avatar_url || "/placeholder.svg"}
                        alt="Avatar"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                        {formData.nome?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-600">Foto de perfil</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                        disabled={isUpdating}
                        className="text-xs"
                      >
                        {isUpdating ? "Enviando..." : "Alterar foto"}
                      </Button>
                      {userProfile.avatar_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          disabled={isUpdating}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Formatos suportados: JPG, PNG, GIF (máximo 5MB)</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
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
                      maxLength={30}
                    />
                    {validationErrors.nome && <p className="text-xs text-red-500">{validationErrors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      placeholder="seu@email.com"
                      className="bg-gray-50 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
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

                  <div className="space-y-2 md:col-span-2">
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
                  <div className="space-y-2 md:col-span-2">
                    <Label>Senha</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="justify-start"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Alterar senha
                    </Button>
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

            <ComingSoonHover>
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
            </ComingSoonHover>

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
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={userProfile.email}
      />
    </div>
  )
}
