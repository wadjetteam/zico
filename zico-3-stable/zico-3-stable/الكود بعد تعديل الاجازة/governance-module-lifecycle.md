# 📘 WADJET GRC — Governance Module Complete Lifecycle

## دورة حياة وحدة الحوكمة من البداية للإغلاق

---

# الفصل الأول: نظرة عامة على وحدة الحوكمة

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GOVERNANCE MODULE ARCHITECTURE                             ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │                    GOVERNANCE LIFECYCLE                                │   ║
║   │                                                                       │   ║
║   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │   ║
║   │  │  DEFINE  │──▶│ APPROVE  │──▶│ IMPLEMENT│──▶│ MONITOR  │        │   ║
║   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │   ║
║   │       │              │              │              │                │   ║
║   │       ▼              ▼              ▼              ▼                │   ║
║   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │   ║
║   │  │ Policies │   │ Versions │   │  Roles   │   │ Audits   │        │   ║
║   │  │          │   │          │   │          │   │          │        │   ║
║   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │   ║
║   │                                                                       │   ║
║   │  ┌──────────────────────────────────────────────────────────────┐   │   ║
║   │  │                    SUPPORTING MODULES                         │   │   ║
║   │  │  • Committees  • Exceptions  • Documents  • Executive Dashboard│   │   ║
║   │  └──────────────────────────────────────────────────────────────┘   │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# الفصل الثاني: المكونات الرئيسية للحوكمة

## 2.1 هيكل الموديولات

```
Governance Module
│
├── 📋 Policy Management (إدارة السياسات)
│   ├── Create Policy
│   ├── Version Control
│   ├── Approval Workflow
│   └── Review & Renewal
│
├── 👥 Roles & Permissions (الأدوار والصلاحيات)
│   ├── Role Definition
│   ├── Permission Matrix
│   └── User Assignment
│
├── 🏛️ Committees (اللجان)
│   ├── Committee Creation
│   ├── Member Management
│   ├── Meeting Schedule
│   └── Decision Tracking
│
├── 📄 Document Program (برنامج المستندات)
│   ├── Document Repository
│   ├── Version Control
│   └── Distribution Tracking
│
├── ⚠️ DefineExceptions (الاستثناءات)
│   ├── Exception Request
│   ├── Approval Workflow
│   └── Expiry Tracking
│
└── 📊 Executive Dashboard (لوحة المعلومات التنفيذية)
    ├── KPI Metrics
    ├── Compliance Status
    └── Risk Overview
```

---

# الفصل الثالث: دورة حياة السياسة (Policy Lifecycle)

## 3.1 المراحل الكاملة

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    POLICY LIFECYCLE                                          ║
║                                                                              ║
║   Stage 1        Stage 2        Stage 3        Stage 4        Stage 5       ║
║   ───────        ───────        ───────        ───────        ───────       ║
║   DRAFT   ──▶   REVIEW   ──▶   APPROVE  ──▶   PUBLISH ──▶   ACTIVE        ║
║      │              │              │              │              │          ║
║      ▼              ▼              ▼              ▼              ▼          ║
║   Created      Reviewed      Approved      Published     Effective       ║
║   by Owner     by Committee  by Board      to All        & Enforced      ║
║                                                                              ║
║                                                        │          │        ║
║                                                        ▼          ▼        ║
║                                                     REVIEW    ARCHIVE     ║
║                                                     (Annual)  (Expired)    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 3.2 تفاصيل كل مرحلة

