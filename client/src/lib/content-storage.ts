import type { News, Event, Service } from "@shared/content-schema";

const STORAGE_KEYS = {
  NEWS: 'landing_news',
  EVENTS: 'landing_events', 
  SERVICES: 'landing_services',
  CONTENT: 'landing_content'
} as const;

// Default data
const DEFAULT_NEWS: News[] = [
  {
    id: "1",
    title: "Новые тренировки по конкуру",
    content: "Мы рады сообщить о запуске новой программы тренировок по конкуру для продвинутых всадников.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    publishedAt: "2024-12-25",
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  }
];

const DEFAULT_EVENTS: Event[] = [
  {
    id: "1", 
    title: "Соревнования по конкуру",
    description: "Ежегодные соревнования среди всадников всех уровней подготовки",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    eventDate: "2024-01-15",
    location: "Главная арена",
    maxParticipants: 50,
    registeredParticipants: 23,
    isActive: true,
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  },
  {
    id: "2",
    title: "Мастер-класс по иппотерапии",
    description: "Профессиональный мастер-класс от ведущих специалистов",
    imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600",
    eventDate: "2024-01-22",
    location: "Терапевтическая зона",
    maxParticipants: 15,
    registeredParticipants: 8,
    isActive: true,
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  }
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: "1",
    title: "Обучение верховой езде",
    description: "Занятия для новичков и опытных всадников с профессиональными инструкторами",
    price: "от 2000₽",
    duration: "45 мин",
    isActive: true,
    order: 1,
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  },
  {
    id: "2",
    title: "Иппотерапия",
    description: "Лечебная верховая езда для реабилитации и улучшения самочувствия",
    price: "от 2500₽",
    duration: "60 мин",
    isActive: true,
    order: 2,
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  },
  {
    id: "3",
    title: "Конная стрельба из лука",
    description: "Уникальные занятия по стрельбе из лука верхом на лошади",
    price: "от 3000₽",
    duration: "90 мин",
    isActive: true,
    order: 3,
    createdAt: "2024-12-25T10:00:00Z",
    updatedAt: "2024-12-25T10:00:00Z"
  }
];

const DEFAULT_CONTENT = {
  siteTitle: "Конюшня \"Солнечная Поляна\"",
  heroTitle: "Добро пожаловать в нашу конюшню",
  heroDescription: "Профессиональные занятия верховой ездой, иппотерапия и незабываемые прогулки с лошадьми в живописной природе",
  servicesTitle: "Наши услуги",
  service1Title: "Обучение верховой езде",
  service1Description: "Занятия для новичков и опытных всадников с профессиональными инструкторами",
  service2Title: "Иппотерапия",
  service2Description: "Лечебная верховая езда для реабилитации и улучшения самочувствия",
  service3Title: "Конная стрельба из лука",
  service3Description: "Уникальные занятия по стрельбе из лука верхом на лошади",
  eventsTitle: "Предстоящие мероприятия"
};

// Storage functions
export const ContentStorage = {
  // News
  getNews(): News[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NEWS);
      return stored ? JSON.parse(stored) : DEFAULT_NEWS;
    } catch {
      return DEFAULT_NEWS;
    }
  },

  saveNews(news: News[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(news));
    } catch (error) {
      console.error('Failed to save news:', error);
    }
  },

  // Events
  getEvents(): Event[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return stored ? JSON.parse(stored) : DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  },

  saveEvents(events: Event[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  },

  // Services
  getServices(): Service[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return stored ? JSON.parse(stored) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  },

  saveServices(services: Service[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (error) {
      console.error('Failed to save services:', error);
    }
  },

  // Content
  getContent(): typeof DEFAULT_CONTENT {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
      return stored ? { ...DEFAULT_CONTENT, ...JSON.parse(stored) } : DEFAULT_CONTENT;
    } catch {
      return DEFAULT_CONTENT;
    }
  },

  saveContent(content: typeof DEFAULT_CONTENT): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content));
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  },

  // Clear all data (for admin reset)
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
};