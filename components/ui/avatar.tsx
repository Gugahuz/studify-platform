"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-studify-lightgreen/20 text-studify-green font-medium",
        className,
      )}
      {...props}
    />
  ),
)
AvatarFallback.displayName = "AvatarFallback"

// Enhanced component for user profile avatars with better image handling
const AvatarWithProfile = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    userProfile?: { avatar_url?: string; nome?: string } | null
    size?: "sm" | "md" | "lg"
    showFallback?: boolean
  }
>(({ className, userProfile, size = "md", showFallback = true, ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-20 w-20",
  }

  const getInitial = () => {
    if (userProfile?.nome) {
      return userProfile.nome.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Avatar ref={ref} className={cn(sizeClasses[size], className)} {...props}>
      {userProfile?.avatar_url ? (
        <AvatarImage
          src={userProfile.avatar_url || "/placeholder.svg"}
          alt={userProfile.nome || "Avatar do usuário"}
          className="object-cover w-full h-full"
          onError={(e) => {
            console.log("❌ Erro ao carregar avatar:", userProfile.avatar_url)
            // Hide the image on error to show fallback
            e.currentTarget.style.display = "none"
          }}
        />
      ) : null}
      {showFallback && (
        <AvatarFallback className="bg-studify-lightgreen/20 text-studify-green font-medium">
          {getInitial()}
        </AvatarFallback>
      )}
    </Avatar>
  )
})
AvatarWithProfile.displayName = "AvatarWithProfile"

export { Avatar, AvatarImage, AvatarFallback, AvatarWithProfile }
