# WADJET GRC — Risk Management Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Risk Management  
**Last Updated:** 2026-08-23  
**Author:** WADJET GRC Engineering Team  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Risk Calculation Engine](#3-risk-calculation-engine)
4. [Functionalities](#4-functionalities)
5. [Data Structures](#5-data-structures)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Workflows](#7-workflows)
8. [API Endpoints](#8-api-endpoints)
9. [Integration Points](#9-integration-points)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Security Considerations](#11-security-considerations)

---

## 1. Module Overview

The Risk Management Module is the core risk intelligence engine of the WADJET GRC platform. It provides comprehensive risk identification, assessment, scoring, treatment, monitoring, and reporting capabilities. The module implements a professional-grade risk calculation engine with support for multiple scoring methodologies, control effectiveness evaluation, residual risk computation, and appetite-based governance.

### 1.1 Scope

| Capability | Description |
|---|---|
| Risk Identification | Submit risks with full contextual metadata |
| Risk Scoring | Multi-method scoring (multiplicative, weighted, max-impact) |
| Impact Assessment | 8-axis impact criteria with configurable weights |
| Control Effectiveness | 4-factor control evaluation model |
| Residual Risk | Axis-based and overall reduction calculations |
| Risk Appetite | Configurable appetite/tolerance thresholds |
| Treatment Planning | Modify, Retain, Avoid, Share decisions |
| POAM Management | Plans of Action and Milestones tracking |
| Management Reviews | Periodic risk review workflows |
| Score History | Full audit trail of score changes |
| Risk Closure | Formal closure with justification |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend Engine | riskEngine.js (1056 lines) — Professional risk calculation |
| Backend API | riskApi.js — REST endpoints for calculations |
| Client Engine | client/src/lib/riskEngine.js — Client-side scoring |
| Frontend | React (JSX) with React Router, TanStack Query, Framer Motion |
| UI Components | Radix UI, shadcn/ui, Lucide icons, Recharts |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     RISK MANAGEMENT MODULE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │SubmitRisk│ │ViewRisks │ │RiskScoring│ │ManagementReviews │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │CloseRisks│ │  POAM    │ │ScoreHist │ │  RiskHeatMap     │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘  │   │
│  └───────┼────────────┼────────────┼────────────────┼─────────────┘   │
│          │            │            │                │                  │
│  ┌───────┼────────────┼────────────┼────────────────┼─────────────┐   │
│  │       ▼            ▼            ▼                ▼             │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              API Layer (mock-server.mjs)                 │  │   │
│  │  │  /api/risks  /api/management-reviews  /api/poam         │  │   │
│  │  │  /api/risk-control-links  /api/risk-score-history       │  │   │
│  │  └─────────────────────────┬───────────────────────────────┘  │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │           Risk Calculation Engine (riskEngine.js)        │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │  │   │
│  │  │  │ParameterEngine│  │ ImpactEngine  │  │  Control   │  │  │   │
│  │  │  │               │  │               │  │Effectiveness│  │  │   │
│  │  │  │ - Criteria    │  │ - Weighted    │  │  Engine    │  │  │   │
│  │  │  │ - Thresholds  │  │ - Max Impact  │  │            │  │  │   │
│  │  │  │ - Appetite    │  │ - Average     │  │ - Design   │  │  │   │
│  │  │  │ - Residual    │  │ - Custom      │  │ - Operating│  │  │   │
│  │  │  │ - Governance  │  │               │  │ - Coverage │  │  │   │
│  │  │  └───────────────┘  └───────────────┘  │ - Testing  │  │  │   │
│  │  │                                         └────────────┘  │  │   │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │  │   │
│  │  │  │  Residual     │  │  Appetite     │  │ Validation │  │  │   │
│  │  │  │  Risk Engine  │  │  Engine       │  │  Engine    │  │  │   │
│  │  │  │               │  │               │  │            │  │  │   │
│  │  │  │ - Overall CE  │  │ - Within      │  │ - Inputs   │  │  │   │
│  │  │  │ - Axis Red.   │  │ - Exceeds     │  │ - Weights  │  │  │   │
│  │  │  │ - Max Red.    │  │ - Breach      │  │ - Bounds   │  │  │   │
│  │  │  └───────────────┘  └───────────────┘  └────────────┘  │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Data Layer (mock-data.mjs)                   │   │
│  │  RISKS[]  ASSETS[]  DOMAINS[]  PARAMETERS[]  LINKS[]           │   │
│  │  MANAGEMENT_REVIEWS[]  POAM[]  RISK_SCORE_HISTORY[]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISK CALCULATION ENGINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input: Risk Parameters + Criteria Scores + Control Assessments        │
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │ ParameterEngine │                                                   │
│  │                 │                                                   │
│  │ • getCriteria() │──▶ Impact Criteria (8 axes)                      │
│  │ • getThresholds()│──▶ Critical/High/Medium/Low                     │
│  │ • getAppetite() │──▶ Appetite + Tolerance limits                  │
│  │ • getResidual() │──▶ Max reduction + method                       │
│  │ • getGovernance()│──▶ Justification/Approval thresholds            │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                          │
│  │  ImpactEngine   │     │  ControlEffect  │                          │
│  │                 │     │  nessEngine     │                          │
│  │ • Weighted      │     │                 │                          │
│  │ • Max Impact    │     │ • Design (0.25) │                          │
│  │ • Average       │     │ • Operating(0.35)│                         │
│  │ • Custom        │     │ • Coverage(0.25)│                          │
│  │                 │     │ • Testing (0.15)│                          │
│  └────────┬────────┘     └────────┬────────┘                          │
│           │                       │                                     │
│           ▼                       ▼                                     │
│  ┌─────────────────────────────────────────┐                          │
│  │         Residual Risk Engine            │                          │
│  │                                         │                          │
│  │  Method 1: Overall CE                   │                          │
│  │  RR = IR × (1 - CR)                     │                          │
│  │                                         │                          │
│  │  Method 2: Axis Reduction               │                          │
│  │  RR = RL × RI                           │                          │
│  │                                         │                          │
│  │  Where:                                 │                          │
│  │  CR = Control Reduction (capped)        │                          │
│  │  RL = Residual Likelihood               │                          │
│  │  RI = Residual Impact                   │                          │
│  └────────────────────┬────────────────────┘                          │
│                       │                                                 │
│                       ▼                                                 │
│  ┌─────────────────────────────────────────┐                          │
│  │           Appetite Engine               │                          │
│  │                                         │                          │
│  │  • Within Appetite (score ≤ appetite)   │                          │
│  │  • Exceeds Appetite (appetite < score ≤ tolerance) │               │
│  │  • Breach (score > tolerance)           │                          │
│  └─────────────────────────────────────────┘                          │
│                                                                         │
│  Output: Inherent Score, Residual Score, Level, Appetite Status       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Risk Calculation Engine

### 3.1 Constants & Configuration

```javascript
RISK_CONSTANTS = {
  SCALE_FACTOR: 5,
  DEFAULT_MAX_REDUCTION: 0.75,    // Max 75% risk reduction
  DEFAULT_MIN_RESIDUAL: 1,        // Minimum residual score
  JUSTIFICATION_THRESHOLD: 0.20,  // 20% reduction requires justification
  APPROVAL_THRESHOLD: 0.40,       // 40% reduction requires approval
  DEFAULT_THRESHOLDS: { critical: 20, high: 12, medium: 6 },
  DEFAULT_CE_FACTORS: {
    design: 0.25,
    operating: 0.35,
    coverage: 0.25,
    testing: 0.15,
  },
};
```

### 3.2 Scoring Methods

#### 3.2.1 Multiplicative (Default)
```
Risk Score = Likelihood × Impact
Range: 1-25 (on 5×5 scale)
```

#### 3.2.2 Weighted
```
Risk Score = (Likelihood × Wl) + (Impact × Wi)
Where Wl + Wi = 1.0
```

#### 3.2.3 Max Impact
```
Risk Score = max(Likelihood, Impact)
```

### 3.3 Impact Calculation Methods

#### 3.3.1 Weighted Impact
```
Impact = Σ (criterion_score × criterion_weight)
Weights must sum to 1.0
Result rounded to 1-5 scale
```

#### 3.3.2 Max Impact
```
Impact = max(all_criterion_scores)
```

#### 3.3.3 Average Impact
```
Impact = average(all_criterion_scores)
```

### 3.4 Control Effectiveness Model

```
CE = (design × 0.25) + (operating × 0.35) + (coverage × 0.25) + (testing × 0.15)

Where each factor is rated:
  Effective = 1.0
  Partially Effective = 0.5
  Ineffective = 0.0
  Not Assessed = excluded from calculation
```

### 3.5 Residual Risk Calculation

#### 3.5.1 Overall CE Method
```
Control Reduction = Σ (control_weight × control_effectiveness)
Capped at: maxReduction (default 75%)
Residual Risk = Inherent Risk × (1 - Control Reduction)
Minimum: minResidualScore (default 1)
```

#### 3.5.2 Axis Reduction Method
```
For each control axis (Likelihood, Impact, Both):
  Likelihood Reduction = Σ (control_weight × effectiveness) for L-controls
  Impact Reduction = Σ (control_weight × effectiveness) for I-controls

Residual Likelihood = Likelihood × (1 - Likelihood Reduction)
Residual Impact = Impact × (1 - Impact Reduction)
Residual Risk = Residual Likelihood × Residual Impact
```

### 3.6 Risk Appetite Evaluation

| Status | Condition | Action |
|---|---|---|
| Within Appetite | Score ≤ appetiteLimit | Standard monitoring |
| Exceeds Appetite | appetiteLimit < Score ≤ toleranceLimit | Enhanced monitoring |
| Breach | Score > toleranceLimit | Immediate escalation |

### 3.7 Control Relationship Types

| Type | Description | Aggregation |
|---|---|---|
| Independent | Controls work independently | Additive reduction |
| Complementary | Controls enhance each other | Multiplicative bonus |
| Overlapping | Controls have overlap | Diminishing returns |
| Compensating | One compensates for another | Max of compensating set |

### 3.8 Control Roles

| Role | Effect |
|---|---|
| Both | Reduces both Likelihood and Impact |
| Likelihood | Reduces Likelihood only |
| Impact | Reduces Impact only |

---

## 4. Functionalities

### 4.1 Risk Submission

#### 4.1.1 Risk Identification Form
- Title, description, process/sub-process mapping
- Domain and parameter selection (determines scoring methodology)
- Asset system linkage
- Threat and vulnerability identification
- Risk category classification
- Risk source (Audit, Incident, Regulatory, Risk Workshop, Vendor Assessment, Scan)
- Risk owner and team assignment
- Date identified

#### 4.1.2 Likelihood Assessment
- 5-point scale: Rare (1), Unlikely (2), Possible (3), Likely (4), Almost Certain (5)
- Visual scale labels for user guidance

#### 4.1.3 Impact Assessment
- 8 impact criteria: Financial, Regulatory, Reputational, Safety, Operational, Confidentiality, Integrity, Availability
- Configurable weights per domain parameter
- Real-time impact score computation
- Weight normalization support

#### 4.1.4 Treatment Planning
- Treatment decision: Modify, Retain, Avoid, Share
- Treatment actions description
- Estimated budget
- Planned controls selection
- Treatment owner and target date
- Review frequency (Monthly, Quarterly, Annually)
- Acceptance justification (for Retain decisions)

#### 4.1.5 Real-time Score Preview
- Client-side risk score computation
- Inherent and residual score display
- Severity level indicator
- Appetite status visualization

### 4.2 Risk Register

- Complete risk listing with filtering and sorting
- Status-based filtering (Open, In Progress, Closed, Accepted)
- Category and domain filtering
- Severity level indicators
- Owner and deadline tracking
- Export capability

### 4.3 Risk Scoring

#### 4.3.1 Scoring Interface
- Parameter selection drives criteria display
- Dynamic impact criteria based on domain
- Control linking with effectiveness assessment
- Real-time residual score calculation
- Score breakdown visualization

#### 4.3.2 Control Linking
- Link controls to risks with relationship type
- Assign control role (Both, Likelihood, Impact)
- Assess tested effectiveness
- Track assessment history

### 4.4 Management Reviews

- Periodic risk review scheduling
- Review frequency tracking (Monthly, Quarterly, Annually)
- Next review date computation
- Overdue review detection
- Review outcome recording

### 4.5 Risk Closure

- Formal closure workflow
- Closure justification required
- Treatment effectiveness assessment
- Closed date recording
- Audit trail preservation

### 4.6 POAM (Plans of Action and Milestones)

- POAM item creation and tracking
- Milestone definition with due dates
- Status tracking (Open, In Progress, Completed, Delayed)
- Cost tracking
- Source linking (Audit, Assessment, Incident)
- Responsible party assignment

### 4.7 Score History

- Complete history of risk score changes
- Timestamp and actor tracking
- Before/after score comparison
- Reason for change recording
- Audit trail compliance

### 4.8 Risk Heat Map

- Visual 5×5 heat map (Likelihood × Impact)
- Color-coded severity zones
- Risk count per cell
- Interactive risk selection

---

## 5. Data Structures

### 5.1 Risk Object

```javascript
{
  _id: "risk-1",
  riskId: "R-001",
  title: "Unauthorised access to customer data",
  process: "Customer Onboarding",
  subProcess: "KYC Verification",
  assetSystem: "Core Banking System",
  ownerTeam: "Digital Banking",
  category: "Cybersecurity",
  threat: "Insider or external attacker",
  vulnerability: "Weak access controls on admin consoles",
  riskDate: "2025-11-22T00:00:00.000Z",
  owner: "Head of IT Security",
  likelihood: 4,                    // 1-5 scale
  impacts: [
    { name: "Financial", value: 5 },
    { name: "Regulatory", value: 4 },
    { name: "Reputational", value: 3 },
    { name: "Safety", value: 2 },
    { name: "Operational", value: 2 },
    { name: "Confidentiality", value: 4 },
    { name: "Integrity", value: 4 },
    { name: "Availability", value: 5 }
  ],
  impactScore: 5,                   // Computed: max or weighted
  riskScore: 20,                    // Computed: likelihood × impact
  inherentLevel: "Critical",        // Derived from riskScore
  residualScore: 18,                // Computed after controls
  residualLevel: "High",
  severityLevel: "Critical",
  domain: { _id: "d-4", name: "Cybersecurity" },
  treatment: "Mitigate",            // Modify, Retain, Avoid, Share
  status: "Open",                   // Open, In Progress, Closed, Accepted
  mitigationActions: "Implement compensating controls...",
  deadline: "2026-09-21T00:00:00.000Z",
  asset: null,
  treatmentOwner: "Head of IT Security",
  treatmentDueDate: "2026-09-21T00:00:00.000Z",
  treatmentEffectiveness: "Partially Effective",
  createdAt: "2025-11-22T00:00:00.000Z",
  closedAt: null,
}
```

### 5.2 Risk Control Link Object

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

### 5.3 Management Review Object

```javascript
{
  _id: "mr-1",
  riskId: "risk-1",
  reviewDate: "2026-08-15T00:00:00Z",
  reviewerUserId: "u-manager",
  reviewType: "Periodic",           // Periodic, Triggered, Ad-hoc
  findings: "Risk score remains elevated...",
  recommendation: "Increase control testing frequency",
  nextReviewDate: "2026-11-15T00:00:00Z",
  status: "Completed",              // Scheduled, In Progress, Completed, Overdue
  createdAt: "2026-08-01T10:00:00Z",
}
```

### 5.4 POAM Object

```javascript
{
  _id: "poam-1",
  riskId: "risk-1",
  title: "Implement privileged access management",
  description: "Deploy PAM solution for admin console access",
  source: "Audit Finding",
  sourceId: "find-1",
  status: "Open",                   // Open, In Progress, Completed, Delayed, Cancelled
  priority: "High",                 // Critical, High, Medium, Low
  owner: "Head of IT Security",
  dueDate: "2026-10-01T00:00:00Z",
  completionDate: null,
  cost: 50000,
  milestones: [
    {
      _id: "ms-1",
      title: "Vendor selection",
      dueDate: "2026-09-01",
      status: "Completed"
    },
    {
      _id: "ms-2",
      title: "Deployment",
      dueDate: "2026-10-01",
      status: "In Progress"
    }
  ],
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-20T14:00:00Z",
}
```

### 5.5 Risk Score History Object

```javascript
{
  _id: "rsh-1",
  riskId: "risk-1",
  previousScore: 20,
  newScore: 16,
  previousLevel: "Critical",
  newLevel: "High",
  changeReason: "Control implementation - PAM deployed",
  changedBy: "u-admin",
  changedAt: "2026-08-20T14:00:00Z",
  metadata: {
    controlId: "ctrl-1",
    effectiveness: "Effective"
  }
}
```

### 5.6 Parameter Object (Risk Methodology)

```javascript
{
  _id: "p-1",
  name: "Information Security",
  domain: { _id: "d-1", name: "Information Security" },
  status: "active",
  methodVersion: 1,
  scoringMethod: "advanced",         // advanced, max
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
  governanceRules: {
    justificationThreshold: 0.2,
    approvalThreshold: 0.4,
    minJustificationLength: 20,
    requireJustification: true,
    requireApproval: true
  }
}
```

### 5.7 Domain Object

```javascript
{
  _id: "d-1",
  name: "Information Security",
  status: "active",
  scoringMethod: "advanced",
  description: "CIA triad and security operations",
  escalationMatrix: {
    Low: "Risk Owner",
    Medium: "Risk Owner + CISO",
    High: "CISO + CRO",
    Critical: "Board of Directors via Enterprise Risk Register"
  }
}
```

---

## 6. User Roles & Permissions

### 6.1 Risk Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| risk.submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| risk.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| risk.edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| risk.delete | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| risk.score | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| risk.close | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| risk.review | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| poam.manage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| risk.treatment.approve | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

### 6.2 Report Permissions (Risk)

| Role | Report Generation |
|---|---|
| admin | All reports |
| board | All reports |
| ciso | risk.view + report.generate |
| cro | risk.view + report.generate |
| risk_owner | risk.view + report.generate |
| analyst | risk.view + report.generate |
| viewer | report.generate only |

---

## 7. Workflows

### 7.1 Risk Submission Workflow

```
┌─────────┐     ┌──────────────────┐     ┌────────────────┐
│  User   │────▶│  Submit Risk     │────▶│  Risk Created  │
│         │     │  Form            │     │  (Open Status) │
└─────────┘     └──────────────────┘     └───────┬────────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │  Risk Scoring  │
                                        │  (Inherent)    │
                                        └───────┬────────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │ Control Linking│
                                        │ & Assessment   │
                                        └───────┬────────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │ Residual Score │
                                        │ Computation    │
                                        └───────┬────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                          Within           Exceeds            Breach
                          Appetite         Appetite           Appetite
                              │                  │                  │
                              ▼                  ▼                  ▼
                        ┌──────────┐      ┌──────────┐      ┌──────────┐
                        │ Standard │      │ Enhanced │          │Immediate │
                        │ Monitor  │      │ Monitor  │          │Escalate  │
                        └──────────┘      └──────────┘      └──────────┘
```

### 7.2 Risk Treatment Workflow

```
┌─────────────┐
│  Open Risk  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Treatment        │
│ Decision         │
├──────────────────┤
│ • Modify (mitigate with controls)
│ • Retain (accept current level)
│ • Avoid (eliminate the activity)
│ │ Share (transfer to third party)
└──────┬───────────┘
       │
       ├──── Modify ────▶ Implement Controls ────▶ Reassess Score
       │
       ├──── Retain ────▶ Justification Required ────▶ Periodic Review
       │
       ├──── Avoid ─────▶ Activity Elimination ────▶ Risk Closure
       │
       └──── Share ─────▶ Transfer Agreement ────▶ Monitor Transfer
```

### 7.3 Risk Closure Workflow

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Open/In   │────▶│  Closure Request │────▶│  Justification │
│  Progress  │     │                  │     │  Required      │
└─────────────┘     └──────────────────┘     └───────┬────────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │  Review &      │
                                            │  Approval      │
                                            └───────┬────────┘
                                                     │
                              ┌──────────────────────┼──────────────────┐
                              │                      │                  │
                          Approved                Rejected
                              │                      │
                              ▼                      ▼
                        ┌──────────┐          ┌──────────┐
                        │  Closed  │          │  Return  │
                        │  Status  │          │  to Open │
                        └──────────┘          └──────────┘
```

### 7.4 Management Review Workflow

```
┌─────────────────┐
│ Scheduled Review│
│ (Monthly/       │
│  Quarterly/     │
│  Annually)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review Meeting  │
│ - Assess current│
│   risk level    │
│ - Evaluate      │
│   controls      │
│ - Identify new  │
│   threats       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Outcome         │
├─────────────────┤
│ • No change     │
│ • Update score  │
│ • Change treatment│
│ • Escalate      │
│ • Close risk    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Record Decision │
│ Set Next Review │
│ Date            │
└─────────────────┘
```

---

## 8. API Endpoints

### 8.1 Risk CRUD Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/risks` | List all risks with filtering |
| GET | `/api/risks/:id` | Get risk detail with links and history |
| POST | `/api/risks` | Create new risk |
| PUT | `/api/risks/:id` | Update risk |
| DELETE | `/api/risks/:id` | Delete risk |

### 8.2 Risk Scoring Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/risks/:id/score` | Compute risk score |
| GET | `/api/risks/:id/score-history` | Get score change history |
| POST | `/api/risk-score-jobs` | Submit async scoring job |

### 8.3 Control Link Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/risk-control-links?riskId=:id` | Get controls linked to risk |
| POST | `/api/risk-control-links` | Link control to risk |
| PUT | `/api/risk-control-links/:id` | Update link (effectiveness, role) |
| DELETE | `/api/risk-control-links/:id` | Remove control link |

### 8.4 Management Review Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/management-reviews` | List management reviews |
| POST | `/api/management-reviews` | Create review |
| PUT | `/api/management-reviews/:id` | Update review |

### 8.5 POAM Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/poam` | List POAM items |
| GET | `/api/poam/:id` | Get POAM detail |
| POST | `/api/poam` | Create POAM item |
| PUT | `/api/poam/:id` | Update POAM item |
| DELETE | `/api/poam/:id` | Delete POAM item |

### 8.6 Risk Calculation API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/risk-calculations/score` | Calculate risk score |
| POST | `/api/risk-calculations/residual` | Calculate residual risk |
| POST | `/api/risk-calculations/validate` | Validate parameter configuration |

---

## 9. Integration Points

### 9.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Controls | Risk-Control linking | Controls reduce risk scores |
| Assets | Risk-Asset mapping | Risks reference asset systems |
| Domains | Risk categorization | Risks belong to domains |
| Parameters | Methodology config | Parameters drive scoring |
| Compliance | Risk-Assessment mapping | Compliance assessments reference risks |
| Audit | Risk-Finding mapping | Audit findings may create risks |
| Governance | Risk-Policy mapping | Policies may mandate risk controls |
| Reporting | Risk reports | Report engine consumes risk data |
| AI Module | Risk insights | AI analyzes risk patterns |

### 9.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RISK MANAGEMENT MODULE                          │
│                                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │ Submit  │───▶│  Score  │───▶│ Control │───▶│Residual │              │
│  │  Risk   │    │ Inherent│    │  Link   │    │  Score  │              │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘              │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    RISK_SCORE_HISTORY                       │       │
│  └─────────────────────────────────────────────────────────────┘       │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │Compliance│    │  Audit  │    │Reporting│    │   AI    │              │
│  │ Module   │    │ Module  │    │ Module  │    │ Module  │              │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Edge Cases & Error Handling

### 10.1 Scoring Edge Cases

| Edge Case | Handling |
|---|---|
| All criteria scores = 1 | Risk score = likelihood × 1 = likelihood |
| All criteria scores = 5 | Risk score = likelihood × 5 = maximum |
| Missing criteria scores | Default to 1 (minimum) |
| Weights don't sum to 1.0 | Validation error returned |
| No controls linked | Residual = Inherent (no reduction) |
| Control reduction > max | Capped at maximumRiskReduction |
| Residual < minResidual | Set to minResidualScore (default 1) |

### 10.2 Risk Lifecycle Edge Cases

| Edge Case | Handling |
|---|---|
| Closing already-closed risk | Rejected with 400 |
| Editing closed risk | Allowed (with audit trail) |
| Deleting risk with POAMs | Prevented (foreign key constraint) |
| Risk with no owner | Validation error on creation |
| Duplicate risk ID | Auto-generated, no collision |

### 10.3 Control Linking Edge Cases

| Edge Case | Handling |
|---|---|
| Linking same control twice | Prevented (unique constraint) |
| Removing control with active assessment | Allowed (soft delete) |
| Control effectiveness = Not Assessed | Excluded from reduction calculation |
| Multiple compensating controls | Max effectiveness used |

---

## 11. Security Considerations

### 11.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Risk owners can edit their own risks
- Only admins can delete risks

### 11.2 Audit Trail
- All score changes recorded in RISK_SCORE_HISTORY
- Actor, timestamp, and reason captured
- Immutable history (no modifications)

### 11.3 Data Validation
- Likelihood: 1-5 range enforced
- Impact scores: 1-5 range enforced
- Weights: must sum to 1.0 (±0.005 tolerance)
- Required fields validated on creation

---

*End of Risk Management Module Technical Documentation*
