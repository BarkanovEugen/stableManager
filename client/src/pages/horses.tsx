import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import HorseCard from "@/components/horses/horse-card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Horse } from "@shared/schema";

export default function HorsesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление лошадьми";
  }, []);

  const { data: horses, isLoading } = useQuery<Horse[]>({
    queryKey: ["/api/horses"],
  });

  const { data: horseStats } = useQuery({
    queryKey: ["/api/statistics/horses"],
  });

  const filteredHorses = horses?.filter(horse =>
    horse.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    horse.breed.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getHorseStats = (horseId: string) => {
    if (!horseStats || !Array.isArray(horseStats)) {
      return { totalHours: 0, totalLessons: 0 };
    }
    return horseStats.find((stat: any) => stat.horseId === horseId) || {
      totalHours: 0,
      totalLessons: 0
    };
  };

  const canCreateOrEdit = user?.role === "instructor" || user?.role === "administrator";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="horses-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">Учет и статистика работы лошадей в конюшне</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск лошадей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-horses"
            />
          </div>
          {canCreateOrEdit && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              data-testid="button-create-horse"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить лошадь
            </Button>
          )}
        </div>
      </div>

      {filteredHorses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {horses?.length === 0 ? "Нет добавленных лошадей" : "Нет лошадей, соответствующих поиску"}
          </div>
          {canCreateOrEdit && horses?.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую лошадь
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHorses.map((horse) => (
            <HorseCard
              key={horse.id}
              horse={horse}
              stats={getHorseStats(horse.id)}
              canEdit={canCreateOrEdit}
              data-testid={`horse-card-${horse.id}`}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateHorseModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateHorseModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    nickname: "",
    breed: "",
    age: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/horses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          age: parseInt(data.age),
        }),
      });
      if (!response.ok) throw new Error("Failed to create horse");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      toast({ title: "Лошадь добавлена", description: "Новая лошадь успешно добавлена в систему" });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Добавить лошадь</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Кличка</label>
            <Input
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              required
              data-testid="input-horse-nickname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Порода</label>
            <Input
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              required
              data-testid="input-horse-breed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Возраст</label>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              min="1"
              data-testid="input-horse-age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Заметки</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="input-horse-notes"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save-horse"
            >
              {createMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
