import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Edit, CheckCircle } from "lucide-react";
import CreateLessonModal from "@/components/lessons/create-lesson-modal";
import LessonCompletionModal from "@/components/lessons/lesson-completion-modal";
import LessonCalendar from "@/components/lessons/lesson-calendar";
import type { LessonWithRelations } from "@shared/schema";

export default function LessonsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление занятиями";
  }, []);

  const { data: lessons, isLoading } = useQuery<LessonWithRelations[]>({
    queryKey: ["/api/lessons"],
    refetchInterval: 15000, // Refresh every 15 seconds
    refetchOnWindowFocus: true,
  });

  const filteredLessons = lessons?.filter(lesson => {
    if (statusFilter !== "all" && lesson.status !== statusFilter) return false;
    if (dateFilter && new Date(lesson.date).toISOString().split('T')[0] !== dateFilter) return false;
    return true;
  }) || [];

  const getStatusBadge = (lesson: LessonWithRelations) => {
    const badges = [];
    
    // Status badge
    switch (lesson.status) {
      case "planned":
        badges.push(<Badge key="status" variant="default" className="bg-blue-100 text-blue-800">Запланировано</Badge>);
        break;
      case "completed":
        badges.push(<Badge key="status" variant="default" className="bg-green-100 text-green-800">Завершено</Badge>);
        break;
      case "cancelled":
        badges.push(<Badge key="status" variant="default" className="bg-red-100 text-red-800">Отменено</Badge>);
        break;
      default:
        badges.push(<Badge key="status" variant="secondary">{lesson.status}</Badge>);
    }

    // Payment status badge
    if (lesson.status === "completed") {
      if (lesson.isPaid) {
        badges.push(<Badge key="payment" variant="default" className="bg-green-100 text-green-800 ml-1">Оплачено</Badge>);
      } else {
        badges.push(<Badge key="debt" variant="default" className="bg-red-100 text-red-800 ml-1">Долг</Badge>);
      }
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const handleCompleteLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
  };

  const handleEditLesson = (lessonId: string) => {
    setEditingLessonId(lessonId);
    setShowEditModal(true);
  };

  const getPaymentTypeBadge = (paymentType: string) => {
    switch (paymentType) {
      case "cash":
        return "Наличные";
      case "subscription":
        return "Абонемент";
      case "certificate":
        return "Сертификат";
      default:
        return paymentType;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="lessons-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">Планирование и учет занятий в конюшне</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          data-testid="button-create-lesson"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать занятие
        </Button>
      </div>

      {/* Calendar View */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle data-testid="calendar-title">Календарь занятий</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium px-4" data-testid="current-month">
                {currentMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LessonCalendar lessons={lessons || []} currentMonth={currentMonth} />
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle data-testid="lessons-list-title">Список занятий</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="planned">Запланированные</SelectItem>
                  <SelectItem value="completed">Завершенные</SelectItem>
                  <SelectItem value="cancelled">Отмененные</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[180px]"
                data-testid="input-date-filter"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Дата/Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Тип занятия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Инструктор
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Лошадь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Оплата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      {lessons?.length === 0 ? "Нет созданных занятий" : "Нет занятий, соответствующих фильтрам"}
                    </td>
                  </tr>
                ) : (
                  filteredLessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50" data-testid={`lesson-row-${lesson.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(lesson.date).toLocaleDateString("ru-RU")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(lesson.date).toLocaleTimeString("ru-RU", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900" data-testid={`lesson-client-${lesson.id}`}>
                          {lesson.client.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lesson.client.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`lesson-type-${lesson.id}`}>
                        {getLessonType(lesson.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lesson.lessonInstructors.map(li => li.instructor.name).join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lesson.lessonHorses.map(lh => lh.horse.nickname).join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lesson.cost} ₽</div>
                        <div className="text-sm text-muted-foreground">
                          {getPaymentTypeBadge(lesson.paymentType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" data-testid={`lesson-status-${lesson.id}`}>
                        {getStatusBadge(lesson)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`button-edit-${lesson.id}`}
                            onClick={() => handleEditLesson(lesson.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {lesson.status === "planned" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600"
                              onClick={() => handleCompleteLesson(lesson.id)}
                              data-testid={`button-complete-${lesson.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {lesson.status === "planned" && (
                            <Button variant="ghost" size="sm" className="text-red-600" data-testid={`button-cancel-${lesson.id}`}>
                              Отменить
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateLessonModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedLessonId && (
        <LessonCompletionModal
          lessonId={selectedLessonId}
          onClose={() => setSelectedLessonId(null)}
        />
      )}
    </div>
  );
}
