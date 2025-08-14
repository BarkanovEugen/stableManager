import { 
  users, horses, instructors, clients, certificates, subscriptions, lessons, 
  lessonInstructors, lessonHorses, landingContent,
  type User, type InsertUser, type Horse, type InsertHorse, 
  type Instructor, type InsertInstructor, type Client, type InsertClient,
  type Certificate, type InsertCertificate, type Subscription, type InsertSubscription,
  type Lesson, type InsertLesson, type LandingContent, type InsertLandingContent,
  type LessonWithRelations
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
  getClient(id: string): Promise<Client | undefined>;
  searchClients(query: string): Promise<Client[]>;
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
  
  // Certificates
  getAllCertificates(): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificateByNumber(number: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, certificate: Partial<InsertCertificate>): Promise<Certificate>;
  deleteCertificate(id: string): Promise<void>;
  
  // Subscriptions
  getClientSubscriptions(clientId: string): Promise<Subscription[]>;
  getActiveSubscription(clientId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  
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
    await db.delete(horses).where(eq(horses.id, id));
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
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(sql`${clients.name} ILIKE ${'%' + query + '%'}`)
      .orderBy(clients.name)
      .limit(10);
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
    const updateData = { ...certificate };
    if (updateData.value !== undefined) {
      updateData.value = updateData.value.toString() as any;
    }
    const [updated] = await db.update(certificates).set(updateData).where(eq(certificates.id, id)).returning();
    return updated;
  }

  async deleteCertificate(id: string): Promise<void> {
    await db.delete(certificates).where(eq(certificates.id, id));
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

  // Lessons
  async getAllLessons(): Promise<LessonWithRelations[]> {
    return await db.query.lessons.findMany({
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

  async getLessonsInDateRange(startDate: Date, endDate: Date): Promise<LessonWithRelations[]> {
    return await db.query.lessons.findMany({
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
      orderBy: lessons.date,
    });
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
    return lesson || undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<LessonWithRelations> {
    const { instructorIds, horseIds, ...lessonData } = lesson;
    
    return await db.transaction(async (tx) => {
      // Create lesson
      const [createdLesson] = await tx.insert(lessons).values(lessonData).returning();
      
      // Add instructors
      if (instructorIds.length > 0) {
        await tx.insert(lessonInstructors).values(
          instructorIds.map(instructorId => ({
            lessonId: createdLesson.id,
            instructorId,
          }))
        );
      }
      
      // Add horses
      if (horseIds.length > 0) {
        await tx.insert(lessonHorses).values(
          horseIds.map(horseId => ({
            lessonId: createdLesson.id,
            horseId,
          }))
        );
      }
      
      // Return lesson with relations
      const lessonWithRelations = await tx.query.lessons.findFirst({
        where: eq(lessons.id, createdLesson.id),
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
      
      return lessonWithRelations!;
    });
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<LessonWithRelations> {
    const { instructorIds, horseIds, ...lessonData } = lesson;
    
    return await db.transaction(async (tx) => {
      // Update lesson
      const [updatedLesson] = await tx.update(lessons).set(lessonData).where(eq(lessons.id, id)).returning();
      
      // Update instructors if provided
      if (instructorIds) {
        await tx.delete(lessonInstructors).where(eq(lessonInstructors.lessonId, id));
        if (instructorIds.length > 0) {
          await tx.insert(lessonInstructors).values(
            instructorIds.map(instructorId => ({
              lessonId: id,
              instructorId,
            }))
          );
        }
      }
      
      // Update horses if provided
      if (horseIds) {
        await tx.delete(lessonHorses).where(eq(lessonHorses.lessonId, id));
        if (horseIds.length > 0) {
          await tx.insert(lessonHorses).values(
            horseIds.map(horseId => ({
              lessonId: id,
              horseId,
            }))
          );
        }
      }
      
      // Return lesson with relations
      const lessonWithRelations = await tx.query.lessons.findFirst({
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
      
      return lessonWithRelations!;
    });
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Statistics
  async getHorseWorkloadStats(startDate: Date, endDate: Date): Promise<{horseId: string, horseName: string, totalHours: number, totalLessons: number}[]> {
    const result = await db
      .select({
        horseId: horses.id,
        horseName: horses.nickname,
        totalLessons: count(lessons.id),
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

    // Calculate hours assuming 1.5 hours per lesson on average
    return result.map(row => ({
      ...row,
      totalHours: row.totalLessons * 1.5,
    }));
  }

  async getInstructorStats(startDate: Date, endDate: Date): Promise<{instructorId: string, instructorName: string, totalHours: number, totalLessons: number}[]> {
    const result = await db
      .select({
        instructorId: instructors.id,
        instructorName: instructors.name,
        totalLessons: count(lessons.id),
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

    // Calculate hours assuming 1.5 hours per lesson on average
    return result.map(row => ({
      ...row,
      totalHours: row.totalLessons * 1.5,
    }));
  }

  async getMonthlyRevenue(year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${lessons.cost}), 0)`,
      })
      .from(lessons)
      .where(and(
        gte(lessons.date, startDate),
        lte(lessons.date, endDate),
        eq(lessons.status, "completed"),
        eq(lessons.isPaid, true)
      ));

    return result[0]?.totalRevenue || 0;
  }

  // Landing content
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
    const [updated] = await db.update(landingContent).set({
      ...content,
      updatedAt: new Date(),
    }).where(eq(landingContent.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
