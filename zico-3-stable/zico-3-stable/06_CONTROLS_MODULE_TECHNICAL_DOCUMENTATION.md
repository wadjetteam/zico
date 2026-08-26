# WADJET GRC — Controls Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Control Management  
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

The Controls Module provides comprehensive control management capabilities for the WADJET GRC platform. It enables organizations to define, classify, assess, and monitor the effectiveness of security and compliance controls. Controls serve as the primary mechanism for risk reduction and compliance evidence across the platform.

### 1.1 Scope

| Capability | Description |
|---|---|
| Control Definition | Define controls with classification and ownership |
| Control Effectiveness | Assess and rate control effectiveness |
| Control-Risk Linking | Link controls to risks for reduction calculation |
- Control-Compliance Mapping | Map controls to compliance requirements |
| Control Testing | Track control testing activities |
| Control Detail | Comprehensive control information management |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | mock-data.mjs (CONTROLS), client-side riskEngine.js |
| Frontend | React (JSX) with React Router, TanStack Query |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTROLS MODULE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │ ControlManagement│  │  ControlDetail   │                     │   │
│  │  │ (List + CRUD)    │  │  (Detail View)   │                     │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                     │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                   │
│  ┌───────────┼──────────────────────┼───────────────────────────────┐   │
│  │           ▼                      ▼                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              API Layer (mock-server.mjs)                 │   │   │
│  │  │  /api/controls  /api/compliance/controls                 │   │   │
│  │  │  /api/risk-control-links                                 │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              Data Layer (mock-data.mjs)                  │  │   │
│  │  │  CONTROLS[]  LINKS[] (risk-control-links)               │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model Relationships

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Control    │────▶│  RiskControlLink │────▶│     Risk        │
│              │ 1:N │                  │ N:1 │                 │
│ - controlId  │     │ - riskId         │     │ - riskId        │
│ - name       │     │ - controlId      │     │ - riskScore     │
│ - type       │     │ - effectiveness  │     │ - residualScore │
│ - status     │     │ - link_type      │     │                 │
└──────┬───────┘     │ - controlRole    │     └─────────────────┘
       │             └──────────────────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌──────────────┐              ┌─────────────────┐
│  Compliance  │              │   Assessment    │
│  Requirement │              │                 │
│              │              │ - controlId     │
│ - mappedControls│           │ - effectiveness │
└──────────────┘              └─────────────────┘
```

---

## 3. Functionalities

### 3.1 Control Management

#### 3.1.1 Control Definition
- Define control with code, name, description
- Classify control type (Preventive, Detective, Corrective)
- Assign control domain
- Set control status

#### 3.1.2 Control Types
| Type | Description |
|---|---|
| Preventive | Prevents incidents from occurring |
| Detective | Detects incidents after occurrence |
| Corrective | Corrects after detection |

#### 3.1.3 Control Status Values
| Status | Description |
|---|---|
| Effective | Operating as designed |
| Partially Effective | Has gaps |
| Ineffective | Not operating as designed |
| Not Assessed | Not yet evaluated |

### 3.2 Control Effectiveness Assessment

#### 3.2.1 Effectiveness Model
```
Effectiveness = (design × 0.25) + (operating × 0.35) + (coverage × 0.25) + (testing × 0.15)
```

#### 3.2.2 Effectiveness Weights
| Rating | Weight |
|---|---|
| Effective | 0.75 |
| Partially Effective | 0.50 |
| Ineffective | 0.25 |
| Not Assessed | 0.00 |

#### 3.2.3 Testing
- Track tested effectiveness separately from designed effectiveness
- Record testing source (audit, assessment, continuous monitoring)
- Track assessment date and assessor

### 3.3 Control-Risk Linking

#### 3.3.1 Link Creation
- Link control to risk
- Specify link type (Independent, Complementary, Overlapping, Compensating)
- Assign control role (Both, Likelihood, Impact)
- Assess effectiveness in context of specific risk

#### 3.3.2 Link Types
| Type | Description | Reduction Impact |
|---|---|---|
| Independent | Control works alone | Full weight |
| Complementary | Enhances other controls | Increased |
| Overlapping | Shares coverage with others | Diminishing |
| Compensating | Replaces another control | Max of set |

#### 3.3.3 Control Roles
| Role | Effect on Risk Score |
|---|---|
| Both | Reduces Likelihood and Impact |
| Likelihood | Reduces Likelihood only |
| Impact | Reduces Impact only |

### 3.4 Control-Compliance Mapping

- Map controls to compliance requirements
- Controls serve as evidence of compliance
- Multiple controls can map to one requirement
- One control can map to multiple requirements

### 3.5 Control Detail View

- Comprehensive control information
- Linked risks with effectiveness
- Compliance requirement mappings
- Testing history
- Effectiveness trend

---

## 4. Data Structures

### 4.1 Control Object

```javascript
{
  _id: "ctrl-1",
  controlId: "CTRL-001",
  name: "Access Control Review",
  description: "Quarterly review of user access rights",
  type: "Preventive",               // Preventive, Detective, Corrective
  domain: "Information Security",
  framework: "ISO 27001",
  status: "Effective",              // Effective, Partially Effective, Ineffective, Not Assessed
  owner: "IT Security Team",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
}
```

### 4.2 Risk Control Link Object

```javascript
{
  _id: "link-1",
  riskId: "risk-1",
  controlId: "ctrl-1",
  link_type: "independent",         // independent, complementary, overlapping, compensating
  effectiveness: "Effective",       // Effective, Partially Effective, Ineffective, Not Assessed
  testedEffectiveness: "Effective",
  testedEffectivenessSource: "Audit 2026",
  controlRole: "both",              // both, likelihood, impact
  weight: 0.5,
  added_by: "u-admin",
  added_at: "2026-08-01T10:00:00Z",
  assessed_by: "u-auditor",
  assessed_at: "2026-08-15T14:00:00Z",
}
```

### 4.3 Control Reference in Compliance

```javascript
// Compliance requirements reference controls via:
{
  _id: "creq-1",
  mappedControls: ["ctrl-1", "ctrl-2"],  // JSON array of control IDs
}
```

### 4.4 Control Reference in Assessment

```javascript
// Assessments reference controls via:
{
  _id: "ca-1",
  controlId: "ctrl-1",
  controlEffectiveness: "Effective",     // Effective, Partially Effective, Not Effective, Not Assessed
}
```

---

## 5. User Roles & Permissions

### 5.1 Control Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| control.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| control.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| control.edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| control.delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| control.assess | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| control.link_risk | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |

### 5.2 Report Permissions (Controls)

| Role | Report Generation |
|---|---|
| admin | All control reports |
| board | All control reports |
| ciso | controls.view + report.generate |
| cro | controls.view + report.generate |
| risk_owner | controls.view + report.generate |
| analyst | controls.view + report.generate |
| viewer | report.generate only |

---

## 6. Workflows

### 6.1 Control Lifecycle Workflow

```
┌─────────────────┐
│ Control Defined │
│ (Not Assessed)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Control         │
│ Assessed        │
├─────────────────┤
│ • Design        │
│ • Operating     │
│ • Coverage      │
│ • Testing       │
└────────┬────────┘
         │
         ├──── Effective ────▶ Monitor
         │
         ├──── Partially Effective ────▶ Improve
         │
         └──── Ineffective ────▶ Remediate
         │
         ▼
