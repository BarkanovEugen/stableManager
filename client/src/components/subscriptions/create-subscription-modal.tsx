import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

interface CreateSubscriptionModalProps {
  onClose: () => void;
}

export default function CreateSubscriptionModal({ onClose }: CreateSubscriptionModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    clientSearch: "",
    totalLessons: "4",
    durationMonths: "6",
  });
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create client");
      }

      return response.json();
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setFormData({ ...formData, clientId: newClient.id, clientSearch: newClient.name });
      setShowClientCreate(false);
      setNewClientName("");
      toast({
        title: "Клиент создан",
        description: "Новый клиент успешно добавлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать клиента",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(formData.durationMonths));

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          totalLessons: parseInt(formData.totalLessons),
          lessonsRemaining: parseInt(formData.totalLessons),
          durationMonths: parseInt(formData.durationMonths),
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Абонемент создан",
        description: "Новый абонемент успешно добавлен",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать абонемент",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast({
        title: "Ошибка",
        description: "Выберите клиента",
        variant: "destructive",
      });
      return;
    }

    createSubscriptionMutation.mutate();
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя клиента",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate(newClientName.trim());
  };

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(formData.clientSearch.toLowerCase())
  ) || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Создание абонемента
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-subscription-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Клиент*</Label>
            <div className="space-y-2">
              <Input
                placeholder="Поиск клиента по имени..."
                value={formData.clientSearch}
                onChange={(e) => setFormData({ ...formData, clientSearch: e.target.value, clientId: "" })}
                data-testid="input-client-search"
              />
              
              {formData.clientSearch && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <div
                        key={client.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => setFormData({ ...formData, clientId: client.id, clientSearch: client.name })}
                        data-testid={`client-option-${client.id}`}
                      >
                        <div className="font-medium">{client.name}</div>
                        {client.phone && <div className="text-sm text-muted-foreground">{client.phone}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-muted-foreground mb-2">Клиент не найден</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClientCreate(true)}
                        data-testid="button-show-create-client"
                      >
                        Создать нового клиента
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {showClientCreate && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label>Имя нового клиента</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Введите имя клиента"
                  data-testid="input-new-client-name"
                />
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending}
                  data-testid="button-create-client"
                >
                  {createClientMutation.isPending ? "..." : "Создать"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientCreate(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Количество занятий*</Label>
              <Select 
                value={formData.totalLessons} 
                onValueChange={(value) => setFormData({ ...formData, totalLessons: value })}
              >
                <SelectTrigger data-testid="select-total-lessons">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 занятия</SelectItem>
                  <SelectItem value="8">8 занятий</SelectItem>
                  <SelectItem value="12">12 занятий</SelectItem>
                  <SelectItem value="16">16 занятий</SelectItem>
                  <SelectItem value="20">20 занятий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Длительность (месяцев)*</Label>
              <Select 
                value={formData.durationMonths} 
                onValueChange={(value) => setFormData({ ...formData, durationMonths: value })}
              >
                <SelectTrigger data-testid="select-duration-months">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 месяц</SelectItem>
                  <SelectItem value="3">3 месяца</SelectItem>
                  <SelectItem value="6">6 месяцев</SelectItem>
                  <SelectItem value="12">12 месяцев</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Информация об абонементе</h4>
            <p className="text-sm text-muted-foreground">
              Абонемент будет действителен в течение {formData.durationMonths} месяцев и включает {formData.totalLessons} занятий.
            </p>
            {formData.durationMonths && (
              <p className="text-sm text-muted-foreground mt-1">
                Истекает: {new Date(Date.now() + parseInt(formData.durationMonths) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU")}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-subscription"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={createSubscriptionMutation.isPending}
              data-testid="button-create-subscription-submit"
            >
              {createSubscriptionMutation.isPending ? "Создание..." : "Создать абонемент"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}