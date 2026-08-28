"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
exports.referenceRouter = (0, express_1.Router)();
exports.referenceRouter.get("/frameworks", async (req, res, next) => {
    try {
        const items = await index_1.prisma.framework.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/requirements", async (req, res, next) => {
    try {
        const items = await index_1.prisma.requirement.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/controls", async (req, res, next) => {
    try {
        const items = await index_1.prisma.control.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/risks", async (req, res, next) => {
    try {
        const items = await index_1.prisma.risk.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/policies", async (req, res, next) => {
    try {
        const items = await index_1.prisma.policy.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/assets", async (req, res, next) => {
    try {
        const items = await index_1.prisma.asset.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
exports.referenceRouter.get("/auditors", async (req, res, next) => {
    try {
        const items = await index_1.prisma.auditor.findMany();
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
});
