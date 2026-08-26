/**
 * WADJET GRC — Identity & Access Management Service
 * RBAC + Scope engine with pluggable SSO interface.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../index";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || "30m";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  scope: string;
}

export class AuthService {
  static async hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, 12);
  }

  static async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL } as jwt.SignOptions);
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL } as jwt.SignOptions);
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user || !user.isActive) throw new Error("Invalid credentials");

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new Error("Account is locked. Try again later.");
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: { increment: 1 } },
      });
      throw new Error("Invalid credentials");
    }

    // Reset failed logins on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lastLoginAt: new Date() },
    });

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role.code,
      scope: "all",
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role.code,
        roleName: user.role.name,
      },
    };
  }

  static async can(user: any, permission: string, object?: any): Promise<boolean> {
    // Get user permissions
    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const userPerms = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });

    const allPerms = [...rolePerms, ...userPerms];
    const hasPermission = allPerms.some((p) => p.permission.code === permission);

    if (!hasPermission) return false;

    // Check scope
    const scope = allPerms.find((p) => p.permission.code === permission)?.scope || "all";
    if (scope === "all") return true;
    if (scope === "department") return object?.department === user.department;
    if (scope === "own") return object?.ownerId === user.id;

    return true;
  }
}

export default AuthService;
