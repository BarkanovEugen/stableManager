// Shared lesson type translations and utilities

export const lessonTypeTranslations: Record<string, string> = {
  mounted_archery: "Конная стрельба из лука",
  hippotherapy: "Иппотерапия",
  therapeutic_riding: "Лечебная верховая езда", 
  recreational_riding: "Прогулочная верховая езда",
  training: "Тренировка",
  competition_prep: "Подготовка к соревнованиям",
  beginner_lesson: "Урок для начинающих",
  beginner_riding: "Верховая езда новичок",
  advanced_lesson: "Продвинутый урок",
  advanced_riding: "Верховая езда опытный",
  group_lesson: "Групповое занятие",
  individual_lesson: "Индивидуальное занятие",
  walk: "Прогулка"
};

export const translateLessonType = (type: string): string => {
  return lessonTypeTranslations[type] || type;
};

export const getLessonTypeLabel = translateLessonType;