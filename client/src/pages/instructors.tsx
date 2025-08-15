import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Instructor, LessonWithRelations } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLessonTypeLabel } from "@/lib/lesson-types";

export default function InstructorsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [scheduleInstructor, setScheduleInstructor] = useState<Instructor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление инструкторами";
  }, []);

  const { data: instructors, isLoading } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: instructorStats } = useQuery({
    queryKey: ["/api/statistics/instructors"],
  });

  const filteredInstructors = instructors?.filter(instructor =>
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.specializations?.some(spec => 
      spec.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const getInstructorStats = (instructorId: string) => {
    if (!instructorStats || !Array.isArray(instructorStats)) {
      return { totalLessons: 0, totalRevenue: 0, totalHours: 0 };
    }
    return instructorStats.find((stat: any) => stat.instructorId === instructorId) || {
      totalLessons: 0,
      totalRevenue: 0,
      totalHours: 0
    };
  };

  const canManage = user?.role === "administrator";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="instructors-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">Управление инструкторами и их статистикой</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск инструкторов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-instructors"
            />
          </div>
          {canManage && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              data-testid="button-create-instructor"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить инструктора
            </Button>
          )}
        </div>
      </div>

      {filteredInstructors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {instructors?.length === 0 ? "Нет добавленных инструкторов" : "Нет инструкторов, соответствующих поиску"}
          </div>
          {canManage && instructors?.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первого инструктора
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => {
            const stats = getInstructorStats(instructor.id);
            return (
              <Card key={instructor.id} data-testid={`instructor-card-${instructor.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`instructor-name-${instructor.id}`}>
                      {instructor.name}
                    </CardTitle>
                    <Badge 
                      variant={instructor.isActive ? "default" : "secondary"}
                      className={instructor.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {instructor.isActive ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Активен
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Неактивен
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {instructor.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span data-testid={`instructor-phone-${instructor.id}`}>{instructor.phone}</span>
                    </div>
                  )}
                  {instructor.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span data-testid={`instructor-email-${instructor.id}`}>{instructor.email}</span>
                    </div>
                  )}
                  
                  {instructor.specializations && instructor.specializations.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Специализации:</div>
                      <div className="flex flex-wrap gap-1">
                        {instructor.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Статистика за месяц</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Часов</div>
                        <div className="font-semibold" data-testid={`instructor-hours-${instructor.id}`}>
                          {(stats.totalHours || 0).toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Занятий</div>
                        <div className="font-semibold" data-testid={`instructor-lessons-${instructor.id}`}>
                          {stats.totalLessons}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Добавлен: {new Date(instructor.createdAt!).toLocaleDateString("ru-RU")}
                  </div>

                  {canManage && (
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setEditingInstructor(instructor)}
                        data-testid={`button-edit-instructor-${instructor.id}`}
                      >
                        Редактировать
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setScheduleInstructor(instructor)}
                        data-testid={`button-view-schedule-${instructor.id}`}
                      >
                        Расписание
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateInstructorModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingInstructor && (
        <EditInstructorModal 
          instructor={editingInstructor}
          onClose={() => setEditingInstructor(null)} 
        />
      )}

      {scheduleInstructor && (
        <InstructorScheduleModal 
          instructor={scheduleInstructor}
          onClose={() => setScheduleInstructor(null)} 
        />
      )}
    </div>
  );
}

function CreateInstructorModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    specializations: "",
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        specializations: data.specializations.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create instructor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
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
          <h3 className="text-xl font-semibold">Добавить инструктора</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя*</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-instructor-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-instructor-phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-instructor-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Специализации</label>
            <Input
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder="Верховая езда, Иппотерапия, Стрельба из лука"
              data-testid="input-instructor-specializations"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Перечислите через запятую
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-save-instructor"
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

function EditInstructorModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: instructor.name,
    phone: instructor.phone || "",
    email: instructor.email || "",
    specializations: instructor.specializations?.join(", ") || "",
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        specializations: data.specializations.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      const response = await fetch(`/api/instructors/${instructor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update instructor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать инструктора</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя*</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-edit-instructor-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-edit-instructor-phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-edit-instructor-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Специализации</label>
            <Input
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder="Верховая езда, Иппотерапия, Стрельба из лука"
              data-testid="input-edit-instructor-specializations"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Перечислите через запятую
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-update-instructor"
            >
              {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InstructorScheduleModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const [statusFilter, setStatusFilter] = useState("planned");
  
  const { data: lessons, isLoading } = useQuery<LessonWithRelations[]>({
    queryKey: ["/api/lessons", "instructor", instructor.id],
    queryFn: () => fetch("/api/lessons").then(res => res.json()),
  });

  // Filter lessons for this instructor
  const instructorLessons = lessons?.filter(lesson => 
    lesson.lessonInstructors?.some(li => li.instructorId === instructor.id)
  ) || [];

  // Apply status filter
  const filteredLessons = statusFilter === "all" 
    ? instructorLessons 
    : instructorLessons.filter(lesson => lesson.status === statusFilter);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Расписание: {instructor.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Статус:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Запланированные</SelectItem>
                <SelectItem value="completed">Завершенные</SelectItem>
                <SelectItem value="cancelled">Отмененные</SelectItem>
                <SelectItem value="all">Все</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет занятий с выбранным статусом
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map(lesson => (
                <div key={lesson.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{lesson.client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getLessonTypeLabel(lesson.type)} • {lesson.duration} мин
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Date(lesson.date).toLocaleDateString("ru-RU")} в{" "}
                        {new Date(lesson.date).toLocaleTimeString("ru-RU", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </div>
                      <Badge 
                        variant={
                          lesson.status === "completed" ? "default" :
                          lesson.status === "cancelled" ? "destructive" :
                          "secondary"
                        }
                      >
                        {lesson.status === "planned" ? "Запланировано" :
                         lesson.status === "completed" ? "Завершено" :
                         "Отменено"}
                      </Badge>
                    </div>
                  </div>
                  
                  {lesson.lessonHorses && lesson.lessonHorses.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Лошади: {lesson.lessonHorses.map(lh => lh.horse?.nickname || "Не назначена").join(", ")}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span>{lesson.cost} ₽</span>
                    <span className={lesson.isPaid ? "text-green-600" : "text-red-600"}>
                      {lesson.isPaid ? "Оплачено" : "Не оплачено"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
