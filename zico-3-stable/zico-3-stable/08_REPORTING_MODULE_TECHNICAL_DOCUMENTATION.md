# WADJET GRC — Reporting Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Reporting  
**Last Updated:** 2026-08-23  
**Author:** WADJET GRC Engineering Team  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Functionalities](#3-functionalities)
4. [Report Definitions](#4-report-definitions)
5. [Data Structures](#5-data-structures)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Workflows](#7-workflows)
8. [API Endpoints](#8-api-endpoints)
9. [Integration Points](#9-integration-points)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Security Considerations](#11-security-considerations)

---

## 1. Module Overview

The Reporting Module is the universal report generation engine of the WADJET GRC platform. It provides comprehensive reporting capabilities across all modules with support for multiple export formats (XLSX, PDF, CSV), branded output with watermarks, role-based access control, and a registry-based architecture for extensibility.

### 1.1 Scope

| Capability | Description |
|---|---|
| Universal Report Engine | Single engine for all report types |
| Multi-Format Export | XLSX, PDF, CSV with branded output |
| Report Registry | Extensible registry for adding new reports |
| Role-Based Access | Report generation permissions by role |
| Filtering | Dynamic filter support per report |
| Branding | Logo, colors, watermark on all exports |
| Audit Logging | All report generation logged for compliance |
| Dashboard Reports | KPI dashboard-style reports |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Report Engine | services/reportsEngine.js (483 lines) |
| Report Definitions | services/reportDefinitions.js (800 lines) |
| XLSX Generation | ExcelJS |
| PDF Generation | pdf-lib |
| CSV Generation | Native string building |
| Frontend | React (TSX) with React Router, TanStack Query |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REPORTING MODULE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │                    ReportsPage                             │  │   │
│  │  │  - Module filter tabs                                     │  │   │
│  │  │  - Report cards with icons                                │  │   │
│  │  │  - Format selection (XLSX/PDF/CSV)                        │  │   │
│  │  │  - Filter panel                                           │  │   │
│  │  │  - Generate & Download                                    │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     API Layer                                    │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  GET  /api/reports           - List all reports           │  │   │
│  │  │  POST /api/reports/:id       - Generate report            │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Report Engine                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │                reportsEngine.js                           │  │   │
│  │  │                                                           │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │   │
│  │  │  │  XLSX       │  │  PDF        │  │  CSV        │     │  │   │
│  │  │  │  Renderer   │  │  Renderer   │  │  Renderer   │     │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │   │
│  │  │                                                           │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │   │
│  │  │  │  Branding   │  │  Watermark  │  │  Filtering  │     │  │   │
│  │  │  │  Engine     │  │  Engine     │  │  Engine     │     │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │              reportDefinitions.js (Registry)              │  │   │
│  │  │                                                           │  │   │
│  │  │  Compliance Reports (4+)    Risk Reports (2+)             │  │   │
│  │  │  Asset Reports (1+)         Audit Reports (2+)            │  │   │
│  │  │  Governance Reports (3+)    Controls Reports (1+)         │  │   │
│  │  │  Platform Reports (1+)      Context Reports (1+)          │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Report Generation Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  User Request   │────▶│  Report Lookup   │────▶│  Permission    │
│  (reportId,     │     │  (registry)      │     │  Check         │
│   format)       │     │                  │     │                │
└─────────────────┘     └──────────────────┘     └───────┬────────┘
                                                         │
                                                         ▼
                                                ┌────────────────┐
                                                │  Data Source   │
                                                │  Invocation    │
                                                └───────┬────────┘
                                                         │
                                                         ▼
                                                ┌────────────────┐
                                                │  Filter        │
                                                │  Application   │
                                                └───────┬────────┘
                                                         │
                              ┌──────────────────────────┼──────────────────────┐
                              │                          │                      │
                              ▼                          ▼                      ▼
                       ┌──────────┐              ┌──────────┐           ┌──────────┐
                       │   XLSX   │              │   PDF    │           │   CSV    │
                       │ Renderer │              │ Renderer │           │ Renderer │
                       └──────────┘              └──────────┘           └──────────┘
                              │                          │                      │
                              └──────────────────────────┼──────────────────────┘
                                                         │
                                                         ▼
                                                ┌────────────────┐
                                                │  Audit Log     │
                                                │  Record        │
                                                └────────────────┘
```

---

## 3. Functionalities

### 3.1 Report Registry

#### 3.1.1 Registration Pattern
All reports are registered via `registerReport()` at server startup:

```javascript
registerReport({
  id: "report_id",              // Unique identifier
  name: "Report Name",          // Display name
  module: "compliance",         // Module ownership
  description: "...",           // Report description
  icon: "ShieldCheck",          // Lucide icon name
  isDashboard: false,           // Dashboard-style report
  supportedFormats: ["xlsx", "pdf", "csv"],
  requiredPermission: "compliance.view",  // Required permission
  columns: [                    // Column definitions
    { key: "field", header: "Header", format: "date" }
  ],
  dataSource: async () => {     // Data retrieval function
    return await fetchData();
  }
});
```

#### 3.1.2 Registry Rules
- Every module MUST register its reports at load time
- Report definitions are mandatory, not optional
- No per-report generate functions in engine
- Just data + columns + metadata

### 3.2 Report Generation

#### 3.2.1 Generation Flow
1. User selects report and format
2. System checks permissions
3. Data source invoked (async)
4. Filters applied (if any)
5. Renderer selected by format
6. Output branded and returned
7. Generation logged to audit trail

#### 3.2.2 Supported Formats
| Format | Library | Features |
|---|---|---|
| XLSX | ExcelJS | Auto-width columns, branded headers, logo, KPI cards |
| PDF | pdf-lib | Diagonal watermark, branded headers, landscape for wide tables |
| CSV | Native | UTF-8 encoded, header row |

### 3.3 Filtering

#### 3.3.1 Filter Operators
| Operator | Description | Example |
|---|---|---|
| eq | Equals | `{ status: { eq: "Open" } }` |
| neq | Not equals | `{ status: { neq: "Closed" } }` |
| in | In array | `{ severity: { in: ["Critical", "High"] } }` |
| nin | Not in array | `{ status: { nin: ["Closed"] } }` |
| contains | Contains text | `{ title: { contains: "access" } }` |
| gt | Greater than | `{ riskScore: { gt: 15 } }` |
| lt | Less than | `{ riskScore: { lt: 10 } }` |
| gte | Greater than or equal | `{ riskScore: { gte: 12 } }` |
| lte | Less than or equal | `{ riskScore: { lte: 6 } }` |
| after | After date | `{ createdAt: { after: "2026-01-01" } }` |
| before | Before date | `{ createdAt: { before: "2026-12-31" } }` |

### 3.4 Branding

#### 3.4.1 Brand Configuration
```javascript
BRANDING = {
  logoPath: null,                    // Logo file path
  primaryColorHex: "#D4AF37",       // Gold
  secondaryColorHex: "#141417",     // Dark
  watermarkText: "WADJET — CONFIDENTIAL",
  footerText: "Generated by WADJET GRC Platform",
};
```

#### 3.4.2 XLSX Branding
- Logo image (top-left, optional)
- Title row (gold color, bold)
- Subtitle with generation metadata
- KPI cards for dashboard reports
- Auto-width columns
- Header row with primary color background

#### 3.4.3 PDF Branding
- Title and metadata header
- Diagonal watermark on every page
- Landscape orientation for wide tables
- Page numbers
- Confidential marking

### 3.5 Report Categories

#### 3.5.1 Compliance Reports
| Report | ID | Formats |
|---|---|---|
| Compliance Executive Summary | compliance_summary | xlsx, pdf |
| Requirements Detail Report | compliance_requirements | xlsx, pdf, csv |
| Gap Analysis Report | compliance_gaps | xlsx, pdf, csv |
| Evidence Inventory | compliance_evidence | xlsx, pdf, csv |

#### 3.5.2 Risk Reports
| Report | ID | Formats |
|---|---|---|
| Risk Register | risk_register | xlsx, pdf, csv |
| POAM Status Report | risk_poam | xlsx, pdf, csv |

#### 3.5.3 Asset Reports
| Report | ID | Formats |
|---|---|---|
| Asset Inventory Report | asset_inventory | xlsx, pdf, csv |

#### 3.5.4 Audit Reports
| Report | ID | Formats |
|---|---|---|
| Audit Findings Report | audit_findings | xlsx, pdf, csv |
| Corrective Actions Status | audit_capa_status | xlsx, pdf, csv |

#### 3.5.5 Governance Reports
| Report | ID | Formats |
|---|---|---|
| Policy Status Report | governance_policies | xlsx, pdf, csv |
| Exception Register | governance_exceptions | xlsx, pdf, csv |
| Attestation Status | governance_attestations | xlsx, pdf, csv |

#### 3.5.6 Controls Reports
| Report | ID | Formats |
|---|---|---|
| Control Effectiveness Report | controls_effectiveness | xlsx, pdf, csv |

#### 3.5.7 Platform Reports
| Report | ID | Formats |
|---|---|---|
| Platform Summary | platform_summary | xlsx, pdf |

#### 3.5.8 Context Reports
| Report | ID | Formats |
|---|---|---|
| Organization Directory | context_organizations | xlsx, pdf, csv |

---

## 4. Report Definitions

### 4.1 Report Definition Object

```javascript
{
  id: "compliance_summary",        // Unique identifier
  name: "Compliance Executive Summary",
  module: "compliance",
  description: "Overall compliance posture with KPIs",
  icon: "ShieldCheck",
  isDashboard: true,               // Dashboard-style layout
  supportedFormats: ["xlsx", "pdf"],
  requiredPermission: "compliance.view",
  columns: [
    { key: "name", header: "Framework" },
    { key: "score", header: "Score", format: "percent" }
  ],
  dataSource: async () => {
    return COMPLIANCE_FRAMEWORKS.map(f => ({
      name: f.name,
      score: calculateScore(f._id)
    }));
  }
}
```

### 4.2 Column Definition Object

```javascript
{
  key: "status",                   // Data field key
  header: "Status",                // Display header
  format: "date"                   // Optional: date, datetime, currency, percent
}
```

### 4.3 Cell Value Formats
| Format | Output |
|---|---|
| date | 23 Aug 2026 |
| datetime | 23 Aug 2026, 14:30 |
| currency | 1,234.56 |
| percent | 85% |
| (default) | String(value) |

---

## 5. Data Structures

### 5.1 Report Generation Request

```javascript
{
  reportId: "risk_register",
  format: "xlsx",
  filters: {
    status: { eq: "Open" },
    severityLevel: { in: ["Critical", "High"] }
  },
  user: {
    _id: "u-admin",
    username: "admin",
    role: "board"
  }
}
```

### 5.2 Report Generation Response (XLSX)

```javascript
{
  buffer: <Buffer ...>,            // Binary file data
  filename: "Risk_Register_2026-08-23.xlsx",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  rowCount: 12,
  meta: {
    title: "Risk Register",
    module: "risk",
    generatedAt: "2026-08-23T13:56:37.000Z",
    generatedBy: "admin",
    rowCount: 12,
    isDashboard: false
  }
}
```

### 5.3 Report Generation Response (PDF)

```javascript
{
  buffer: <Buffer ...>,            // Binary PDF data
  filename: "Risk_Register_2026-08-23.pdf",
  contentType: "application/pdf",
  rowCount: 12,
  meta: { ... }
}
```

### 5.4 Report Generation Response (CSV)

```javascript
{
  text: "Risk ID,Title,Category\nR-001,...,...\n",
  filename: "Risk_Register_2026-08-23.csv",
  contentType: "text/csv",
  rowCount: 12,
  meta: { ... }
}
```

### 5.5 Report List Item

```javascript
{
  id: "compliance_summary",
  name: "Compliance Executive Summary",
  module: "compliance",
  description: "Overall compliance posture with KPIs",
  icon: "ShieldCheck",
  supportedFormats: ["xlsx", "pdf"],
  isDashboard: true
}
```

---

## 6. User Roles & Permissions

### 6.1 Report Generation Permissions

| Role | Reports Accessible |
|---|---|
| admin | All reports (admin.all) |
| board | All reports (admin.all) |
| ciso | policy, compliance, risk, audit, controls, asset, governance, assessments, context + report.generate |
| cro | risk, governance, compliance, policy + report.generate |
| risk_owner | risk, asset + report.generate |
| analyst | compliance, risk + report.generate |
| viewer | report.generate only |

### 6.2 Role Permission Mapping

```javascript
ROLE_PERMISSIONS = {
  admin: ["admin.all"],
  board: ["admin.all"],
  ciso: ["policy.view", "compliance.view", "risk.view", "audit.view",
         "controls.view", "asset.view", "governance.view",
         "assessments.view", "context.view", "report.generate"],
  cro: ["risk.view", "governance.view", "compliance.view",
        "report.generate", "policy.view"],
  risk_owner: ["risk.view", "asset.view", "report.generate"],
  analyst: ["compliance.view", "risk.view", "report.generate"],
  viewer: ["report.generate"]
};
```

---

## 7. Workflows

### 7.1 Report Generation Workflow

```
┌─────────────────┐
│ User Selects    │
│ Report + Format │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ System Looks Up │
│ Report in       │
│ Registry        │
└────────┬────────┘
         │
         ├──── Not Found ────▶ Error 404
         │
         ▼
┌─────────────────┐
│ Permission      │
│ Check           │
└────────┬────────┘
         │
         ├──── Denied ────▶ Error 403
         │
         ▼
┌─────────────────┐
│ Invoke Data     │
│ Source          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply Filters   │
│ (if any)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Renderer │
│ (XLSX/PDF/CSV)  │
└────────┬────────┘
         │
         ├──── XLSX ────▶ ExcelJS Renderer
         │
         ├──── PDF ────▶ pdf-lib Renderer
         │
         └──── CSV ────▶ Native Renderer
         │
         ▼
┌─────────────────┐
│ Add Branding    │
│ + Watermark     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Log Generation  │
│ to Audit Trail  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return File     │
│ to User         │
└─────────────────┘
```

### 7.2 Report Registration Workflow

```
┌─────────────────┐
│ Server Startup  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Import          │
│ reportDefinitions│
│ .js             │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Each report     │
│ calls           │
│ registerReport()│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Report stored   │
│ in registry Map │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Reports         │
│ Available via   │
│ API             │
└─────────────────┘
```

---

## 8. API Endpoints

### 8.1 Report Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports` | List all available reports |
| GET | `/api/reports?module=:module` | List reports by module |
| POST | `/api/reports/:id/generate` | Generate report (returns file) |

### 8.2 Report Generation Request Body

```javascript
{
  format: "xlsx",                  // xlsx, pdf, csv
  filters: {
    status: { eq: "Open" },
    severity: { in: ["Critical", "High"] }
  }
}
```

---

## 9. Integration Points

### 9.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| All Modules | Data sources | Reports consume data from all modules |
| Governance | Audit logging | Report generation logged |
| Auth | Permission check | Role-based report access |
| All Modules | Module filter | Reports grouped by module |

### 9.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REPORTING MODULE                               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                      Report Registry                          │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │     │
│  │  │Compliance│ │  Risk   │ │  Asset  │ │  Audit  │           │     │
│  │  │ Reports │ │ Reports │ │ Reports │ │ Reports │           │     │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │     │
│  │       │           │           │           │                 │     │
│  │       └───────────┴───────────┴───────────┘                 │     │
│  │                           │                                 │     │
│  │                           ▼                                 │     │
│  │               ┌─────────────────────┐                       │     │
│  │               │   Report Engine     │                       │     │
│  │               │   (reportsEngine.js)│                       │     │
│  │               └──────────┬──────────┘                       │     │
│  └──────────────────────────┼──────────────────────────────────┘     │
│                             │                                         │
│  ┌──────────────────────────┼──────────────────────────────────┐     │
│  │                          ▼                                   │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │     │
│  │  │   XLSX   │  │   PDF    │  │   CSV    │  │  Audit   │    │     │
│  │  │  Output  │  │  Output  │  │  Output  │  │  Log     │    │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Edge Cases & Error Handling

### 10.1 Report Generation Edge Cases

| Edge Case | Handling |
|---|---|
| Report not found in registry | Error: "Report not found: {id}" |
| Format not supported | Error: "Format not supported for report" |
| Permission denied | Error: "Access denied: missing permission" |
| Data source throws error | Caught and returned as 500 |
| No data (empty result) | Returns report with headers only |
| Filter on invalid field | Silently ignored |
| Large dataset (>10k rows) | Streaming for CSV, buffer for XLSX/PDF |

### 10.2 XLSX Rendering Edge Cases

| Edge Case | Handling |
|---|---|
| Logo file not found | Optional, skipped gracefully |
| Sheet name > 31 chars | Truncated to 31 characters |
| Very wide tables | Auto-width columns |
| Empty data | Headers still rendered |

### 10.3 PDF Rendering Edge Cases

| Edge Case | Handling |
|---|---|
| No data | Empty table with headers |
| Multi-page data | Automatic page breaks |
| Wide tables | Landscape orientation |

---

## 11. Security Considerations

### 11.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced per report
- `admin.all` permission grants access to all reports
- Permission check before data source invocation

### 11.2 Audit Trail
- Every report generation logged to GOVERNANCE_AUDIT_LOG
- Log includes: report ID, format, row count, user, timestamp
- Supports compliance auditing of report access

### 11.3 Data Protection
- "WADJET — CONFIDENTIAL" watermark on all PDF exports
- Report access scoped to user permissions
- No cross-module data leakage

---

*End of Reporting Module Technical Documentation*
