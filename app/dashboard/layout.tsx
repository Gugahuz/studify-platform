"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { TopNav } from "@/components/top-nav"
import { supabase } from "@/lib/supabase"
import { useDailyStreak } from "@/hooks/use-daily-streak"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Adicione esta linha após as outras declarações de useState
  const { streak } = useDailyStreak()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔐 Verificando autenticação...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log("❌ Nenhuma sessão encontrada, redirecionando...")
          router.push("/")
          return
        }

        console.log("✅ Sessão válida encontrada:", session.user.email)
        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error)
        // Não redirecionar imediatamente em caso de erro para evitar loops
        setIsLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Mudança no estado de auth:", event, session?.user?.email)

      if (event === "SIGNED_OUT" || !session) {
        console.log("🚪 Usuário deslogado, redirecionando...")
        setIsAuthenticated(false)
        router.push("/")
      } else if (event === "SIGNED_IN" && session) {
        console.log("🔐 Usuário logado:", session.user.email)
        setIsAuthenticated(true)
        setIsLoading(false)
      }
    })

    return () => {
      console.log("🧹 Limpando subscription de auth")
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <TopNav />
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 md:ml-16 p-4 md:p-6 transition-all duration-300">{children}</main>
      </div>
    </div>
  )
}
