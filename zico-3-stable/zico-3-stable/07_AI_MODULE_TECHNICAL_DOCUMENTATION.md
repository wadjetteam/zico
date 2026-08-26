# WADJET GRC — AI Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Artificial Intelligence  
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

The AI Module provides artificial intelligence-powered insights and assistance for the WADJET GRC platform. It includes a Risk Insights Dashboard for data-driven risk analysis and an AI Assistant for natural language interaction with the GRC system. The module leverages aggregated data from all other modules to provide intelligent recommendations and automated analysis.

### 1.1 Scope

| Capability | Description |
|---|---|
| Risk Insights Dashboard | AI-powered risk analytics and trend identification |
| AI Assistant | Natural language chat interface for GRC queries |
| Trend Analysis | Historical risk and compliance trend identification |
| Anomaly Detection | Identification of unusual patterns in GRC data |
| Recommendation Engine | Automated recommendations for risk treatment |
| Predictive Analytics | Forecasting risk and compliance trajectories |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | Aggregated from all module data (RISKS, CONTROLS, etc.) |
| Frontend | React (JSX) with React Router, TanStack Query, Framer Motion |
| Visualization | Recharts (charts and graphs) |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AI MODULE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │   Insights       │  │   Assistant      │                     │   │
│  │  │   (Dashboard)    │  │   (Chat UI)      │                     │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                     │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                   │
│  ┌───────────┼──────────────────────┼───────────────────────────────┐   │
│  │           ▼                      ▼                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              API Layer (mock-server.mjs)                 │   │   │
│  │  │  /api/ai/insights  /api/ai/chat                          │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              Data Aggregation Layer                      │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │   │
│  │  │  │  Risks  │ │Controls │ │Compliance│ │  Audit  │     │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                  │  │   │
│  │  │  │  Assets │ │Governance│ │  Gaps   │                  │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘                  │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 AI Insights Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Data Sources   │────▶│  Aggregation     │────▶│  Analysis      │
│                 │     │  Engine          │     │  Engine        │
│ - Risks         │     │                  │     │                │
│ - Controls      │     │ - Consolidate    │     │ - Trends       │
│ - Compliance    │     │ - Normalize      │     │ - Anomalies    │
│ - Audit         │     │ - Correlate      │     │ - Predictions  │
│ - Assets        │     │                  │     │                │
└─────────────────┘     └──────────────────┘     └───────┬────────┘
                                                         │
                                                         ▼
                                                ┌────────────────┐
                                                │  Insights      │
                                                │  Dashboard     │
                                                │                │
                                                │ - KPI Cards    │
                                                │ - Charts       │
                                                │ - Tables       │
                                                │ - Recommendations│
                                                └────────────────┘
