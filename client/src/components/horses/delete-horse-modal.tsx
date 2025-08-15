import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Horse } from "@shared/schema";

interface DeleteHorseModalProps {
  horse: Horse;
  onClose: () => void;
}

export default function DeleteHorseModal({ horse, onClose }: DeleteHorseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/horses/${horse.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete horse");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/horses"] });
      toast({
        title: "Успешно",
        description: `Лошадь "${horse.nickname}" была удалена`,
      });
      onClose();
    },
    onError: (error) => {
      console.error("Delete horse error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить лошадь",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    setIsLoading(true);
    deleteMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Подтверждение удаления
          </DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Лошадь будет удалена из системы.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Информация о лошади</h3>
            <p><strong>Кличка:</strong> {horse.nickname}</p>
            <p><strong>Порода:</strong> {horse.breed}</p>
            <p><strong>Возраст:</strong> {horse.age} лет</p>
            <p><strong>Статус:</strong> {horse.status}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Внимание:</strong> При удалении лошади:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• В завершенных занятиях лошадь останется для статистики</li>
              <li>• В незавершенных занятиях лошадь будет заменена на "Не назначено"</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Вы уверены, что хотите удалить лошадь <strong>"{horse.nickname}"</strong>?
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="button-cancel-delete"
          >
            Отменить
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isLoading}
            data-testid="button-confirm-delete"
          >
            {isLoading ? "Удаление..." : "Удалить лошадь"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}