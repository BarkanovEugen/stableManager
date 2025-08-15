import type {
  User, InsertUser,
  Horse, InsertHorse,
  Instructor, InsertInstructor,
  Client, InsertClient,
  Certificate, InsertCertificate,
  Subscription, InsertSubscription,
  Lesson, InsertLesson, LessonWithRelations,
  LandingContent, InsertLandingContent
} from "@shared/schema";
import {
  users, horses, instructors, clients, certificates, subscriptions, lessons, lessonInstructors, lessonHorses, landingContent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByVkId(vkId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  updateUserRole(id: string, role: "observer" | "instructor" | "administrator"): Promise<User>;
  
  // Horses
  getAllHorses(): Promise<Horse[]>;
  getHorse(id: string): Promise<Horse | undefined>;
  createHorse(horse: InsertHorse): Promise<Horse>;
  updateHorse(id: string, horse: Partial<InsertHorse>): Promise<Horse>;
  deleteHorse(id: string): Promise<void>;
  
  // Instructors
  getAllInstructors(): Promise<Instructor[]>;
  getActiveInstructors(): Promise<Instructor[]>;
  getInstructor(id: string): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: string, instructor: Partial<InsertInstructor>): Promise<Instructor>;
  deleteInstructor(id: string): Promise<void>;
  
  // Clients
  getAllClients(): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Subscriptions
  getAllSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getClientSubscriptions(clientId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  getSubscriptionLessons(subscriptionId: string): Promise<LessonWithRelations[]>;
  getActiveSubscription(clientId: string): Promise<Subscription | undefined>;
  
  // Certificates
  getAllCertificates(): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificateByNumber(number: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, certificate: Partial<InsertCertificate>): Promise<Certificate>;
  deleteCertificate(id: string): Promise<void>;
  
  // Lessons
  getAllLessons(): Promise<LessonWithRelations[]>;
  getLessonsInDateRange(startDate: Date, endDate: Date): Promise<LessonWithRelations[]>;
  getLesson(id: string): Promise<LessonWithRelations | undefined>;
  createLesson(lesson: InsertLesson): Promise<LessonWithRelations>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<LessonWithRelations>;
  deleteLesson(id: string): Promise<void>;
  
  // Statistics
  getHorseWorkloadStats(startDate: Date, endDate: Date): Promise<{horseId: string, horseName: string, totalHours: number, totalLessons: number}[]>;
  getInstructorStats(startDate: Date, endDate: Date): Promise<{instructorId: string, instructorName: string, totalHours: number, totalLessons: number}[]>;
  getMonthlyRevenue(year: number, month: number): Promise<number>;
  getNewClientsCount(year: number, month: number): Promise<number>;
  
  // Landing content
  getAllLandingContent(): Promise<LandingContent[]>;
  getLandingContentBySection(section: string): Promise<LandingContent | undefined>;
  createLandingContent(content: InsertLandingContent): Promise<LandingContent>;
  updateLandingContent(id: string, content: Partial<InsertLandingContent>): Promise<LandingContent>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByVkId(vkId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.vkId, vkId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserRole(id: string, role: "observer" | "instructor" | "administrator"): Promise<User> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  // Horses
  async getAllHorses(): Promise<Horse[]> {
    return await db.select().from(horses).orderBy(horses.nickname);
  }

  async getHorse(id: string): Promise<Horse | undefined> {
    const [horse] = await db.select().from(horses).where(eq(horses.id, id));
    return horse || undefined;
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const [created] = await db.insert(horses).values(horse).returning();
    return created;
  }

  async updateHorse(id: string, horse: Partial<InsertHorse>): Promise<Horse> {
    const [updated] = await db.update(horses).set(horse).where(eq(horses.id, id)).returning();
    return updated;
  }

  async deleteHorse(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // First, remove horse assignments from non-completed lessons only
      await tx.delete(lessonHorses)
        .where(
          and(
            eq(lessonHorses.horseId, id),
            // Only remove from non-completed lessons
            sql`EXISTS (
              SELECT 1 FROM ${lessons} 
              WHERE ${lessons.id} = ${lessonHorses.lessonId} 
              AND ${lessons.status} != 'completed'
            )`
          )
        );

      // Check if there are still any lesson_horses references (from completed lessons)
      const remainingRefs = await tx.select()
        .from(lessonHorses)
        .where(eq(lessonHorses.horseId, id))
        .limit(1);

      if (remainingRefs.length > 0) {
        // Horse still has completed lessons - mark as deleted instead of deleting
        const currentHorse = await tx.select().from(horses).where(eq(horses.id, id)).limit(1);
        if (currentHorse[0]) {
          await tx.update(horses)
            .set({ 
              status: 'unavailable',
              nickname: `[УДАЛЕНО] ${currentHorse[0].nickname}`
            })
            .where(eq(horses.id, id));
        }
      } else {
        // No references remain, safe to delete completely
        await tx.delete(horses).where(eq(horses.id, id));
      }
    });
  }

  // Instructors
  async getAllInstructors(): Promise<Instructor[]> {
    return await db.select().from(instructors).orderBy(instructors.name);
  }

  async getActiveInstructors(): Promise<Instructor[]> {
    return await db.select().from(instructors).where(eq(instructors.isActive, true)).orderBy(instructors.name);
  }

  async getInstructor(id: string): Promise<Instructor | undefined> {
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
    return instructor || undefined;
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    const [created] = await db.insert(instructors).values(instructor).returning();
    return created;
  }

  async updateInstructor(id: string, instructor: Partial<InsertInstructor>): Promise<Instructor> {
    const [updated] = await db.update(instructors).set(instructor).where(eq(instructors.id, id)).returning();
    return updated;
  }

  async deleteInstructor(id: string): Promise<void> {
    await db.delete(instructors).where(eq(instructors.id, id));
  }

  // Clients
  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(
        sql`lower(${clients.name}) LIKE ${`%${query.toLowerCase()}%`} OR 
            lower(${clients.phone}) LIKE ${`%${query.toLowerCase()}%`} OR 
            lower(${clients.email}) LIKE ${`%${query.toLowerCase()}%`}`
      )
      .orderBy(clients.name);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Subscriptions
  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.query.subscriptions.findMany({
      with: {
        client: true,
      },
      orderBy: desc(subscriptions.createdAt),
    });
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: {
        client: true,
      },
    });
    return subscription || undefined;
  }

  async getClientSubscriptions(clientId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions)
      .where(eq(subscriptions.clientId, clientId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db.update(subscriptions).set(subscription).where(eq(subscriptions.id, id)).returning();
    return updated;
  }

  async getSubscriptionLessons(subscriptionId: string): Promise<LessonWithRelations[]> {
    return await db.query.lessons.findMany({
      where: eq(lessons.subscriptionId, subscriptionId),
      with: {
        client: true,
        certificate: true,
        subscription: true,
        lessonInstructors: {
          with: {
            instructor: true,
          },
        },
        lessonHorses: {
          with: {
            horse: true,
          },
        },
      },
      orderBy: desc(lessons.date),
    });
  }

  async getActiveSubscription(clientId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.clientId, clientId),
        sql`${subscriptions.lessonsRemaining} > 0`,
        sql`${subscriptions.expiresAt} IS NULL OR ${subscriptions.expiresAt} > NOW()`
      ))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  // Certificates
  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates).orderBy(desc(certificates.createdAt));
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getCertificateByNumber(number: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.number, number));
    return certificate || undefined;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [created] = await db.insert(certificates).values({
      ...certificate,
      value: certificate.value.toString()
    }).returning();
    return created;
  }

  async updateCertificate(id: string, certificate: Partial<InsertCertificate>): Promise<Certificate> {
    // Convert number to string for value field if needed
    const updateData = {
      ...certificate,
      ...(certificate.value !== undefined && { value: String(certificate.value) })
    };
    const [updated] = await db.update(certificates).set(updateData).where(eq(certificates.id, id)).returning();
    return updated;
  }

  async deleteCertificate(id: string): Promise<void> {
    await db.delete(certificates).where(eq(certificates.id, id));
  }

  // Helper function to convert null to undefined for optional relations
  private convertLessonRelations(lesson: any): LessonWithRelations {
    return {
      ...lesson,
      certificate: lesson.certificate || undefined,
      subscription: lesson.subscription || undefined,
    };
  }

  // Lessons
  async getAllLessons(): Promise<LessonWithRelations[]> {
    const lessonList = await db.query.lessons.findMany({
      with: {
        client: true,
        certificate: true,
        subscription: true,
        lessonInstructors: {
          with: {
            instructor: true,
          },
        },
        lessonHorses: {
          with: {
            horse: true,
          },
        },
      },
      orderBy: desc(lessons.date),
    });
    return lessonList.map(lesson => this.convertLessonRelations(lesson));
  }

  async getLessonsInDateRange(startDate: Date, endDate: Date): Promise<LessonWithRelations[]> {
    const lessonList = await db.query.lessons.findMany({
      where: and(
        gte(lessons.date, startDate),
        lte(lessons.date, endDate)
      ),
      with: {
        client: true,
        certificate: true,
        subscription: true,
        lessonInstructors: {
          with: {
            instructor: true,
          },
        },
        lessonHorses: {
          with: {
            horse: true,
          },
        },
      },
      orderBy: desc(lessons.date),
    });
    return lessonList.map(lesson => this.convertLessonRelations(lesson));
  }

  async getLesson(id: string): Promise<LessonWithRelations | undefined> {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        client: true,
        certificate: true,
        subscription: true,
        lessonInstructors: {
          with: {
            instructor: true,
          },
        },
        lessonHorses: {
          with: {
            horse: true,
          },
        },
      },
    });
    return lesson ? this.convertLessonRelations(lesson) : undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<LessonWithRelations> {
    const { instructorIds, horseIds, ...lessonData } = lesson;
    
    // Create lesson
    const [createdLesson] = await db.insert(lessons).values(lessonData).returning();
    
    // Create instructor associations
    if (instructorIds?.length) {
      await db.insert(lessonInstructors).values(
        instructorIds.map(instructorId => ({
          lessonId: createdLesson.id,
          instructorId,
        }))
      );
    }
    
    // Create horse associations
    if (horseIds?.length) {
      await db.insert(lessonHorses).values(
        horseIds.map(horseId => ({
          lessonId: createdLesson.id,
          horseId,
        }))
      );
    }
    
    // Return lesson with relations
    return this.getLesson(createdLesson.id) as Promise<LessonWithRelations>;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<LessonWithRelations> {
    const { instructorIds, horseIds, ...lessonData } = lesson;
    
    // Get current lesson data to check for changes
    const currentLesson = await this.getLesson(id);
    if (!currentLesson) {
      throw new Error("Lesson not found");
    }
    
    // Update lesson
    await db.update(lessons).set(lessonData).where(eq(lessons.id, id));
    
    // Handle subscription deduction if lesson is completed with subscription payment
    if (
      lesson.status === "completed" && 
      lesson.paymentType === "subscription" &&
      currentLesson.status !== "completed"
    ) {
      // Find active subscription for the client
      const activeSubscription = await this.getActiveSubscription(currentLesson.clientId);
      
      if (activeSubscription && activeSubscription.lessonsRemaining > 0) {
        const newLessonsRemaining = activeSubscription.lessonsRemaining - 1;
        const newStatus = newLessonsRemaining === 0 ? "used" : "active";
        
        // Update subscription
        await db.update(subscriptions)
          .set({ 
            lessonsRemaining: newLessonsRemaining,
            status: newStatus,
            ...(newStatus === "used" && { usedAt: new Date() })
          })
          .where(eq(subscriptions.id, activeSubscription.id));
      }
    }
    
    // Update instructor associations if provided
    if (instructorIds !== undefined) {
      await db.delete(lessonInstructors).where(eq(lessonInstructors.lessonId, id));
      if (instructorIds.length > 0) {
        await db.insert(lessonInstructors).values(
          instructorIds.map(instructorId => ({
            lessonId: id,
            instructorId,
          }))
        );
      }
    }
    
    // Update horse associations if provided
    if (horseIds !== undefined) {
      await db.delete(lessonHorses).where(eq(lessonHorses.lessonId, id));
      if (horseIds.length > 0) {
        await db.insert(lessonHorses).values(
          horseIds.map(horseId => ({
            lessonId: id,
            horseId,
          }))
        );
      }
    }
    
    // Return updated lesson with relations
    return this.getLesson(id) as Promise<LessonWithRelations>;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Statistics
  async getHorseWorkloadStats(startDate: Date, endDate: Date): Promise<{horseId: string, horseName: string, totalHours: number, totalLessons: number}[]> {
    const results = await db
      .select({
        horseId: horses.id,
        horseName: horses.nickname,
        totalHours: sql<number>`COALESCE(SUM(${lessons.duration}) / 60.0, 0)`,
        totalLessons: sql<number>`COALESCE(COUNT(${lessons.id}), 0)`,
      })
      .from(horses)
      .leftJoin(lessonHorses, eq(horses.id, lessonHorses.horseId))
      .leftJoin(lessons, and(
        eq(lessonHorses.lessonId, lessons.id),
        gte(lessons.date, startDate),
        lte(lessons.date, endDate),
        eq(lessons.status, "completed")
      ))
      .groupBy(horses.id, horses.nickname)
      .orderBy(horses.nickname);

    return results.map(row => ({
      horseId: row.horseId,
      horseName: row.horseName,
      totalHours: Number(row.totalHours) || 0,
      totalLessons: Number(row.totalLessons) || 0,
    }));
  }

  async getInstructorStats(startDate: Date, endDate: Date): Promise<{instructorId: string, instructorName: string, totalHours: number, totalLessons: number}[]> {
    const results = await db
      .select({
        instructorId: instructors.id,
        instructorName: instructors.name,
        totalHours: sql<number>`COALESCE(SUM(${lessons.duration}) / 60.0, 0)`,
        totalLessons: sql<number>`COALESCE(COUNT(${lessons.id}), 0)`,
      })
      .from(instructors)
      .leftJoin(lessonInstructors, eq(instructors.id, lessonInstructors.instructorId))
      .leftJoin(lessons, and(
        eq(lessonInstructors.lessonId, lessons.id),
        gte(lessons.date, startDate),
        lte(lessons.date, endDate),
        eq(lessons.status, "completed")
      ))
      .groupBy(instructors.id, instructors.name)
      .orderBy(instructors.name);

    return results.map(row => ({
      instructorId: row.instructorId,
      instructorName: row.instructorName,
      totalHours: Number(row.totalHours) || 0,
      totalLessons: Number(row.totalLessons) || 0,
    }));
  }

  async getMonthlyRevenue(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${lessons.cost}), 0)`,
      })
      .from(lessons)
      .where(and(
        gte(lessons.date, startDate),
        lte(lessons.date, endDate),
        eq(lessons.status, "completed")
      ));

    return parseFloat(result[0]?.revenue || "0");
  }

  async getNewClientsCount(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await db
      .select({
        count: count(clients.id),
      })
      .from(clients)
      .where(and(
        gte(clients.createdAt, startDate),
        lte(clients.createdAt, endDate)
      ));

    return result[0]?.count || 0;
  }

  // Landing Content
  async getAllLandingContent(): Promise<LandingContent[]> {
    return await db.select().from(landingContent).orderBy(landingContent.section);
  }

  async getLandingContentBySection(section: string): Promise<LandingContent | undefined> {
    const [content] = await db.select().from(landingContent).where(eq(landingContent.section, section));
    return content || undefined;
  }

  async createLandingContent(content: InsertLandingContent): Promise<LandingContent> {
    const [created] = await db.insert(landingContent).values(content).returning();
    return created;
  }

  async updateLandingContent(id: string, content: Partial<InsertLandingContent>): Promise<LandingContent> {
    const [updated] = await db.update(landingContent).set(content).where(eq(landingContent.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();