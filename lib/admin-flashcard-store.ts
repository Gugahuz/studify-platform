import type { Flashcard } from "@/types/flashcards"

// Este é um armazenamento em memória. Os dados serão perdidos ao reiniciar o servidor.
// Para uma aplicação real, use um banco de dados.
export const adminCreatedFlashcards: Flashcard[] = []

export function addAdminFlashcard(flashcard: Flashcard) {
  // Adiciona no início para que os mais recentes apareçam primeiro
  adminCreatedFlashcards.unshift(flashcard)
}

export function getAdminFlashcards(): Flashcard[] {
  return [...adminCreatedFlashcards] // Retorna uma cópia para evitar mutação direta
}
