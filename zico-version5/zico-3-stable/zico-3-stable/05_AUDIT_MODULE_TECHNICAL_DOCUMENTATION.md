# WADJET GRC — Audit Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Audit Management  
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

The Audit Module provides comprehensive audit management capabilities for planning, executing, reporting, and tracking audits within the WADJET GRC platform. It supports the full audit lifecycle from planning through execution, findings management, corrective action tracking, and reporting.

### 1.1 Scope

| Capability | Description |
|---|---|
| Audit Planning | Define audit plans with objectives, scope, and team |
| Audit Execution | Execute audits with checklists and evidence collection |
| Findings Management | Record, classify, and track audit findings |
| Corrective Actions | Track corrective and preventive actions (CAPA) |
| Evidence Management | Request and track audit evidence |
| Audit Reporting | Generate audit reports with results |
| Audit Universe | Maintain audit universe with risk-based prioritization |
| Procedures | Define and track audit procedures |
| History Tracking | Complete audit trail of all audit activities |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | mock-data.mjs (AUDIT_ENGAGEMENTS, AUDIT_UNIVERSE, AUDIT_PROCEDURES, AUDIT_FINDINGS, AUDIT_CAPAS, AUDIT_REPORTS) |
| Frontend | React (TSX) with React Router, TanStack Query |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUDIT MODULE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │  AuditModule     │  │  (Tab-based      │                     │   │
│  │  │  (Main Page)     │  │   Navigation)    │                     │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                     │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                   │
│  ┌───────────┼──────────────────────┼───────────────────────────────┐   │
│  │           ▼                      ▼                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              API Layer (mock-server.mjs)                 │   │   │
│  │  │  /api/audit/engagements  /api/audit/universe             │   │   │
│  │  │  /api/audit/procedures   /api/audit/findings             │   │   │
│  │  │  /api/audit/capas        /api/audit/reports              │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              Data Layer (mock-data.mjs)                  │  │   │
│  │  │  AUDIT_ENGAGEMENTS[]  AUDIT_UNIVERSE[]                  │  │   │
│  │  │  AUDIT_PROCEDURES[]   AUDIT_FINDINGS[]                  │  │   │
│  │  │  AUDIT_CAPAS[]        AUDIT_REPORTS[]                   │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model Relationships

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ AuditEngagement │────▶│   Audit          │────▶│    Finding      │
│                 │ 1:N │                  │ 1:N │                 │
│ - name          │     │ - auditCode      │     │ - findingCode   │
│ - type          │     │ - name           │     │ - description   │
│ - status        │     │ - status         │     │ - severity      │
│ - owner         │     │ - overallResult  │     │ - status        │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                                 │                        ▼
                                 │               ┌─────────────────┐
                                 │               │ CorrectiveAction│
                                 │               │                 │
                                 │               │ - actionCode    │
                                 │               │ - description   │
                                 │               │ - status        │
                                 │               │ - priority      │
                                 │               └─────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ AuditProcedure   │
                        │                  │
                        │ - procedureCode  │
                        │ - description    │
                        │ - result         │
                        └──────────────────┘