```

---

## 3. Functionalities

### 3.1 Risk Insights Dashboard

#### 3.1.1 Key Performance Indicators
- Total risk count by severity level
- Risk treatment distribution (Modify, Retain, Avoid, Share)
- Control effectiveness distribution
- Compliance score trends
- Open vs. closed risk ratio
- Overdue items count

#### 3.1.2 Trend Analysis
- Risk score trends over time
- Control effectiveness trends
- Compliance score progression
- Gap closure rates
- Finding resolution trends

#### 3.1.3 Anomaly Detection
- Risks with sudden score increases
- Controls with declining effectiveness
- Compliance gaps with unusual patterns
- Audit findings clustering

#### 3.1.4 Visual Analytics
- Risk heat maps (5×5 likelihood-impact matrix)
- Severity distribution charts
- Domain risk distribution
- Treatment progress charts
- Control coverage visualization

### 3.2 AI Assistant

#### 3.2.1 Chat Interface
- Natural language question answering
- Context-aware responses
- GRC-specific knowledge base
- Multi-turn conversation support

#### 3.2.2 Query Types Supported
| Query Type | Example |
|---|---|
| Risk queries | "What are the top 5 critical risks?" |
| Compliance queries | "What is our ISO 27001 compliance score?" |
| Control queries | "Which controls are ineffective?" |
| Audit queries | "How many open audit findings?" |
| Asset queries | "List critical assets" |
| Treatment queries | "What risks need treatment?" |

#### 3.2.3 Response Format
- Structured data responses
- Contextual recommendations
- Related entity links
- Confidence indicators

### 3.3 Recommendation Engine

- Automated risk treatment recommendations
- Control improvement suggestions
- Compliance gap prioritization
- Resource allocation optimization

---

## 4. Data Structures

### 4.1 AI Insight Object

```javascript
{
  _id: "insight-1",
  type: "risk_trend",              // risk_trend, anomaly, recommendation, prediction
  title: "Critical Risk Increase",
  description: "Risk R-001 score increased from 16 to 20",
  severity: "High",                // Critical, High, Medium, Low
  entityType: "Risk",
  entityId: "risk-1",
  data: {
    previousScore: 16,
    currentScore: 20,
    changeDate: "2026-08-20T00:00:00Z",
    changeReason: "New threat identified"
  },
  recommendation: "Review and strengthen controls",
  generatedAt: "2026-08-21T10:00:00Z",
  status: "New",                   // New, Acknowledged, Resolved, Dismissed
}
```

### 4.2 Chat Message Object

```javascript
{
  _id: "msg-1",
  conversationId: "conv-1",
  role: "user",                    // user, assistant, system
  content: "What are the top 5 critical risks?",
  timestamp: "2026-08-21T10:00:00Z",
  metadata: {
    queryType: "risk_query",
    entities: ["risk-1", "risk-2", "risk-3", "risk-4", "risk-5"],
  }
}
```

### 4.3 Chat Response Object

```javascript
{
  _id: "msg-2",
  conversationId: "conv-1",
  role: "assistant",
  content: "Here are the top 5 critical risks...",
  timestamp: "2026-08-21T10:00:01Z",
  metadata: {
    data: [
      { rank: 1, riskId: "R-001", title: "Unauthorized access", score: 20 },
      { rank: 2, riskId: "R-008", title: "Ransomware infection", score: 20 },
      { rank: 3, riskId: "R-004", title: "Third-party vendor breach", score: 16 },
      { rank: 4, riskId: "R-013", title: "Insider threat", score: 15 },
      { rank: 5, riskId: "R-007", title: "Fraudulent wire transfers", score: 15 }
    ],
    confidence: 0.95,
    relatedEntities: ["risk-1", "risk-8", "risk-4", "risk-13", "risk-7"]
  }
}
```

### 4.4 Dashboard KPI Object

```javascript
{
  totalRisks: 16,
  criticalRisks: 2,
  highRisks: 4,
  mediumRisks: 6,
  lowRisks: 4,
  openRisks: 12,
  closedRisks: 2,
  acceptedRisks: 2,
  effectiveControls: 5,
  partiallyEffectiveControls: 2,
  ineffectiveControls: 1,
  overallCompliance: 72,
  openFindings: 8,
  overdueItems: 3,
}
```

---

## 5. User Roles & Permissions

### 5.1 AI Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| ai.insights.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ai.insights.acknowledge | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| ai.insights.dismiss | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| ai.assistant.use | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| ai.assistant.manage | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 6. Workflows

### 6.1 Insights Generation Workflow

```
┌─────────────────┐
│ Data Collection │
│ (All Modules)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data            │
│ Aggregation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Analysis        │
│ - Trends        │
│ - Anomalies     │
│ - Patterns      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Insight         │
│ Generation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dashboard       │
│ Display         │
└────────┬────────┘
         │
         ├──── Acknowledge ────▶ Mark as Read
         │
         └──── Dismiss ────▶ Remove from View
