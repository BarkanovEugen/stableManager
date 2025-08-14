import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface VKUserData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export async function authenticateVK(req: Request, res: Response): Promise<void> {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      res.status(400).json({ error: "Access token is required" });
      return;
    }

    // Verify token with VK API
    const vkResponse = await fetch(`https://api.vk.com/method/users.get?access_token=${accessToken}&v=5.131&fields=email`);
    const vkData = await vkResponse.json();
    
    if (vkData.error) {
      res.status(401).json({ error: "Invalid VK token" });
      return;
    }

    const vkUser = vkData.response[0] as VKUserData;
    
    // Check if user exists
    let user = await storage.getUserByVkId(vkUser.id);
    
    if (!user) {
      // Check if this is the admin user
      const adminVkId = process.env.ADMIN_VK_ID;
      const role = vkUser.id === adminVkId ? "administrator" : "observer";
      
      // Create new user
      user = await storage.createUser({
        vkId: vkUser.id,
        name: `${vkUser.first_name} ${vkUser.last_name}`,
        email: vkUser.email,
        role,
      });
    }

    // Store user in session
    req.session.userId = user.id;
    
    res.json(user);
  } catch (error) {
    console.error("VK authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await storage.getUser(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
