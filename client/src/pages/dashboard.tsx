import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Rabbit, RussianRuble, UserPlus } from "lucide-react";
import LessonCompletionModal from "@/components/lessons/lesson-completion-modal";
import { translateLessonType } from "@/lib/lesson-types";

export default function Dashboard() {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Дашборд";
  }, []);

  const handleCompleteLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
  };

  const { data: horseStats } = useQuery({
    queryKey: ["/api/statistics/horses"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: revenueData } = useQuery({
    queryKey: ["/api/statistics/revenue"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: newClientsData } = useQuery({
    queryKey: ["/api/statistics/new-clients"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: lessons } = useQuery({
    queryKey: ["/api/lessons"],
    refetchInterval: 15000, // Refresh every 15 seconds for lessons
    refetchOnWindowFocus: true,
  });

  const { data: upcomingLessonsRaw } = useQuery({
    queryKey: ["/api/lessons", "upcoming"],
    queryFn: () => {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return fetch(`/api/lessons?startDate=${today.toISOString().split('T')[0]}&endDate=${nextWeek.toISOString().split('T')[0]}`).then(res => res.json());
    },
    refetchInterval: 15000, // Refresh every 15 seconds for upcoming lessons
    refetchOnWindowFocus: true,
  });

  // Sort upcoming lessons by date/time (nearest first)
  const upcomingLessons = (Array.isArray(upcomingLessonsRaw) && upcomingLessonsRaw) ? 
    [...upcomingLessonsRaw].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : 
    [];

  const todayLessons = Array.isArray(lessons) ? lessons.filter((lesson: any) => {
    const lessonDate = new Date(lesson.date).toDateString();
    const today = new Date().toDateString();
    return lessonDate === today;
  }).length : 0;
  const activeHorses = Array.isArray(horseStats) ? horseStats.filter((horse: any) => horse.totalLessons > 0).length : 0;
  const monthlyRevenue = (revenueData && typeof revenueData === 'object' && 'revenue' in revenueData) ? Number(revenueData.revenue) : 0;
  const newClientsCount = (newClientsData && typeof newClientsData === 'object' && 'count' in newClientsData) ? Number(newClientsData.count) : 0;

  return (
    <div data-testid="dashboard-page">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm" data-testid="stat-today-lessons-label">
                  Занятий сегодня
                </p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-today-lessons-value">
                  {todayLessons}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm" data-testid="stat-active-horses-label">
                  Активных лошадей
                </p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-active-horses-value">
                  {activeHorses}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Rabbit className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm" data-testid="stat-monthly-revenue-label">
                  Доход за месяц
                </p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-monthly-revenue-value">
                  {monthlyRevenue.toLocaleString()} ₽
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <RussianRuble className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm" data-testid="stat-new-clients-label">
                  Новых клиентов
                </p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-new-clients-value">
                  {newClientsCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserPlus className="text-purple-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="recent-lessons-title">Ближайшие занятия</CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(upcomingLessons) || upcomingLessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4" data-testid="no-lessons-message">
                Нет запланированных занятий на ближайшую неделю
              </p>
            ) : (
              <div className="space-y-3">
                {(upcomingLessons || []).slice(0, 5).map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-16 h-12 bg-primary text-white rounded-lg flex flex-col items-center justify-center text-xs font-semibold mr-3">
                        <div className="text-[10px] opacity-80">
                          {new Date(lesson.date).toLocaleDateString("ru-RU", { 
                            day: "2-digit", 
                            month: "2-digit" 
                          })}
                        </div>
                        <div className="text-sm">
                          {new Date(lesson.date).toLocaleTimeString("ru-RU", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`lesson-client-${lesson.id}`}>
                          {lesson.client.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`lesson-type-${lesson.id}`}>
                          {translateLessonType(lesson.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium" data-testid={`lesson-instructor-${lesson.id}`}>
                          {lesson.lessonInstructors[0]?.instructor.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`lesson-horse-${lesson.id}`}>
                          {lesson.lessonHorses[0]?.horse.nickname}
                        </p>
                      </div>
                      {lesson.status === "planned" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCompleteLesson(lesson.id)}
                          data-testid={`button-complete-${lesson.id}`}
                        >
                          Завершить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rabbit Workload */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="horse-workload-title">Нагрузка лошадей (текущий месяц)</CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(horseStats) || horseStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-4" data-testid="no-horse-stats-message">
                Нет данных о нагрузке лошадей
              </p>
            ) : (
              <div className="space-y-3">
                {(horseStats || []).slice(0, 5).map((horse: any) => (
                  <div key={horse.horseId} className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <Rabbit className="text-muted-foreground" size={20} />
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`horse-name-${horse.horseId}`}>
                          {horse.horseName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Занятий: {horse.totalLessons}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid={`horse-hours-${horse.horseId}`}>
                        {horse.totalHours.toFixed(1)} часов
                      </p>
                      <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${Math.min((horse.totalHours / 30) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedLessonId && (
        <LessonCompletionModal
          lessonId={selectedLessonId}
          onClose={() => setSelectedLessonId(null)}
        />
      )}
    </div>
  );
}
