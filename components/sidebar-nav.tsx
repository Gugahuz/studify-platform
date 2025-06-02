"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Calendar, MessageSquare, FileText, BarChart2, Crown, Menu, X } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Matérias",
    href: "/dashboard/materias",
    icon: BookOpen,
  },
  {
    title: "Cronograma",
    href: "/dashboard/cronograma",
    icon: Calendar,
  },
  {
    title: "Assistente",
    href: "/dashboard/assistente",
    icon: MessageSquare,
  },
  {
    title: "Resumos",
    href: "/dashboard/resumos",
    icon: FileText,
  },
  {
    title: "Simulados",
    href: "/dashboard/simulados",
    icon: BarChart2,
  },
  {
    title: "Assinatura",
    href: "/dashboard/assinatura",
    icon: Crown,
  },
]

export function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:block fixed inset-y-0 left-0 z-40 bg-studify-white border-r border-studify-gray/20 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16",
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="p-4">
          <div className={cn("flex items-center justify-center mb-8 transition-all duration-300")}>
            <span
              className={cn(
                "studify-logo text-studify-green transition-all duration-300",
                isExpanded ? "text-2xl" : "text-xl",
              )}
            >
              studify
            </span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-studify-gray rounded-md hover:bg-studify-lightgreen/10 hover:text-studify-green group transition-all duration-200",
                  pathname === item.href && "bg-studify-lightgreen/10 text-studify-green",
                  isExpanded ? "px-3 py-2" : "px-2 py-2 justify-center",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isExpanded ? "mr-3" : "")} />
                <span
                  className={cn(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
                  )}
                >
                  {item.title}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-studify-white border-r border-studify-gray/20 transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-8">
            <span className="studify-logo text-studify-green text-3xl">studify</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-studify-gray rounded-md hover:bg-studify-lightgreen/10 hover:text-studify-green group",
                  pathname === item.href && "bg-studify-lightgreen/10 text-studify-green",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