```

---

## 3. Functionalities

### 3.1 Audit Planning

#### 3.1.1 Audit Engagement Creation
- Define audit engagement with name, type, objective
- Assign owner and lead auditor
- Set audit team members
- Define auditee and department
- Link to framework
- Set start and end dates
- Set priority level

#### 3.1.2 Audit Types
| Type | Description |
|---|---|
| Regular | Planned periodic audit |
| Follow-up | Verification of previous findings |
| Special | Ad-hoc or triggered audit |
| External | Third-party audit |

#### 3.1.3 Audit Status Values
| Status | Description |
|---|---|
| Planned | Audit scheduled, not started |
| In Progress | Audit execution underway |
| Completed | Audit execution finished |
| Reported | Audit report issued |
| Closed | All actions completed |

### 3.2 Audit Universe

- Maintain comprehensive audit universe
- Risk-based audit prioritization
- Audit frequency tracking
- Last audit date recording
- Next audit due calculation

### 3.3 Audit Procedures

- Define audit procedures for each engagement
- Link procedures to requirements and controls
- Record test objectives and test procedures
- Track execution results
- Document findings from procedures

### 3.4 Findings Management

#### 3.4.1 Finding Creation
- Record finding with description
- Classify severity: Critical, High, Medium, Low
- Identify root cause
- Assess impact
- Link to risk
- Assign owner and due date
- Provide recommendation

#### 3.4.2 Finding Status Values
| Status | Description |
|---|---|
| Open | Finding identified, not yet addressed |
| In Progress | Corrective action underway |
| Resolved | Action implemented, pending verification |
| Closed | Verified as resolved |
| Accepted | Risk accepted, no action planned |

### 3.5 Corrective Actions (CAPA)

#### 3.5.1 Corrective Action Creation
- Link to finding
- Describe corrective action
- Assign owner
- Set priority: Critical, High, Medium, Low
- Set due date
- Track progress percentage

#### 3.5.2 Corrective Action Status Values
| Status | Description |
|---|---|
| Open | Action planned |
| In Progress | Implementation underway |
| Completed | Action implemented |
| Verified | Implementation verified |
| Overdue | Past due date |

### 3.6 Evidence Management

- Request evidence from auditees
- Track evidence submission
- Link evidence to findings
- Evidence status tracking

### 3.7 Audit Reporting

- Generate audit reports
- Overall result: Satisfactory, Needs Improvement, Unsatisfactory
- Finding summary
- Corrective action status
- Management response

### 3.8 Audit Dashboard

- Audit plan vs. actual progress
- Finding severity distribution
- Corrective action status
- Overdue items
- Audit coverage metrics

---

## 4. Data Structures

### 4.1 Audit Engagement Object

```javascript
{
  _id: "ae-1",
  name: "Information Security Audit 2026",
  type: "Regular",                 // Regular, Follow-up, Special, External
  objective: "Assess IS controls",
  description: "Annual information security audit",
  owner: "Head of Audit",
  leadAuditor: "Audrey Tor",
  team: ["Auditor 1", "Auditor 2"],
  auditee: "IT Operations",
  department: "Information Technology",
  frameworkId: "fw-1",
  startDate: "2026-09-01T00:00:00Z",
  endDate: "2026-09-30T00:00:00Z",
  status: "Planned",               // Planned, In Progress, Completed, Reported, Closed
  priority: "High",                // Critical, High, Medium, Low
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
}
```

### 4.2 Audit Universe Object

```javascript
{
  _id: "au-1",
  name: "Core Banking System Audit",
  type: "Application",
  auditee: "IT Operations",
  department: "Information Technology",
  riskLevel: "Critical",
  lastAuditDate: "2025-09-01T00:00:00Z",
  nextAuditDue: "2026-09-01T00:00:00Z",
  auditFrequency: "Annual",       // Annual, Semi-Annual, Quarterly
  status: "Due",                   // Due, Scheduled, Completed, Overdue
  createdAt: "2025-01-01T00:00:00Z",
}
```

### 4.3 Audit Procedure Object

```javascript
{
  _id: "ap-1",
  engagementId: "ae-1",
  procedureCode: "PROC-001",
  description: "Verify access control configuration",
  requirementId: "creq-1",
  controlId: "ctrl-1",
  testObjective: "Confirm access controls are properly configured",
  testProcedure: "Review access control lists and user permissions",
  expectedResult: "All access controls documented and approved",
  actualResult: "Some undocumented admin accounts found",
  result: "Fail",                  // Pass, Fail, Partial, Not Tested
  findingId: "af-1",
  executedBy: "Audrey Tor",
  executedAt: "2026-09-15T14:00:00Z",
  createdAt: "2026-09-01T00:00:00Z",
}
```

### 4.4 Audit Finding Object

```javascript
{
  _id: "af-1",
  findingCode: "FND-001",
  engagementId: "ae-1",
  procedureId: "ap-1",
  description: "Undocumented admin accounts found on Core Banking System",
  rootCause: "Lack of periodic access review",
  impact: "Unauthorized access to critical financial data",
  riskId: "risk-1",
  severity: "High",                // Critical, High, Medium, Low
  recommendation: "Implement quarterly access reviews",
  owner: "Head of IT Security",
  dueDate: "2026-10-15T00:00:00Z",
  status: "Open",                  // Open, In Progress, Resolved, Closed, Accepted
  createdAt: "2026-09-15T00:00:00Z",
  updatedAt: "2026-09-15T00:00:00Z",
}
```

### 4.5 Corrective Action Object

```javascript
{
  _id: "aca-1",
  actionCode: "CAPA-001",
  findingId: "af-1",
  engagementId: "ae-1",
  description: "Remove undocumented accounts and implement access review process",
  owner: "Head of IT Security",
  priority: "High",                // Critical, High, Medium, Low
  dueDate: "2026-10-15T00:00:00Z",
  status: "Open",                  // Open, In Progress, Completed, Verified, Overdue
  progress: 0,                     // 0-100
  completionDate: null,
  verification: "",
  reviewerComments: "",
  createdAt: "2026-09-15T00:00:00Z",
  updatedAt: "2026-09-15T00:00:00Z",
}
```

### 4.6 Audit Report Object

```javascript
{
  _id: "ar-1",
  engagementId: "ae-1",
  reportCode: "RPT-001",
  title: "Information Security Audit Report 2026",
  executiveSummary: "The audit identified several control weaknesses...",
  overallResult: "Needs Improvement", // Satisfactory, Needs Improvement, Unsatisfactory
  findingCount: 5,
  criticalFindings: 0,
  highFindings: 2,
  mediumFindings: 2,
  lowFindings: 1,
  issuedDate: "2026-10-01T00:00:00Z",
  issuedBy: "Head of Audit",
  status: "Draft",                 // Draft, Final, Issued
  createdAt: "2026-10-01T00:00:00Z",
}
```

---

## 5. User Roles & Permissions

### 5.1 Audit Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| audit.plan | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| audit.execute | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| audit.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| audit.manage_findings | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| audit.manage_capa | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| audit.report | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| audit.close | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 5.2 Report Permissions (Audit)

| Role | Report Generation |
|---|---|
| admin | All audit reports |
| board | All audit reports |
| ciso | audit.view + report.generate |
| cro | audit.view + report.generate |
| risk_owner | Limited audit reports |
| analyst | audit.view + report.generate |
| viewer | report.generate only |

---

## 6. Workflows

### 6.1 Audit Lifecycle Workflow

```
┌─────────────────┐
│ Audit Planning  │
│ - Define scope  │
│ - Assign team   │
│ - Set schedule  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Audit Execution │
│ - Execute       │
│   procedures    │
│ - Collect       │
│   evidence      │
│ - Document      │
│   findings      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Findings        │
│ Management      │
│ - Classify      │
│ - Assign owner  │
│ - Set due date  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Corrective      │
│ Actions         │
│ - Plan actions  │
│ - Implement     │
│ - Track progress│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verification    │
│ & Closure       │
│ - Verify action │
│ - Close finding │
│ - Issue report  │
└─────────────────┘
```

### 6.2 Finding Resolution Workflow

```
┌─────────────────┐
│ Finding Open    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Corrective      │
│ Action Assigned │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Action In       │
│ Progress        │
└────────┬────────┘
         │
         ├──── Completed ────▶ Verification
         │
         └──── Overdue ────▶ Escalation
         │
         ▼
