import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Client } from "@shared/schema";

export default function ClientsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление клиентами";
  }, []);

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const canCreateOrEdit = user?.role === "instructor" || user?.role === "administrator";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="clients-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">Управление базой клиентов конюшни</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск клиентов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-clients"
            />
          </div>
          {canCreateOrEdit && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              data-testid="button-create-client"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить клиента
            </Button>
          )}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {clients?.length === 0 ? "Нет добавленных клиентов" : "Нет клиентов, соответствующих поиску"}
          </div>
          {canCreateOrEdit && clients?.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первого клиента
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} data-testid={`client-card-${client.id}`}>
              <CardHeader>
                <CardTitle className="text-lg" data-testid={`client-name-${client.id}`}>
                  {client.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span data-testid={`client-phone-${client.id}`}>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span data-testid={`client-email-${client.id}`}>{client.email}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">Заметки:</div>
                    <div className="text-gray-700">{client.notes}</div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Добавлен: {new Date(client.createdAt!).toLocaleDateString("ru-RU")}
                </div>
                {canCreateOrEdit && (
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => {
                        setEditingClientId(client.id);
                        setShowEditModal(true);
                      }}
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      Редактировать
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-lessons-${client.id}`}>
                      Занятия
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateClientModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateClientModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create client");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">Добавить клиента</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя*</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-client-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-client-phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-client-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Заметки</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="input-client-notes"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save-client"
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
