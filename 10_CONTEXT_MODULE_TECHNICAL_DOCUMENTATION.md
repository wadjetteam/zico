# WADJET GRC — Context Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Context Management  
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

The Context Module provides the foundational organizational and structural context for the entire WADJET GRC platform. It defines the organizational hierarchy, risk domains, scoring parameters, and asset groups that all other modules reference. The Context Module is the configuration backbone that ensures consistent risk methodology, organizational alignment, and domain-specific governance across the platform.

### 1.1 Scope

| Capability | Description |
|---|---|
| Organization Management | Define organizational hierarchy (parent/subsidiary) |
| Domain Management | Define risk domains with methodology configuration |
| Parameter Management | Configure scoring parameters per domain |
| Group Management | Define organizational groups with members |
| Organizational Detail | Comprehensive organizational information |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | mock-data.mjs (ORGANIZATIONS, DOMAINS, PARAMETERS, GROUPS) |
| Frontend | React (JSX) with React Router, TanStack Query |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT MODULE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │Organizations │  │   Domains    │  │    Parameters        │  │   │
│  │  │Page          │  │   Page       │  │    Page              │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │   │
│  │  ┌──────┴───────┐  ┌──────┴───────┐             │              │   │
│  │  │Organization  │  │   Groups     │             │              │   │
│  │  │Detail        │  │   Page       │             │              │   │
│  │  └──────────────┘  └──────────────┘             │              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              API Layer (mock-server.mjs)                         │   │
│  │  /api/organizations  /api/domains  /api/parameters  /api/groups │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Data Layer (mock-data.mjs)                          │   │
│  │  ORGANIZATIONS[]  DOMAINS[]  PARAMETERS[]  GROUPS[]             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model Relationships

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Organization   │────▶│     Domain       │────▶│   Parameter     │
│                 │ 1:N │                  │ 1:1 │                 │
│ - orgId         │     │ - name           │     │ - criteria      │
│ - name          │     │ - status         │     │ - thresholds    │
│ - type          │     │ - scoringMethod  │     │ - appetiteLimit │
│ - region        │     │ - escalationMatrix│    │ - toleranceLimit│
│ - status        │     │ - description    │     │ - residualMethod│
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│     Group       │
│                 │
│ - name          │
│ - description   │
│ - members       │
│ - status        │
└─────────────────┘
```

---

## 3. Functionalities

### 3.1 Organization Management

#### 3.1.1 Organization Definition
- Define organizations with code, name, type
- Support parent/subsidiary hierarchy
- Track region and industry
- Manage operational status

#### 3.1.2 Organization Types
| Type | Description |
|---|---|
| parent | Top-level holding entity |
| subsidiary | Child organization under parent |
| division | Internal division |
| department | Organizational department |

#### 3.1.3 Organization Hierarchy
- Parent organizations can have multiple subsidiaries
- Subsidiaries reference parent organization
- Recursive hierarchy support (subsidiary of subsidiary)
- Organization detail view with all related entities

### 3.2 Domain Management

#### 3.2.1 Domain Definition
- Define risk domains (Information Security, Operational, Compliance, etc.)
- Configure scoring method per domain
- Define escalation matrix per severity level
- Set domain status (active/inactive)

#### 3.2.2 Scoring Methods
| Method | Description |
|---|---|
| advanced | Weighted impact with full parameter configuration |
| max | Maximum impact scoring |

#### 3.2.3 Escalation Matrix
```
{
  Low: "Risk Owner",
  Medium: "Risk Owner + CISO",
  High: "CISO + CRO",
  Critical: "Board of Directors via Enterprise Risk Register"
}
```

### 3.3 Parameter Management

#### 3.3.1 Parameter Configuration
- Each domain has one active parameter configuration
- Parameters define the complete risk methodology
- Version tracking for methodology changes
- Criteria weights and thresholds

#### 3.3.2 Parameter Components
| Component | Description |
|---|---|
| criteria | Impact criteria with weights |
| thresholds | Critical/High/Medium/Low score boundaries |
| appetiteLimit | Maximum acceptable risk score |
| toleranceLimit | Risk score requiring escalation |
| residualMethod | Method for residual risk calculation |
| maxReduction | Maximum allowable risk reduction |
| minResidual | Minimum residual risk score |
| ceModel | Control effectiveness model factors |
| governanceRules | Justification and approval thresholds |

### 3.4 Group Management

#### 3.4.1 Group Definition
- Define organizational groups with name and description
- Track group members (users)
- Set group status (Active/Inactive)
- Groups used for delegation and notification

#### 3.4.2 Group Detail
- View group information
- Manage group members
- View group-related activities
- Group membership history

---

## 4. Data Structures

### 4.1 Organization Object

```javascript
{
  _id: "o-1",
  orgId: "ORG-001",
  name: "Wadjet Bank Plc",
  type: "parent",                   // parent, subsidiary, division, department
  region: "East Africa",
  industry: "Banking",
  status: "active",                 // active, inactive
  createdAt: "2024-08-26T00:00:00Z",
  description: "Parent holding entity",
  // For subsidiaries:
  parentOrg: {
    _id: "o-1",
    name: "Wadjet Bank Plc"
  },
}
```

### 4.2 Domain Object

```javascript
{
  _id: "d-1",
  name: "Information Security",
  status: "active",                 // active, inactive
  scoringMethod: "advanced",        // advanced, max
  description: "CIA triad and security operations",
  escalationMatrix: {
    Low: "Risk Owner",
    Medium: "Risk Owner + CISO",
    High: "CISO + CRO",
    Critical: "Board of Directors via Enterprise Risk Register"
  }
}
```

### 4.3 Parameter Object (Full)

```javascript
{
  _id: "p-1",
  name: "Information Security",
  domain: { _id: "d-1", name: "Information Security" },
  description: "Risk methodology for Information Security domain",
  status: "active",                 // active, inactive
  methodVersion: 1,
  scoringMethod: "advanced",
  impactMethod: "weighted",         // weighted, max
  criteria: [
    { name: "Financial", weight: 0.125 },
    { name: "Regulatory", weight: 0.125 },
    { name: "Reputational", weight: 0.125 },
    { name: "Safety", weight: 0.125 },
    { name: "Operational", weight: 0.125 },
    { name: "Confidentiality", weight: 0.125 },
    { name: "Integrity", weight: 0.125 },
    { name: "Availability", weight: 0.125 }
  ],
  riskScoreMethod: "multiplicative", // multiplicative, weighted, max
  riskScoreWeights: { likelihood: 0.5, impact: 0.5 },
  matrixLookupTable: null,
  thresholds: { critical: 20, high: 12, medium: 6 },
  appetiteLimit: 8,
  toleranceLimit: 12,
  residualMethod: "overall_ce",     // overall_ce, axis_reduction
  maximumRiskReduction: 0.75,
  minResidualScore: 1,
  controlEffectivenessModel: {
    version: "CE-V1",
    factors: {
      design: 0.25,
      operating: 0.35,
      coverage: 0.25,
      testing: 0.15
    }
  },
  controlEffectivenessWeights: {
    Effective: 0.75,
    "Partially Effective": 0.5,
    Ineffective: 0.25,
    "Not Assessed": 0
  },
  recommendedControls: [],
  governanceRules: {
    justificationThreshold: 0.2,
    approvalThreshold: 0.4,
    minJustificationLength: 20,
    requireJustification: true,
    requireApproval: true
  },
  createdBy: "admin",
  createdAt: "2025-01-24T00:00:00Z",
  updatedAt: "2026-05-24T00:00:00Z"
}
```

### 4.4 Group Object

```javascript
{
  _id: "g-1",
  name: "Risk Committee Members",
  description: "Members of the enterprise risk committee",
  members: ["u-admin", "u-manager", "u-auditor"],
  status: "Active",                 // Active, Inactive
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
```

### 4.5 Organization with Computed Fields

```javascript
// When retrieved, organizations include computed fields:
{
  _id: "o-1",
  orgId: "ORG-001",
  name: "Wadjet Bank Plc",
  type: "parent",
  // Computed:
  subsidiaryCount: 2,
  activeSubsidiaries: [
    { _id: "o-2", name: "Wadjet Digital Ltd" },
    { _id: "o-3", name: "Wadjet Capital" }
  ],
  domainCount: 6,
  riskCount: 16,
  complianceScore: 72,
}
```

---

## 5. User Roles & Permissions

### 5.1 Context Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| context.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| context.manage_organizations | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| context.manage_domains | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| context.manage_parameters | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| context.manage_groups | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## 6. Workflows

### 6.1 Organization Setup Workflow

```
┌─────────────────┐
│ Define Parent   │
│ Organization    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Define          │
│ Subsidiaries    │
│ (link to parent)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assign Domains  │
│ to Organization │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Configure       │
│ Parameters      │
│ per Domain      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Define Groups   │
│ and Members     │
└─────────────────┘
```

### 6.2 Parameter Configuration Workflow

```
┌─────────────────┐
│ Select Domain   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Define Criteria │
│ & Weights       │
│ (must sum to 1) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Thresholds  │
│ (Critical/High/ │
│  Medium/Low)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Configure       │
│ Appetite &      │
│ Tolerance       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Control     │
│ Effectiveness   │
│ Model           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Define          │
│ Governance Rules│
│ (justification, │
│  approval)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Activate        │
│ Parameter       │
└─────────────────┘
```

### 6.3 Domain-to-Risk Methodology Workflow

```
┌─────────────────┐
│ Risk Submit Form│
│ - User selects  │
│   domain        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ System Loads    │
│ Active Parameter│
│ for Domain      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Criteria &      │
│ Weights Applied │
│ to Risk Form    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Risk Scored     │
│ Using Domain    │
│ Methodology     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Appetite &      │
│ Escalation      │
│ Evaluated       │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Organization Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/organizations` | List all organizations |
| GET | `/api/organizations/:id` | Get organization detail with subsidiaries |
| POST | `/api/organizations` | Create organization |
| PUT | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete organization |

### 7.2 Domain Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/domains` | List all domains |
| GET | `/api/domains/:id` | Get domain detail with parameters |
| POST | `/api/domains` | Create domain |
| PUT | `/api/domains/:id` | Update domain |
| DELETE | `/api/domains/:id` | Delete domain |

### 7.3 Parameter Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/parameters` | List all parameters |
| GET | `/api/parameters/:id` | Get parameter detail |
| GET | `/api/parameters?domain=:domainId` | Get parameter by domain |
| POST | `/api/parameters` | Create parameter |
| PUT | `/api/parameters/:id` | Update parameter |
| DELETE | `/api/parameters/:id` | Delete parameter |

### 7.4 Group Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups` | List all groups |
| GET | `/api/groups/:id` | Get group detail with members |
| POST | `/api/groups` | Create group |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Domain-Parameter mapping | Risks use domain parameters for scoring |
| Compliance | Domain-Framework mapping | Frameworks apply to domains |
| Controls | Domain-Control mapping | Controls belong to domains |
| Assets | Domain-Asset mapping | Assets classified by domains |
| Audit | Organization-Audit mapping | Audits scoped to organizations |
| Governance | Organization-Policy mapping | Policies apply to organizations |
| Reporting | Context reports | Report engine consumes context data |
| AI Module | Domain analytics | AI analyzes domain risk patterns |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT MODULE                                 │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                    Context Configuration                       │     │
│  │                                                               │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │     │
│  │  │Organizations│  │   Domains   │  │  Parameters │          │     │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │     │
│  │         │                │                │                   │     │
│  │         │                │                │                   │     │
│  │         └────────────────┴────────────────┘                   │     │
│  │                          │                                    │     │
│  │                          ▼                                    │     │
│  │               ┌─────────────────────┐                         │     │
│  │               │  Methodology Config │                         │     │
│  │               └──────────┬──────────┘                         │     │
│  └──────────────────────────┼───────────────────────────────────┘     │
│                             │                                         │
│  ┌──────────────────────────┼───────────────────────────────────┐     │
│  │                          ▼                                    │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │     │
│  │  │  Risk    │  │Compliance│  │ Controls │  │  Audit   │    │     │
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │    │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Organization Edge Cases

| Edge Case | Handling |
|---|---|
| Deleting parent with subsidiaries | Prevented (foreign key constraint) |
| Circular parent reference | Prevented (validation) |
| Duplicate org code | Prevented (unique constraint) |
| Organization with no domains | Allowed (incomplete setup) |

### 9.2 Domain Edge Cases

| Edge Case | Handling |
|---|---|
| Deleting domain with active risks | Prevented (foreign key constraint) |
| No active parameter for domain | Risk scoring uses defaults |
| Multiple active parameters for domain | System uses first active parameter |
| Criteria weights don't sum to 1 | Validation error |

### 9.3 Parameter Edge Cases

| Edge Case | Handling |
|---|---|
| Changing active parameter | Affects all future risk scoring |
| Deleting active parameter | Prevented (deactivate first) |
| Negative thresholds | Validation error |
| Appetite > Tolerance | Allowed (but unusual) |

### 9.4 Group Edge Cases

| Edge Case | Handling |
|---|---|
| Empty group (no members) | Allowed |
| Duplicate group name | Allowed (different IDs) |
| Deleting group with members | Members unassigned from group |
| User in multiple groups | Allowed |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Parameter configuration restricted to admins
- Organization management restricted to admins

### 10.2 Data Integrity
- Parameter changes versioned
- Domain deletion protected by foreign key constraints
- Organization hierarchy validated
- Criteria weights validated (sum to 1.0)

### 10.3 Methodology Consistency
- One active parameter per domain ensures consistent scoring
- Parameter versioning tracks methodology changes
- Historical parameters retained for audit

---

*End of Context Module Technical Documentation*
