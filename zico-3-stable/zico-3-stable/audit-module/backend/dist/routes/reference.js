import { Router } from "express";
import { prisma } from "../index";
export const referenceRouter = Router();
referenceRouter.get("/frameworks", async (req, res, next) => {
    try {
        const items = await prisma.framework.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/requirements", async (req, res, next) => {
    try {
        const items = await prisma.requirement.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/controls", async (req, res, next) => {
    try {
        const items = await prisma.control.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/risks", async (req, res, next) => {
    try {
        const items = await prisma.risk.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/policies", async (req, res, next) => {
    try {
        const items = await prisma.policy.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/assets", async (req, res, next) => {
    try {
        const items = await prisma.asset.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
referenceRouter.get("/auditors", async (req, res, next) => {
    try {
        const items = await prisma.auditor.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
