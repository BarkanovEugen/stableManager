import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["observer", "instructor", "administrator"]);
export const lessonTypeEnum = pgEnum("lesson_type", [
  "hippotherapy", 
  "beginner_riding", 
  "advanced_riding", 
  "walk", 
  "mounted_archery"
]);
export const paymentTypeEnum = pgEnum("payment_type", ["cash", "subscription", "certificate"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["planned", "completed", "cancelled"]);
export const horseStatusEnum = pgEnum("horse_status", ["active", "rest", "unavailable"]);
export const certificateStatusEnum = pgEnum("certificate_status", ["active", "used", "expired"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vkId: varchar("vk_id").unique(),
  name: text("name").notNull(),
  email: text("email"),
  role: userRoleEnum("role").notNull().default("observer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Horses table
export const horses = pgTable("horses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: text("nickname").notNull(),
  breed: text("breed").notNull(),
  age: integer("age").notNull(),
  status: horseStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Instructors table
export const instructors = pgTable("instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  specializations: text("specializations").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  clientId: varchar("client_id").references(() => clients.id),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  status: certificateStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "used"]);

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  lessonsRemaining: integer("lessons_remaining").notNull(),
  totalLessons: integer("total_lessons").notNull(),
  durationMonths: integer("duration_months").notNull().default(6),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull().default(45), // in minutes
  type: lessonTypeEnum("type").notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  status: lessonStatusEnum("status").notNull().default("planned"),
  isPaid: boolean("is_paid").notNull().default(false),
  notes: text("notes"),
  certificateId: varchar("certificate_id").references(() => certificates.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lesson instructors (many-to-many)
export const lessonInstructors = pgTable("lesson_instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  instructorId: varchar("instructor_id").notNull().references(() => instructors.id),
});

// Lesson horses (many-to-many)
export const lessonHorses = pgTable("lesson_horses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  horseId: varchar("horse_id").notNull().references(() => horses.id),
});

// Sessions table for connect-pg-simple
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Landing page content
export const landingContent = pgTable("landing_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull().unique(),
  title: text("title"),
  content: text("content"),
  imageUrl: text("image_url"),
  isVisible: boolean("is_visible").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Users don't have direct lesson relations since they're system users, not clients
}));

export const horsesRelations = relations(horses, ({ many }) => ({
  lessonHorses: many(lessonHorses),
}));

export const instructorsRelations = relations(instructors, ({ many }) => ({
  lessonInstructors: many(lessonInstructors),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  lessons: many(lessons),
  certificates: many(certificates),
  subscriptions: many(subscriptions),
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  client: one(clients, {
    fields: [certificates.clientId],
    references: [clients.id],
  }),
  lessons: many(lessons),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  client: one(clients, {
    fields: [subscriptions.clientId],
    references: [clients.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  client: one(clients, {
    fields: [lessons.clientId],
    references: [clients.id],
  }),
  certificate: one(certificates, {
    fields: [lessons.certificateId],
    references: [certificates.id],
  }),
  subscription: one(subscriptions, {
    fields: [lessons.subscriptionId],
    references: [subscriptions.id],
  }),
  lessonInstructors: many(lessonInstructors),
  lessonHorses: many(lessonHorses),
}));

export const lessonInstructorsRelations = relations(lessonInstructors, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonInstructors.lessonId],
    references: [lessons.id],
  }),
  instructor: one(instructors, {
    fields: [lessonInstructors.instructorId],
    references: [instructors.id],
  }),
}));

export const lessonHorsesRelations = relations(lessonHorses, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonHorses.lessonId],
    references: [lessons.id],
  }),
  horse: one(horses, {
    fields: [lessonHorses.horseId],
    references: [horses.id],
  }),
}));

export const landingContentRelations = relations(landingContent, ({ }) => ({}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHorseSchema = createInsertSchema(horses).omit({
  id: true,
  createdAt: true,
});

export const insertInstructorSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  usedAt: true,
}).extend({
  value: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  expiresAt: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
}).extend({
  expiresAt: z.string().transform(val => new Date(val)),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
}).extend({
  instructorIds: z.array(z.string()).min(1),
  horseIds: z.array(z.string()).min(1),
  date: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  cost: z.union([z.string(), z.number()]).transform(val => typeof val === 'number' ? val.toString() : val),
});

export const insertLandingContentSchema = createInsertSchema(landingContent).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = z.infer<typeof insertHorseSchema>;

export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type LandingContent = typeof landingContent.$inferSelect;
export type InsertLandingContent = z.infer<typeof insertLandingContentSchema>;

// Extended types with relations
export type LessonWithRelations = Lesson & {
  client: Client;
  certificate?: Certificate;
  subscription?: Subscription;
  lessonInstructors: (typeof lessonInstructors.$inferSelect & {
    instructor: Instructor;
  })[];
  lessonHorses: (typeof lessonHorses.$inferSelect & {
    horse: Horse;
  })[];
};
