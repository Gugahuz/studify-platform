"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarWithProfileProps {
  userProfile: any
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarWithProfile({ userProfile, size = "md", className = "" }: AvatarWithProfileProps) {
  // Determinar tamanho do avatar
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const sizeClass = sizeClasses[size]

  // Obter a primeira letra do nome para o avatar
  const getInitial = () => {
    if (userProfile?.nome) {
      return userProfile.nome.charAt(0).toUpperCase()
    }
    return "U"
  }

  // Use a safe placeholder URL instead of potentially broken blob URLs
  const avatarUrl =
    userProfile?.avatar_url && userProfile.avatar_url.startsWith("http")
      ? userProfile.avatar_url
      : `/placeholder.svg?height=40&width=40&text=${getInitial()}`

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage
        src={avatarUrl || "/placeholder.svg"}
        alt={userProfile?.nome || "Avatar do usuário"}
        onError={(e) => {
          // If image fails to load, hide it and show fallback
          e.currentTarget.style.display = "none"
        }}
      />
      <AvatarFallback>{getInitial()}</AvatarFallback>
    </Avatar>
  )
}
