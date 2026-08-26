import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { USERS, RISKS, DOMAINS, PARAMETERS } from "./mock-data.mjs";
import { RiskEngine } from "./riskEngine.js";

const ROOT = new URL("./", import.meta.url);
const workbookPath = fileURLToPath(new URL("../Risk_Assessment_v3.xlsx", ROOT));
const databasePath = fileURLToPath(new URL("./data/database.json", ROOT));
const riskFilePath = fileURLToPath(new URL("./data/risks.json", ROOT));
const criteriaNames = ["Financial", "Regulatory", "Reputational", "Safety", "Operational", "Confidentiality", "Integrity", "Availability"];

const clean = (value) => String(value ?? "").trim();
const asDate = (value, fallback = new Date().toISOString().slice(0, 10)) => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
};
const asNumber = (value, fallback = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(5, Math.max(1, Math.round(number))) : fallback;
};
const slug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "owner";

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(workbookPath);
const sheet = workbook.getWorksheet("Risk Rigister");
if (!sheet) throw new Error("Risk Rigister sheet was not found.");

const rows = [];
sheet.eachRow((row, rowNumber) => {
  if (rowNumber >= 4 && clean(row.getCell(1).value)) rows.push(row.values.slice(1));
});
if (rows.length !== 48) throw new Error(`Expected 48 risks, found ${rows.length}.`);

const ownerUsers = new Map(USERS.map((user) => [clean(user.fullName || user.name || user.username).toLowerCase(), user]));
const getOwnerUser = (ownerName) => {
  const key = clean(ownerName).toLowerCase();
  if (ownerUsers.has(key)) return ownerUsers.get(key);
  const user = {
    _id: `u-import-${slug(ownerName)}`,
    username: slug(ownerName),
    fullName: clean(ownerName),
    name: clean(ownerName),
    email: `${slug(ownerName)}@wadjet.local`,
    department: "Risk Management",
    is_active: true,
    role: "risk_owner",
  };
  USERS.push(user);
  ownerUsers.set(key, user);
  return user;
};

const domainByName = new Map(DOMAINS.map((domain) => [clean(domain.name).toLowerCase(), domain]));
const fallbackDomain = DOMAINS.find((domain) => domain.status === "active") || DOMAINS[0];
const parameterByDomain = new Map(PARAMETERS.map((parameter) => [String(parameter.domain?._id || parameter.domain), parameter]));

const imported = rows.map((cells) => {
  const [riskId, process, subProcess, assetSystem, ownerTeam, category, threat, vulnerability, severity, title, description, riskDate, likelihood, ...rest] = cells;
  const impacts = {};
  for (let index = 0; index < criteriaNames.length; index += 1) impacts[criteriaNames[index]] = asNumber(rest[index]);
  const sheetRiskScore = rest[8];
  const sheetResidualScore = rest[12];
  const treatment = clean(rest[14]) || "Mitigate";
  const status = clean(rest[15]).toLowerCase() === "close" ? "Closed" : "Open";
  const mitigationActions = clean(rest[16]);
  const deadline = asDate(rest[17]);
  const ownerName = clean(rest[18]) || "Risk Manager";
  const owner = getOwnerUser(ownerName);
  const domain = domainByName.get(clean(category).toLowerCase()) || fallbackDomain;
  const parameter = parameterByDomain.get(domain?._id) || PARAMETERS[0];
  const engine = new RiskEngine(parameter);
  const calculation = engine.calculate({
    criteriaScores: impacts,
    likelihood: asNumber(likelihood),
    riskControls: [],
    riskId,
    calculatedBy: "risk-sheet-import",
  });
  if (!calculation.success) throw new Error(`${riskId}: ${calculation.errors.join(", ")}`);
  const result = calculation.result;
  return {
    _id: `risk-import-${riskId.toLowerCase()}`,
    riskId: clean(riskId),
    title: clean(title) || `Imported ${riskId}`,
    description: clean(description),
    process: clean(process),
    subProcess: clean(subProcess),
    riskCategory: clean(category),
    category: clean(category),
    assetSystem: clean(assetSystem),
    ownerTeam: clean(ownerTeam),
    threat: clean(threat),
    vulnerability: clean(vulnerability),
    riskOwnerId: owner._id,
    owner: ownerName,
    dateIdentified: asDate(riskDate),
    riskDate: asDate(riskDate),
    likelihood: asNumber(likelihood),
    impacts: criteriaNames.map((name) => ({ name, value: impacts[name] })),
    impactScore: result.impact,
    impact: result.impact,
    riskScore: result.inherentScore,
    inherentScore: result.inherentScore,
    inherentLevel: result.inherentLevel,
    severityLevel: result.inherentLevel,
    residualScore: result.residualScore,
    residualLevel: result.residualLevel,
    overallRisk: result.residualLevel,
    appetiteStatus: result.appetiteStatus,
    appetiteLimit: result.calculationTrace.appetiteLimit,
    toleranceLimit: result.calculationTrace.toleranceLimit,
    combinedCE: result.combinedCE,
    effectiveCE: result.effectiveCE,
    suggestedResidual: result.residualScore,
    calculatedResidualScore: result.residualScore,
    calculationTrace: result.calculationTrace,
    reductionDetail: result.reductionDetail,
    escalationPath: domain?.escalationMatrix?.[result.inherentLevel] || "Risk Owner",
    domain: domain ? { _id: domain._id, name: domain.name, scoringMethod: domain.scoringMethod } : null,
    parameter: parameter ? { _id: parameter._id, name: parameter.name, methodVersion: parameter.methodVersion } : null,
    treatmentDecision: treatment,
    treatment,
    status,
    mitigationActions,
    treatmentActions: mitigationActions,
    deadline,
    targetDate: deadline,
    treatmentDueDate: deadline,
    treatmentOwner: ownerName,
    treatmentOwnerId: owner._id,
    treatmentEffectiveness: "Not Assessed",
    existingControls: clean(rest[7]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closedAt: status === "Closed" ? new Date().toISOString() : null,
    source: "Risk_Assessment_v3.xlsx",
    sourceRiskScore: Number(sheetRiskScore) || null,
    sourceResidualScore: Number(sheetResidualScore) || null,
  };
});

const importedIds = new Set(imported.map((risk) => risk.riskId));
for (let index = RISKS.length - 1; index >= 0; index -= 1) {
  if (importedIds.has(RISKS[index].riskId)) RISKS.splice(index, 1);
}
RISKS.push(...imported);
const database = { version: 1, savedAt: new Date().toISOString(), collections: {}, nested: {} };
try { Object.assign(database, JSON.parse(await fs.readFile(databasePath, "utf8"))); } catch (error) { if (error.code !== "ENOENT") throw error; }
database.collections.risks = RISKS;
database.collections.users = USERS;
await fs.mkdir(new URL("./data/", ROOT), { recursive: true });
await fs.writeFile(databasePath, JSON.stringify(database, null, 2), { encoding: "utf8", mode: 0o600 });
await fs.writeFile(riskFilePath, JSON.stringify(RISKS, null, 2), { encoding: "utf8", mode: 0o600 });
console.log(`Imported ${imported.length} risks and ${USERS.length} users.`);
console.log(`Calculated levels: ${JSON.stringify(imported.reduce((counts, risk) => { counts[risk.inherentLevel] = (counts[risk.inherentLevel] || 0) + 1; return counts; }, {}))}`);
