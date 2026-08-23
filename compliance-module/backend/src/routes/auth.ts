import { Router } from "express";
import { prisma } from "../index";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { authenticate } from "../middleware/auth";
import { badRequest } from "../middleware/errorHandler";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw badRequest("Username and password required");

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw badRequest("Invalid credentials");

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw badRequest("Invalid credentials");

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});
