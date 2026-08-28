/**
 * WADJET GRC — Authorization Middleware
 * Wires AuthService.can() into Express middleware for route protection.
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../index";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    roleId: string;
    department: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const auth = await import("../shared/auth");
  const payload = auth.default.verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Invalid token" });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });

  if (!user || !user.isActive) return res.status(401).json({ message: "Unauthorized" });

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role.code,
    roleId: user.roleId,
    department: user.department,
  };

  next();
}

export function requirePermission(permission: string, scope?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Check permission
    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const hasPermission = rolePerms.some((p) => p.permission.code === permission);
    if (!hasPermission) return res.status(403).json({ message: "Forbidden: insufficient permissions" });

    // Check scope if specified
    if (scope === "department" && req.params.department && req.params.department !== user.department) {
      return res.status(403).json({ message: "Forbidden: scope restriction" });
    }

    next();
  };
}

export default { authenticate, requirePermission };
