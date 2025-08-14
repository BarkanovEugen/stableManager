import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rabbit as HorseIcon, Edit, Trash2 } from "lucide-react";
import EditHorseModal from "./edit-horse-modal";
import type { Horse } from "@shared/schema";

interface HorseCardProps {
  horse: Horse;
  stats: {
    totalHours: number;
    totalLessons: number;
  };
  canEdit: boolean;
}

export default function HorseCard({ horse, stats, canEdit }: HorseCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/horses/${horse.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete horse");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
    },
  });

  const handleDelete = () => {
    if (confirm(`Вы уверены, что хотите удалить лошадь "${horse.nickname}"?`)) {
      deleteMutation.mutate();
    }
  };

  const getStatusBadge = () => {
    switch (horse.status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Активна</Badge>;
      case "rest":
        return <Badge className="bg-yellow-100 text-yellow-800">Отдых</Badge>;
      case "unavailable":
        return <Badge className="bg-red-100 text-red-800">Недоступна</Badge>;
      default:
        return <Badge variant="secondary">{horse.status}</Badge>;
    }
  };

  const workloadPercentage = Math.min((stats.totalHours / 30) * 100, 100);

  return (
    <Card className="overflow-hidden" data-testid={`horse-card-${horse.id}`}>
      <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <HorseIcon size={64} className="text-gray-600" />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold" data-testid={`horse-name-${horse.id}`}>
            {horse.nickname}
          </h4>
          <span className="text-sm text-muted-foreground">#{horse.id.slice(-4)}</span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Порода:</span>
            <span data-testid={`horse-breed-${horse.id}`}>{horse.breed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Возраст:</span>
            <span data-testid={`horse-age-${horse.id}`}>{horse.age} лет</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Статус:</span>
            <span data-testid={`horse-status-${horse.id}`}>{getStatusBadge()}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h5 className="font-medium mb-2">Статистика за месяц</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Часов работы</div>
              <div className="font-semibold" data-testid={`horse-hours-${horse.id}`}>
                {stats.totalHours.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Занятий</div>
              <div className="font-semibold" data-testid={`horse-lessons-${horse.id}`}>
                {stats.totalLessons}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Нагрузка</span>
              <span>{workloadPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${workloadPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {horse.notes && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Заметки:</div>
            <div className="text-sm">{horse.notes}</div>
          </div>
        )}

        {canEdit && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowEditModal(true)}
              data-testid={`button-edit-horse-${horse.id}`}
            >
              <Edit className="w-4 h-4 mr-1" />
              Редактировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
              data-testid={`button-delete-horse-${horse.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {showEditModal && (
        <EditHorseModal
          horse={horse}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </Card>
  );
}