```

### 6.2 AI Assistant Workflow

```
┌─────────────────┐
│ User Query      │
│ (Natural        │
│  Language)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query           │
│ Understanding   │
├─────────────────┤
│ - Intent        │
│ - Entities      │
│ - Context       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Retrieval  │
│ (API Calls)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Response        │
│ Generation      │
├─────────────────┤
│ - Structure     │
│ - Format        │
│ - Recommendations│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Response   │
│ Display         │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 AI Insights Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/insights` | Get all AI insights |
| GET | `/api/ai/insights?type=:type` | Get insights by type |
| POST | `/api/ai/insights/:id/acknowledge` | Acknowledge insight |
| POST | `/api/ai/insights/:id/dismiss` | Dismiss insight |
| GET | `/api/ai/insights/dashboard` | Get dashboard KPIs |

### 7.2 AI Assistant Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/chat` | Send message to AI assistant |
| GET | `/api/ai/chat/history` | Get chat conversation history |
| DELETE | `/api/ai/chat/history` | Clear chat history |

### 7.3 Dashboard Summary Endpoint

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Get consolidated dashboard KPIs |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Risk Management | Risk analytics | Risk scores, trends, treatments |
| Compliance | Compliance analytics | Scores, gaps, assessments |
| Controls | Control analytics | Effectiveness, coverage |
| Audit | Audit analytics | Findings, corrective actions |
| Assets | Asset analytics | Criticality, coverage |
| Governance | Governance analytics | Policies, exceptions, attestations |
| Reporting | Insight export | AI insights in reports |

### 8.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AI MODULE                                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                    Data Aggregation                            │     │
│  │                                                               │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │     │
│  │  │  Risks  │ │Controls │ │Compliance│ │  Audit  │           │     │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │     │
│  │       │           │           │           │                 │     │
│  │       └───────────┴───────────┴───────────┘                 │     │
│  │                       │                                     │     │
│  │                       ▼                                     │     │
│  │               ┌─────────────┐                               │     │
│  │               │  Aggregate  │                               │     │
│  │               │  & Analyze  │                               │     │
│  │               └──────┬──────┘                               │     │
│  └──────────────────────┼──────────────────────────────────────┘     │
│                         │                                             │
│  ┌──────────────────────┼──────────────────────────────────────┐     │
│  │                      ▼                                       │     │
│  │  ┌──────────────────────┐  ┌──────────────────────┐        │     │
│  │  │   Insights Dashboard │  │   AI Assistant       │        │     │
│  │  │                      │  │                      │        │     │
│  │  │ - KPI Cards          │  │ - Chat Interface     │        │     │
│  │  │ - Charts             │  │ - Query Processing   │        │     │
│  │  │ - Recommendations    │  │ - Response Generation│        │     │
│  │  └──────────────────────┘  └──────────────────────┘        │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases & Error Handling

### 9.1 Insights Edge Cases

| Edge Case | Handling |
|---|---|
| No data available | Return empty insights with message |
| Data inconsistency | Flag anomaly, log error |
| High insight volume | Prioritize by severity |
| Stale insights | Auto-archive after 30 days |

### 9.2 Assistant Edge Cases

| Edge Case | Handling |
|---|---|
| Ambiguous query | Request clarification |
| No matching data | Return "no results found" |
| Complex query | Break into sub-queries |
| Unsupported query type | Explain limitations |
| Rate limiting | Queue requests |

---

## 10. Security Considerations

### 10.1 Access Control
- All endpoints require valid JWT
- Role-based permissions enforced
- Chat history scoped to user session
- Admin controls for insight management

### 10.2 Data Privacy
- AI processes only authorized data
- No external data transmission (current implementation)
- Chat history ephemeral by default
- Insight data scoped to user permissions

### 10.3 AI Safety
- Confidence thresholds for recommendations
- Human oversight for critical decisions
- Audit trail of AI interactions
- Transparent reasoning display

---

*End of AI Module Technical Documentation*
