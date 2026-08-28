import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workbookPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/Cross_Mapping_Sheet_fixed.xlsx");
const additionsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/cross-mapping-additions.json");
export const CROSS_MAPPING_SYSTEM_PROMPT = `You are the WADJET Compliance AI Agent. Analyze ISO/IEC 27001:2022, CBE, and PCI DSS cross-mappings. Return only the defined JSON contract. Use the mapping record as the source of truth, explain gaps from its rationale, identify the control owner, audit frequency, and evidence, and create actionable remediation tasks when coverage is below 100%.`;

let cache = { mtimeMs: 0, rows: [] };
let additionsCache = null;

const value = (row, key) => row[key] == null ? "" : String(row[key]).trim();
const parseCoverage = (text) => {
  const match = String(text).match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : 0;
};
const splitEvidence = (text) => String(text || "").split(/\r?\n|•/).map((item) => item.trim()).filter(Boolean);

export async function getCrossMappings() {
  const [stat, additions] = await Promise.all([
    fs.stat(workbookPath),
    additionsCache ? Promise.resolve(additionsCache) : fs.readFile(additionsPath, "utf8").then((text) => JSON.parse(text)).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    }),
  ]);
  additionsCache = additions;
  if (cache.mtimeMs === stat.mtimeMs && cache.rows.length) return [...cache.rows, ...additionsCache];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.worksheets[0];
  const headers = sheet.getRow(1).values.slice(1).map((header) => String(header || "").trim());
  const rows = [];
  for (let index = 2; index <= sheet.rowCount; index += 1) {
    const cells = sheet.getRow(index).values.slice(1);
    if (!cells.some((cell) => cell != null && String(cell).trim())) continue;
    const raw = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""]));
    rows.push({
      mapId: value(raw, "Map ID"),
      isoControl: value(raw, "ISO Control"),
      isoObjective: value(raw, "ISO Objective"),
      cbeDomain: value(raw, "CBE Domain"),
      cbeControlId: value(raw, "CBE Control ID"),
      supportingCbeControls: value(raw, "Supporting CBE Controls"),
      pciRequirement: value(raw, "PCI DSS Requirement"),
      mappingStrength: value(raw, "Mapping Strength"),
      coverage: value(raw, "Coverage"),
      gap: value(raw, "Gap"),
      controlOwner: value(raw, "Control Owner"),
      auditFrequency: value(raw, "Audit Frequency"),
      typicalAuditEvidence: splitEvidence(raw["Typical Audit Evidence"]),
      rationale: value(raw, "Rationale"),
    });
  }
  cache = { mtimeMs: stat.mtimeMs, rows };
  return [...rows, ...additionsCache];
}

export async function addCrossMapping(input) {
  const rows = await getCrossMappings();
  const mapId = String(input.mapId || "").trim();
  if (!mapId || rows.some((row) => row.mapId.toLowerCase() === mapId.toLowerCase())) {
    const error = new Error("A unique Map ID is required");
    error.statusCode = 422;
    throw error;
  }
  const row = {
    mapId,
    isoControl: String(input.isoControl || "").trim(),
    isoObjective: String(input.isoObjective || "").trim(),
    cbeDomain: String(input.cbeDomain || "").trim(),
    cbeControlId: String(input.cbeControlId || "").trim(),
    supportingCbeControls: String(input.supportingCbeControls || "").trim(),
    pciRequirement: String(input.pciRequirement || "").trim(),
    mappingStrength: String(input.mappingStrength || "Partial").trim(),
    coverage: String(input.coverage || "0%").trim(),
    gap: String(input.gap || "").trim(),
    controlOwner: String(input.controlOwner || "").trim(),
    auditFrequency: String(input.auditFrequency || "").trim(),
    typicalAuditEvidence: Array.isArray(input.typicalAuditEvidence) ? input.typicalAuditEvidence : splitEvidence(input.typicalAuditEvidence),
    rationale: String(input.rationale || "").trim(),
    source: "platform",
    createdAt: new Date().toISOString(),
  };
  additionsCache = [...(additionsCache || []), row];
  await fs.writeFile(additionsPath, JSON.stringify(additionsCache, null, 2), "utf8");
  return row;
}

function remediationFor(row) {
  const coverage = parseCoverage(row.coverage);
  if (coverage >= 100 || row.gap.toLowerCase().startsWith("no gap")) return [];
  return [{
    task_title: `Close cross-framework gap for ${row.mapId}`,
    assigned_to: row.controlOwner || "Compliance Owner",
    priority: coverage < 90 ? "High" : "Medium",
  }];
}

export async function analyzeCrossMapping(query = {}) {
  const rows = await getCrossMappings();
  const search = String(query.query || query.map_id || query.control || "").trim().toLowerCase();
  const row = rows.find((item) => query.map_id && item.mapId.toLowerCase() === String(query.map_id).toLowerCase())
    || rows.find((item) => search && [item.mapId, item.isoControl, item.isoObjective, item.cbeDomain, item.cbeControlId, item.pciRequirement].join(" ").toLowerCase().includes(search));
  if (!row) {
    const error = new Error("No cross-mapping matched the supplied query");
    error.statusCode = 404;
    throw error;
  }
  const coverage = parseCoverage(row.coverage);
  return {
    map_id: row.mapId,
    framework_mapping: { iso_27001: row.isoControl, cbe_framework: row.cbeControlId || row.cbeDomain, pci_dss: row.pciRequirement },
    compliance_evaluation: {
      mapping_strength: row.mappingStrength, coverage_percentage: `${coverage}%`,
      gap_details: coverage < 100 ? row.gap : "No Gap", rationale: row.rationale,
    },
    governance_and_audit: {
      control_owner: row.controlOwner, audit_frequency: row.auditFrequency, required_evidence: row.typicalAuditEvidence,
    },
    automated_remediation: remediationFor(row),
  };
}
