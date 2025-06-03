// Sistema centralizado para gerenciar códigos de recuperação
class ResetCodeManager {
  private codes = new Map<string, { code: string; expires: number }>()

  set(email: string, code: string, expiresIn: number = 10 * 60 * 1000) {
    this.codes.set(email.toLowerCase(), {
      code,
      expires: Date.now() + expiresIn,
    })
  }

  get(email: string) {
    return this.codes.get(email.toLowerCase())
  }

  verify(email: string, code: string): { valid: boolean; error?: string } {
    const storedData = this.codes.get(email.toLowerCase())

    if (!storedData) {
      return { valid: false, error: "Código não encontrado" }
    }

    if (Date.now() > storedData.expires) {
      this.codes.delete(email.toLowerCase())
      return { valid: false, error: "Código expirado" }
    }

    if (storedData.code !== code) {
      return { valid: false, error: "Código inválido" }
    }

    return { valid: true }
  }

  delete(email: string) {
    this.codes.delete(email.toLowerCase())
  }

  // Limpar códigos expirados periodicamente
  cleanup() {
    const now = Date.now()
    for (const [email, data] of this.codes.entries()) {
      if (now > data.expires) {
        this.codes.delete(email)
      }
    }
  }
}

// Instância singleton
export const resetCodeManager = new ResetCodeManager()

// Limpar códigos expirados a cada 5 minutos
setInterval(
  () => {
    resetCodeManager.cleanup()
  },
  5 * 60 * 1000,
)
