import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { LessonWithRelations, Client, Instructor, Horse } from "@shared/schema";

interface EditLessonModalProps {
  lessonId: string;
  onClose: () => void;
}

export default function EditLessonModal({ lessonId, onClose }: EditLessonModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lesson data
  const { data: lesson, isLoading: lessonLoading } = useQuery<LessonWithRelations>({
    queryKey: ["/api/lessons", lessonId],
    queryFn: () => fetch(`/api/lessons/${lessonId}`).then(res => res.json()),
  });

  // Fetch related data
  const { data: clients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: horses } = useQuery<Horse[]>({ queryKey: ["/api/horses"] });

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: "45",
    clientId: "",
    type: "",
    paymentType: "",
    cost: "",
    notes: "",
    instructorIds: [] as string[],
    horseIds: [] as string[],
  });

  // Initialize form data when lesson loads
  useEffect(() => {
    if (lesson) {
      const lessonDate = new Date(lesson.date);
      setFormData({
        date: lessonDate.toISOString().split('T')[0],
        time: lessonDate.toTimeString().slice(0, 5),
        duration: lesson.duration?.toString() || "45",
        clientId: lesson.clientId,
        type: lesson.type,
        paymentType: lesson.paymentType,
        cost: lesson.cost.toString(),
        notes: lesson.notes || "",
        instructorIds: lesson.lessonInstructors?.map(li => li.instructorId) || [],
        horseIds: lesson.lessonHorses?.map(lh => lh.horseId) || [],
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const lessonDate = new Date(`${data.date}T${data.time}`);
      const payload = {
        clientId: data.clientId,
        date: lessonDate.toISOString(),
        duration: parseInt(data.duration),
        type: data.type,
        paymentType: data.paymentType,
        cost: parseFloat(data.cost),
        notes: data.notes || null,
        instructorIds: data.instructorIds,
        horseIds: data.horseIds,
      };
      
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update lesson");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate multiple related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/horses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/revenue"] });
      toast({
        title: "Занятие обновлено",
        description: "Изменения успешно сохранены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить занятие. Попробуйте еще раз.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLessonMutation.mutate(formData);
  };

  const handleInstructorChange = (instructorId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, instructorIds: [...formData.instructorIds, instructorId] });
    } else {
      setFormData({ 
        ...formData, 
        instructorIds: formData.instructorIds.filter(id => id !== instructorId) 
      });
    }
  };

  const handleHorseChange = (horseId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, horseIds: [...formData.horseIds, horseId] });
    } else {
      setFormData({ 
        ...formData, 
        horseIds: formData.horseIds.filter(id => id !== horseId) 
      });
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "cash": return "Наличные (1500 ₽)";
      case "certificate": return "Сертификат (1500 ₽)";
      case "subscription": return "Абонемент (1250 ₽)";
      default: return type;
    }
  };

  if (lessonLoading || !lesson) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Загрузка...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать занятие</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Дата*</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                data-testid="input-lesson-date"
              />
            </div>
            <div>
              <Label>Время*</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                data-testid="input-lesson-time"
              />
            </div>
            <div>
              <Label>Длительность (мин)*</Label>
              <Select 
                value={formData.duration} 
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger data-testid="select-lesson-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 минут</SelectItem>
                  <SelectItem value="45">45 минут</SelectItem>
                  <SelectItem value="60">60 минут</SelectItem>
                  <SelectItem value="90">90 минут</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Клиент*</Label>
            <Select 
              value={formData.clientId} 
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
            >
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Тип тренировки*</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger data-testid="select-lesson-type">
                <SelectValue placeholder="Выберите тип тренировки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hippotherapy">Иппотерапия</SelectItem>
                <SelectItem value="beginner_riding">Верховая езда новичок</SelectItem>
                <SelectItem value="advanced_riding">Верховая езда опытный</SelectItem>
                <SelectItem value="walk">Прогулка</SelectItem>
                <SelectItem value="mounted_archery">Верховая стрельба из лука</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Инструкторы*</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {instructors?.map(instructor => (
                <div key={instructor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`instructor-${instructor.id}`}
                    checked={formData.instructorIds.includes(instructor.id)}
                    onCheckedChange={(checked) => handleInstructorChange(instructor.id, checked as boolean)}
                    data-testid={`checkbox-instructor-${instructor.id}`}
                  />
                  <Label htmlFor={`instructor-${instructor.id}`} className="text-sm">
                    {instructor.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Лошади*</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {horses?.map(horse => (
                <div key={horse.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`horse-${horse.id}`}
                    checked={formData.horseIds.includes(horse.id)}
                    onCheckedChange={(checked) => handleHorseChange(horse.id, checked as boolean)}
                    data-testid={`checkbox-horse-${horse.id}`}
                  />
                  <Label htmlFor={`horse-${horse.id}`} className="text-sm">
                    {horse.nickname} ({horse.breed})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Тип оплаты*</Label>
            <Select 
              value={formData.paymentType} 
              onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
            >
              <SelectTrigger data-testid="select-payment-type">
                <SelectValue placeholder="Выберите тип оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Наличные (1500 ₽)</SelectItem>
                <SelectItem value="certificate">Сертификат (1500 ₽)</SelectItem>
                <SelectItem value="subscription">Абонемент (1250 ₽)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Стоимость*</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
              data-testid="input-cost"
            />
          </div>

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительные заметки к занятию..."
              rows={3}
              data-testid="textarea-notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={updateLessonMutation.isPending}>
              {updateLessonMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}