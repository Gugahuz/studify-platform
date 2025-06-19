"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeleteDeckModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  deckName: string
  isDeleting?: boolean
}

export function DeleteDeckModal({ isOpen, onClose, onConfirm, deckName, isDeleting = false }: DeleteDeckModalProps) {
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    try {
      setError(null)
      await onConfirm()
      onClose()
    } catch (err) {
      setError("Erro ao excluir deck. Tente novamente.")
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Esta ação não pode ser desfeita. O deck e todos os seus flashcards serão removidos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Você está prestes a excluir o deck: <span className="font-semibold">"{deckName}"</span>
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting} className="min-w-[100px]">
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Excluindo...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
