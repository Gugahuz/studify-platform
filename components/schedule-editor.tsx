"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type ScheduleItem, type WeekDay, WEEK_DAYS, SUBJECT_COLORS, checkTimeConflict } from "@/types/schedule"
import { useSchedule } from "@/hooks/use-schedule"
import { Loader2 } from "lucide-react"

interface ScheduleEditorProps {
  isOpen: boolean
  onClose: () => void
  editingItem?: ScheduleItem | null
  defaultDay?: WeekDay
  defaultTime?: string
}

export function ScheduleEditor({
  isOpen,
  onClose,
  editingItem,
  defaultDay = "Segunda",
  defaultTime = "08:00",
}: ScheduleEditorProps) {
  const { schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useSchedule()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    day: defaultDay,
    subject: "",
    startTime: defaultTime,
    duration: 60,
    color: SUBJECT_COLORS[0],
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        day: editingItem.day,
        subject: editingItem.subject,
        startTime: editingItem.startTime,
        duration: editingItem.duration,
        color: editingItem.color,
      })
    } else {
      setFormData({
        day: defaultDay,
        subject: "",
        startTime: defaultTime,
        duration: 60,
        color: SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)],
      })
    }
  }, [editingItem, defaultDay, defaultTime, isOpen])

  const handleSave = async () => {
    if (!formData.subject.trim()) {
      toast({
        title: "Erro",
        description: "O nome da matéria é obrigatório.",
        variant: "destructive",
      })
      return
    }

    // Check for time conflicts
    const hasConflict = checkTimeConflict(formData, schedule, editingItem?.id)
    if (hasConflict) {
      toast({
        title: "Conflito de horário",
        description: "Já existe uma aula neste horário.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (editingItem) {
        await updateScheduleItem(editingItem.id, formData)
      } else {
        await addScheduleItem(formData)
      }

      // Close immediately for better UX (optimistic UI)
      onClose()
    } catch (error) {
      console.error("Erro ao salvar aula:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingItem) return

    setIsSubmitting(true)

    try {
      await deleteScheduleItem(editingItem.id)

      // Close immediately for better UX (optimistic UI)
      onClose()
    } catch (error) {
      console.error("Erro ao excluir aula:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Editar aula" : "Adicionar nova aula"}</DialogTitle>
          <DialogDescription>
            {editingItem ? "Modifique as informações da aula." : "Preencha as informações da nova aula."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Matéria</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Matemática"
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="day">Dia da semana</Label>
              <Select
                value={formData.day}
                onValueChange={(value: WeekDay) => setFormData({ ...formData, day: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startTime">Horário de início</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => setFormData({ ...formData, duration: Number.parseInt(value) })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="150">2h 30min</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-8 h-8 rounded border-2 ${color} ${
                    formData.color === color ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, color })}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
          {editingItem && (
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingItem ? "Salvando..." : "Adicionando..."}
                </>
              ) : editingItem ? (
                "Salvar alterações"
              ) : (
                "Adicionar aula"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleEditor
