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
import type { Client, Horse, Instructor } from "@shared/schema";

interface CreateLessonModalProps {
  onClose: () => void;
}

export default function CreateLessonModal({ onClose }: CreateLessonModalProps) {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: "45",
    clientId: "",
    clientSearch: "",
    type: "",
    paymentType: "",
    cost: "",
    notes: "",
    instructorIds: [] as string[],
    horseIds: [] as string[],
  });
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors", "active"],
    queryFn: () => fetch("/api/instructors?active=true").then(res => res.json()),
  });

  const { data: horses } = useQuery<Horse[]>({
    queryKey: ["/api/horses"],
  });

  const { data: clientSubscriptions } = useQuery({
    queryKey: ["/api/clients", formData.clientId, "subscriptions"],
    queryFn: () => 
      formData.clientId 
        ? fetch(`/api/clients/${formData.clientId}/subscriptions`).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!formData.clientId,
  });

  const createClientMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to create client");
      return response.json();
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setFormData({ ...formData, clientId: newClient.id, clientSearch: newClient.name });
      setShowClientCreate(false);
      setNewClientName("");
    },
  });

  const createLessonMutation = useMutation({
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
      
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create lesson");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate multiple related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/horses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/revenue"] });
      toast({
        title: "Занятие создано",
        description: "Новое занятие успешно добавлено в систему",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать занятие. Попробуйте еще раз.",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(formData.clientSearch.toLowerCase())
  ) || [];

  const activeSubscription = clientSubscriptions?.find((sub: any) => 
    sub.lessonsRemaining > 0 && new Date(sub.expiresAt) > new Date()
  );

  const getPaymentOptions = () => {
    const options = [
      { value: "cash", label: "Наличные (1500 ₽)" },
      { value: "certificate", label: "Сертификат (1500 ₽)" },
    ];

    if (activeSubscription) {
      const expiryDate = new Date(activeSubscription.expiresAt).toLocaleDateString("ru-RU");
      options.push({
        value: "subscription",
        label: `Абонемент (${activeSubscription.lessonsRemaining} занятий до ${expiryDate})`
      });
    }

    return options;
  };

  const handleClientSelect = (client: Client) => {
    setFormData({
      ...formData,
      clientId: client.id,
      clientSearch: client.name,
    });
  };

  const handleCreateNewClient = () => {
    if (newClientName.trim()) {
      createClientMutation.mutate(newClientName.trim());
    }
  };

  const handleInstructorToggle = (instructorId: string) => {
    const newIds = formData.instructorIds.includes(instructorId)
      ? formData.instructorIds.filter(id => id !== instructorId)
      : [...formData.instructorIds, instructorId];
    setFormData({ ...formData, instructorIds: newIds });
  };

  const handleHorseToggle = (horseId: string) => {
    const newIds = formData.horseIds.includes(horseId)
      ? formData.horseIds.filter(id => id !== horseId)
      : [...formData.horseIds, horseId];
    setFormData({ ...formData, horseIds: newIds });
  };

  const handlePaymentTypeChange = (paymentType: string) => {
    let defaultCost = "";
    switch (paymentType) {
      case "cash":
        defaultCost = "1500";
        break;
      case "subscription":
        defaultCost = "1250";
        break;
      case "certificate":
        defaultCost = "1500";
        break;
    }
    setFormData({ ...formData, paymentType, cost: defaultCost });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать клиента",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.instructorIds.length === 0) {
      toast({
        title: "Ошибка", 
        description: "Необходимо выбрать хотя бы одного инструктора",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.horseIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать хотя бы одну лошадь",
        variant: "destructive",
      });
      return;
    }

    createLessonMutation.mutate(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-lesson-modal">
        <DialogHeader>
          <DialogTitle>Создать занятие</DialogTitle>
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
            <div className="relative">
              <Input
                placeholder="Начните вводить имя клиента..."
                value={formData.clientSearch}
                onChange={(e) => setFormData({ ...formData, clientSearch: e.target.value, clientId: "" })}
                data-testid="input-client-search"
              />
              {formData.clientSearch && !formData.clientId && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <div
                        key={client.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleClientSelect(client)}
                        data-testid={`client-option-${client.id}`}
                      >
                        {client.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-muted-foreground">
                      Клиент не найден.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setNewClientName(formData.clientSearch);
                          setShowClientCreate(true);
                        }}
                        className="text-primary hover:underline"
                      >
                        Создать нового?
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                    onCheckedChange={() => handleInstructorToggle(instructor.id)}
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
              {horses?.filter(horse => horse.status === "active" && !horse.nickname.includes('[УДАЛЕНО]')).map(horse => (
                <div key={horse.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`horse-${horse.id}`}
                    checked={formData.horseIds.includes(horse.id)}
                    onCheckedChange={() => handleHorseToggle(horse.id)}
                    data-testid={`checkbox-horse-${horse.id}`}
                  />
                  <Label htmlFor={`horse-${horse.id}`} className="text-sm">
                    {horse.nickname} ({horse.breed})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Тип оплаты*</Label>
              <Select value={formData.paymentType} onValueChange={handlePaymentTypeChange}>
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue placeholder="Выберите тип оплаты" />
                </SelectTrigger>
                <SelectContent>
                  {getPaymentOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Стоимость*</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
                min="0"
                step="0.01"
                data-testid="input-lesson-cost"
              />
            </div>
          </div>

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация о занятии..."
              data-testid="textarea-lesson-notes"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createLessonMutation.isPending}
              data-testid="button-save-lesson"
            >
              {createLessonMutation.isPending ? "Создание..." : "Создать занятие"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>

        {/* Create Client Modal */}
        {showClientCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-sm w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Создать нового клиента</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientCreate(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label>Имя клиента</Label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Введите имя"
                    data-testid="input-new-client-name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateNewClient}
                    disabled={!newClientName.trim() || createClientMutation.isPending}
                    data-testid="button-create-client"
                  >
                    {createClientMutation.isPending ? "Создание..." : "Создать"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowClientCreate(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
