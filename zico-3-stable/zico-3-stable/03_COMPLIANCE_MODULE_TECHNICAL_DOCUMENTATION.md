# WADJET GRC — Compliance Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Compliance  
**Last Updated:** 2026-08-23  
**Author:** WADJET GRC Engineering Team  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Functionalities](#3-functionalities)
4. [Data Structures](#4-data-structures)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Workflows](#6-workflows)
7. [API Endpoints](#7-api-endpoints)
8. [Integration Points](#8-integration-points)
9. [Edge Cases & Error Handling](#9-edge-cases--error-handling)
10. [Security Considerations](#10-security-considerations)

---

## 1. Module Overview

The Compliance Module is the regulatory compliance management engine of the WADJET GRC platform. It provides comprehensive framework management, requirement tracking, compliance assessments, gap analysis, evidence management, remediation planning, and crosswalk capabilities. The module enables organizations to map their compliance posture against multiple regulatory frameworks simultaneously and track remediation progress.

### 1.1 Scope

| Capability | Description |
|---|---|
| Framework Management | Define and manage compliance frameworks (ISO, PCI DSS, NIST, etc.) |
| Requirement Tracking | Track individual requirements within frameworks |
| Compliance Assessments | Assess requirement compliance status |
| Gap Analysis | Identify and track compliance gaps |
| Evidence Management | Collect and verify compliance evidence |
| Remediation Planning | Plan and track remediation activities |
| Crosswalks | Map requirements across frameworks |
| Audit Findings | Track findings from compliance audits |
| Compliance Dashboard | Real-time compliance posture visualization |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | compliance-data.js (compliance domain data) |
| Frontend | React (JSX/TSX) with React Router, TanStack Query |
| UI Components | Radix UI, shadcn/ui, Lucide icons, Recharts |
| Export | ExcelJS, pdf-lib (via reports engine) |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       COMPLIANCE MODULE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │   │
│  │  │  Compliance  │ │  Frameworks  │ │  Requirements          │  │   │
│  │  │  Dashboard   │ │  Page        │ │  Page                  │  │   │
│  │  └──────┬───────┘ └──────┬───────┘ └───────────┬────────────┘  │   │
│  │  ┌──────┴───────┐ ┌──────┴───────┐ ┌───────────┴────────────┐  │   │
│  │  │ Assessments  │ │    Gaps      │ │  Evidence              │  │   │
│  │  │ Page         │ │  Page        │ │  Page                  │  │   │
│  │  └──────┬───────┘ └──────┬───────┘ └───────────┬────────────┘  │   │
│  │  ┌──────┴───────┐ ┌──────┴───────┐ ┌───────────┴────────────┐  │   │
│  │  │ Remediation  │ │  Crosswalks  │ │  Audit Findings        │  │   │
│  │  │ Page         │ │  Page        │ │  Page                  │  │   │
│  │  └──────┬───────┘ └──────┬───────┘ └───────────┬────────────┘  │   │
│  └─────────┼────────────────┼──────────────────────┼──────────────┘   │
│            │                │                      │                   │
│  ┌─────────┼────────────────┼──────────────────────┼──────────────┐   │
│  │         ▼                ▼                      ▼              │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              API Layer (mock-server.mjs)                 │  │   │
│  │  │  /api/frameworks  /api/compliance/*  /api/audit/*       │  │   │
│  │  └─────────────────────────┬───────────────────────────────┘  │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │           Data Layer (compliance-data.js)                │  │   │
│  │  │                                                         │  │   │
│  │  │  COMPLIANCE_FRAMEWORKS[]  COMPLIANCE_REQUIREMENTS[]     │  │   │
│  │  │  COMPLIANCE_GAPS[]        COMPLIANCE_EVIDENCE[]         │  │   │
│  │  │  COMPLIANCE_REMEDIATION[] COMPLIANCE_FINDINGS[]         │  │   │
│  │  │  COMPLIANCE_CONTROLS[]    COMPLIANCE_POLICIES[]         │  │   │
│  │  │  COMPLIANCE_RISKS[]       COMPLIANCE_ASSETS[]           │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model Relationships

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Framework   │────▶│   Requirement    │────▶│   Assessment    │
│              │ 1:N │                  │ 1:N │                 │
│ - code       │     │ - code           │     │ - status        │
│ - name       │     │ - title          │     │ - assessor      │
│ - type       │     │ - frameworkId    │     │ - date          │
│ - version    │     │ - category       │     │ - comments      │
│ - issuer     │     │ - status         │     │ - findings      │
│ - status     │     │ - mappedControls │     │ - controlEffect │
└──────┬───────┘     └────────┬─────────┘     └─────────────────┘
       │                      │
       │                      ├──────────────────────────────┐
       │                      │                              │
       │                      ▼                              ▼
       │               ┌──────────────┐              ┌──────────────┐
       │               │    Gap       │              │   Evidence   │
       │               │              │              │              │
       │               │ - code       │              │ - code       │
       │               │ - severity   │              │ - name       │
       │               │ - status     │              │ - type       │
       │               │ - owner      │              │ - status     │
       │               │ - dueDate    │              │ - owner      │
       │               └──────┬───────┘              │ - uploadDate │
       │                      │                       │ - verification│
       │                      ▼                       └──────────────┘
       │               ┌──────────────┐
       └──────────────▶│  Remediation │
                       │              │
                       │ - code       │
                       │ - gapId      │
                       │ - priority   │
                       │ - status     │
                       │ - progress   │
                       └──────────────┘
```

---

## 3. Functionalities

### 3.1 Framework Management

#### 3.1.1 Framework Definition
- Create compliance frameworks with code, name, type, version, issuer
- Framework types: Standard, Regulation, Internal Policy Baseline
- Framework status: Active, Draft, Archived
- Effective date tracking
- Description and scope documentation

#### 3.1.2 Supported Framework Types
| Type | Examples |
|---|---|
| Standard | ISO 27001, NIST CSF, COBIT |
| Regulation | GDPR, PCI DSS, SOX, Basel III |
| Internal Policy Baseline | Internal Security Policies, Vendor Requirements |

### 3.2 Requirement Management

#### 3.2.1 Requirement Definition
- Requirements linked to parent frameworks
- Unique code per requirement
- Title and description
- Category classification
- Applicability: Applicable, Not Applicable
- Status: NotAssessed, Compliant, PartiallyCompliant, NonCompliant

#### 3.2.2 Requirement Mappings
- Control mappings (JSON array of control IDs)
- Policy mappings (JSON array of policy IDs)
- Risk mappings (JSON array of risk IDs)
- Asset mappings (JSON array of asset IDs)

### 3.3 Compliance Assessments

#### 3.3.1 Assessment Creation
- Link assessment to requirement
- Set compliance status
- Assign assessor
- Record assessment date
- Document comments and findings
- Evaluate control effectiveness

#### 3.3.2 Assessment Status Values
| Status | Description |
|---|---|
| Compliant | Fully meets requirement |
| Partially Compliant | Meets some aspects |
| Non-Compliant | Does not meet requirement |
| Not Assessed | No assessment performed |
| Not Applicable | Requirement not applicable |

#### 3.3.3 Control Effectiveness in Assessments
| Rating | Description |
|---|---|
| Effective | Control operates as designed |
| Partially Effective | Control has gaps |
| Not Effective | Control fails to meet objective |
| Not Assessed | Control not yet evaluated |

### 3.4 Gap Analysis

#### 3.4.1 Gap Identification
- Link gap to requirement and framework
- Describe current state vs expected state
- Assign severity: Critical, High, Medium, Low
- Set owner and due date
- Track related risks and controls

#### 3.4.2 Gap Status Values
| Status | Description |
|---|---|
| Open | Gap identified, not yet addressed |
| In Progress | Remediation underway |
| Resolved | Gap addressed, pending verification |
| Accepted | Risk accepted, no remediation planned |
| Closed | Gap verified as resolved |

### 3.5 Evidence Management

#### 3.5.1 Evidence Collection
- Link evidence to requirements
- Evidence types: Document, Screenshot, LogExport, Policy, Ticket, Attestation
- Owner assignment
- Upload date tracking
- Expiration date support

#### 3.5.2 Evidence Status Values
| Status | Description |
|---|---|
| Missing | No evidence provided |
| Requested | Evidence requested from owner |
| Submitted | Evidence uploaded, pending review |
| Under Review | Evidence being reviewed |
| Approved | Evidence accepted |
| Rejected | Evidence insufficient |
| Expired | Evidence past validity date |

#### 3.5.3 Evidence Verification
- Verification status: Verified, Pending
- Reviewer assignment
- Reviewer comments
- Approval workflow

### 3.6 Remediation Management

#### 3.6.1 Remediation Planning
- Link remediation to gap and requirement
- Priority: Critical, High, Medium, Low
- Owner assignment
- Due date tracking
- Progress percentage (0-100)

#### 3.6.2 Remediation Status Values
| Status | Description |
|---|---|
| Open | Remediation planned |
| In Progress | Work underway |
| Blocked | Impediments encountered |
| Completed | Work finished |
| Cancelled | No longer required |

### 3.7 Crosswalks

- Map requirements across different frameworks
- Identify overlapping requirements
- Reduce duplicate assessment effort
- Support multi-framework compliance

### 3.8 Audit Findings

- Link findings to requirements
- Track finding severity
- Assign corrective actions
- Monitor resolution status

### 3.9 Compliance Dashboard

- Framework compliance scores (percentage)
- Requirement status distribution
- Gap severity breakdown
- Evidence status summary
- Remediation progress tracking
- Overdue items highlighting

---

## 4. Data Structures

### 4.1 Framework Object

```javascript
{
  _id: "cfw-1",
  code: "ISO-27001",
  name: "ISO/IEC 27001:2022",
  type: "Standard",
  version: "2022",
  issuer: "ISO",
  effectiveDate: "2022-10-25T00:00:00Z",
  description: "Information security management systems",
  status: "Active",                 // Active, Draft, Archived
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-06-01T00:00:00Z",
}
```

### 4.2 Requirement Object

```javascript
{
  _id: "creq-1",
  code: "A.8.1",
  title: "User endpoint devices",
  description: "Assets owned by the organization shall be inventoried...",
  frameworkId: "cfw-1",
  category: "Asset Management",
  applicability: "Applicable",      // Applicable, Not Applicable
  status: "Compliant",              // NotAssessed, Compliant, PartiallyCompliant, NonCompliant
  criticality: "High",              // Critical, High, Medium, Low
  owner: "IT Security Team",
  mappedControls: ["ctrl-1", "ctrl-2"],
  relatedPolicies: ["pol-1"],
  relatedRisks: ["risk-1"],
  relatedAssets: ["a-1"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-06-01T00:00:00Z",
}
```

### 4.3 Assessment Object

```javascript
{
  _id: "ca-1",
  code: "ASM-001",
  requirementId: "creq-1",
  status: "Compliant",
  assessor: "u-auditor",
  date: "2026-08-01T00:00:00Z",
  comments: "All endpoint devices are inventoried and tracked.",
  findings: "No significant findings.",
  evidenceIds: ["ev-1", "ev-2"],
  controlEffectiveness: "Effective",
  reviewer: "u-manager",
  reviewStatus: "Reviewed",         // PendingReview, Reviewed
  createdAt: "2026-08-01T00:00:00Z",
}
```

### 4.4 Gap Object

```javascript
{
  _id: "cg-1",
  code: "GAP-001",
  requirementId: "creq-1",
  frameworkId: "cfw-1",
  description: "Missing inventory for cloud instances",
  currentState: "Partial inventory maintained",
  expectedState: "Complete inventory of all assets",
  severity: "High",                 // Critical, High, Medium, Low
  owner: "Cloud Team Lead",
  dueDate: "2026-10-01T00:00:00Z",
  status: "Open",                   // Open, InProgress, Resolved, Accepted, Closed
  relatedRiskId: "risk-3",
  relatedControlId: "ctrl-5",
  remediationPlan: "Implement cloud asset discovery tool",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-15T00:00:00Z",
}
```

### 4.5 Evidence Object

```javascript
{
  _id: "ev-1",
  code: "EVD-001",
  name: "Asset Inventory Report Q3 2026",
  requirementId: "creq-1",
  controlId: "ctrl-1",
  type: "Document",                 // Document, Screenshot, LogExport, Policy, Ticket, Attestation
  owner: "IT Security Team",
  uploadDate: "2026-08-01T00:00:00Z",
  expirationDate: "2027-08-01T00:00:00Z",
  status: "Approved",               // Missing, Requested, Submitted, UnderReview, Approved, Rejected, Expired
  verificationStatus: "Verified",   // Verified, Pending
  reviewer: "u-manager",
  comments: "Complete and accurate inventory.",
  createdAt: "2026-08-01T00:00:00Z",
}
```

### 4.6 Remediation Object

```javascript
{
  _id: "cr-1",
  code: "REM-001",
  gapId: "cg-1",
  requirementId: "creq-1",
  description: "Deploy cloud asset discovery tool",
  owner: "Cloud Team Lead",
  priority: "High",                 // Critical, High, Medium, Low
  dueDate: "2026-10-01T00:00:00Z",
  status: "InProgress",             // Open, InProgress, Blocked, Completed, Cancelled
  progress: 45,                     // 0-100
  relatedRiskId: "risk-3",
  relatedControlId: "ctrl-5",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-20T00:00:00Z",
}
```

### 4.7 Finding Object

```javascript
{
  _id: "cf-1",
  code: "FND-001",
  auditId: "audit-1",
  requirementId: "creq-1",
  finding: "Asset inventory does not include cloud instances",
  severity: "High",
  evidenceId: "ev-3",
  auditor: "u-auditor",
  status: "Open",                   // Open, InProgress, Resolved, Closed
  correctiveAction: "Implement cloud asset discovery",
  dueDate: "2026-10-01T00:00:00Z",
  createdAt: "2026-08-01T00:00:00Z",
}
```

### 4.8 Crosswalk Object

```javascript
{
  _id: "cw-1",
  sourceFrameworkId: "cfw-1",
  sourceRequirementId: "creq-1",
  targetFrameworkId: "cfw-2",
  targetRequirementId: "creq-5",
  mappingType: "Equivalent",        // Equivalent, Partial, Related
  description: "Both require asset inventory",
  createdAt: "2026-01-01T00:00:00Z",
}
```

### 4.9 Campaign Object

```javascript
{
  _id: "camp-1",
  name: "ISO 27001 Annual Assessment",
  frameworkId: "cfw-1",
  startDate: "2026-07-01T00:00:00Z",
  endDate: "2026-09-30T00:00:00Z",
  status: "Active",                 // Planned, Active, Completed, Cancelled
  owner: "Compliance Manager",
  description: "Annual ISO 27001 compliance assessment",
  createdAt: "2026-06-01T00:00:00Z",
}
```

---

## 5. User Roles & Permissions

### 5.1 Compliance Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| compliance.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| compliance.assess | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| compliance.manage_frameworks | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| compliance.manage_gaps | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| compliance.manage_evidence | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| compliance.manage_remediation | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| compliance.approve_evidence | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| compliance.manage_crosswalks | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 5.2 Report Permissions (Compliance)

| Role | Report Generation |
|---|---|
| admin | All compliance reports |
| board | All compliance reports |
| ciso | compliance.view + report.generate |
| cro | compliance.view + report.generate |
| risk_owner | Limited (no compliance reports) |
| analyst | compliance.view + report.generate |
| viewer | report.generate only |

---

## 6. Workflows

### 6.1 Compliance Assessment Workflow

```
┌─────────────────┐
│ Framework       │
│ Definition      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Requirement     │
│ Mapping         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Evidence        │
│ Collection      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assessment      │
│ Execution       │
├─────────────────┤
│ • Evaluate      │
│   compliance    │
│ • Rate controls │
│ • Document      │
│   findings      │
└────────┬────────┘
         │
         ├──── Compliant ────▶ Close Assessment
         │
         ├──── Partially Compliant ────▶ Create Gap + Remediation Plan
         │
         └──── Non-Compliant ────▶ Create Gap + Remediation Plan
```

### 6.2 Gap Remediation Workflow

```
┌─────────────────┐
│ Gap Identified  │
│ (Open)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Remediation     │
│ Plan Created    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Remediation     │
│ In Progress     │
└────────┬────────┘
         │
         ├──── Completed ────▶ Gap Resolved
         │
         └──── Blocked ────▶ Escalate
         │
         ▼
┌─────────────────┐
│ Verification    │
│ & Closure       │
└────────┬────────┘
         │
         ├──── Verified ────▶ Gap Closed
         │
         └──── Not Verified ────▶ Return to In Progress
```

### 6.3 Evidence Lifecycle Workflow

```
┌─────────────────┐
│ Evidence        │
│ Requested       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Evidence        │
│ Submitted       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Under Review    │
└────────┬────────┘
         │
         ├──── Approved ────▶ Evidence Approved
         │
         └──── Rejected ────▶ Return to Requested
         │
         ▼
┌─────────────────┐
│ Evidence        │
│ Approved        │
└────────┬────────┘
         │
         │ (time-based)
         ▼
┌─────────────────┐
│ Evidence        │
│ Expired         │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Framework Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/frameworks` | List all frameworks |
| GET | `/api/frameworks/:id` | Get framework with requirements |
| POST | `/api/frameworks` | Create framework |
| PUT | `/api/frameworks/:id` | Update framework |
| DELETE | `/api/frameworks/:id` | Delete framework |

### 7.2 Requirement Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/requirements` | List requirements |
| GET | `/api/compliance/requirements/:id` | Get requirement detail |
| POST | `/api/compliance/requirements` | Create requirement |
| PUT | `/api/compliance/requirements/:id` | Update requirement |

### 7.3 Assessment Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assessments` | List assessments |
| POST | `/api/assessments` | Create assessment |
| PUT | `/api/assessments/:id` | Update assessment |

### 7.4 Gap Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/gaps` | List gaps |
| POST | `/api/compliance/gaps` | Create gap |
| PUT | `/api/compliance/gaps/:id` | Update gap |

### 7.5 Evidence Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/evidence` | List evidence |
| POST | `/api/compliance/evidence` | Upload evidence |
| PUT | `/api/compliance/evidence/:id` | Update evidence status |

### 7.6 Remediation Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/remediation` | List remediation items |
| POST | `/api/compliance/remediation` | Create remediation |
| PUT | `/api/compliance/remediation/:id` | Update remediation |

### 7.7 Crosswalk Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/crosswalks` | List crosswalks |
| POST | `/api/compliance/crosswalks` | Create crosswalk mapping |

### 7.8 Campaign Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/compliance/campaigns` | List campaigns |
| POST | `/api/compliance/campaigns` | Create campaign |

### 7.9 Audit Finding Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit-findings` | List audit findings |
| POST | `/api/audit-findings` | Create finding |
| PUT | `/api/audit-findings/:id` | Update finding |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Controls | Requirement-Control mapping | Controls evidence compliance |
| Risks | Requirement-Risk mapping | Risks linked to requirements |
| Policies | Requirement-Policy mapping | Policies evidence compliance |
| Audit | Finding-Requirement mapping | Audit findings create gaps |
| Governance | Framework-Policy mapping | Policies implement frameworks |
| Assets | Requirement-Asset mapping | Assets subject to requirements |
| Reporting | Compliance reports | Report engine consumes compliance data |
| AI Module | Compliance insights | AI analyzes compliance posture |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLIANCE MODULE                              │
│                                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │Framework│───▶│Require- │───▶│Assess-  │───▶│  Gap    │              │
│  │         │    │  ment   │    │  ment   │    │Analysis │              │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘              │
│       │              │              │              │                    │
│       │              │              │              ▼                    │
│       │              │              │       ┌─────────────┐            │
│       │              │              │       │ Remediation │            │
│       │              │              │       │   Planning  │            │
│       │              │              │       └──────┬──────┘            │
│       │              │              │              │                    │
│       │              ▼              │              │                    │
│       │       ┌─────────────┐       │              │                    │
│       │       │  Evidence   │       │              │                    │
│       │       │ Collection  │       │              │                    │
│       │       └──────┬──────┘       │              │                    │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    Compliance Dashboard                      │       │
│  └─────────────────────────────────────────────────────────────┘       │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │Controls │    │  Risks  │    │Reporting│    │   AI    │              │
│  │ Module  │    │ Module  │    │ Module  │    │ Module  │              │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Assessment Edge Cases

| Edge Case | Handling |
|---|---|
| Assessing already-compliant requirement | Allowed (re-assessment) |
| No evidence for compliant assessment | Warning (best practice) |
| Assessor = Evidence owner | Allowed (but flagged) |
| Assessment date in future | Rejected with 400 |

### 9.2 Gap Edge Cases

| Edge Case | Handling |
|---|---|
| Gap without remediation plan | Allowed (accepted status) |
| Closing unresolved gap | Requires acceptance justification |
| Duplicate gaps for same requirement | Allowed (different aspects) |
| Gap with no owner | Validation error |

### 9.3 Evidence Edge Cases

| Edge Case | Handling |
|---|---|
| Expired evidence | Status auto-set to Expired |
| Re-uploading rejected evidence | Creates new evidence record |
| Evidence for non-applicable requirement | Allowed (but flagged) |
| Multiple evidence for same requirement | Allowed |

### 9.4 Crosswalk Edge Cases

| Edge Case | Handling |
|---|---|
| Circular crosswalk mapping | Not prevented (business rule) |
| Crosswalk to archived framework | Allowed |
| Duplicate crosswalk | Prevented (unique constraint) |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Evidence approval restricted to authorized roles
- Framework management restricted to admins

### 10.2 Data Integrity
- Assessment history preserved
- Gap status changes audited
- Evidence verification tracked
- Crosswalk mappings versioned

### 10.3 Evidence Security
- File type validation
- Size limits enforced
- Expiration tracking
- Verification workflow

---

*End of Compliance Module Technical Documentation*
