import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Calendar, User, Clock, CreditCard } from "lucide-react";
import type { Subscription, Client, LessonWithRelations } from "@shared/schema";

interface SubscriptionDetailsModalProps {
  subscriptionId: string;
  onClose: () => void;
}

export default function SubscriptionDetailsModal({ subscriptionId, onClose }: SubscriptionDetailsModalProps) {
  const { data: subscription } = useQuery<Subscription & { client: Client }>({
    queryKey: ["/api/subscriptions", subscriptionId],
    queryFn: () => fetch(`/api/subscriptions/${subscriptionId}`).then(res => res.json()),
  });

  const { data: lessons } = useQuery<LessonWithRelations[]>({
    queryKey: ["/api/subscriptions", subscriptionId, "lessons"],
    queryFn: () => fetch(`/api/subscriptions/${subscriptionId}/lessons`).then(res => res.json()),
  });

  if (!subscription) {
    return null;
  }

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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("ru-RU");
  };

  const getLessonType = (type: string) => {
    switch (type) {
      case "hippotherapy":
        return "Иппотерапия";
      case "beginner_riding":
        return "Верховая езда новичок";
      case "advanced_riding":
        return "Верховая езда опытный";
      case "walk":
        return "Прогулка";
      case "mounted_archery":
        return "Конная стрельба из лука";
      default:
        return type;
    }
  };

  const usedLessons = lessons?.filter(lesson => lesson.status === "completed") || [];
  const totalUsedLessons = subscription.totalLessons - subscription.lessonsRemaining;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Детали абонемента
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-subscription-details"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold" data-testid="subscription-client-name">
                  {subscription.client.name}
                </h3>
                <p className="text-muted-foreground">{subscription.client.phone}</p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Занятий: {subscription.lessonsRemaining} из {subscription.totalLessons}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Создан: {formatDate(subscription.createdAt!)}</span>
              </div>

              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Длительность: {subscription.durationMonths} мес.</span>
              </div>

              {subscription.expiresAt && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Истекает: {formatDate(subscription.expiresAt)}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Использовано занятий</span>
                <span>{totalUsedLessons} из {subscription.totalLessons}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${(totalUsedLessons / subscription.totalLessons) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Used Lessons */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Использованные занятия ({usedLessons.length})
            </h4>
            
            {usedLessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Пока не было проведено занятий по этому абонементу
              </p>
            ) : (
              <div className="space-y-3">
                {usedLessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50"
                    data-testid={`lesson-${lesson.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium">
                          {getLessonType(lesson.type)}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(lesson.date)}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {lesson.duration} мин
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Инструктор: {lesson.lessonInstructors.map(li => li.instructor.name).join(", ")}</p>
                      <p>Лошадь: {lesson.lessonHorses.map(lh => lh.horse.nickname).join(", ")}</p>
                      {lesson.notes && <p>Заметки: {lesson.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}