# WADJET GRC — Asset Management Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Asset Management  
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

The Asset Management Module provides comprehensive IT asset inventory and classification capabilities for the WADJET GRC platform. It enables organizations to maintain a centralized repository of all assets (applications, databases, infrastructure) with criticality ratings, ownership, location tracking, and domain classification. Assets serve as the foundation for risk assessment, compliance mapping, and control implementation.

### 1.1 Scope

| Capability | Description |
|---|---|
| Asset Inventory | Centralized repository of all IT assets |
| Asset Classification | Type, criticality, domain, and status classification |
| Asset Grouping | Logical grouping of related assets |
| Ownership Tracking | Asset owner and team assignment |
| Location Tracking | Physical and logical location |
| Criticality Rating | Critical, High, Medium, Low classification |
| Status Management | Operational, In Deployment, Decommissioned |
| Domain Mapping | Assets mapped to risk domains |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | mock-data.mjs (ASSETS, ASSET_GROUPS) |
| Frontend | React (JSX) with React Router, TanStack Query |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ASSET MANAGEMENT MODULE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │  ManageAssets    │  │  AssetGroups     │                     │   │
│  │  │  (CRUD + List)   │  │  (CRUD + List)   │                     │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                     │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                   │
│  ┌───────────┼──────────────────────┼───────────────────────────────┐   │
│  │           ▼                      ▼                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              API Layer (mock-server.mjs)                 │   │   │
│  │  │  /api/assets  /api/asset-groups                          │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              Data Layer (mock-data.mjs)                  │  │   │
│  │  │  ASSETS[]  ASSET_GROUPS[]                                │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Model Relationships

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AssetGroup  │────▶│     Asset        │────▶│     Domain      │
│              │ 1:N │                  │ N:1 │                 │
│ - name       │     │ - name           │     │ - name          │
│ - description│     │ - type           │     │ - status        │
│ - status     │     │ - owner          │     │ - scoringMethod │
└──────────────┘     │ - location       │     └─────────────────┘
                     │ - criticality    │
                     │ - status         │     ┌─────────────────┐
                     │ - domain         │────▶│     Risk        │
                     └──────────────────┘     │                 │
                                              │ - assetSystem   │
                                              └─────────────────┘
```

---

## 3. Functionalities

### 3.1 Asset Management

#### 3.1.1 Asset Creation
- Define asset with name, type, owner, location
- Assign criticality rating
- Map to risk domain
- Set operational status

#### 3.1.2 Asset Types
| Type | Description | Examples |
|---|---|---|
| Application | Software applications | Core Banking System, Mobile Banking App |
| Database | Data storage systems | Customer Database, Data Warehouse |
| Infrastructure | Hardware and network | Email Gateway, Branch Network |
| Service | Cloud services | SaaS platforms, IaaS resources |

#### 3.1.3 Asset Criticality Levels
| Level | Description | Impact |
|---|---|---|
| Critical | Business-essential, no workaround | Severe business impact if unavailable |
| High | Important, limited workaround | Significant business impact |
| Medium | Supporting function | Moderate business impact |
| Low | Non-essential | Minimal business impact |

#### 3.1.4 Asset Status Values
| Status | Description |
|---|---|
| Operational | Fully functional and in use |
| In Deployment | Being deployed or configured |
| Maintenance | Under maintenance |
| Decommissioned | Retired and no longer in use |

### 3.2 Asset Group Management

#### 3.2.1 Group Creation
- Define logical groupings of assets
- Group name and description
- Active/Inactive status

#### 3.2.2 Predefined Groups
| Group | Description |
|---|---|
| Core Banking | Systems supporting core banking operations |
| Digital Channels | Customer-facing digital channels |
| Payments Infrastructure | Payment processing infrastructure |

### 3.3 Asset-Domain Mapping

- Each asset mapped to a risk domain
- Domain determines applicable risk methodology
- Multiple assets can share the same domain
- Domain mapping drives risk assessment criteria

### 3.4 Asset Search & Filtering

- Filter by type, criticality, status, domain, owner
- Search by name or description
- Sort by any column
- Export filtered results

---

## 4. Data Structures

### 4.1 Asset Object

```javascript
{
  _id: "a-1",
  name: "Core Banking System",
  type: "Application",              // Application, Database, Infrastructure, Service
  owner: "IT Operations",
  location: "Primary DC",          // Primary DC, Secondary DC, Cloud, Branches
  criticality: "Critical",         // Critical, High, Medium, Low
  status: "Operational",           // Operational, In Deployment, Maintenance, Decommissioned
  domain: "Information Security",  // Risk domain classification
}
```

### 4.2 Asset Group Object

```javascript
{
  _id: "ag-1",
  name: "Core Banking",
  description: "Systems supporting core banking operations",
  status: "Active",                // Active, Inactive
  assetIds: ["a-1", "a-5"],        // References to assets
}
```

### 4.3 Asset Reference in Risk Object

```javascript
// Risk objects reference assets via:
{
  _id: "risk-1",
  assetSystem: "Core Banking System",  // Asset name reference
  asset: null,                          // Direct asset link (when selected)
}
```

### 4.4 Asset Reference in Compliance Object

```javascript
// Compliance requirements reference assets via:
{
  _id: "creq-1",
  relatedAssets: ["a-1", "a-2"],   // JSON array of asset IDs
}
```

---

## 5. User Roles & Permissions

### 5.1 Asset Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| asset.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| asset.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| asset.edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| asset.delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| asset_group.manage | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 5.2 Report Permissions (Asset)

| Role | Report Generation |
|---|---|
| admin | All asset reports |
| board | All asset reports |
| ciso | asset.view + report.generate |
| cro | Limited asset reports |
| risk_owner | asset.view + report.generate |
| analyst | Limited asset reports |
| viewer | report.generate only |

---

## 6. Workflows

### 6.1 Asset Lifecycle Workflow

```
┌─────────────────┐
│ Asset Created   │
│ (In Deployment) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Asset Deployed  │
│ (Operational)   │
└────────┬────────┘
         │
         ├──── Maintenance ────▶ Return to Operational
         │
         ▼
