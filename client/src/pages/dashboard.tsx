import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Rabbit, RussianRuble, UserPlus } from "lucide-react";

export default function Dashboard() {
  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Дашборд";
  }, []);

  const { data: horseStats } = useQuery({
    queryKey: ["/api/statistics/horses"],
  });

  const { data: revenueData } = useQuery({
    queryKey: ["/api/statistics/revenue"],
  });

  const { data: lessons } = useQuery({
    queryKey: ["/api/lessons", {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }],
  });

  const todayLessons = Array.isArray(lessons) ? lessons.length : 0;
  const activeHorses = Array.isArray(horseStats) ? horseStats.filter((horse: any) => horse.totalLessons > 0).length : 0;
  const monthlyRevenue = (revenueData && typeof revenueData === 'object' && 'revenue' in revenueData) ? revenueData.revenue : 0;

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
                  -
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
            {!Array.isArray(lessons) || lessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4" data-testid="no-lessons-message">
                Нет запланированных занятий на сегодня
              </p>
            ) : (
              <div className="space-y-3">
                {(lessons || []).slice(0, 5).map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-semibold mr-3">
                        {new Date(lesson.date).toLocaleTimeString("ru-RU", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`lesson-client-${lesson.id}`}>
                          {lesson.client.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`lesson-type-${lesson.id}`}>
                          {lesson.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid={`lesson-instructor-${lesson.id}`}>
                        {lesson.lessonInstructors[0]?.instructor.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`lesson-horse-${lesson.id}`}>
                        {lesson.lessonHorses[0]?.horse.nickname}
                      </p>
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
    </div>
  );
}
