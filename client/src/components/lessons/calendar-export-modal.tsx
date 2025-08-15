import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, ExternalLink, X, Link, Copy, Rss } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LessonWithRelations } from "@shared/schema";
import { translateLessonType } from "@/lib/lesson-types";

interface CalendarExportModalProps {
  onClose: () => void;
  lessons: LessonWithRelations[];
}

interface SubscriptionInfo {
  icalUrl: string;
  webcalUrl: string;
  calDAVUrl: string;
  instructions: {
    google: string;
    outlook: string;
    apple: string;
    other: string;
  };
}

export default function CalendarExportModal({ onClose, lessons }: CalendarExportModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedService, setSelectedService] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const { toast } = useToast();

  // Fetch subscription info for automatic calendar updates
  const { data: subscriptionInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/calendar/subscription-info"],
    queryFn: () => fetch("/api/calendar/subscription-info").then(res => res.json()),
  });

  const generateICalContent = (lessonsToExport: LessonWithRelations[]) => {
    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Солнечная Поляна//Календарь занятий//RU",
      "CALSCALE:GREGORIAN",
    ];

    lessonsToExport.forEach(lesson => {
      const startDate = new Date(lesson.date);
      const endDate = new Date(startDate.getTime() + (lesson.duration || 45) * 60 * 1000);
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const instructorNames = lesson.lessonInstructors?.map(li => li.instructor.name).join(', ') || 'Не назначен';
      const horseNames = lesson.lessonHorses?.map(lh => lh.horse.nickname).join(', ') || 'Не назначена';
      
      icalContent.push(
        "BEGIN:VEVENT",
        `UID:lesson-${lesson.id}@sunnymeadow.ru`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${translateLessonType(lesson.type)} - ${lesson.client.name}`,
        `DESCRIPTION:Тип занятия: ${translateLessonType(lesson.type)}\\nКлиент: ${lesson.client.name}\\nИнструктор: ${instructorNames}\\nЛошадь: ${horseNames}\\nСтоимость: ${lesson.cost} ₽\\nСтатус: ${lesson.status === 'planned' ? 'Запланировано' : lesson.status === 'completed' ? 'Завершено' : 'Отменено'}`,
        `LOCATION:Конюшня Солнечная Поляна`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    icalContent.push("END:VCALENDAR");
    return icalContent.join('\n');
  };

  const getFilteredLessons = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return lessons.filter(lesson => {
          const lessonDate = new Date(lesson.date);
          return lessonDate >= weekStart && lessonDate <= weekEnd;
        });
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lessons.filter(lesson => {
          const lessonDate = new Date(lesson.date);
          return lessonDate >= monthStart && lessonDate <= monthEnd;
        });
      case "quarter":
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), quarterStart.getMonth() + 3, 0);
        return lessons.filter(lesson => {
          const lessonDate = new Date(lesson.date);
          return lessonDate >= quarterStart && lessonDate <= quarterEnd;
        });
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return lessons.filter(lesson => {
          const lessonDate = new Date(lesson.date);
          return lessonDate >= yearStart && lessonDate <= yearEnd;
        });
      default:
        return lessons;
    }
  };

  const downloadICalFile = () => {
    const filteredLessons = getFilteredLessons();
    const icalContent = generateICalContent(filteredLessons);
    
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-lessons-${selectedPeriod}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Календарь экспортирован",
      description: `Файл календаря (${filteredLessons.length} занятий) загружен`,
    });
  };

  const generateCalendarUrl = (service: string) => {
    const filteredLessons = getFilteredLessons();
    if (filteredLessons.length === 0) {
      toast({
        title: "Нет занятий",
        description: "В выбранном периоде нет занятий для экспорта",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, we'll use the first lesson
    const firstLesson = filteredLessons[0];
    const startDate = new Date(firstLesson.date);
    const endDate = new Date(startDate.getTime() + (firstLesson.duration || 45) * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${translateLessonType(firstLesson.type)} - ${firstLesson.client.name}`);
    const details = encodeURIComponent(`Тип: ${translateLessonType(firstLesson.type)}\nКлиент: ${firstLesson.client.name}\nСтоимость: ${firstLesson.cost} ₽`);
    const location = encodeURIComponent("Конюшня Солнечная Поляна");

    let url = "";
    
    switch (service) {
      case "google":
        url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${details}&location=${location}`;
        break;
      case "outlook":
        url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${details}&location=${location}`;
        break;
      case "yahoo":
        const formatYahooDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0];
        };
        url = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${formatYahooDate(startDate)}&dur=${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))}&desc=${details}&in_loc=${location}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      toast({
        title: "Календарь открыт",
        description: `Ссылка на ${service === 'google' ? 'Google' : service === 'outlook' ? 'Outlook' : 'Yahoo'} календарь открыта в новой вкладке`,
      });
    }
  };

  const handleExport = () => {
    if (selectedService === "download") {
      downloadICalFile();
    } else if (selectedService) {
      generateCalendarUrl(selectedService);
    }
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано",
        description: `${description} скопирована в буфер обмена`,
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  const filteredLessons = getFilteredLessons();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Экспорт и подписка на календарь
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-export-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Разовый экспорт</TabsTrigger>
            <TabsTrigger value="subscribe">Подписка на календарь</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">

            {/* Existing export content */}
          <div>
            <Label>Период экспорта</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger data-testid="select-export-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Текущая неделя</SelectItem>
                <SelectItem value="month">Текущий месяц</SelectItem>
                <SelectItem value="quarter">Текущий квартал</SelectItem>
                <SelectItem value="year">Текущий год</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Найдено занятий: {filteredLessons.length}
            </p>
          </div>

          <div>
            <Label>Способ экспорта</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger data-testid="select-export-service">
                <SelectValue placeholder="Выберите календарный сервис" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="download">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Скачать файл .ics
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Calendar
                  </div>
                </SelectItem>
                <SelectItem value="outlook">
                  <div className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Outlook Calendar
                  </div>
                </SelectItem>
                <SelectItem value="yahoo">
                  <div className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Yahoo Calendar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Что включается в экспорт:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Дата и время занятия</li>
              <li>• Тип занятия и клиент</li>
              <li>• Инструктор и лошадь</li>
              <li>• Стоимость и статус</li>
              <li>• Местоположение (Конюшня Солнечная Поляна)</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-export"
            >
              Отмена
            </Button>
            <Button
              onClick={handleExport}
              disabled={!selectedService || filteredLessons.length === 0}
              data-testid="button-confirm-export"
            >
              {selectedService === "download" ? "Скачать" : "Экспортировать"}
            </Button>
          </div>

          </TabsContent>

          <TabsContent value="subscribe" className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Rss className="w-5 h-5 mr-2 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Автоматическое обновление
                </h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Подписка на календарь автоматически обновляет события при добавлении новых занятий.
                Все изменения появятся в вашем календаре без дополнительных действий.
              </p>
            </div>

            {subscriptionInfo && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Ссылка для подписки (webcal://)</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={subscriptionInfo.webcalUrl}
                      readOnly
                      className="text-sm"
                      data-testid="webcal-url-input"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(subscriptionInfo.webcalUrl, "Ссылка webcal")}
                      data-testid="copy-webcal-button"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Ссылка .ics для прямого доступа</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={subscriptionInfo.icalUrl}
                      readOnly
                      className="text-sm"
                      data-testid="ical-url-input"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(subscriptionInfo.icalUrl, "Ссылка .ics")}
                      data-testid="copy-ical-button"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Google Calendar</h5>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionInfo.instructions.google}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(subscriptionInfo.icalUrl, "Ссылка для Google Calendar")}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Копировать ссылку
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Outlook</h5>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionInfo.instructions.outlook}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(subscriptionInfo.icalUrl, "Ссылка для Outlook")}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Копировать ссылку
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Apple Calendar</h5>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionInfo.instructions.apple}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(subscriptionInfo.webcalUrl, "Ссылка для Apple Calendar")}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Копировать ссылку
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Другие приложения</h5>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionInfo.instructions.other}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(subscriptionInfo.icalUrl, "Универсальная ссылка")}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Копировать ссылку
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Как работает подписка:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Календарь автоматически обновляется каждый час</li>
                    <li>• Новые занятия появляются без вашего участия</li>
                    <li>• Изменения в существующих занятиях синхронизируются</li>
                    <li>• Отмененные занятия автоматически удаляются</li>
                    <li>• Работает с любым календарным приложением</li>
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}