┌─────────────────┐
│ Asset           │
│ Decommissioned  │
└─────────────────┘
```

### 6.2 Asset Risk Assessment Workflow

```
┌─────────────────┐
│ Asset Inventory │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Domain Mapping  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Risk Assessment │
│ (Risks linked   │
│  to asset)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Control         │
│ Implementation  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compliance      │
│ Mapping         │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Asset Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assets` | List all assets |
| GET | `/api/assets/:id` | Get asset detail |
| POST | `/api/assets` | Create asset |
| PUT | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete asset |

### 7.2 Asset Group Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/asset-groups` | List all groups |
| GET | `/api/asset-groups/:id` | Get group detail |
| POST | `/api/asset-groups` | Create group |
| PUT | `/api/asset-groups/:id` | Update group |
| DELETE | `/api/asset-groups/:id` | Delete group |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Risk-Asset linking | Risks reference asset systems |
| Compliance | Asset-Requirement mapping | Assets subject to requirements |
| Controls | Asset-Control mapping | Controls protect assets |
| Audit | Asset-Scope mapping | Audits scope assets |
| Governance | Asset-Policy mapping | Policies govern assets |
| Reporting | Asset reports | Report engine consumes asset data |
| Context | Asset-Organization mapping | Assets belong to organizations |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ASSET MANAGEMENT MODULE                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                      Asset Inventory                           │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │     │
│  │  │Application│ │Database │ │Infrastructure│ │Service │        │     │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │     │
│  │       │            │            │            │               │     │
│  │       └────────────┴────────────┴────────────┘               │     │
│  │                          │                                    │     │
│  │                          ▼                                    │     │
│  │                   ┌─────────────┐                             │     │
│  │                   │Domain Mapping│                             │     │
│  │                   └──────┬──────┘                             │     │
│  └──────────────────────────┼───────────────────────────────────┘     │
│                             │                                         │
│  ┌──────────────────────────┼───────────────────────────────────┐     │
│  │                          ▼                                    │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │     │
│  │  │  Risk   │  │Compliance│ │ Controls│ │  Audit  │        │     │
│  │  │ Module  │  │ Module   │ │ Module  │ │ Module  │        │     │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Asset Edge Cases

| Edge Case | Handling |
|---|---|
| Deleting asset with linked risks | Prevented (foreign key constraint) |
| Duplicate asset name | Allowed (different IDs) |
| Asset with no owner | Validation error |
| Changing asset domain | Affects linked risk assessments |
| Decommissioning asset | Linked risks flagged for review |

### 9.2 Asset Group Edge Cases

| Edge Case | Handling |
|---|---|
| Empty group | Allowed |
| Duplicate group name | Allowed (different IDs) |
| Deleting group with assets | Assets retained (group reference removed) |
| Circular group nesting | Not supported (flat structure) |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Asset creation restricted to authorized roles
- Asset deletion restricted to admins

### 10.2 Data Sensitivity
- Asset criticality visible to all authorized users
- Location data may be sensitive
- Owner information used for accountability

---

*End of Asset Management Module Technical Documentation*
