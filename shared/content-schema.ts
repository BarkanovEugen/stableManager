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

// Services schema
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  price: z.string().optional(),
  duration: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertServiceSchema = serviceSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type Service = z.infer<typeof serviceSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;

// Reviews schema
export const reviewSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Имя обязательно"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Комментарий обязателен"),
  date: z.string(),
  isApproved: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertReviewSchema = reviewSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type Review = z.infer<typeof reviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

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