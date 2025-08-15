import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { LessonWithRelations } from "@shared/schema";

interface LessonCalendarProps {
  lessons: LessonWithRelations[];
  currentMonth: Date;
}

export default function LessonCalendar({ lessons, currentMonth }: LessonCalendarProps) {
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and how many days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    
    // Create calendar grid
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayLessons = lessons.filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return lessonDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date: day,
        fullDate: date,
        lessons: dayLessons,
      });
    }
    
    return days;
  }, [currentMonth, lessons]);

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case "hippotherapy":
        return "bg-green-100 text-green-800";
      case "beginner_riding":
        return "bg-blue-100 text-blue-800";
      case "advanced_riding":
        return "bg-purple-100 text-purple-800";
      case "walk":
        return "bg-yellow-100 text-yellow-800";
      case "mounted_archery":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="calendar-grid" data-testid="lesson-calendar">
      {/* Header */}
      {weekDays.map(day => (
        <div key={day} className="calendar-cell bg-gray-50 font-semibold text-center py-1 sm:py-2 min-h-[30px] sm:min-h-[40px] text-xs sm:text-sm">
          {day}
        </div>
      ))}
      
      {/* Calendar Days */}
      {calendarData.map((day, index) => (
        <div
          key={index}
          className={`calendar-cell cursor-pointer hover:bg-gray-50 ${day ? "" : "bg-gray-100"}`}
          data-testid={day ? `calendar-day-${day.date}` : `calendar-empty-${index}`}
        >
          {day && (
            <>
              <div className="font-medium text-xs sm:text-sm mb-1">{day.date}</div>
              <div className="space-y-1">
                {day.lessons.slice(0, 2).map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`lesson-indicator text-xs ${getLessonTypeColor(lesson.type)}`}
                    title={`${formatTime(lesson.date)} - ${lesson.client.name}`}
                    data-testid={`lesson-indicator-${lesson.id}`}
                  >
                    <span className="hidden sm:inline">{formatTime(lesson.date)} {lesson.client.name}</span>
                    <span className="sm:hidden">{formatTime(lesson.date)}</span>
                  </div>
                ))}
                {day.lessons.length > 2 && (
                  <div className="lesson-indicator bg-gray-100 text-gray-600 text-xs">
                    +{day.lessons.length - 2} <span className="hidden sm:inline">еще</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
