import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Gift, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Certificate } from "@shared/schema";

export default function CertificatesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Подарочные сертификаты";
  }, []);

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const filteredCertificates = certificates?.filter(certificate => {
    const matchesSearch = certificate.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || certificate.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Активен</Badge>;
      case "used":
        return <Badge className="bg-blue-100 text-blue-800">Использован</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Истек</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTotalValue = () => {
    return certificates?.reduce((sum, cert) => sum + parseFloat(cert.value.toString()), 0) || 0;
  };

  const getActiveValue = () => {
    return certificates?.filter(cert => cert.status === "active")
      .reduce((sum, cert) => sum + parseFloat(cert.value.toString()), 0) || 0;
  };

  const canManage = user?.role === "instructor" || user?.role === "administrator";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="certificates-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">Управление подарочными сертификатами</p>
        </div>
        {canManage && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            data-testid="button-create-certificate"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать сертификат
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего сертификатов</p>
                <p className="text-2xl font-bold">{certificates?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общая стоимость</p>
                <p className="text-2xl font-bold">{getTotalValue().toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активные сертификаты</p>
                <p className="text-2xl font-bold">{getActiveValue().toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск по номеру сертификата..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-certificates"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="used">Использованные</SelectItem>
                <SelectItem value="expired">Истекшие</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {certificates?.length === 0 ? "Нет созданных сертификатов" : "Нет сертификатов, соответствующих фильтрам"}
          </div>
          {canManage && certificates?.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать первый сертификат
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} data-testid={`certificate-card-${certificate.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid={`certificate-number-${certificate.id}`}>
                    №{certificate.number}
                  </CardTitle>
                  {getStatusBadge(certificate.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary" data-testid={`certificate-value-${certificate.id}`}>
                    {certificate.value} ₽
                  </div>
                  <div className="text-sm text-muted-foreground">Номинал</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создан:</span>
                    <span>{new Date(certificate.createdAt!).toLocaleDateString("ru-RU")}</span>
                  </div>
                  
                  {certificate.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Истекает:</span>
                      <span>{new Date(certificate.expiresAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                  )}
                  
                  {certificate.usedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Использован:</span>
                      <span>{new Date(certificate.usedAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      data-testid={`button-edit-certificate-${certificate.id}`}
                    >
                      Редактировать
                    </Button>
                    {certificate.status === "active" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        data-testid={`button-use-certificate-${certificate.id}`}
                      >
                        Использовать
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCertificateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateCertificateModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    number: "",
    value: "",
    expiresAt: "",
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        value: parseFloat(data.value),
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create certificate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Generate random certificate number
  const generateNumber = () => {
    const number = Math.random().toString().substr(2, 8);
    setFormData({ ...formData, number });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">Создать сертификат</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Номер сертификата*</label>
            <div className="flex gap-2">
              <Input
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
                data-testid="input-certificate-number"
              />
              <Button type="button" variant="outline" onClick={generateNumber}>
                Генерировать
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Номинал*</label>
            <Input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              min="1"
              step="0.01"
              data-testid="input-certificate-value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Дата истечения</label>
            <Input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              data-testid="input-certificate-expires"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save-certificate"
            >
              {createMutation.isPending ? "Создание..." : "Создать"}
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