┌─────────────────┐
│ Action Verified │
│ Finding Closed  │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Audit Engagement Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/engagements` | List audit engagements |
| GET | `/api/audit/engagements/:id` | Get engagement detail |
| POST | `/api/audit/engagements` | Create engagement |
| PUT | `/api/audit/engagements/:id` | Update engagement |
| DELETE | `/api/audit/engagements/:id` | Delete engagement |

### 7.2 Audit Universe Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/universe` | List audit universe |
| POST | `/api/audit/universe` | Add to universe |
| PUT | `/api/audit/universe/:id` | Update universe item |

### 7.3 Procedure Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/procedures?engagementId=:id` | List procedures |
| POST | `/api/audit/procedures` | Create procedure |
| PUT | `/api/audit/procedures/:id` | Update procedure |

### 7.4 Finding Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/findings?engagementId=:id` | List findings |
| POST | `/api/audit/findings` | Create finding |
| PUT | `/api/audit/findings/:id` | Update finding |

### 7.5 Corrective Action Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/capas?findingId=:id` | List corrective actions |
| POST | `/api/audit/capas` | Create corrective action |
| PUT | `/api/audit/capas/:id` | Update corrective action |

### 7.6 Report Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit/reports?engagementId=:id` | List audit reports |
| POST | `/api/audit/reports` | Generate audit report |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Finding-Risk mapping | Findings linked to risks |
| Compliance | Finding-Requirement mapping | Findings create compliance gaps |
| Controls | Procedure-Control mapping | Procedures test controls |
| Assets | Audit-Scope mapping | Audits scope assets |
| Governance | Audit-Committee mapping | Committee oversees audits |
| Reporting | Audit reports | Report engine consumes audit data |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AUDIT MODULE                                 │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │   Audit     │───▶│  Execution  │───▶│  Findings   │                │
│  │   Planning  │    │             │    │             │                │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│         │                  │                  │                        │
│         │                  │                  ▼                        │
│         │                  │           ┌─────────────┐                │
│         │                  │           │  Corrective │                │
│         │                  │           │  Actions    │                │
│         │                  │           └──────┬──────┘                │
│         │                  │                  │                        │
│         ▼                  ▼                  ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                      Audit Reporting                        │       │
│  └─────────────────────────────────────────────────────────────┘       │
│         │                  │                  │                        │
│         ▼                  ▼                  ▼                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Risk    │  │Compliance│  │ Controls │  │Reporting │              │
│  │ Module   │  │ Module   │  │ Module   │  │ Module   │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Audit Edge Cases

| Edge Case | Handling |
|---|---|
| Deleting engagement with findings | Prevented (foreign key constraint) |
| Closing audit with open findings | Warning issued |
| Audit with no team members | Allowed (incomplete) |
| End date before start date | Validation error |
| Duplicate audit code | Auto-generated, no collision |

### 9.2 Finding Edge Cases

| Edge Case | Handling |
|---|---|
| Finding with no owner | Validation error |
| Closing finding without corrective action | Requires acceptance justification |
| Finding linked to archived risk | Allowed (historical reference) |
| Duplicate finding code | Auto-generated, no collision |

### 9.3 Corrective Action Edge Cases

| Edge Case | Handling |
|---|---|
| Action with no due date | Allowed (but flagged) |
| Marking action complete without verification | Status = Completed (not Verified) |
| Overdue action | Status auto-set to Overdue |
| Action for closed finding | Allowed (additional improvement) |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Audit execution restricted to auditors
- Finding management restricted to authorized roles

### 10.2 Audit Trail
- All audit activities logged
- Finding status changes tracked
- Corrective action progress recorded
- Immutable history

### 10.3 Segregation of Duties
- Auditor cannot approve own findings
- Audit manager reviews all findings
- Corrective action verification by independent party

---

*End of Audit Module Technical Documentation*
