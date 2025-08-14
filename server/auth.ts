import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

import type { User } from "@shared/schema";

// Extend Express Request interface to include session and user
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      userId?: string;
      destroy?: (callback: (err?: any) => void) => void;
    };
    user?: User;
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
    const { access_token, user_id, first_name, last_name, email } = req.body;
    
    if (!access_token || !user_id) {
      res.status(400).json({ error: "Access token and user ID are required" });
      return;
    }

    // Create VK user data from the request
    const vkUser: VKUserData = {
      id: user_id.toString(),
      first_name: first_name || 'VK',
      last_name: last_name || 'User',
      email: email
    };
    
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
    } else {
      // Update existing user info in case it changed
      user = await storage.updateUser(user.id, {
        name: `${vkUser.first_name} ${vkUser.last_name}`,
        email: vkUser.email,
      });
    }

    // Store user in session
    if (req.session) {
      req.session.userId = user.id;
    }
    
    res.json(user);
  } catch (error) {
    console.error("VK authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.session?.userId;
    
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
