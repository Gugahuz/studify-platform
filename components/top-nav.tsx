"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, Loader2, User, ChevronDown, Menu, X } from "lucide-react"
import { signOut } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function TopNav() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
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
      <div className="flex h-16 items-center justify-between w-full px-4">
        <div className="flex items-center gap-2">
          {/* Botão do menu mobile - agora ao lado esquerdo do logo */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <Link
            href="/dashboard"
            className="text-xl font-bold text-studify-green hover:text-studify-green/80 transition-colors"
          >
            studify
          </Link>
        </div>

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
              <Avatar className="h-8 w-8 border border-studify-green/20">
                <AvatarImage
                  src={userProfile?.avatar_url || "/placeholder.svg"}
                  alt={userProfile?.nome || "Avatar do usuário"}
                />
                <AvatarFallback>{getInitial()}</AvatarFallback>
              </Avatar>
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
            <SidebarContent onClose={toggleMobileMenu} />
          </div>
        </div>
      )}
    </header>
  )
}

// Componente para o conteúdo da sidebar mobile
function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = useRouter().pathname
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "home",
    },
    {
      title: "Matérias",
      href: "/dashboard/materias",
      icon: "book",
    },
    {
      title: "Cronograma",
      href: "/dashboard/cronograma",
      icon: "calendar",
    },
    {
      title: "Assistente",
      href: "/dashboard/assistente",
      icon: "message-square",
    },
    {
      title: "Resumos",
      href: "/dashboard/resumos",
      icon: "file-text",
    },
    {
      title: "Simulados",
      href: "/dashboard/simulados",
      icon: "bar-chart-2",
    },
    {
      title: "Sobre",
      href: "/dashboard/sobre",
      icon: "info",
    },
    {
      title: "Assinatura",
      href: "/dashboard/assinatura",
      icon: "crown",
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <span className="studify-logo text-studify-green text-3xl">studify</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 text-studify-gray rounded-md hover:bg-studify-lightgreen/10 hover:text-studify-green group ${
              pathname === item.href ? "bg-studify-lightgreen/10 text-studify-green" : ""
            }`}
            onClick={onClose}
          >
            <span className="mr-3">{getIcon(item.icon)}</span>
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

// Função auxiliar para obter o ícone correto
function getIcon(name: string) {
  switch (name) {
    case "home":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    case "book":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      )
    case "calendar":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      )
    case "message-square":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case "file-text":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      )
    case "bar-chart-2":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      )
    case "info":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      )
    case "crown":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      )
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}
