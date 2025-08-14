import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, TrendingUp, BarChart3 } from "lucide-react";
import type { Client, LessonWithRelations } from "@shared/schema";

interface ClientLessonsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientLessonsModal({ client, onClose }: ClientLessonsModalProps) {
  const [periodMonths, setPeriodMonths] = useState("6");

  // Calculate date range based on selected period
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(periodMonths));
  const endDate = new Date();

  // Fetch lessons for this client
  const { data: allLessons } = useQuery<LessonWithRelations[]>({
    queryKey: ["/api/lessons"],
  });

  // Filter lessons for this client within the selected period
  const clientLessons = (allLessons || []).filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lesson.clientId === client.id && 
           lessonDate >= startDate && 
           lessonDate <= endDate;
  });

  // Calculate statistics
  const totalLessons = clientLessons.length;
  const completedLessons = clientLessons.filter(l => l.status === "completed").length;
  
  // Lesson types statistics
  const lessonTypes = clientLessons.reduce((acc, lesson) => {
    acc[lesson.type] = (acc[lesson.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularType = Object.entries(lessonTypes)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "Нет данных";

  // Day of week statistics
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayStats = clientLessons.reduce((acc, lesson) => {
    const dayIndex = new Date(lesson.date).getDay();
    const dayName = daysOfWeek[dayIndex];
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularDay = Object.entries(dayStats)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "Нет данных";

  // Time statistics
  const timeStats = clientLessons.reduce((acc, lesson) => {
    const hour = new Date(lesson.date).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostPopularHour = Object.entries(timeStats)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  const mostPopularTime = mostPopularHour ? `${mostPopularHour}:00` : "Нет данных";

  const getLessonTypeName = (type: string) => {
    const types: Record<string, string> = {
      hippotherapy: "Иппотерапия",
      beginner_riding: "Верховая езда новичок",
      advanced_riding: "Верховая езда опытный",
      walk: "Прогулка",
      mounted_archery: "Верховая стрельба из лука"
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Завершено</Badge>;
      case "planned":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Запланировано</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Отменено</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Занятия клиента: {client.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Период:</label>
            <Select value={periodMonths} onValueChange={setPeriodMonths}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Последний месяц</SelectItem>
                <SelectItem value="3">Последние 3 месяца</SelectItem>
                <SelectItem value="6">Последние 6 месяцев</SelectItem>
                <SelectItem value="12">Последний год</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalLessons}</div>
                <div className="text-sm text-muted-foreground">Всего занятий</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedLessons}</div>
                <div className="text-sm text-muted-foreground">Завершено</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center">
                <Calendar className="w-6 h-6 text-blue-600 mb-1" />
                <div className="text-sm font-medium">{mostPopularDay}</div>
                <div className="text-xs text-muted-foreground">Популярный день</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center">
                <Clock className="w-6 h-6 text-purple-600 mb-1" />
                <div className="text-sm font-medium">{mostPopularTime}</div>
                <div className="text-xs text-muted-foreground">Популярное время</div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson types breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Типы занятий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Самый популярный тип: </span>
                  {getLessonTypeName(mostPopularType)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(lessonTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm">{getLessonTypeName(type)}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Последние занятия
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientLessons.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Нет занятий за выбранный период
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {clientLessons
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {new Date(lesson.date).toLocaleDateString("ru-RU")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(lesson.date).toLocaleTimeString("ru-RU", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </div>
                        <div className="text-sm">
                          {getLessonTypeName(lesson.type)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {lesson.cost} ₽
                        </div>
                        {getStatusBadge(lesson.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}