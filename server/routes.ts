import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHorseSchema, insertInstructorSchema, insertClientSchema, 
  insertCertificateSchema, insertSubscriptionSchema, insertLessonSchema,
  insertLandingContentSchema 
} from "@shared/schema";
import { authenticateVK, requireAuth, requireRole } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/vk", authenticateVK);
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    if (req.session?.destroy) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Could not log out" });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  // Users routes (admin only)
  app.get("/api/users", requireAuth, requireRole(["administrator"]), async (req, res) => {
    // This would need to be implemented in storage
    res.json([]);
  });
  
  app.put("/api/users/:id/role", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["observer", "instructor", "administrator"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Horses routes
  app.get("/api/horses", requireAuth, async (req, res) => {
    try {
      const horses = await storage.getAllHorses();
      res.json(horses);
    } catch (error) {
      console.error("Error fetching horses:", error);
      res.status(500).json({ error: "Failed to fetch horses" });
    }
  });

  app.get("/api/horses/:id", requireAuth, async (req, res) => {
    try {
      const horse = await storage.getHorse(req.params.id);
      if (!horse) {
        return res.status(404).json({ error: "Horse not found" });
      }
      res.json(horse);
    } catch (error) {
      console.error("Error fetching horse:", error);
      res.status(500).json({ error: "Failed to fetch horse" });
    }
  });

  app.post("/api/horses", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertHorseSchema.parse(req.body);
      const horse = await storage.createHorse(data);
      res.status(201).json(horse);
    } catch (error) {
      console.error("Error creating horse:", error);
      res.status(400).json({ error: "Failed to create horse" });
    }
  });

  app.put("/api/horses/:id", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertHorseSchema.partial().parse(req.body);
      const horse = await storage.updateHorse(req.params.id, data);
      res.json(horse);
    } catch (error) {
      console.error("Error updating horse:", error);
      res.status(400).json({ error: "Failed to update horse" });
    }
  });

  app.delete("/api/horses/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      await storage.deleteHorse(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting horse:", error);
      res.status(500).json({ error: "Failed to delete horse" });
    }
  });

  // Instructors routes
  app.get("/api/instructors", requireAuth, async (req, res) => {
    try {
      const instructors = req.query.active === "true" 
        ? await storage.getActiveInstructors()
        : await storage.getAllInstructors();
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ error: "Failed to fetch instructors" });
    }
  });

  app.post("/api/instructors", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const data = insertInstructorSchema.parse(req.body);
      const instructor = await storage.createInstructor(data);
      res.status(201).json(instructor);
    } catch (error) {
      console.error("Error creating instructor:", error);
      res.status(400).json({ error: "Failed to create instructor" });
    }
  });

  app.put("/api/instructors/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const data = insertInstructorSchema.partial().parse(req.body);
      const instructor = await storage.updateInstructor(req.params.id, data);
      res.json(instructor);
    } catch (error) {
      console.error("Error updating instructor:", error);
      res.status(400).json({ error: "Failed to update instructor" });
    }
  });

  // Clients routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const { search } = req.query;
      const clients = search 
        ? await storage.searchClients(search as string)
        : await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ error: "Failed to create client" });
    }
  });

  // Certificates routes
  app.get("/api/certificates", requireAuth, async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.post("/api/certificates", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertCertificateSchema.parse(req.body);
      const certificate = await storage.createCertificate(data);
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error creating certificate:", error);
      res.status(400).json({ error: "Failed to create certificate" });
    }
  });

  // Lessons routes
  app.get("/api/lessons", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const lessons = startDate && endDate
        ? await storage.getLessonsInDateRange(new Date(startDate as string), new Date(endDate as string))
        : await storage.getAllLessons();
      
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", requireAuth, async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(data);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(400).json({ error: "Failed to create lesson" });
    }
  });

  app.put("/api/lessons/:id", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      const data = insertLessonSchema.partial().parse(req.body);
      const lesson = await storage.updateLesson(req.params.id, data);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(400).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", requireAuth, requireRole(["instructor", "administrator"]), async (req, res) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Statistics routes
  app.get("/api/statistics/horses", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const stats = await storage.getHorseWorkloadStats(start, end);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching horse statistics:", error);
      res.status(500).json({ error: "Failed to fetch horse statistics" });
    }
  });

  app.get("/api/statistics/instructors", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const stats = await storage.getInstructorStats(start, end);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching instructor statistics:", error);
      res.status(500).json({ error: "Failed to fetch instructor statistics" });
    }
  });

  app.get("/api/statistics/revenue", requireAuth, async (req, res) => {
    try {
      const { year, month } = req.query;
      const currentDate = new Date();
      const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
      const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
      
      const revenue = await storage.getMonthlyRevenue(targetYear, targetMonth);
      res.json({ revenue });
    } catch (error) {
      console.error("Error fetching revenue statistics:", error);
      res.status(500).json({ error: "Failed to fetch revenue statistics" });
    }
  });

  // Landing content routes (admin only)
  app.get("/api/landing-content", async (req, res) => {
    try {
      const content = await storage.getAllLandingContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching landing content:", error);
      res.status(500).json({ error: "Failed to fetch landing content" });
    }
  });

  app.put("/api/landing-content/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const data = insertLandingContentSchema.partial().parse(req.body);
      const content = await storage.updateLandingContent(req.params.id, data);
      res.json(content);
    } catch (error) {
      console.error("Error updating landing content:", error);
      res.status(400).json({ error: "Failed to update landing content" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