### Stage 1: DRAFT (مسودة)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POLICY CREATION (إنشاء السياسة)                                            │
│  ───────────────────────────────                                            │
│                                                                             │
│  Responsible: Policy Owner (مالك السياسة)                                  │
│                                                                             │
│  Actions:                                                                   │
│  ────────                                                                   │
│  1. Define Policy Title & Description                                       │
│  2. Select Category (Information Security, Data Privacy, etc.)             │
│  3. Set Classification (Internal, Confidential, Public)                    │
│  4. Write Policy Content                                                    │
│  5. Set Version Number (default: 1.0)                                      │
│  6. Assign Owner & Department                                               │
│  7. Set Review Period (default: 365 days)                                  │
│  8. Define Applicable Regions & Scope                                       │
│                                                                             │
│  Fields Required:                                                           │
│  ─────────────────                                                          │
│  • title: عنوان السياسة                                                     │
│  • description: وصف السياسة                                                 │
│  • category: التصنيف                                                        │
│  • classification: مستوى السرية                                             │
│  • content: محتوى السياسة                                                   │
│  • owner: المالك                                                            │
│  • department: القسم                                                        │
│  • reviewPeriodDays: فترة المراجعة (بالأيام)                                │
│                                                                             │
│  Next Stage: SUBMIT FOR REVIEW                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage 2: REVIEW (مراجعة)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POLICY REVIEW (مراجعة السياسة)                                             │
│  ──────────────────────────────                                             │
│                                                                             │
│  Responsible: Committee / Reviewer (لجنة المراجعة)                          │
│                                                                             │
│  Actions:                                                                   │
│  ────────                                                                   │
│  1. Review Policy Content                                                   │
│  2. Check Regulatory Compliance                                             │
│  3. Verify Alignment with Other Policies                                    │
│  4. Provide Feedback / Comments                                             │
│  5. Approve or Reject or Request Changes                                    │
│                                                                             │
│  Review Criteria:                                                           │
│  ────────────────                                                           │
│  ✓ Legal and Regulatory Compliance                                          │
│  ✓ Alignment with Organizational Objectives                                │
│  ✓ Clarity and Understandability                                            │
│  ✓ Practicality and Implementability                                        │
│  ✓ Consistency with Existing Policies                                       │
│                                                                             │
│  Possible Outcomes:                                                         │
│  ─────────────────                                                          │
│  • APPROVED → Move to Stage 3 (APPROVE)                                    │
│  • CHANGES REQUESTED → Return to Stage 1 (DRAFT)                           │
│  • REJECTED → Archive                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage 3: APPROVE (اعتماد)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POLICY APPROVAL (اعتماد السياسة)                                           │
│  ───────────────────────────────                                            │
│                                                                             │
│  Responsible: Board / Senior Management (مجلس الإدارة / الإدارة العليا)      │
│                                                                             │
│  Actions:                                                                   │
│  ────────                                                                   │
│  1. Final Review of Policy                                                 │
│  2. Verify All Comments Addressed                                           │
│  3. Sign-off / Digital Approval                                             │
│  4. Set Effective Date                                                      │
│                                                                             │
│  Approval Levels:                                                           │
│  ────────────────                                                           │
│  • Tier 1: Department Head (سياسات داخلية)                                 │
│  • Tier 2: CISO / CTO (سياسات أمنية)                                       │
│  • Tier 3: Board of Directors (سياسات مؤسسية)                               │
│                                                                             │
│  Next Stage: PUBLISH                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage 4: PUBLISH (نشر)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POLICY PUBLICATION (نشر السياسة)                                           │
│  ───────────────────────────────                                            │
│                                                                             │
│  Responsible: Policy Owner / GRC Admin                                      │
│                                                                             │
│  Actions:                                                                   │
│  ────────                                                                   │
│  1. Publish Policy to All Stakeholders                                      │
│  2. Send Notifications                                                      │
│  3. Update Policy Register                                                  │
│  4. Schedule Training if Required                                           │
│  5. Set Effective Date                                                      │
│                                                                             │
│  Publication Checklist:                                                     │
│  ─────────────────────                                                      │
│  ✓ All approvals obtained                                                   │
│  ✓ Effective date set                                                       │
│  ✓ Stakeholders notified                                                    │
│  ✓ Training materials prepared                                              │
│  ✓ Acknowledgment tracking enabled                                          │
│                                                                             │
│  Next Stage: ACTIVE                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage 5: ACTIVE (نشط)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POLICY ACTIVE (السياسة نشطة)                                               │
│  ───────────────────────────                                                │
│                                                                             │
│  Responsible: All Employees / Compliance Team                               │
│                                                                             │
│  Actions:                                                                   │
│  ────────                                                                   │
│  1. Policy is in Effect                                                     │
│  2. Compliance Monitoring                                                   │
│  3. Annual Review Scheduled                                                 │
│  4. Exceptions Tracked                                                      │
│                                                                             │
│  Monitoring Metrics:                                                        │
│  ──────────────────                                                         │
│  • Compliance Rate                                                          │
│  • Exception Requests                                                       │
│  • Training Completion                                                      │
│  • Incident Reports                                                         │
│                                                                             │
│  Triggers for Review:                                                       │
│  ────────────────────                                                       │
│  • Annual review date reached                                               │
│  • Regulatory change                                                        │
│  • Organizational change                                                    │
│  • Incident or breach                                                       │
│  • Management request                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل الرابع: مصفوفة RACI للحوكمة

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  RACI MATRIX — GOVERNANCE MODULE                                            ║
╠═════════════════════════╦═══════╦═══════╦═══════╦═══════╦════════════════════╣
║ Activity                ║ 1st L ║ 2nd L ║ 3rd L ║ CISO ║ Board              ║
╠═════════════════════════╬═══════╬═══════╬═══════╬═══════╬════════════════════╣
║ Create Policy           ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Review Policy           ║   C   ║   R   ║   I   ║   A   ║   I               ║
║ Approve Policy (Tier 1) ║   C   ║   R   ║   I   ║   A   ║   I               ║
║ Approve Policy (Tier 2) ║   I   ║   C   ║   I   ║   A   ║   I               ║
║ Approve Policy (Tier 3) ║   I   ║   C   ║   I   ║   C   ║   A               ║
║ Publish Policy          ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Monitor Compliance      ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Annual Policy Review    ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Create Role             ║   I   ║   R   ║   I   ║   A   ║   I               ║
║ Assign Permissions      ║   I   ║   R   ║   I   ║   A   ║   I               ║
║ Create Committee        ║   I   ║   R   ║   I   ║   C   ║   A               ║
║ Committee Meeting       ║   C   ║   R   ║   I   ║   C   ║   A               ║
║ Grant Exception         ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Audit Governance        ║   I   ║   C   ║   R   ║   C   ║   A               ║
║ Executive Reporting     ║   I   ║   R   ║   I   ║   C   ║   A               ║
╠═════════════════════════╬═══════╬═══════╬═══════╬═══════╬════════════════════╣
║ R = Responsible         ║ 1st Line = Business/Operations                    ║
║ A = Accountable         ║ 2nd Line = Risk/Compliance                        ║
║ C = Consulted           ║ 3rd Line = Internal Audit                         ║
║ I = Informed            ║                                                    ║
╚═════════════════════════╩═════════════════════════════════════════════════╝
```

---

# الفصل الخامس: دورة حياة الأدوار والصلاحيات

## 5.1 إنشاء الدور (Role Creation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ROLE LIFECYCLE                                                              │
│  ────────────                                                                │
│                                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  DEFINE  │──▶│ ASSIGN   │──▶│ ACTIVE   │──▶│ REVIEW   │                │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                │
│       │              │              │              │                        │
│       ▼              ▼              ▼              ▼                        │
│   Create Role    Assign Users   Role in Use   Annual Review                │
│   Set Permissions  to Role      Enforced      Update/Deactivate            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 مصفوفة الصلاحيات (Permission Matrix)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERMISSION MATRIX BY ROLE                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  Module              │ Admin │ Manager │ Analyst │ Auditor │ Viewer        │
│  ────────────────────┼───────┼─────────┼─────────┼─────────┼───────        │
│  Policy Management   │  Full │  Edit   │  View   │  View   │  View         │
│  Risk Management     │  Full │  Edit   │  Edit   │  View   │  View         │
│  Control Management  │  Full │  Edit   │  Edit   │  View   │  View         │
│  Compliance          │  Full │  Edit   │  Edit   │  View   │  View         │
│  Audit               │  Full │  View   │  View   │  Full   │  View         │
│  Governance          │  Full │  Edit   │  View   │  View   │  View         │
│  Context Org         │  Full │  Edit   │  View   │  View   │  View         │
│  Settings            │  Full │  View   │  None   │  None   │  None         │
│  Reporting           │  Full │  Edit   │  View   │  View   │  View         │
│                                                                             │
│  Legend: Full = Create/Edit/Delete/View | Edit = Create/Edit/View          │
│          View = Read-Only | None = No Access                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل السادس: دورة حياة اللجان

## 6.1 إنشاء اللجنة (Committee Creation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMMITTEE LIFECYCLE                                                         │
│  ────────────────                                                            │
│                                                                             │
│  Stage 1: ESTABLISH                                                          │
│  ────────────────                                                            │
│  • Define Committee Name & Type                                             │
│  • Set Charter / Mandate                                                    │
│  • Appoint Chairperson                                                      │
│  • Set Meeting Frequency                                                    │
│  • Define Quorum Requirements                                               │
│                                                                             │
│  Committee Types:                                                           │
│  ────────────────                                                           │
│  • Board Committee (لجنة مجلس الإدارة)                                     │
│  • Audit Committee (لجنة المراجعة)                                          │
│  • Risk Committee (لجنة المخاطر)                                           │
│  • Policy Board (لجنة السياسات)                                             │
│  • Other (أخرى)                                                            │
│                                                                             │
│  Stage 2: OPERATE                                                           │
│  ────────────────                                                           │
│  • Schedule Meetings                                                        │
│  • Track Attendance                                                         │
│  • Record Decisions                                                         │
│  • Monitor Action Items                                                     │
│                                                                             │
│  Stage 3: REVIEW                                                            │
│  ────────────────                                                           │
│  • Annual Effectiveness Review                                              │
│  • Member Rotation                                                          │
│  • Charter Update                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل السابع: دورة حياة الاستثناءات

## 7.1 طلب الاستثناء (Exception Request)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXCEPTION LIFECYCLE                                                         │
│  ────────────────                                                            │
│                                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │ REQUEST  │──▶│ REVIEW   │──▶│ DECIDE   │──▶│ TRACK    │                │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                │
│       │              │              │              │                        │
│       ▼              ▼              ▼              ▼                        │
│   Submit         Evaluate      Approve/       Monitor                      │
│   Justification  Risk          Reject         Expiry                       │
│                                                                             │
│  Exception Types:                                                           │
│  ────────────────                                                           │
│  • Technical (تقني) — Control cannot be implemented technically             │
│  • Operational (تشغيلي) — Control conflicts with operations                │
│  • Third-Party (طرف ثالث) — Vendor-related limitation                      │
│                                                                             │
│  Exception Fields:                                                          │
│  ────────────────                                                           │
│  • Policy/Control being excepted                                            │
│  • Justification                                                            │
│  • Risk Assessment                                                          │
│  • Compensating Controls                                                    │
│  • Expiry Date                                                              │
│  • Approver                                                                 │
│                                                                             │
│  Approval Levels:                                                           │
│  ────────────────                                                           │
│  • < 30 days: Department Head                                               │
│  • 30-90 days: CISO                                                         │
│  • > 90 days: Risk Committee                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل الثامن: سير عمل الموافقات (Approval Workflow)

## 8.1 مستويات الموافقة

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  APPROVAL WORKFLOW                                                           │
│  ────────────────                                                            │
│                                                                             │
│  Level 1: Department Head (رئيس القسم)                                     │
│  ──────────────────────────────────────                                     │
│  • Internal policies                                                        │
│  • Operational procedures                                                   │
│  • Exceptions < 30 days                                                     │
│                                                                             │
│  Level 2: CISO / CTO (مدير أمن المعلومات / المدير التقني)                  │
│  ───────────────────────────────────────────────────────────                │
│  • Security policies                                                        │
│  • Risk treatment plans                                                     │
│  • Exceptions 30-90 days                                                    │
│  • Control changes                                                          │
│                                                                             │
│  Level 3: Risk Committee (لجنة المخاطر)                                    │
│  ────────────────────────────────────────                                   │
│  • High-risk decisions                                                      │
│  • Exceptions > 90 days                                                     │
│  • Policy exceptions                                                        │
│                                                                             │
│  Level 4: Board of Directors (مجلس الإدارة)                                │
│  ──────────────────────────────────────────                                 │
│  • Enterprise policies                                                      │
│  • Strategic risk decisions                                                 │
│  • Annual policy review                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل التاسع: المؤشرات والتقارير

## 9.1 مؤشرات الأداء الرئيسية (KPIs)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GOVERNANCE KPIs                                                            │
│  ────────────                                                                │
│                                                                             │
│  Policy Management KPIs:                                                    │
│  ───────────────────────                                                    │
│  • Total Policies: إجمالي السياسات                                          │
│  • Published Policies: السياسات المنشورة                                    │
│  • Pending Review: قيد المراجعة                                            │
│  • Pending Approval: قيد الاعتماد                                           │
│  • Overdue Reviews: المراجعات المتأخرة                                     │
│  • Compliance Rate: معدل الامتثال                                           │
│                                                                             │
│  Committee KPIs:                                                            │
│  ────────────                                                               │
│  • Active Committees: اللجان النشطة                                         │
│  • Meetings Held: الاجتماعات المنعقدة                                       │
│  • Decisions Made: القرارات المتخذة                                         │
│  • Action Items Completed: الإجراءات المكتملة                               │
│                                                                             │
│  Exception KPIs:                                                            │
│  ────────────                                                               │
│  • Active Exceptions: الاستثناءات النشطة                                    │
│  • Pending Approval: قيد الموافقة                                          │
│  • Expired Exceptions: الاستثناءات المنتهية                                 │
│  • Exception Rate: معدل الاستثناءات                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل العاشر: ملخص المعادلات والقواعد

## 10.1 قواعد العمل (Business Rules)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GOVERNANCE BUSINESS RULES                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  1. Policy Status Transition:                                               │
│     ─────────────────────────                                               │
│     DRAFT → REVIEW → APPROVED → PUBLISHED → ACTIVE → REVIEW/ARCHIVE       │
│                                                                             │
│  2. Version Control:                                                        │
│     ────────────────                                                        │
│     • Major changes: 1.0 → 2.0                                              │
│     • Minor changes: 1.0 → 1.1                                              │
│     • Each version has full audit trail                                     │
│                                                                             │
│  3. Review Cycle:                                                           │
│     ─────────────                                                           │
│     • Default: 365 days                                                     │
│     • High-risk policies: 180 days                                          │
│     • Regulatory policies: per regulation requirement                       │
│                                                                             │
│  4. Exception Rules:                                                        │
│     ──────────────                                                          │
│     • Max 90 days without Risk Committee approval                           │
│     • Must have compensating controls                                       │
│     • Must be reviewed monthly                                              │
│                                                                             │
│  5. Committee Rules:                                                        │
│     ──────────────                                                          │
│     • Quorum required for decisions                                         │
│     • Minutes recorded for all meetings                                     │
│     • Action items tracked to completion                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل الحادي عشر: هيكل البيانات

## 11.1 Policy Entity

```javascript
{
  _id: "policy-1",
  title: "Information Security Policy",
  description: "Comprehensive security policy",
  category: "Information Security",
  classification: "Internal",        // Internal, Confidential, Public
  version: "1.0",
  content: "Policy content...",
  tags: ["security", "compliance"],
  status: "Draft",                  // Draft, Review, Approved, Published, Active, Archived
  owner: "CISO",
  ownerUserId: "u-admin",
  department: "IT Security",
  effectiveDate: "2026-01-01",
  expirationDate: "2027-01-01",
  applicableTo: "All Employees",
  applicableRegions: ["Egypt", "UAE"],
  regulatoryBasis: "ISO 27001",
  reviewPeriodDays: 365,
  sourceTemplateId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  approvedBy: null,
  approvedAt: null,
  publishedAt: null,
}
```

## 11.2 Role Entity

```javascript
{
  _id: "role-1",
  name: "CISO",
  description: "Chief Information Security Officer",
  status: "Active",
  permissionsMatrix: {
    policy: "manage",
    compliance: "manage",
    audit: "view",
    context: "manage",
    governance: "manage",
    settings: "manage",
    reporting: "manage",
  },
  usersAssigned: 1,
  createdAt: "2026-01-01T00:00:00Z",
}
```

## 11.3 Committee Entity

```javascript
{
  _id: "cm-1",
  name: "Risk Committee",
  type: "Risk Committee",
  chair: { _id: "u-admin", name: "System Administrator" },
  charter: "Oversee enterprise risk management",
  meetingFrequency: "Quarterly",
  quorumRequired: 3,
  status: "Active",
  members: [
    { _id: "cm-m1", user: { _id: "u-admin", fullName: "System Administrator" }, memberRole: "Chair" },
    { _id: "cm-m2", user: { _id: "u-manager", fullName: "Morgan Lee" }, memberRole: "Member" }
  ],
  createdAt: "2026-01-01T00:00:00Z",
}
```

---

# الفصل الثاني عشر: API Endpoints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GOVERNANCE API ENDPOINTS                                                   │
│  ──────────────────────                                                     │
│                                                                             │
│  Policies:                                                                  │
│  ────────                                                                   │
│  GET    /api/policies                    — List all policies                │
│  GET    /api/policies/:id                — Get policy details               │
│  POST   /api/policies                    — Create new policy                │
│  PUT    /api/policies/:id                — Update policy                    │
│  DELETE /api/policies/:id                — Delete policy                    │
│  GET    /api/policies/stats              — Get policy statistics            │
│                                                                             │
│  Roles:                                                                     │
│  ────                                                                       │
│  GET    /api/governance/roles            — List all roles                   │
│  GET    /api/governance/roles/:id        — Get role details                  │
│  POST   /api/governance/roles            — Create new role                  │
│  PUT    /api/governance/roles/:id        — Update role                      │
│  DELETE /api/governance/roles/:id        — Delete role                      │
│                                                                             │
│  Committees:                                                                │
│  ──────────                                                                 │
│  GET    /api/governance/committees       — List all committees              │
│  GET    /api/governance/committees/:id   — Get committee details            │
│  POST   /api/governance/committees       — Create new committee             │
│  PUT    /api/governance/committees/:id   — Update committee                 │
│  DELETE /api/governance/committees/:id   — Delete committee                 │
│                                                                             │
│  Exceptions:                                                                │
│  ──────────                                                                 │
│  GET    /api/governance/exceptions       — List all exceptions              │
│  POST   /api/governance/exceptions       — Create exception request         │
│  PUT    /api/governance/exceptions/:id   — Update exception                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**المصدر:** WADJET GRC Governance Module v2.0
**التاريخ:** 2026-08-22
**الحالة:** Production Ready
