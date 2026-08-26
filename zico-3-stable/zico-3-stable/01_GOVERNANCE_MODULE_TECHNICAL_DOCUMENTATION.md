# WADJET GRC — Governance Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Governance  
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
11. [Audit Trail & Compliance](#11-audit-trail--compliance)

---

## 1. Module Overview

The Governance Module is the central policy and organizational governance engine of the WADJET GRC platform. It provides end-to-end lifecycle management for policies, exceptions, documents, roles, committees, and organizational governance structures. The module enforces segregation of duties (SoD), maintains immutable audit trails with cryptographic chaining, and supports multi-stage approval workflows.

### 1.1 Scope

| Capability | Description |
|---|---|
| Policy Lifecycle Management | Draft → Review → Approval → Publish → Active → Archive |
| Version Control | Semantic versioning with full history, comparison, and rollback |
| Exception Management | Request, risk-assess, approve, and auto-expire governance exceptions |
| Document Program | Centralized governance document repository with classification |
| Roles & Permissions | RBAC matrix with module-level and action-level granularity |
| Committee Management | Meeting scheduling, quorum tracking, decision recording |
| Executive Dashboard | Real-time governance KPIs and attestation tracking |
| Attestation | User acknowledgment tracking with completion rates |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| API Layer | governance-api.js (895 lines), governance-data.js (358 lines) |
| Lifecycle Engine | policyLifecycleService.js (605 lines) |
| Version Service | policyVersionService.js (223 lines) |
| Validation Service | policyValidationService.js (168 lines) |
| SoD Engine | sodService.js (77 lines) |
| Exception Expiry | exceptionExpiryService.js (95 lines) |
| Frontend | React (JSX) with React Router, TanStack Query, Framer Motion |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOVERNANCE MODULE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Frontend   │  │  API Layer   │  │   Data Layer         │  │
│  │              │  │              │  │                      │  │
│  │ PolicyMgmt   │──│ governance-  │──│ POLICIES[]           │  │
│  │ PolicyDetail │  │ api.js       │  │ POLICY_VERSIONS[]    │  │
│  │ Exceptions   │  │              │  │ POLICY_REVIEWS[]     │  │
│  │ Documents    │  │ listPolicies │  │ POLICY_ACKNOWLEDGE[] │  │
│  │ Roles        │  │ getPolicy    │  │ COMMITTEES[]         │  │
│  │ Committees   │  │ createPolicy │  │ EXCEPTIONS[]         │  │
│  │ Executive    │  │ createVersion│  │ ROLES[]              │  │
│  │ Dashboard    │  │ submitVersion│  │ GOVERNANCE_AUDIT_LOG │  │
│  └──────────────┘  │ approveVers  │  └──────────────────────┘  │
│                    │ publishVers  │                             │
│                    │ archivePolicy│  ┌──────────────────────┐  │
│                    │ listRoles    │  │   Services Layer     │  │
│                    │ createRole   │  │                      │  │
│                    │ listCommit   │  │ policyLifecycleSvc   │  │
│                    │ createExc    │  │ policyVersionSvc     │  │
│                    │ approveExc   │  │ policyValidationSvc  │  │
│                    │ getDashboard │  │ sodService           │  │
│                    └──────────────┘  │ exceptionExpirySvc   │  │
│                                      └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Dependencies

```
policyLifecycleService.js
    ├── policyVersionData.js (STATE_TRANSITIONS, computePolicyState)
    ├── governance-data.js (GOVERNANCE_AUDIT_LOG)
    ├── mock-data.mjs (USERS, POLICIES)
    └── sodService.js (checkSoDConstraint)

governance-api.js
    ├── governance-data.js (POLICY_VERSIONS, POLICY_REVIEWS, etc.)
    ├── mock-data.mjs (POLICIES, COMMITTEES, EXCEPTIONS, USERS, ROLES)
    └── policyLifecycleService.js (for state transitions)

exceptionExpiryService.js
    ├── governance-data.js (GOVERNANCE_AUDIT_LOG)
    └── mock-data.mjs (EXCEPTIONS)
```

---

## 3. Functionalities

### 3.1 Policy Management

#### 3.1.1 Policy Creation
- Creates a new policy with auto-generated policy code (`POL-001`, `POL-002`, etc.)
- Automatically creates initial version (v1.0) in Draft status
- Records creation in immutable audit log
- Validates required fields: title, category, owner, department

#### 3.1.2 Policy Versioning
- Semantic versioning (1.0, 1.1, 2.0, etc.)
- Each version is immutable once published
- Full version history retained with change summaries
- Version comparison and rollback capability
- Superseded versions marked with reference to replacement

#### 3.1.3 Policy Lifecycle State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │ SUBMIT_FOR_REVIEW
                         ▼
                    ┌─────────┐
          ┌────────│ REVIEW  │────────┐
          │        └────┬────┘        │
          │             │             │
   RETURN_TO_DRAFT   START_APPROVAL  REJECT
          │             │             │
          │             ▼             │
          │       ┌──────────┐        │
          │       │ APPROVAL │        │
          │       └────┬─────┘        │
          │            │              │
          │         APPROVE           │
          │            │              │
          │            ▼              │
          │      ┌──────────┐         │
          └──────│ APPROVED │─────────┘
                 └────┬─────┘
                      │ PUBLISH
                      ▼
                 ┌──────────┐
                 │ PUBLISHED│
                 └────┬─────┘
                      │ ACTIVATE
                      ▼
                 ┌──────────┐
          ┌──────│  ACTIVE  │──────┐
          │      └──────────┘      │
          │                        │
     ARCHIVE                   SUPERSEDED
          │                        │
          ▼                        ▼
     ┌──────────┐           ┌──────────┐
     │ ARCHIVED │           │SUPERSEDED│
     └──────────┘           └──────────┘
```

#### 3.1.4 Policy Review Workflow
- Multi-reviewer support with sequential review tracking
- Review decisions: Approved, Rejected (with mandatory comments)
- Review status computed from next review date
- Automatic review overdue detection

#### 3.1.5 Policy Attestation
- Tracks user acknowledgments of active policies
- Computes acknowledgement rate per policy
- Supports attestation snapshots (PDF export)
- Pending/Completed status tracking

### 3.2 Exception Management

#### 3.2.1 Exception Lifecycle
```
DRAFT → SUBMITTED → RISK_ASSESSMENT → UNDER_REVIEW → APPROVED → ACTIVE → EXPIRED → CLOSED
                                          ↓
                                       REJECTED
```

#### 3.2.2 Exception Expiry
- Background job runs hourly (configurable interval)
- Automatically transitions Active exceptions past `requestedUntil` to Expired
- Records audit event for each expiration
- Safe-to-repeat pattern (idempotent)

#### 3.3.3 Exception Types
- Configurable exception types with approval authority mapping
- Risk assessment workflow before approval
- Related policy linkage

### 3.3 Document Program

- Centralized governance document repository
- Document classification (Internal, Confidential, Public, Restricted)
- Version tracking per document
- Framework mapping support
- Owner and review date tracking

### 3.4 Roles & Permissions

#### 3.4.1 Role Structure
- Role-based access control (RBAC) with module-level permissions
- Permission matrix: grc, audit, settings (manage/edit/view/none)
- Approval authority tiers (None, Tier 1, Tier 2, Tier 3)
- Module access control (policy, compliance, audit, context, governance)

#### 3.4.2 Predefined Roles
| Role | GRC | Audit | Settings | Approval Authority |
|------|-----|-------|----------|-------------------|
| Admin | manage | manage | manage | Tier 3 |
| User | edit | view | view | None |
| Auditor | view | manage | view | Tier 2 |
| Viewer | view | view | none | None |

### 3.5 Committee Management

#### 3.5.1 Committee Structure
- Committee definitions with chair, secretary, members
- Meeting scheduling with agenda items
- Quorum computation based on member attendance
- Decision recording with vote tracking (for/against)
- Action item tracking with status

#### 3.5.2 Committee Types
- Board of Directors
- Risk Committee
- Audit Committee
- Compliance Committee
- Information Security Committee

### 3.6 Executive Dashboard

- Real-time governance KPIs
- Policy status distribution
- Exception volume and ageing
- Attestation completion rates
- Committee meeting activity
- Overdue review tracking

---

## 4. Data Structures

### 4.1 Policy Object

```javascript
{
  _id: "pol-1",                    // Unique identifier
  policyCode: "POL-001",           // Human-readable code
  title: "Information Security Policy",
  description: "...",
  category: "Information Security",
  classification: "Internal",      // Internal, Confidential, Public, Restricted
  ownerUserId: "u-admin",          // Reference to User
  department: "IT Security",
  applicableTo: "All employees",
  applicableRegions: ["East Africa", "West Africa"],
  regulatoryMappings: ["ISO 27001", "PCI DSS"],
  controlMappings: ["ctrl-1", "ctrl-2"],
  reviewPeriodDays: 365,
  sourceTemplateId: "pt-1",        // Reference to PolicyTemplate
  currentVersionId: "pv-1",        // Reference to active PolicyVersion
  createdAt: "2025-08-15T10:00:00Z",
  updatedAt: "2025-08-21T08:00:00Z",
  
  // Computed at read time:
  status: "Active",                // Derived from current version
  nextReviewDate: "2026-08-22",
  reviewStatus: "Due",             // Due, Overdue, Upcoming
  acknowledgementRate: 0.85,       // 85% acknowledged
}
```

### 4.2 Policy Version Object

```javascript
{
  _id: "pv-1",
  policyId: "pol-1",
  versionNumber: "3.2",
  content: "Full policy text...",
  changeSummary: "Updated access control requirements",
  attachmentIds: ["att-1"],
  status: "Active",                // Draft, Submitted, InReview, Approved, Rejected, Published, Active, Superseded
  createdByUserId: "u-admin",
  createdAt: "2025-08-15T10:00:00Z",
  submittedByUserId: "u-admin",
  submittedAt: "2025-08-16T09:00:00Z",
  approvedByUserId: "u-manager",
  approvedAt: "2025-08-20T14:00:00Z",
  rejectedByUserId: null,
  rejectedAt: null,
  rejectionReason: null,
  publishedAt: "2025-08-21T08:00:00Z",
  effectiveDate: "2025-08-22T00:00:00Z",
  supersededAt: null,
  supersededByVersionId: null,
}
```

### 4.3 Exception Object

```javascript
{
  _id: "exc-1",
  title: "Temporary Access Exception",
  description: "...",
  relatedPolicyId: "pol-1",
  exceptionType: "Access Control",
  requestedByUserId: "u-analyst",
  requestedAt: "2026-08-01T10:00:00Z",
  requestedUntil: "2026-12-31T23:59:59Z",
  riskAssessment: "Low risk - temporary access for project duration",
  approvedByUserId: "u-manager",
  approvedAt: "2026-08-02T14:00:00Z",
  status: "Active",                // Draft, Submitted, RiskAssessment, UnderReview, Approved, Rejected, Active, Expired, Closed
  expiredAt: null,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-02T14:00:00Z",
}
```

### 4.4 Committee Object

```javascript
{
  _id: "cm-1",
  name: "Risk Committee",
  type: "Risk Committee",
  chairUserId: "u-manager",
  secretaryUserId: "u-admin",
  memberUserIds: ["u-admin", "u-manager", "u-auditor"],
  meetingFrequency: "Monthly",
  status: "Active",
  createdAt: "2025-01-01T00:00:00Z",
}
```

### 4.5 Committee Meeting Object

```javascript
{
  _id: "cmt-1",
  committeeId: "cm-1",
  meetingNumber: 1,
  scheduledDate: "2026-08-15T10:00:00Z",
  actualDate: "2026-08-15T10:05:00Z",
  attendeeUserIds: ["u-admin", "u-manager", "u-auditor"],
  agendaItems: ["Q3 Risk Review", "Policy Approvals", "Exception Review"],
  minutesAttachmentId: null,
  status: "Held",                  // Scheduled, Held, Cancelled, Postponed
}
```

### 4.6 Committee Decision Object

```javascript
{
  _id: "cd-1",
  meetingId: "cmt-1",
  committeeId: "cm-1",
  description: "Approved Information Security Policy v3.2",
  relatedEntityType: "Policy",
  relatedEntityId: "pol-1",
  decisionType: "ApprovePolicy",   // ApprovePolicy, RejectPolicy, RequestChanges, Escalate, Defer
  votesFor: 3,
  votesAgainst: 0,
  decidedAt: "2026-08-15T11:30:00Z",
}
```

### 4.7 Role Object

```javascript
{
  _id: "r-admin",
  name: "Admin",
  description: "Full access to all modules",
  status: "Active",                // Active, Inactive
  permissionsMatrix: {
    grc: "manage",                 // manage, edit, view, none
    audit: "manage",
    settings: "manage"
  },
  approvalAuthority: "Tier 3",     // None, Tier 1, Tier 2, Tier 3
  email: "admin@wadjet.local",
  modulesWithAccess: ["policy", "compliance", "audit", "context", "governance"]
}
```

### 4.8 Audit Log Entry

```javascript
{
  _id: "pal-1",
  timestamp: "2025-08-15T10:00:00Z",
  previousEntryHash: "sha256:abc...",  // Cryptographic chain
  actorUserId: "u-admin",
  actorRoleAtTime: "board",
  action: "policy.created",
  entityType: "Policy",
  entityId: "pol-1",
  fromState: null,
  toState: "Draft",
  reason: null,
  metadata: { versionNumber: "3.2" },
  ipAddress: "127.0.0.1",
  entryHash: "sha256:def...",       // SHA-256 of this entry
}
```

### 4.9 Policy Template Object

```javascript
{
  _id: "pt-1",
  name: "Information Security Policy Template",
  category: "Information Security",
  defaultContent: "# Information Security Policy\n\n## 1. Purpose\n...",
  applicableFrameworks: ["ISO 27001", "NIST CSF"],
  status: "Active"
}
```

### 4.10 Attachment Object

```javascript
{
  _id: "att-1",
  originalFileName: "security-policy-v3.2.pdf",
  storedFileName: "a1b2c3d4e5f6.pdf",
  storagePath: "/storage/governance/policies/",
  mimeType: "application/pdf",
  sizeBytes: 245760,
  checksum: "sha256:abc123def456",
  uploadedByUserId: "u-admin",
  uploadedAt: "2025-08-15T10:30:00Z",
  relatedEntityType: "PolicyVersion",
  relatedEntityId: "pv-1",
  status: "Active",
  scanStatus: "Clean"              // Clean, Infected, Pending
}
```

---

## 5. User Roles & Permissions

### 5.1 Permission Matrix

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| policy.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.submit_review | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| policy.review | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| policy.approve | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.publish | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.publish_direct | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| policy.archive | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.create_version | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| policy.delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| role.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| role.manage | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| committee.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| committee.manage | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| committee.recordDecision | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| exception.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| exception.create | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| exception.approve | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| exception.reject | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

### 5.2 Segregation of Duties (SoD) Constraints

| Workflow Step | Must Differ From |
|---|---|
| Review | Creator |
| Approval | Creator, Reviewer |
| Publish | Creator, Reviewer, Approver |
| Reject | Creator |

SoD constraints are enforced at the service layer and cannot be bypassed by metadata flags. The system prevents:
- Self-approval (creator cannot approve their own policy)
- Self-review (creator cannot review their own policy)
- Same-user publish (publisher must differ from creator, reviewer, and approver)

---

## 6. Workflows

### 6.1 Policy Creation Workflow

```
┌─────────┐     ┌──────────────┐     ┌────────────────┐
│  User   │────▶│  Frontend    │────▶│  API Layer     │
│         │     │  Policy Form │     │  createPolicy()│
└─────────┘     └──────────────┘     └───────┬────────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │  Validation    │
                                    │  - title       │
                                    │  - category    │
                                    │  - owner       │
                                    │  - department  │
                                    └───────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                          Valid                         Invalid
                              │                             │
                              ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │ Create Policy   │           │ Return 422      │
                    │ + Version 1.0   │           │ + Error List    │
                    │ (Draft status)  │           └─────────────────┘
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Record Audit    │
                    │ "policy.created"│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Return 201      │
                    │ + Policy Object │
                    └─────────────────┘
```

### 6.2 Policy Approval Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT   │───▶│  REVIEW  │───▶│ APPROVAL │───▶│ APPROVED │───▶│ PUBLISHED│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     │ submit        │ approve       │ approve       │ publish       │ activate
     │ _for_review   │ (CISO/CRO)    │ (Admin/       │ (Admin/       │ (Admin/
     │ (Admin/       │               │  Board/CISO)  │  Board/CISO)  │  Board/
     │  Board/CISO/  │               │               │               │  CISO)
     │  RiskOwner)   │               │               │               │
     │               │               │               │               │
     │◀── reject ────│◀── reject ────│               │               │
     │  (reason      │  (reason      │               │               │
     │   required)   │   required)   │               │               │
     └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 6.3 Exception Request Workflow

```
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────────┐
│  DRAFT   │───▶│ SUBMITTED │───▶│RISK_ASSESSMENT│───▶│ UNDER_REVIEW│
└──────────┘    └───────────┘    └──────────────┘    └──────┬──────┘
                                                            │
                              ┌─────────────────────────────┤
                              │                             │
                          Approved                      Rejected
                              │                             │
                              ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │     ACTIVE      │           │    REJECTED     │
                    └────────┬────────┘           └─────────────────┘
                             │
                             │ (time-based)
                             ▼
                    ┌─────────────────┐
                    │     EXPIRED     │
                    └────────┬────────┘
                             │
                             │ (manual)
                             ▼
                    ┌─────────────────┐
                    │     CLOSED      │
                    └─────────────────┘
```

### 6.4 Committee Decision Workflow

```
┌─────────────────┐
│ Schedule Meeting │
│ - Set date       │
│ - Set agenda     │
│ - Invite members │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Record Meeting  │
│ - Attendance     │
│ - Quorum check   │
│ - Minutes        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Record Decisions │
│ - Vote counting  │
│ - Entity linkage │
│ - Action items   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Track Actions    │
│ - Status         │
│ - Due dates      │
│ - Completion     │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Policy Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/policies` | List all policies with computed status | Yes |
| GET | `/api/policies/:id` | Get policy detail with versions, attachments, acknowledgements | Yes |
| POST | `/api/policies` | Create new policy (auto-creates v1.0 Draft) | Admin, Board, CISO |
| POST | `/api/policies/:id/versions` | Create new version of existing policy | Admin, Board, CISO |
| POST | `/api/policies/:id/versions/:vId/submit` | Submit version for review | Admin, Board, CISO, Risk Owner |
| POST | `/api/policies/:id/versions/:vId/start-review` | Start review process | Admin, Board, CISO, CRO |
| POST | `/api/policies/:id/versions/:vId/approve` | Approve version (review or final) | Admin, Board, CISO |
| POST | `/api/policies/:id/versions/:vId/reject` | Reject version (requires reason) | Admin, Board, CISO |
| POST | `/api/policies/:id/versions/:vId/publish` | Publish approved version | Admin, Board, CISO |
| POST | `/api/policies/:id/versions/:vId/activate` | Activate published version | Admin, Board, CISO |
| POST | `/api/policies/:id/archive` | Archive policy | Admin, Board, CISO |

### 7.2 Role Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/governance/roles` | List all roles | Yes |
| GET | `/api/governance/roles/:id` | Get role detail with users | Yes |
| POST | `/api/governance/roles` | Create new role | Admin, Board, CISO |
| PUT | `/api/governance/roles/:id` | Update role | Admin, Board, CISO |
| DELETE | `/api/governance/roles/:id` | Delete role | Admin, Board |

### 7.3 Committee Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/governance/committees` | List all committees | Yes |
| GET | `/api/governance/committees/:id` | Get committee detail with meetings, decisions | Yes |
| POST | `/api/governance/committees/:id/meetings` | Create committee meeting | Admin, Board, CISO |
| POST | `/api/governance/committees/:id/decisions` | Record committee decision | Admin, Board, CISO, CRO |

### 7.4 Exception Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/exceptions` | List all exceptions | Yes |
| GET | `/api/exceptions/:id` | Get exception detail | Yes |
| POST | `/api/exceptions` | Create new exception | Admin, Board, CISO, CRO, Risk Owner, Analyst |
| POST | `/api/exceptions/:id/approve` | Approve exception | Admin, Board, CISO, CRO |
| POST | `/api/exceptions/:id/reject` | Reject exception | Admin, Board, CISO, CRO |

### 7.5 Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/governance/dashboard` | Governance dashboard KPIs | Yes |
| GET | `/api/governance/executive` | Executive dashboard data | Admin, Board, CISO |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Policy-Risk mappings | Policies reference risks; risks reference policies |
| Compliance | Policy-Framework mappings | Policies mapped to compliance frameworks |
| Controls | Policy-Control mappings | Policies reference controls; controls reference policies |
| Audit | Committee decisions | Audit findings may reference committee decisions |
| Reporting | Governance reports | Report engine consumes governance data |
| AI Module | Policy insights | AI analyzes policy gaps and compliance |

### 8.2 External Integrations

| System | Integration Type | Purpose |
|---|---|---|
| File Storage | Attachment upload/download | Policy document storage |
| Email (Settings) | Notification | Policy review reminders, attestation requests |
| Authentication | JWT validation | All endpoints require valid JWT |

### 8.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE MODULE                              │
│                                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │ Policy  │───▶│ Version │───▶│ Review  │───▶│ Approve │              │
│  │ Create  │    │ Control │    │ Workflow│    │ Publish │              │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘              │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │              GOVERNANCE_AUDIT_LOG (Immutable)               │       │
│  └─────────────────────────────────────────────────────────────┘       │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │Compliance│    │  Risk   │    │ Controls│    │Reporting│              │
│  │ Module   │    │ Module  │    │ Module  │    │ Module  │              │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Policy Lifecycle Edge Cases

| Edge Case | Handling | Error Code |
|---|---|---|
| Submit non-Draft version | Rejected with 400 | INVALID_TRANSITION |
| Approve from wrong state | Rejected with 400 | INVALID_TRANSITION |
| Reject without reason | Rejected with 400 | REJECTION_REASON_REQUIRED |
| Self-approval attempt | Blocked by SoD | SELF_APPROVAL_NOT_ALLOWED |
| Duplicate active versions | Prevented | ACTIVE_VERSION_CONFLICT |
| Invalid effective date | Rejected with 400 | INVALID_EFFECTIVE_DATE |
| Missing required fields | Rejected with 422 | REQUIRED_FIELD_MISSING |
| Policy not found | Returns 404 | POLICY_NOT_FOUND |
| Version not found | Returns 404 | VERSION_NOT_FOUND |

### 9.2 Exception Edge Cases

| Edge Case | Handling |
|---|---|
| Exception past expiry date | Auto-transitioned to Expired by background job |
| Exception with no expiry date | Remains Active indefinitely |
| Approving already-expired exception | Allowed (manual override) |
| Concurrent expiry processing | Safe-to-repeat pattern ensures idempotency |

### 9.3 Committee Edge Cases

| Edge Case | Handling |
|---|---|
| Quorum not met | Computed and flagged; decisions still recorded |
| Cancelled meeting | Status set to Cancelled; no decisions recorded |
| Duplicate meeting number | Not prevented (business rule) |
| Empty agenda items | Allowed (no validation) |

### 9.4 Attachment Edge Cases

| Edge Case | Handling |
|---|---|
| File exceeds 25MB | Rejected with 400 |
| Disallowed file type | Rejected with 400 |
| File checksum mismatch | Flagged in scan status |
| Orphaned attachment | Retained (soft delete only) |

---

## 10. Security Considerations

### 10.1 Authentication & Authorization
- All endpoints require valid JWT (HS256, 8-hour expiry)
- Role-based access control enforced at API layer
- SoD constraints enforced at service layer (cannot be bypassed)

### 10.2 Audit Trail Integrity
- Cryptographic chaining: each audit entry includes SHA-256 hash of previous entry
- Append-only audit log (no modifications allowed)
- Tamper detection via `verifyAuditChainIntegrity()` function

### 10.3 File Upload Security
- File type validation via magic bytes (not just extension)
- Maximum file size: 25MB
- Malware scanning placeholder (`scanFileForMalware()`)
- Checksum verification (SHA-256)

### 10.4 Rate Limiting
- 30 requests per minute per user
- In-memory rate limit tracking
- Returns 429 when exceeded

### 10.5 Data Classification
- Policies support classification levels: Internal, Confidential, Public, Restricted
- Classification visible in policy detail and reports

---

## 11. Audit Trail & Compliance

### 11.1 Audit Log Structure
- Every state transition recorded with: actor, timestamp, from/to states, reason, IP address
- Cryptographic chaining prevents tampering
- Audit log is append-only and immutable

### 11.2 Compliance Mapping
- Policies map to regulatory frameworks (ISO 27001, PCI DSS, etc.)
- Policy attestation provides evidence of employee awareness
- Committee decisions provide governance oversight evidence
- Exception management demonstrates risk-based decision making

### 11.3 Retention
- All versions retained (no hard deletes)
- Superseded versions marked but not removed
- Audit log entries permanently retained

---

*End of Governance Module Technical Documentation*
