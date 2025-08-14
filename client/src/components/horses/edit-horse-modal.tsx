import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Horse } from "@shared/schema";

interface EditHorseModalProps {
  horse: Horse;
  onClose: () => void;
}

export default function EditHorseModal({ horse, onClose }: EditHorseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nickname: horse.nickname,
    breed: horse.breed,
    age: horse.age?.toString() || "",
    status: horse.status,
    notes: horse.notes || "",
  });

  const updateHorseMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        nickname: data.nickname,
        breed: data.breed,
        age: data.age ? parseInt(data.age) : horse.age,
        status: data.status as "active" | "rest" | "unavailable",
        notes: data.notes || null,
      };
      
      const response = await fetch(`/api/horses/${horse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update horse");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/horses"] });
      toast({
        title: "Лошадь обновлена",
        description: "Изменения успешно сохранены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить лошадь. Попробуйте еще раз.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHorseMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать лошадь</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Кличка*</Label>
            <Input
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              required
              data-testid="input-horse-nickname"
            />
          </div>

          <div>
            <Label>Порода*</Label>
            <Input
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              required
              data-testid="input-horse-breed"
            />
          </div>

          <div>
            <Label>Возраст</Label>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="1"
              max="50"
              data-testid="input-horse-age"
            />
          </div>



          <div>
            <Label>Статус*</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger data-testid="select-horse-status">
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активная</SelectItem>
                <SelectItem value="rest">На отдыхе</SelectItem>
                <SelectItem value="unavailable">Недоступна</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация о лошади..."
              rows={3}
              data-testid="textarea-horse-notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={updateHorseMutation.isPending}>
              {updateHorseMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}