import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

import { authRouter } from "./routes/auth";
import { frameworksRouter } from "./routes/frameworks";
import { requirementsRouter } from "./routes/requirements";
import { assessmentsRouter } from "./routes/assessments";
import { evidenceRouter } from "./routes/evidence";
import { gapsRouter } from "./routes/gaps";
import { remediationRouter } from "./routes/remediation";
import { findingsRouter } from "./routes/findings";
import { dashboardRouter } from "./routes/dashboard";
import { referenceRouter } from "./routes/reference";
import { errorHandler } from "./middleware/errorHandler";

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/frameworks", frameworksRouter);
app.use("/api/requirements", requirementsRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/evidence", evidenceRouter);
app.use("/api/gaps", gapsRouter);
app.use("/api/remediation", remediationRouter);
app.use("/api/findings", findingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reference", referenceRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[WADJET Compliance] API running on http://localhost:${PORT}`);
});
