import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/toast-provider"
import { DatabaseInitializer } from "@/components/database-initializer"

export const metadata: Metadata = {
  title: "Studify - Assistente de Estudos",
  description: "Organize seus estudos com a ajuda da inteligência artificial",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <DatabaseInitializer />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
