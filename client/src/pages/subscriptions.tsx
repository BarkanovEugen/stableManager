import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, User, Clock } from "lucide-react";
import CreateSubscriptionModal from "@/components/subscriptions/create-subscription-modal";
import SubscriptionDetailsModal from "@/components/subscriptions/subscription-details-modal";
import type { Subscription, Client } from "@shared/schema";

export default function SubscriptionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("");

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление абонементами";
  }, []);

  const { data: subscriptions, isLoading } = useQuery<(Subscription & { client: Client })[]>({
    queryKey: ["/api/subscriptions"],
  });

  const filteredSubscriptions = subscriptions?.filter(subscription => {
    if (statusFilter !== "all" && subscription.status !== statusFilter) return false;
    if (clientFilter && !subscription.client.name.toLowerCase().includes(clientFilter.toLowerCase())) return false;
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Активен</Badge>;
      case "expired":
        return <Badge variant="default" className="bg-red-100 text-red-800">Истек</Badge>;
      case "used":
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Использован</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU");
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Истек";
    if (diffDays === 0) return "Истекает сегодня";
    if (diffDays === 1) return "Истекает завтра";
    return `Осталось ${diffDays} дней`;
  };

  return (
    <div className="space-y-6" data-testid="subscriptions-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Абонементы</h1>
          <p className="text-muted-foreground">
            Управление абонементами клиентов
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          data-testid="button-create-subscription"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать абонемент
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="expired">Истек</SelectItem>
                  <SelectItem value="used">Использован</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Клиент</label>
              <Input
                placeholder="Поиск по имени клиента"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                data-testid="input-client-filter"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Загрузка абонементов...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              {subscriptions?.length === 0 ? "Нет созданных абонементов" : "Нет абонементов, соответствующих фильтрам"}
            </p>
          </div>
        ) : (
          filteredSubscriptions.map((subscription) => (
            <Card 
              key={subscription.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedSubscriptionId(subscription.id)}
              data-testid={`subscription-card-${subscription.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg" data-testid={`subscription-client-${subscription.id}`}>
                      {subscription.client.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {subscription.client.phone}
                    </p>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Занятий осталось: <strong>{subscription.lessonsRemaining} из {subscription.totalLessons}</strong></span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Создан: {formatDate(subscription.createdAt!)}</span>
                </div>

                {subscription.expiresAt && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className={subscription.status === "expired" ? "text-red-600" : ""}>
                      {getTimeRemaining(subscription.expiresAt)}
                    </span>
                  </div>
                )}

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${(subscription.lessonsRemaining / subscription.totalLessons) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  Использовано {subscription.totalLessons - subscription.lessonsRemaining} занятий
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateSubscriptionModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedSubscriptionId && (
        <SubscriptionDetailsModal
          subscriptionId={selectedSubscriptionId}
          onClose={() => setSelectedSubscriptionId(null)}
        />
      )}
    </div>
  );
}