┌─────────────────┐
│ Control Linked  │
│ to Risk(s)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Effectiveness   │
│ Monitored       │
└─────────────────┘
```

### 6.2 Control-Risk Linking Workflow

```
┌─────────────────┐
│ Risk Identified │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Control Picker  │
│ - Select control│
│ - Set link type │
│ - Set role      │
│ - Assess effect.│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Residual Score  │
│ Recalculated    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Effectiveness   │
│ Tracking        │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Control Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/controls` | List all controls |
| GET | `/api/controls/:id` | Get control detail |
| POST | `/api/controls` | Create control |
| PUT | `/api/controls/:id` | Update control |
| DELETE | `/api/controls/:id` | Delete control |

### 7.2 Risk Control Link Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/risk-control-links?riskId=:id` | Get controls for risk |
| POST | `/api/risk-control-links` | Link control to risk |
| PUT | `/api/risk-control-links/:id` | Update link |
| DELETE | `/api/risk-control-links/:id` | Remove link |

### 7.3 Control Assessment Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/controls/:id/assess` | Assess control effectiveness |
| GET | `/api/controls/:id/assessments` | Get assessment history |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Control-Risk linking | Controls reduce risk scores |
| Compliance | Control-Requirement mapping | Controls evidence compliance |
| Audit | Control-Procedure mapping | Audit procedures test controls |
| Governance | Control-Policy mapping | Policies mandate controls |
| Assets | Control-Asset mapping | Controls protect assets |
| Reporting | Control reports | Report engine consumes control data |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTROLS MODULE                               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                      Control Registry                         │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │     │
│  │  │ Preventive  │  │  Detective  │  │  Corrective │          │     │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │     │
│  │         │                │                │                   │     │
│  │         └────────────────┴────────────────┘                   │     │
│  │                          │                                    │     │
│  │                          ▼                                    │     │
│  │                   ┌─────────────┐                             │     │
│  │                   │ Assessment  │                             │     │
│  │                   └──────┬──────┘                             │     │
│  └──────────────────────────┼───────────────────────────────────┘     │
│                             │                                         │
│  ┌──────────────────────────┼───────────────────────────────────┐     │
│  │                          ▼                                    │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │     │
│  │  │  Risk    │  │Compliance│  │  Audit   │  │Reporting │    │     │
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │    │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Control Edge Cases

| Edge Case | Handling |
|---|---|
| Deleting control with active links | Prevented (foreign key constraint) |
| Control with no owner | Validation error |
| Duplicate control code | Prevented (unique constraint) |
| Changing control domain | Affects linked risk assessments |

### 9.2 Control-Risk Link Edge Cases

| Edge Case | Handling |
|---|---|
| Linking same control to same risk twice | Prevented (unique constraint) |
| Linking to archived risk | Allowed (historical) |
| Removing control with active assessment | Allowed (soft delete) |
| Control effectiveness = Not Assessed | Excluded from reduction |

### 9.3 Assessment Edge Cases

| Edge Case | Handling |
|---|---|
| Assessing already-effective control | Allowed (re-assessment) |
| Assessment date in future | Rejected with 400 |
| Assessor = Control owner | Allowed (but flagged) |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Control creation restricted to authorized roles
- Control deletion restricted to admins

### 10.2 Data Integrity
- Assessment history preserved
- Link changes tracked
- Effectiveness ratings audited

---

*End of Controls Module Technical Documentation*
