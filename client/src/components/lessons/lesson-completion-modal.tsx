import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LessonWithRelations } from "@shared/schema";

interface LessonCompletionModalProps {
  lessonId: string;
  onClose: () => void;
}

export default function LessonCompletionModal({ lessonId, onClose }: LessonCompletionModalProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lesson } = useQuery<LessonWithRelations>({
    queryKey: ["/api/lessons", lessonId],
    queryFn: () => fetch(`/api/lessons/${lessonId}`).then(res => res.json()),
  });

  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          isPaid,
          paymentType: isPaid ? paymentType : lesson?.paymentType,
          notes: notes || lesson?.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete lesson");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate multiple related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/horses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/revenue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Занятие завершено",
        description: "Статус занятия успешно обновлен",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить занятие",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPaid && !paymentType) {
      toast({
        title: "Ошибка",
        description: "Выберите тип оплаты",
        variant: "destructive",
      });
      return;
    }

    completeLessonMutation.mutate();
  };

  if (!lesson) {
    return null;
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "cash":
        return "Наличные";
      case "subscription":
        return "Абонемент";
      case "certificate":
        return "Сертификат";
      default:
        return type;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Завершение занятия
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-completion-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Информация о занятии</h3>
            <p><strong>Клиент:</strong> {lesson.client.name}</p>
            <p><strong>Дата:</strong> {new Date(lesson.date).toLocaleDateString("ru-RU")}</p>
            <p><strong>Стоимость:</strong> {lesson.cost} ₽</p>
            <p><strong>Тип оплаты:</strong> {getPaymentTypeLabel(lesson.paymentType)}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={setIsPaid}
              data-testid="checkbox-is-paid"
            />
            <Label htmlFor="isPaid">Занятие оплачено</Label>
          </div>

          {isPaid && (
            <div>
              <Label>Тип оплаты*</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger data-testid="select-payment-type-completion">
                  <SelectValue placeholder={`По умолчанию: ${getPaymentTypeLabel(lesson.paymentType)}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="subscription">Абонемент</SelectItem>
                  <SelectItem value="certificate">Сертификат</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные заметки к занятию..."
              data-testid="textarea-notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-completion"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={completeLessonMutation.isPending}
              data-testid="button-complete-lesson"
            >
              {completeLessonMutation.isPending ? "Сохранение..." : "Завершить занятие"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}