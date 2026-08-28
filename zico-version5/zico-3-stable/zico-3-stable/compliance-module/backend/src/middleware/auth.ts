import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Invalid or expired token" });

  req.user = payload;
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}
