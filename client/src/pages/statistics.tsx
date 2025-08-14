import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rabbit, UserCheck, DollarSign, Calendar, TrendingUp, BarChart3 } from "lucide-react";

export default function StatisticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Статистика и отчеты";
  }, []);

  const { data: horseStats, isLoading: horsesLoading } = useQuery({
    queryKey: ["/api/statistics/horses", dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/statistics/horses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => res.json()),
  });

  const { data: instructorStats, isLoading: instructorsLoading } = useQuery({
    queryKey: ["/api/statistics/instructors", dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/statistics/instructors?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => res.json()),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/statistics/revenue", selectedMonth.year, selectedMonth.month],
    queryFn: () => 
      fetch(`/api/statistics/revenue?year=${selectedMonth.year}&month=${selectedMonth.month}`)
        .then(res => res.json()),
  });

  const getTotalLessons = () => {
    return horseStats?.reduce((sum: number, horse: any) => sum + horse.totalLessons, 0) || 0;
  };

  const getTotalWorkHours = () => {
    return horseStats?.reduce((sum: number, horse: any) => sum + horse.totalHours, 0) || 0;
  };

  const getTopPerformer = (data: any[], type: 'horse' | 'instructor') => {
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.totalLessons - a.totalLessons);
    return sorted[0];
  };

  return (
    <div data-testid="statistics-page">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Аналитика работы конюшни и статистика занятий
        </p>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Период для анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">От</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                data-testid="input-start-date"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">До</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                data-testid="input-end-date"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Месяц для выручки</label>
              <div className="flex gap-2">
                <Select
                  value={selectedMonth.month.toString()}
                  onValueChange={(value) => setSelectedMonth({ ...selectedMonth, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString("ru-RU", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedMonth.year.toString()}
                  onValueChange={(value) => setSelectedMonth({ ...selectedMonth, year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={2024 - i} value={(2024 - i).toString()}>
                        {2024 - i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Всего занятий</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-lessons">
                  {horsesLoading ? "-" : getTotalLessons()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Часов работы</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-hours">
                  {horsesLoading ? "-" : getTotalWorkHours().toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Выручка за месяц</p>
                <p className="text-2xl font-semibold" data-testid="stat-revenue">
                  {revenueLoading ? "-" : `${(revenueData?.revenue || 0).toLocaleString()} ₽`}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Средний доход/занятие</p>
                <p className="text-2xl font-semibold" data-testid="stat-avg-income">
                  {revenueLoading || horsesLoading ? "-" : 
                    getTotalLessons() > 0 
                      ? `${Math.round((revenueData?.revenue || 0) / getTotalLessons())} ₽`
                      : "0 ₽"
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-purple-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rabbit Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Rabbit className="w-5 h-5 mr-2" />
              Статистика лошадей
            </CardTitle>
          </CardHeader>
          <CardContent>
            {horsesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : !horseStats || horseStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных за выбранный период
              </div>
            ) : (
              <div className="space-y-4">
                {horseStats.map((horse: any) => (
                  <div key={horse.horseId} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <Rabbit className="text-muted-foreground" size={16} />
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`horse-stat-name-${horse.horseId}`}>
                          {horse.horseName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {horse.totalLessons} занятий
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid={`horse-stat-hours-${horse.horseId}`}>
                        {horse.totalHours.toFixed(1)} ч
                      </p>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-secondary rounded-full" 
                          style={{ width: `${Math.min((horse.totalHours / Math.max(...horseStats.map((h: any) => h.totalHours))) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructor Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2" />
              Статистика инструкторов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {instructorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : !instructorStats || instructorStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных за выбранный период
              </div>
            ) : (
              <div className="space-y-4">
                {instructorStats.map((instructor: any) => (
                  <div key={instructor.instructorId} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {instructor.instructorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`instructor-stat-name-${instructor.instructorId}`}>
                          {instructor.instructorName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {instructor.totalLessons} занятий
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid={`instructor-stat-hours-${instructor.instructorId}`}>
                        {instructor.totalHours.toFixed(1)} ч
                      </p>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ width: `${Math.min((instructor.totalHours / Math.max(...instructorStats.map((i: any) => i.totalHours))) * 100, 100)}%` }}
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

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>🏆 Лучшая лошадь периода</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const topHorse = getTopPerformer(horseStats, 'horse');
              return topHorse ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rabbit className="text-yellow-600" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold" data-testid="top-horse-name">
                    {topHorse.horseName}
                  </h3>
                  <p className="text-muted-foreground">
                    {topHorse.totalLessons} занятий • {topHorse.totalHours.toFixed(1)} часов
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏆 Лучший инструктор периода</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const topInstructor = getTopPerformer(instructorStats, 'instructor');
              return topInstructor ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-blue-600 text-xl font-bold">
                      {topInstructor.instructorName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold" data-testid="top-instructor-name">
                    {topInstructor.instructorName}
                  </h3>
                  <p className="text-muted-foreground">
                    {topInstructor.totalLessons} занятий • {topInstructor.totalHours.toFixed(1)} часов
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
