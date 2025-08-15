import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// News schema
export const newsSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Заголовок обязателен"),
  content: z.string().min(1, "Содержание обязательно"),
  imageUrl: z.string().optional(),
  publishedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertNewsSchema = newsSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type News = z.infer<typeof newsSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;

// Events schema
export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  imageUrl: z.string().optional(),
  eventDate: z.string(),
  location: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  registeredParticipants: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertEventSchema = eventSchema.omit({ 
  id: true, 
  registeredParticipants: true,
  createdAt: true, 
  updatedAt: true 
});

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;