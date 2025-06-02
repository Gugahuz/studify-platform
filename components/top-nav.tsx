"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, Loader2, User, Settings, ChevronDown } from "lucide-react"
import { signOut } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { AvatarWithProfile } from "@/components/ui/avatar"

export function TopNav() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { userProfile, userEmail, refreshUserData } = useUserData()
  const router = useRouter()
  const { toast } = useToast()

  // Atualizar dados do usuário quando o componente montar
  useEffect(() => {
    refreshUserData()
  }, [refreshUserData])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setIsDropdownOpen(false)

    try {
      toast({
        title: "Fazendo logout...",
        description: "Aguarde um momento...",
      })

      const { success } = await signOut()

      if (success) {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        })

        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push("/")

        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      } else {
        toast({
          title: "Problema no logout",
          description: "Houve um problema, mas você será redirecionado.",
          variant: "destructive",
        })

        setTimeout(() => {
          router.push("/")
          window.location.href = "/"
        }, 2000)
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Erro durante logout. Redirecionando...",
        variant: "destructive",
      })

      setTimeout(() => {
        router.push("/")
        window.location.href = "/"
      }, 2000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const goToProfile = () => {
    setIsDropdownOpen(false)
    router.push("/dashboard/perfil")
  }

  const goToSettings = () => {
    setIsDropdownOpen(false)
    router.push("/dashboard/configuracoes")
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Add this after the toggleDropdown function
  useEffect(() => {
    if (isDropdownOpen) {
      refreshUserData()
    }
  }, [isDropdownOpen, refreshUserData])

  // Obter a primeira letra do nome para o avatar
  const getInitial = () => {
    if (userProfile?.nome) {
      return userProfile.nome.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-studify-gray/20 bg-studify-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center -ml-2">
          <h1 className="text-xl font-bold text-studify-green">studify</h1>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-4">
          {/* Botão de notificações */}
          <Button variant="ghost" size="icon" disabled={isLoggingOut}>
            <Bell className="h-5 w-5" />
          </Button>

          {/* Custom Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 rounded-full cursor-pointer focus:ring-2 focus:ring-studify-green focus:ring-offset-2"
              disabled={isLoggingOut}
              onClick={toggleDropdown}
            >
              <AvatarWithProfile
                userProfile={userProfile}
                size="md"
                className="h-8 w-8 border border-studify-green/20"
              />
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[100]">
                <div className="py-1">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" key={userProfile?.nome}>
                        {userProfile?.nome || "Usuário"}
                      </p>
                      <p className="text-xs leading-none text-studify-gray" key={`${userProfile?.email}-${Date.now()}`}>
                        {userProfile?.email || userEmail || "email@exemplo.com"}
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={goToProfile}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </button>

                  <button
                    onClick={goToSettings}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saindo...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        Sair
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)} />}
    </header>
  )
}
