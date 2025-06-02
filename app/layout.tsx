import type React from "react"
import type { Metadata } from "next"
import { Baloo_2 } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const baloo2 = Baloo_2({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "studify - Never stop learning",
  description: "Plataforma de estudos inteligente para estudantes do ensino médio, vestibulandos e universitários",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={baloo2.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
