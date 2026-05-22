import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../services/auth/authService";

// Extend Express Request object to include the user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string;

  if ((!authHeader || !authHeader.startsWith("Bearer ")) && !queryToken) {
     res.status(401).json({ error: "Access denied. No token provided." });
     return;
  }

  const token = authHeader ? authHeader.split(" ")[1] : queryToken;

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (role: "faculty" | "student") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Access denied. Not authenticated." });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `Access denied. Requires ${role} role.` });
      return;
    }

    next();
  };
};
