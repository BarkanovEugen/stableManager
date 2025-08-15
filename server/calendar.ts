import type { LessonWithRelations } from "@shared/schema";
import { translateLessonType } from "../client/src/lib/lesson-types";

export function generateICalFeed(lessons: LessonWithRelations[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Солнечная Поляна//Календарь занятий//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Занятия - Солнечная Поляна",
    "X-WR-CALDESC:Календарь занятий конюшни Солнечная Поляна",
    "X-WR-TIMEZONE:Europe/Moscow",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H", // Refresh every hour
    "X-PUBLISHED-TTL:PT1H",
  ];

  lessons.forEach(lesson => {
    const startDate = new Date(lesson.date);
    const endDate = new Date(startDate.getTime() + (lesson.duration || 45) * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const instructorNames = lesson.lessonInstructors?.map(li => li.instructor.name).join(', ') || 'Не назначен';
    const horseNames = lesson.lessonHorses?.map(lh => lh.horse.nickname).join(', ') || 'Не назначена';
    
    const summary = `${translateLessonType(lesson.type)} - ${lesson.client.name}`;
    const description = [
      `Тип занятия: ${translateLessonType(lesson.type)}`,
      `Клиент: ${lesson.client.name}`,
      `Телефон: ${lesson.client.phone}`,
      `Инструктор: ${instructorNames}`,
      `Лошадь: ${horseNames}`,
      `Стоимость: ${lesson.cost} ₽`,
      `Статус: ${getStatusText(lesson.status)}`,
      lesson.isPaid ? 'Оплачено: Да' : 'Оплачено: Нет',
      lesson.notes ? `Заметки: ${lesson.notes}` : '',
    ].filter(Boolean).join('\\n');

    // Create unique UID based on lesson ID and last modified time
    const uid = `lesson-${lesson.id}@sunnymeadow.ru`;
    const lastModified = lesson.createdAt ? new Date(lesson.createdAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : timestamp;

    icalContent.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:Конюшня Солнечная Поляна`,
      `LAST-MODIFIED:${lastModified}`,
      `STATUS:${lesson.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      `TRANSP:${lesson.status === 'completed' ? 'TRANSPARENT' : 'OPAQUE'}`,
      `CLASS:PUBLIC`,
      "END:VEVENT"
    );
  });

  icalContent.push("END:VCALENDAR");
  return icalContent.join('\r\n');
}

function getStatusText(status: string): string {
  switch (status) {
    case 'planned': return 'Запланировано';
    case 'completed': return 'Завершено';
    case 'cancelled': return 'Отменено';
    default: return status;
  }
}

export function generateWebCalUrl(baseUrl: string): string {
  return `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/lessons.ics`;
}

export function generateCalDAVUrl(baseUrl: string): string {
  return `${baseUrl}/api/calendar/lessons.ics`;
}