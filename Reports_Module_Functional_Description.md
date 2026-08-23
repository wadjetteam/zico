# WADJET GRC — Reports Module: Functional Description & Technical Evaluation

**Document Version:** 1.0
**Date:** 2026-08-23
**Scope:** Complete functional description of all components, features, data fields, and UI elements within the Reports Module
**Audience:** Subject Matter Experts (SME) for professional technical evaluation

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture & File Structure](#2-architecture--file-structure)
3. [Backend: Reports Service](#3-backend-reports-service)
4. [Frontend: Report Pages](#4-frontend-report-pages)
5. [Data Structures & Field Definitions](#5-data-structures--field-definitions)
6. [API Endpoints](#6-api-endpoints)
7. [UI Component Library](#7-ui-component-library)
8. [Export Engine](#8-export-engine)
9. [Optimization & Development Opportunities](#9-optimization--development-opportunities)

---

## 1. Module Overview

The Reports Module is a cross-functional reporting engine within the WADJET GRC platform that generates downloadable, audit-ready reports from five domain modules: **Compliance**, **Risk**, **Asset**, **Audit**, and **Platform**. It provides:

- A centralized report catalog with 9 pre-defined report types
- Multi-format export (XLSX, PDF, CSV)
- Visual dashboard reporting (bar charts, data tables)
- Pre-canned stakeholder communication reports

**Key Characteristics:**
- **Report Types:** 9 (4 Compliance, 2 Risk, 1 Asset, 1 Audit, 1 Platform)
- **Export Formats:** XLSX (ExcelJS), PDF (pdf-lib), CSV (client-side)
- **Data Source:** In-memory mock data stores (compliance-data.js, mock-data.mjs)
- **Authentication:** JWT Bearer token (localStorage: `wadjet_token`)

---

## 2. Architecture & File Structure

```
Reports Module
├── Backend
│   └── server/services/reportsService.js    (338 lines — Core generation engine)
│
├── Frontend — Main Reports Hub
│   └── client/src/pages/reports/
│       └── ReportsPage.tsx                  (118 lines — Report catalog browser)
│
├── Frontend — Reporting Dashboards
│   └── client/src/pages/reporting/
│       ├── ComplianceReports.jsx            (80 lines — Visual compliance dashboard)
│       └── DynamicRiskReport.jsx            (62 lines — Filterable risk data table)
│
├── Frontend — Compliance Reports
│   └── client/src/pages/compliance/
│       └── ReportsPage.tsx                  (30 lines — Pre-canned report cards)
│
├── Shared Components (used by Reports)
│   ├── client/src/components/DataTable.jsx  (171 lines — Reusable data table)
│   ├── client/src/components/States.jsx     (37 lines — Loading/Empty/Error states)
│   ├── client/src/components/PageHeader.jsx (11 lines — Page header with actions)
│   └── client/src/lib/format.js             (60 lines — Formatting utilities)
│
└── Data Sources
    ├── server/compliance-data.js            (Compliance domain data)
    └── server/mock-data.mjs                 (Risk/Audit/Asset domain data)
```

---

## 3. Backend: Reports Service

**File:** `server/services/reportsService.js`

### 3.1 Report Catalog (REPORT_CATALOG)

A static array of 9 report definitions. Each entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (kebab-case, e.g., `"compliance_summary"`) |
| `name` | `string` | Human-readable report title |
| `module` | `string` | Domain classification: `"compliance"`, `"risk"`, `"asset"`, `"audit"`, `"platform"` |
| `description` | `string` | One-line description of report contents |
| `formats` | `string[]` | Supported export formats: `"xlsx"`, `"pdf"` |
| `icon` | `string` | Lucide icon name for UI rendering |

**Complete Catalog:**

| ID | Name | Module | Formats | Icon |
|----|------|--------|---------|------|
| `compliance_summary` | Compliance Executive Summary | compliance | xlsx, pdf | ShieldCheck |
| `compliance_requirements` | Requirements Detail Report | compliance | xlsx | ClipboardList |
| `compliance_gaps` | Gap Analysis Report | compliance | xlsx, pdf | AlertOctagon |
| `compliance_evidence` | Evidence Inventory | compliance | xlsx | FileText |
| `risk_register` | Risk Register | risk | xlsx, pdf | Shield |
| `risk_poam` | POAM Status Report | risk | xlsx | Clock |
| `asset_inventory` | Asset Inventory | asset | xlsx | Building2 |
| `audit_findings` | Audit Findings Report | audit | xlsx, pdf | Search |
| `platform_executive` | Platform Executive Summary | platform | pdf | BarChart3 |

### 3.2 Core Functions

#### `generateReport(reportId, format)` — Main Entry Point
- **Input:** `reportId` (string), `format` (string: "xlsx" | "pdf")
- **Output:** `Buffer` (binary file data)
- **Logic:** Looks up report in catalog → validates format support → dispatches to specific generator function
- **Error Handling:** Throws `"Report not found"` or `"Format not supported for this report"`

#### `computeScore(requirements)` — Compliance Scoring Algorithm
- **Input:** Array of requirement objects
- **Output:** Integer percentage (0-100)
- **Logic:**
  1. Filters out requirements with status `"NotApplicable"` or `"NotAssessed"`
  2. Maps remaining: `Compliant` → 100, `PartiallyCompliant` → 50, `NonCompliant` → 0
  3. Returns `Math.round(total / scored.length)`

### 3.3 Report Generator Functions

#### `generateComplianceSummary(format)`
- **Data Sources:** `COMPLIANCE_REQUIREMENTS`, `COMPLIANCE_FRAMEWORKS`, `COMPLIANCE_GAPS`, `COMPLIANCE_EVIDENCE`
- **XLSX Output:**
  - Title row with branding
  - Generation timestamp
  - Overall compliance score (KPI)
  - Per-framework score breakdown table
  - Summary metrics: Total Requirements, Open Gaps, Missing Evidence
- **PDF Output:**
  - Letter size (612×792)
  - Gold-colored title (`rgb(0.85, 0.68, 0.31)`)
  - Overall score, framework coverage list

#### `generateComplianceRequirements(format)`
- **Data Sources:** `COMPLIANCE_REQUIREMENTS`, `COMPLIANCE_FRAMEWORKS`
- **XLSX Output:** Tabular with columns: Code, Title, Framework, Status, Criticality, Owner
- **Note:** Only XLSX format supported

#### `generateComplianceGaps(format)`
- **Data Sources:** `COMPLIANCE_GAPS`
- **XLSX Output:** Tabular with columns: Code, Description, Severity, Status, Owner, Due Date

#### `generateComplianceEvidence(format)`
- **Data Sources:** `COMPLIANCE_EVIDENCE`
- **XLSX Output:** Tabular with columns: Code, Name, Type, Status, Owner, Upload Date

#### `generateRiskRegister(format)`
- **Data Sources:** `RISKS` (from mock-data.mjs)
- **XLSX Output:** Tabular with columns: Risk ID, Title, Score, Likelihood, Impact, Status, Owner
- **Note:** Uses `inherentScore` field, falls back to empty string if missing

#### `generatePOAMReport(format)`
- **Data Sources:** `POAM` (from mock-data.mjs)
- **XLSX Output:** Tabular with columns: ID, Title, Status, Due Date, Owner, Milestone
- **Note:** Handles both `poamId`/`title` and `_id`/`description` field naming

#### `generateAssetInventory(format)`
- **Data Sources:** `ASSETS` (from mock-data.mjs)
- **XLSX Output:** Tabular with columns: Asset ID, Name, Type, Owner, Criticality, Status

#### `generateAuditFindings(format)`
- **Data Sources:** `AUDIT_FINDINGS` (from mock-data.mjs)
- **XLSX Output:** Tabular with columns: Finding ID, Title, Severity, Status, Due Date, Auditor

#### `generatePlatformExecutive(format)`
- **Data Sources:** `COMPLIANCE_REQUIREMENTS`, `COMPLIANCE_FRAMEWORKS`, `COMPLIANCE_GAPS`, `RISKS`, `ASSETS`
- **PDF Output:** Cross-module executive summary with:
  - Overall Compliance Score
  - Total Requirements count
  - Open Gaps count
  - Total Risks count
  - Total Assets count
- **Note:** Only PDF format supported

---

## 4. Frontend: Report Pages

### 4.1 ReportsPage.tsx — Main Report Catalog Browser

**File:** `client/src/pages/reports/ReportsPage.tsx`
**Route Context:** Primary reports hub

#### Component State
| State Variable | Type | Default | Purpose |
|----------------|------|---------|---------|
| `activeModule` | `string` | `"all"` | Active module filter tab |
| `downloading` | `string \| null` | `null` | Tracks which report+format is being downloaded (e.g., `"compliance_summary-xlsx"`) |

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleFilter` | `string` | `"all"` | Initial module filter (set via route param) |

#### MODULES Constant
Defines 6 filter tabs:
| ID | Label | Icon |
|----|-------|------|
| `all` | All Reports | FileText |
| `compliance` | Compliance | Shield |
| `risk` | Risk | AlertTriangle |
| `audit` | Audit | Search |
| `asset` | Asset | Building2 |
| `platform` | Platform | BarChart3 |

#### Data Fetching
- **Hook:** `useQuery` from `@tanstack/react-query`
- **Query Key:** `["reports", activeModule]`
- **API Call:** `GET /reports?module={activeModule}` (omits param when "all")
- **Response Shape:** `{ items: Report[] }`

#### `handleDownload(reportId, format)` Function
1. Sets `downloading` state to `"reportId-format"`
2. Fetches from `/api/reports/generate?reportId={reportId}&format={format}`
3. Reads JWT from `localStorage.getItem("wadjet_token")`
4. Creates Blob → ObjectURL → anchor element → triggers download
5. Filename format: `{reportId}_{timestamp}.{format}`
6. Error handling: `alert()` with error message

#### UI Structure
- Page heading: "Reports" with subtitle
- Module filter tabs (horizontal, wrap on small screens)
- Responsive grid: 1 col (mobile) → 2 col (md) → 3 col (lg)
- Report cards with: icon, name, module badge, description, format download buttons

#### `getIcon(iconName)` Helper
Maps icon name strings to Lucide icon components with gold color styling.

---

### 4.2 ComplianceReports.jsx — Visual Compliance Dashboard

**File:** `client/src/pages/reporting/ComplianceReports.jsx`
**Route Context:** Reporting dashboards section

#### Data Fetching
- **Hook:** `useEffect` with `Promise.all`
- **API Calls:**
  - `GET /dashboard/summary` → compliance summary data
  - `GET /frameworks?pageSize=100` → framework list
  - `GET /controls?pageSize=500` → control library

#### Component State
| State Variable | Type | Purpose |
|----------------|------|---------|
| `summary` | `object \| null` | Dashboard summary with `frameworkCompliance` array |
| `frameworks` | `Framework[]` | List of compliance frameworks |
| `controls` | `Control[]` | List of controls from library |

#### UI Structure
1. **PageHeader** — Title: "Compliance Reports"
2. **Bar Chart Card** — Implementation by framework
   - Uses Recharts `BarChart` with `ResponsiveContainer`
   - Data: `summary.frameworkCompliance` (name, percent)
   - Gold bars (`#D4AF37`), rounded corners
   - Custom tooltip with gold cursor highlight
3. **Framework Cards** — One per framework
   - Framework name + version
   - Control count
   - Control list with implementation status chips
   - Status styles: Not Implemented (red), Partially Implemented (amber), Largely Implemented (sky), Fully Implemented (emerald)

#### `byFramework(fwId)` Helper
Filters controls by matching `c.framework?._id` to given framework ID.

---

### 4.3 DynamicRiskReport.jsx — Filterable Risk Data Table

**File:** `client/src/pages/reporting/DynamicRiskReport.jsx`
**Route Context:** Reporting dashboards section

#### Data Fetching
- **Hook:** `useEffect` with `resource("risks").list()`
- **API Call:** `GET /risks` (via generic resource helper)
- **Response Shape:** `{ items: Risk[] }`

#### Component State
| State Variable | Type | Purpose |
|----------------|------|---------|
| `rows` | `Risk[]` | Risk data for table display |
| `loading` | `boolean` | Loading state toggle |

#### UI Structure
1. **PageHeader** — Title: "Dynamic Risk Report" with "Export CSV" action button
2. **DataTable** — Paginated, sortable, searchable table with columns:

| Column Key | Header | Render Logic |
|------------|--------|--------------|
| `title` | Risk | Bold white text |
| `category` | Category | Capitalized |
| `owner` | Owner | Plain text |
| `likelihood` | L | Plain number |
| `impact` | I | `r.impactScore ?? r.impact` |
| `inherentScore` | Inherent | `r.inherentScore ?? r.riskScore` |
| `residualScore` | Residual | Chip with severity color |
| `status` | Status | Chip with status style, title-cased |
| `createdAt` | Created | Formatted date |

#### `exportCsv()` Function
1. Defines headers: Title, Category, Owner, Likelihood, Impact, Inherent, Residual, Severity, Status, Created, Closed
2. Maps each risk row to CSV line with proper escaping (`"` → `""`)
3. Creates Blob with `type: "text/csv"`
4. Filename: `wadjet-risk-report-{YYYY-MM-DD}.csv`
5. Triggers download via anchor element

---

### 4.4 Compliance ReportsPage.tsx — Pre-Canned Report Cards

**File:** `client/src/pages/compliance/ReportsPage.tsx`
**Route Context:** Compliance module section

#### Static Report Definitions
| Title | Description | Icon | Data |
|-------|-------------|------|------|
| Overall Compliance Report | Program-wide score, framework count, requirement count | Shield | Summary metrics |
| Framework Compliance Report | Per-framework scores and coverage | ClipboardList | Framework breakdown |
| Requirements Status Report | Breakdown by compliance status | FileText | Status counts |
| Compliance Gap Report | Open gaps by severity level | AlertOctagon | Gap analysis |
| Evidence Status Report | Approved vs total evidence | Upload | Evidence metrics |
| Remediation Report | Completed vs total tasks | Wrench | Progress tracking |
| Audit Readiness Report | Cross-references open findings, gaps, missing evidence | Shield | Readiness score |

#### UI Structure
- Inline-styled card grid (no Tailwind)
- Responsive: `auto-fit` with `minmax(280px, 1fr)`
- Cards use theme tokens from `shared.tsx` (`T.panelBg`, `T.panelBorder`, `T.accent`)
- **Note:** Cards are non-functional (no click handlers) — display-only placeholders

---

## 5. Data Structures & Field Definitions

### 5.1 Report Object (from API)
```typescript
interface Report {
  id: string;           // Unique report identifier
  name: string;         // Display name
  module: string;       // Domain: "compliance" | "risk" | "asset" | "audit" | "platform"
  description: string;  // One-line description
  formats: string[];    // ["xlsx"] | ["pdf"] | ["xlsx", "pdf"]
  icon: string;         // Lucide icon name
}
```

### 5.2 Compliance Requirements
```typescript
interface ComplianceRequirement {
  _id: string;           // e.g., "cr-1"
  code: string;          // e.g., "REQ-101"
  title: string;         // Requirement name
  frameworkId: string;   // Reference to COMPLIANCE_FRAMEWORKS._id
  category: string;      // e.g., "Identity & Access"
  applicability: string; // "Applicable" | "NotApplicable"
  status: string;        // "Compliant" | "PartiallyCompliant" | "NonCompliant" | "NotApplicable" | "NotAssessed"
  mappedControls: string; // JSON-stringified array of control IDs
  relatedPolicies: string; // JSON-stringified array of policy IDs
  relatedRisks: string;   // JSON-stringified array of risk IDs
  relatedAssets: string;  // JSON-stringified array of asset IDs
}
```

### 5.3 Compliance Gaps
```typescript
interface ComplianceGap {
  _id: string;           // e.g., "cg-1"
  code: string;          // e.g., "GAP-001"
  requirementId: string; // Reference to COMPLIANCE_REQUIREMENTS._id
  frameworkId: string;   // Reference to COMPLIANCE_FRAMEWORKS._id
  description: string;   // Gap description
  currentState: string;  // Current state description
  expectedState: string; // Target state description
  severity: string;      // "Critical" | "High" | "Medium" | "Low"
  owner: string;         // Responsible person
  dueDate: string;       // ISO date string
  status: string;        // "Open" | "InProgress" | "Resolved" | "Accepted" | "Closed"
  relatedRiskId: string; // Reference to risk
  relatedControlId: string; // Reference to control
  remediationPlan: string;  // Remediation description
}
```

### 5.4 Compliance Evidence
```typescript
interface ComplianceEvidence {
  _id: string;              // e.g., "ce-1"
  code: string;             // e.g., "EVD-001"
  name: string;             // File/document name
  requirementId: string;    // Reference to requirement
  controlId: string;        // Reference to control
  type: string;             // "Document" | "Screenshot" | "LogExport" | "Policy" | "Ticket/Record" | "Attestation"
  owner: string;            // Responsible person
  uploadDate: string | null; // ISO date or null
  expirationDate: string | null;
  status: string;           // "Missing" | "Requested" | "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Expired"
  verificationStatus: string; // "Verified" | "Pending"
  reviewer: string;         // Reviewer name
  comments: string;         // Review comments
}
```

### 5.5 Risk Object
```typescript
interface Risk {
  _id: string;              // Internal ID, e.g., "risk-1"
  riskId: string;           // Business ID, e.g., "R-001"
  title: string;            // Risk title
  process: string;          // Business process
  subProcess: string;       // Sub-process
  assetSystem: string;      // Affected system
  ownerTeam: string;        // Owning team
  category: string;         // Risk category
  threat: string;           // Threat description
  vulnerability: string;    // Vulnerability description
  riskDate: string;         // ISO date
  owner: string;            // Risk owner name
  likelihood: number;       // 1-5 scale
  impacts: ImpactItem[];    // Array of {name, value} for 8 criteria
  impactScore: number;      // Maximum impact value
  riskScore: number;        // likelihood × impactScore
  inherentLevel: string;    // "Critical" | "High" | "Medium" | "Low"
  residualScore: number;    // Post-mitigation score
  residualLevel: string;    // Post-mitigation level
  severityLevel: string;    // Same as inherentLevel
  domain: { _id: string; name: string } | null;
  treatment: string;        // "Mitigate" | "Transfer" | "Accept" | "Avoid"
  status: string;           // "Open" | "In Progress" | "Accepted" | "Closed"
  mitigationActions: string;
  deadline: string;         // ISO date
  asset: object | null;
  treatmentOwner: string;
  treatmentDueDate: string;
  treatmentEffectiveness: string; // "Effective" | "Partially Effective"
  createdAt: string;        // ISO date
  closedAt: string | null;  // ISO date or null
}
```

### 5.6 POAM (Plan of Action & Milestones)
```typescript
interface POAM {
  _id: string;              // e.g., "poam-1"
  title: string;            // Action title
  description: string;      // Action description
  status: string;           // "In Progress" | "Planned" | "Closed"
  owner: string;            // Responsible person
  dueDate: string;          // ISO date
  riskId: string;           // Associated risk ID (e.g., "R-013")
}
```

### 5.7 Asset
```typescript
interface Asset {
  _id: string;              // e.g., "a-1"
  name: string;             // Asset name
  type: string;             // "Application" | "Database" | "Infrastructure"
  owner: string;            // Responsible team/person
  location: string;         // Physical/logical location
  criticality: string;      // "Critical" | "High" | "Medium"
  status: string;           // "Operational" | "In Deployment"
  domain: string;           // Risk domain
}
```

### 5.8 Audit Finding
```typescript
interface AuditFinding {
  _id: string;              // e.g., "af-1"
  findingId: string;        // Business ID, e.g., "F-2026-01"
  title: string;            // Finding title
  severity: string;         // "Critical" | "High" | "Medium" | "Low"
  status: string;           // "Open" | "In Progress" | "Closed"
  owner: string;            // Responsible person
  dueDate: string;          // ISO date
  description: string;      // Finding description
}
```

### 5.9 Framework
```typescript
interface Framework {
  _id: string;              // e.g., "cf-1"
  code: string;             // e.g., "FRW-001"
  name: string;             // Framework name
  type: string;             // "Standard" | "Regulation"
  version: string;          // Version string
  issuer: string;           // Issuing body
  effectiveDate: string;    // ISO date
  description: string;      // Framework description
  status: string;           // "Active" | "Archived" | "Draft"
}
```

### 5.10 Control
```typescript
interface Control {
  _id: string;              // e.g., "c-1"
  controlId: string;        // Business ID, e.g., "ORG-01"
  annexCode: string | null; // Framework annex reference
  name: string;             // Control name
  description: string;      // Control description
  category: string;         // Control category
  domain: string;           // "Administrative" | "Physical" | "Technical"
  controlType: string;      // "Preventive" | "Detective" | "Corrective"
  owner: string;            // Control owner
  testingFrequency: string; // "Continuous" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Semi-Annual" | "Annually"
  status: string;           // "Active / Implemented" | "In Progress / Under Implementation"
  progress: number;         // 0-100
  maturityLevel: number;    // 1-5
  targetAssets: string[];   // Asset IDs
  effectiveness: {
    design: number;         // 0-100
    operating: number;      // 0-100
    coverage: number;       // 0-100
    testing: number;        // 0-100
    overall: number;        // Weighted average
  };
  framework: { _id: string; name: string };
  frameworkMappings: FrameworkMapping[];
  lastTestedAt: string;
  nextTestDueAt: string;
  createdAt: string;
  evidence: any[];
  assessments: any[];
}
```

---

## 6. API Endpoints

### 6.1 Report Catalog
```
GET /reports
Query Params: module? (string: "compliance" | "risk" | "audit" | "asset" | "platform")
Response: { items: Report[] }
Auth: Bearer JWT
```

### 6.2 Report Generation
```
GET /api/reports/generate
Query Params: reportId (string), format (string: "xlsx" | "pdf")
Headers: Authorization: Bearer {token}
Response: Binary file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | application/pdf)
```

### 6.3 Supporting Endpoints (used by reporting dashboards)
```
GET /dashboard/summary
Response: { frameworkCompliance: [{ name: string, percent: number }], ... }

GET /frameworks?pageSize=100
Response: { items: Framework[] }

GET /controls?pageSize=500
Response: { items: Control[] }

GET /risks
Response: { items: Risk[] }
```

---

## 7. UI Component Library

### 7.1 DataTable (Reusable)
**File:** `client/src/components/DataTable.jsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Column[]` | required | Column definitions |
| `rows` | `any[]` | required | Data rows |
| `loading` | `boolean` | false | Loading state |
| `emptyTitle` | `string` | "No records yet" | Empty state title |
| `emptyHint` | `string` | — | Empty state hint text |
| `emptyAction` | `ReactNode` | — | Empty state action button |
| `searchable` | `boolean` | true | Enable search input |
| `searchPlaceholder` | `string` | "Search…" | Search placeholder |
| `pageSize` | `number` | 10 | Rows per page |
| `toolbar` | `ReactNode` | — | Toolbar content (right of search) |
| `rowKey` | `(row) => string` | `(r) => r._id` | Row key extractor |
| `onRowClick` | `(row) => void` | — | Row click handler |

**Column Definition:**
```typescript
interface Column {
  key: string;              // Data field key
  header: string;           // Column header text
  render?: (row) => ReactNode;  // Custom render function
  sortable?: boolean;       // Default: true
  className?: string;       // Additional CSS class
}
```

**Features:**
- Client-side search (searches all column values)
- Client-side sorting (numeric and string)
- Pagination with page indicator
- Loading/Empty state integration

### 7.2 States Components
**File:** `client/src/components/States.jsx`

| Component | Props | Purpose |
|-----------|-------|---------|
| `LoadingState` | `label?: string` | Spinning loader with text |
| `EmptyState` | `title?, hint?, action?` | Empty data placeholder with icon |
| `ErrorState` | `message?, onRetry?` | Error display with retry button |

### 7.3 PageHeader
**File:** `client/src/components/PageHeader.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page title (heading style) |
| `subtitle` | `string` | Subtitle text (muted) |
| `actions` | `ReactNode` | Action buttons (right-aligned) |

### 7.4 Formatting Utilities
**File:** `client/src/lib/format.js`

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `fmtDate(v)` | ISO date string | "DD Mon YYYY" | Date formatting |
| `fmtDateTime(v)` | ISO date string | "DD Mon YYYY, HH:mm" | DateTime formatting |
| `fmtDateInput(v)` | ISO date string | "YYYY-MM-DD" | Input date formatting |
| `severityOf(score)` | number | "low"\|"medium"\|"high"\|"critical" | Score-to-severity mapping |
| `chipClass(value, map?)` | string, style map | CSS class string | Status chip styling |
| `titleCase(s)` | string | string | "in_progress" → "in progress" |

**Severity Thresholds:**
- `score >= 20` → "critical"
- `score >= 12` → "high"
- `score >= 6` → "medium"
- else → "low"

---

## 8. Export Engine

### 8.1 XLSX Generation (ExcelJS)
- **Library:** `exceljs`
- **Method:** `new ExcelJS.Workbook()` → `addWorksheet()` → `addRow()` → `wb.xlsx.writeBuffer()`
- **Styling:** Minimal — raw data rows with header text
- **No formatting:** No column widths, no cell styling, no formulas

### 8.2 PDF Generation (pdf-lib)
- **Library:** `pdf-lib`
- **Method:** `PDFDocument.create()` → `addPage([612, 792])` → `drawText()` → `pdfDoc.save()`
- **Page Size:** Letter (612×792 points)
- **Fonts:** Helvetica, Helvetica-Bold
- **Colors:** Gold (`rgb(0.85, 0.68, 0.31)`) for titles
- **Layout:** Manual y-coordinate positioning (decrement y after each line)

### 8.3 CSV Generation (Client-Side)
- **Method:** Manual string construction → `Blob` → `URL.createObjectURL()` → anchor click
- **Escaping:** Double-quote escaping (`"` → `""`)
- **No BOM:** No UTF-8 BOM prefix (potential Excel encoding issue)

---

## 9. Optimization & Development Opportunities

### 9.1 Critical Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| No server-side report persistence | High | Generated reports are not stored; no report history |
| No async report generation | High | Large reports block the event loop; no job queue |
| No report scheduling | Medium | No ability to schedule recurring report generation |
| No report parameterization | Medium | No date range, filter, or scope selection before generation |
| No report preview | Medium | Users must download to see content |
| CSV export lacks UTF-8 BOM | Low | Non-ASCII characters may display incorrectly in Excel |

### 9.2 Architecture Improvements

| Opportunity | Impact | Effort |
|-------------|--------|--------|
| Add report template engine (e.g., Handlebars) | High | Medium |
| Implement report generation job queue (Bull/BullMQ) | High | High |
| Add report history & versioning | Medium | Medium |
| Implement server-side pagination for large datasets | Medium | Low |
| Add report sharing via secure link | Medium | Medium |
| Add custom report builder (drag-and-drop) | High | High |

### 9.3 Data Model Enhancements

| Enhancement | Benefit |
|-------------|---------|
| Add `ReportExecution` schema | Track who generated what and when |
| Add `ReportTemplate` schema | Allow custom report definitions |
| Add `ReportSchedule` schema | Support recurring automated reports |
| Add `ReportFavorite` schema | User-specific report favorites |
| Add date-range parameters to all reports | Enable period-specific reporting |

### 9.4 UI/UX Improvements

| Improvement | Description |
|-------------|-------------|
| Report preview modal | Show report content before download |
| Date range picker | Filter report data by period |
| Progress indicator | Show generation progress for large reports |
| Bulk download | Download multiple reports at once |
| Report comparison | Compare reports across time periods |
| Dashboard widgets | Embed report charts on main dashboard |

### 9.5 Export Engine Enhancements

| Enhancement | Description |
|-------------|-------------|
| Add column auto-width in XLSX | Improve readability |
| Add cell formatting (colors, borders) | Professional styling |
| Add charts to XLSX | Embedded visualizations |
| Add headers/footers to PDF | Page numbers, branding |
| Add table formatting to PDF | Structured data presentation |
| Add CSV UTF-8 BOM | Fix encoding issues |
| Add JSON export | API integration support |

### 9.6 Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| Server-side CSV generation | Reduce client memory usage |
| Streaming XLSX generation | Handle large datasets |
| Report caching | Avoid regeneration of unchanged data |
| Pagination in report data fetch | Reduce initial load time |
| Web Worker for CSV export | Non-blocking UI |

### 9.7 Security Considerations

| Concern | Recommendation |
|---------|----------------|
| Report data access control | Verify user has permission to access report data |
| Token exposure in URLs | Move report generation to POST with body |
| Rate limiting | Prevent abuse of report generation endpoint |
| Input validation | Validate reportId and format parameters |
| Audit logging | Log all report access for compliance |

---

## Appendix A: Report-to-Data-Source Mapping

| Report | Data Source File | Data Variables |
|--------|-----------------|----------------|
| Compliance Executive Summary | compliance-data.js | COMPLIANCE_REQUIREMENTS, COMPLIANCE_FRAMEWORKS, COMPLIANCE_GAPS, COMPLIANCE_EVIDENCE |
| Requirements Detail | compliance-data.js | COMPLIANCE_REQUIREMENTS, COMPLIANCE_FRAMEWORKS |
| Gap Analysis | compliance-data.js | COMPLIANCE_GAPS |
| Evidence Inventory | compliance-data.js | COMPLIANCE_EVIDENCE |
| Risk Register | mock-data.mjs | RISKS |
| POAM Status | mock-data.mjs | POAM |
| Asset Inventory | mock-data.mjs | ASSETS |
| Audit Findings | mock-data.mjs | AUDIT_FINDINGS |
| Platform Executive | compliance-data.js + mock-data.mjs | COMPLIANCE_REQUIREMENTS, COMPLIANCE_FRAMEWORKS, COMPLIANCE_GAPS, RISKS, ASSETS |

## Appendix B: Report-to-Format Support Matrix

| Report | XLSX | PDF | CSV |
|--------|------|-----|-----|
| Compliance Executive Summary | ✓ | ✓ | — |
| Requirements Detail | ✓ | — | — |
| Gap Analysis | ✓ | ✓ | — |
| Evidence Inventory | ✓ | — | — |
| Risk Register | ✓ | ✓ | — |
| POAM Status | ✓ | — | — |
| Asset Inventory | ✓ | — | — |
| Audit Findings | ✓ | ✓ | — |
| Platform Executive | — | ✓ | — |
| Dynamic Risk Report (frontend) | — | — | ✓ |

---

*End of Document*
