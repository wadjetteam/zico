# 📘 WADJET GRC — Risk Management Complete Lifecycle & Methodology

## دورة حياة المخاطرة الكاملة من البداية للإغلاق

---

# الفصل الأول: إطار العمل الكامل

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RISK MANAGEMENT LIFECYCLE                                ║
║                                                                              ║
║   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐  ║
║   │ 1. IDENT │──▶│ 2. ASSESS│──▶│ 3. TREAT │──▶│ 4. MONIT │──▶│ 5.CLOSE│  ║
║   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────┘  ║
║        │              │              │              │              │        ║
║        ▼              ▼              ▼              ▼              ▼        ║
║   Identification   Inherent      Controls      KRIs &       Closure    ║
║   & Registration  Risk          & Residual    Reassessment  & Archive  ║
║                   Assessment     Risk                                     ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐  ║
║   │                    GOVERNANCE LAYER (Continuous)                     │  ║
║   │  • RACI • Override • Approval • Audit Trail • Board Reporting       │  ║
║   └──────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# الفصل الثاني: المعادلات الأساسية (Quick Reference)

## 2.1 حساب التأثير (Impact)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Method 1: Weighted Impact (Default)                                        │
│  ─────────────────────────────────                                          │
│  I_raw = Σ (Sᵢ × Wᵢ)                                                       │
│                                                                             │
│  Where: Sᵢ = Score for criterion i (1-5)                                   │
│         Wᵢ = Weight for criterion i (ΣWᵢ = 1)                              │
│                                                                             │
│  I = round(I_raw)  ← للـ scoring فقط                                      │
│  I_raw يحتفظ به للحسابات الدقيقة                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Method 2: Max Impact                                                       │
│  ─────────────────────                                                      │
│  I = max(S₁, S₂, ..., Sₙ)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Method 3: Average Impact                                                   │
│  ─────────────────────────                                                  │
│  I = mean(S₁, S₂, ..., Sₙ)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Method 4: Matrix Lookup                                                    │
│  ────────────────────────                                                   │
│  I = Matrix[row][col]                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 حساب المخاطرة الذاتية (Inherent Risk)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Method 1: Multiplicative (Default)                                         │
│  ─────────────────────────────────                                          │
│  IR = L × I                                                                 │
│                                                                             │
│  Scale: 1-25 (5×5 Matrix)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Method 2: Weighted Additive                                                │
│  ────────────────────────────                                               │
│  IR = (wL × L + wI × I) × 5                                                 │
│                                                                             │
│  Where: wL = likelihood weight, wI = impact weight (wL + wI = 1)           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Method 3: Matrix Lookup                                                    │
│  ────────────────────────                                                   │
│  IR = Matrix[L-1][I-1]                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 حساب فعالية الرقابة (Control Effectiveness)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Factor-Based Model (Default)                                               │
│  ────────────────────────────                                               │
│  CE = Σ (Fⱼ × Wⱼ)                                                          │
│                                                                             │
│  Where: Fⱼ = Factor score (0-100)                                          │
│         Wⱼ = Factor weight (ΣWⱼ = 1)                                       │
│                                                                             │
│  Default Factors:                                                           │
│  ┌──────────────┬────────┬────────────────────────────────┐                │
│  │ Factor       │ Weight │ Description                    │                │
│  ├──────────────┼────────┼────────────────────────────────┤                │
│  │ Design       │  25%   │ فعالية التصميم                 │                │
│  │ Operating    │  35%   │ فعالية التشغيل                 │                │
│  │ Coverage     │  25%   │ نسبة التغطية                   │                │
│  │ Testing      │  15%   │ نتيجة الاختبار                 │                │
│  └──────────────┴────────┴────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Band-Based Model (Alternative)                                             │
│  ──────────────────────────────                                             │
│  CE = Weights[Rating]                                                       │
│                                                                             │
│  ┌──────────────────────┬────────┐                                         │
│  │ Rating               │   CE   │                                         │
│  ├──────────────────────┼────────┤                                         │
│  │ Effective            │  75%   │                                         │
│  │ Partially Effective  │  50%   │                                         │
│  │ Ineffective          │  25%   │                                         │
│  │ Not Assessed         │   0%   │                                         │
│  └──────────────────────┴────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.4 حساب مساهمة الرقابة (Control Contribution)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Core Equation                                                              │
│  ─────────────                                                              │
│  C = CE × R × W                                                             │
│                                                                             │
│  Where: CE = Control Effectiveness (0-1)                                    │
│         R  = Risk Relevance (0-1)                                           │
│         W  = Risk Reduction Weight (ΣW = 1)                                 │
│                                                                             │
│  Role Allocation (for BOTH role):                                          │
│  ────────────────────────────────                                          │
│  C_L = C × A_L                                                              │
│  C_I = C × A_I                                                              │
│                                                                             │
│  Where: A_L = Likelihood allocation (0-1)                                   │
│         A_I = Impact allocation (0-1)                                       │
│         A_L + A_I = 1                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.5 حساب تقليل المخاطرة (Risk Reduction)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Axis-Based Reduction                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  CR_L = Σ C_L  (مجموع contributions على محور Likelihood)                    │
│  CR_I = Σ C_I  (مجموع contributions على محور Impact)                        │
│                                                                             │
│  Relationship Adjustment:                                                   │
│  ────────────────────────                                                   │
│  CR_adj = CR × RelationshipFactor                                          │
│                                                                             │
│  ┌───────────────────┬─────────────────┬─────────────────────────┐         │
│  │ Relationship      │ Factor          │ Effect                  │         │
│  ├───────────────────┼─────────────────┼─────────────────────────┤         │
│  │ Independent       │     1.0         │ No adjustment           │         │
│  │ Complementary     │     1.1         │ +10% boost              │         │
│  │ Overlapping       │     0.8         │ -20% reduction          │         │
│  │ Compensating      │     1.0         │ Special handling        │         │
│  └───────────────────┴─────────────────┴─────────────────────────┘         │
│                                                                             │
│  Maximum Reduction Cap:                                                     │
│  ───────────────────────                                                    │
│  CR_eff = min(CR_adj, CR_max)                                               │
│                                                                             │
│  Where: CR_max = 75% (configurable in Parameter)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.6 حساب المخاطرة المتبقية (Residual Risk)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Axis-Based Residual Risk (ISO 27005)                                       │
│  ────────────────────────────────────                                       │
│                                                                             │
│  L_R = L × (1 - CR_L_eff)                                                   │
│  I_R = I × (1 - CR_I_eff)                                                   │
│                                                                             │
│  RR = L_R × I_R                                                             │
│                                                                             │
│  With Floor:                                                                │
│  ───────────                                                                │
│  RR = max(RR, RR_min)                                                       │
│                                                                             │
│  Where: RR_min = 1 (configurable)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Overall CE Method (Alternative)                                             │
│  ──────────────────────────────                                             │
│  RR = IR × (1 - CR_eff)                                                     │
│  RR = max(RR, RR_min)                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# الفصل الثالث: سيناريو كامل — دورة حياة المخاطرة

## المخاطرة: Unauthorized Privileged Access

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   Risk ID:        R-2026-042                                                ║
║   Title:          Unauthorized Privileged Access                            ║
║   Domain:         Cybersecurity                                            ║
║   Category:       Information Security                                     ║
║   Owner:          Head of IT Security                                      ║
║   Identified:     2026-08-22                                               ║
║   Status:         Open → Assessment → Treatment → Monitoring → Closed       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## المرحلة 1: التسجيل والتعريف (Identification & Registration)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1.1 Risk Identification                                                   │
│  ─────────────────────                                                      │
│  Source: Risk Assessment Workshop                                          ║
│  Threat: Insider or external attacker gaining privileged access            ║
│  Vulnerability: Weak access controls on admin consoles                     ║
│  Asset: Core Banking System, Customer Database                             ║
│                                                                              ║
│  1.2 Risk Categorization                                                   │
│  ─────────────────────────                                                  │
│  Domain: Cybersecurity                                                     ║
│  Category: Information Security                                             ║
│  Sub-Category: Access Control                                              ║
│  Risk Type: Internal/External Threat                                       ║
│                                                                              ║
│  1.3 Initial Data Entry                                                     ║
│  ─────────────────────                                                      ║
│  Risk Title: Unauthorized Privileged Access                                ║
│  Risk Description: Attacker could gain privileged access through           ║
│                    weak access controls, leading to data breach            ║
│  Risk Owner: Head of IT Security                                           ║
│  Risk Source: Risk Workshop                                                ║
│  Date Identified: 2026-08-22                                               ║
│  Review Frequency: Quarterly                                               ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 2: التقييم الذاتي (Inherent Risk Assessment)

### 2.1 تقييم معايير التأثير (Impact Criteria Assessment)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Impact Criteria Assessment                                                 │
│  ──────────────────────────                                                 │
│  Assessor: Risk Analyst (1st Line)                                         ║
│  Reviewer: CISO (2nd Line)                                                 ║
│                                                                              ║
│  ┌────────────────┬───────┬────────┬─────────────────────────────────────┐  ║
│  │ Criterion      │ Score │ Weight │ Justification                       │  ║
│  ├────────────────┼───────┼────────┼─────────────────────────────────────┤  ║
│  │ Financial      │   5   │ 12.5%  │ Potential $5M+ loss from fraud      │  ║
│  │ Regulatory     │   4   │ 12.5%  │ CBE fines up to EGP 10M            │  ║
│  │ Reputational   │   3   │ 12.5%  │ Customer trust impact               │  ║
│  │ Safety         │   2   │ 12.5%  │ Minimal safety impact               │  ║
│  │ Operational    │   4   │ 12.5%  │ System downtime 4-8 hours           │  ║
│  │ Confidentiality│   3   │ 12.5%  │ Customer data exposure              │  ║
│  │ Integrity      │   4   │ 12.5%  │ Data manipulation possible          │  ║
│  │ Availability   │   3   │ 12.5%  │ 4-8 hour outage                    │  ║
│  └────────────────┴───────┴────────┴─────────────────────────────────────┘  ║
│                                                                              ║
│  Calculation:                                                               ║
│  ────────────                                                               ║
│  I_raw = 5(0.125) + 4(0.125) + 3(0.125) + 2(0.125)                         ║
│        + 4(0.125) + 3(0.125) + 4(0.125) + 3(0.125)                         ║
│                                                                              ║
│  I_raw = 0.625 + 0.500 + 0.375 + 0.250 + 0.500 + 0.375 + 0.500 + 0.375    ║
│  I_raw = 3.500                                                              ║
│                                                                              ║
│  I = round(3.500) = 4                                                       ║
│                                                                              ║
│  ┌─────────────────────────────────────────────────────────────────────┐    ║
│  │  Raw Impact Value: 3.500 (preserved for calculations)              │    ║
│  │  Scoring Impact: 4 (used for matrix/classification)                │    ║
│  └─────────────────────────────────────────────────────────────────────┘    ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 تقييم الاحتمالية (Likelihood Assessment)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Likelihood Assessment                                                      │
│  ────────────────────                                                       ║
│  Assessor: Risk Analyst                                                     ║
│                                                                              ║
│  Scale:                                                                     ║
│  ┌─────┬──────────────────────────────────────────────────────────────┐     ║
│  │  1  │ Rare          — Less than once every 5 years                 │     ║
│  │  2  │ Unlikely      — Once every 2-5 years                        │     ║
│  │  3  │ Possible      — Once every 1-2 years                        │     ║
│  │  4  │ Likely        — Once per year                              │     ║
│  │  5  │ Almost Certain — Multiple times per year                    │     ║
│  └─────┴──────────────────────────────────────────────────────────────┘     ║
│                                                                              ║
│  Assessment:                                                                ║
│  ────────────                                                               ║
│  Historical Data: 3 privileged access incidents in past 2 years            ║
│  Industry Benchmark: Financial sector avg = 2.5/year                       ║
│  Control Posture: Weak (no PAM, limited MFA)                               ║
│                                                                              ║
│  Likelihood Score: 4 (Likely — once per year)                              ║
│                                                                              ║
│  Justification: Based on historical incidents and current control          ║
│  gaps, this risk is likely to materialize once per year.                   ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 حساب المخاطرة الذاتية (Inherent Risk Calculation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Inherent Risk Calculation                                                  │
│  ──────────────────────────                                                 ║
│                                                                              ║
│  Method: Multiplicative (configured in Parameter)                           ║
│                                                                              ║
│  IR = L × I                                                                 ║
│  IR = 4 × 4                                                                 ║
│  IR = 16                                                                    ║
│                                                                              ║
│  ┌─────────────────────────────────────────────────────────────────────┐    ║
│  │  Inherent Risk Score: 16 / 25                                       │    ║
│  │  Inherent Level: HIGH (12 ≤ 16 < 20)                               │    ║
│  └─────────────────────────────────────────────────────────────────────┘    ║
│                                                                              ║
│  Risk Matrix Position:                                                      ║
│  ────────────────────                                                       ║
│                                                                             ║
│  Impact →  1    2    3    4    5                                           ║
│  Likelihood ↓                                                              ║
│    5      5   10   15   20   25                                           ║
│    4      4    8   12   [16]  20    ← Current Position                     ║
│    3      3    6    9   12   15                                           ║
│    2      2    4    6    8   10                                           ║
│    1      1    2    3    4    5                                           ║
│                                                                              ║
│  Escalation Path: Risk Owner (Head of IT Security) → CISO                  ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 3: تقييم الرقابات (Control Assessment)

### 3.1 اختيار الرقابات (Control Selection)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Control Selection                                                          ║
│  ────────────────                                                           ║
│  Control Owner: IAM Team Lead                                              ║
│  Risk Owner Approval: Head of IT Security                                  ║
│                                                                              ║
│  Selected Controls:                                                         ║
│  ┌─────────┬────────────────────────────────┬──────────────┬────────────┐  ║
│  │ ID      │ Name                           │ Role         │ Source     │  ║
│  ├─────────┼────────────────────────────────┼──────────────┼────────────┤  ║
│  │ CTRL-11 │ Multi-Factor Authentication    │ Likelihood   │ ISO/NIST   │  ║
│  │ CTRL-12 │ Privileged Access Management   │ Likelihood   │ ISO/Custom │  ║
│  │ CTRL-13 │ Role-Based Access Control      │ Both         │ ISO/NIST   │  ║
│  └─────────┴────────────────────────────────┴──────────────┴────────────┘  ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 تقييم فعالية كل رقابة (Control Effectiveness Assessment)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CTRL-11: Multi-Factor Authentication (MFA)                                ║
│  ───────────────────────────────────────────                                ║
│  Assessor: IAM Team (1st Line)                                             ║
│  Reviewer: IT Security (2nd Line)                                          ║
│                                                                              ║
│  ┌──────────────┬───────┬────────┬────────────────────────────────────────┐  ║
│  │ Factor       │ Score │ Weight │ Evidence                               │  ║
│  ├──────────────┼───────┼────────┼────────────────────────────────────────┤  ║
│  │ Design       │  90   │  25%   │ Architecture review approved            │  ║
│  │ Operating    │  85   │  35%   │ Operational logs reviewed               │  ║
│  │ Coverage     │  92   │  25%   │ 92% of privileged accounts             │  ║
│  │ Testing      │ 100   │  15%   │ Pen-test passed Q2 2026                │  ║
│  └──────────────┴───────┴────────┴────────────────────────────────────────┘  ║
│                                                                              ║
│  CE = 90(0.25) + 85(0.35) + 92(0.25) + 100(0.15)                          ║
│  CE = 22.50 + 29.75 + 23.00 + 15.00                                        ║
│  CE = 90.25%                                                                ║
│                                                                              ║
│  Confidence: 100% (all factors have data)                                   ║
│  Last Tested: 2026-06-15                                                   ║
│  Next Test Due: 2026-12-15                                                 ║
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CTRL-12: Privileged Access Management (PAM)                               ║
│  ────────────────────────────────────────────                               ║
│  ┌──────────────┬───────┬────────┬────────────────────────────────────────┐  ║
│  │ Factor       │ Score │ Weight │ Evidence                               │  ║
│  ├──────────────┼───────┼────────┼────────────────────────────────────────┤  ║
│  │ Design       │  88   │  25%   │ Design documented                      │  ║
│  │ Operating    │  82   │  35%   │ Monthly reviews conducted              │  ║
│  │ Coverage     │  90   │  25%   │ 90% of admin accounts                  │  ║
│  │ Testing      │  85   │  15%   │ Last test 2026-03                      │  ║
│  └──────────────┴───────┴────────┴────────────────────────────────────────┘  ║
│                                                                              ║
│  CE = 88(0.25) + 82(0.35) + 90(0.25) + 85(0.15)                           ║
│  CE = 22.00 + 28.70 + 22.50 + 12.75                                        ║
│  CE = 85.95%                                                                ║
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CTRL-13: Role-Based Access Control (RBAC)                                 ║
│  ─────────────────────────────────────────────                              ║
│  ┌──────────────┬───────┬────────┬────────────────────────────────────────┐  ║
│  │ Factor       │ Score │ Weight │ Evidence                               │  ║
│  ├──────────────┼───────┼────────┼────────────────────────────────────────┤  ║
│  │ Design       │  92   │  25%   │ RBAC model documented                  │  ║
│  │ Operating    │  88   │  35%   │ Quarterly access reviews               │  ║
│  │ Coverage     │  85   │  25%   │ 85% of roles defined                   │  ║
│  │ Testing      │  90   │  15%   │ Tested 2026-05                         │  ║
│  └──────────────┴───────┴────────┴────────────────────────────────────────┘  ║
│                                                                              ║
│  CE = 92(0.25) + 88(0.35) + 85(0.25) + 90(0.15)                           ║
│  CE = 23.00 + 30.80 + 21.25 + 13.50                                        ║
│  CE = 88.55%                                                                ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 تحديد الصلة والوزن (Relevance & Weight Assignment)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Risk Relevance & Reduction Weight Assignment                               ║
│  ────────────────────────────────────────────                               ║
│  Approver: Risk Owner + CISO                                               ║
│                                                                              ║
│  ┌─────────┬────────┬────────────┬──────────┬────────────┬──────────────┐  ║
│  │ Control │   CE   │ Relevance  │  Weight  │    Role    │ Relationship│  ║
│  ├─────────┼────────┼────────────┼──────────┼────────────┼──────────────┤  ║
│  │ MFA     │ 90.25% │    95%     │   40%    │ Likelihood │Complementary │  ║
│  │ PAM     │ 85.95% │    90%     │   35%    │ Likelihood │Complementary │  ║
│  │ RBAC    │ 88.55% │    85%     │   25%    │ Both (50/50)│ Independent │  ║
│  └─────────┴────────┴────────────┴──────────┴────────────┴──────────────┘  ║
│                                                                              ║
│  Justification:                                                             ║
│  ──────────────                                                             ║
│  • MFA: High relevance (95%) — directly prevents unauthorized access        ║
│  • PAM: High relevance (90%) — monitors privileged sessions                ║
│  • RBAC: Good relevance (85%) — limits access but doesn't prevent breach   ║
│                                                                             ║
│  Weight Distribution Logic:                                                 ║
│  ──────────────────────────                                                 ║
│  • MFA highest weight (40%) — first line of defense                        ║
│  • PAM second (35%) — monitoring and control                               ║
│  • RBAC third (25%) — preventive but limited                               ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 4: حساب المعالجة (Treatment Calculation)

### 4.1 حساب مساهمة كل رقابة (Control Contribution)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Control Contribution Calculation                                           ║
│  ──────────────────────────────                                             ║
│  Formula: C = CE × R × W                                                    ║
│                                                                              ║
│  ┌─────────┬────────────────────────────────────────────────────────────┐  ║
│  │ Control │ Calculation                                                 │  ║
│  ├─────────┼────────────────────────────────────────────────────────────┤  ║
│  │         │                                                            │  ║
│  │ MFA     │ C = 0.9025 × 0.95 × 0.40 = 0.34295                        │  ║
│  │         │ C = 34.30%                                                 │  ║
│  │         │                                                            │  ║
│  │ PAM     │ C = 0.8595 × 0.90 × 0.35 = 0.27074                        │  ║
│  │         │ C = 27.07%                                                 │  ║
│  │         │                                                            │  ║
│  │ RBAC    │ C = 0.8855 × 0.85 × 0.25 = 0.18817                        │  ║
│  │         │ C = 18.82%                                                 │  ║
│  │         │                                                            │  ║
│  └─────────┴────────────────────────────────────────────────────────────┘  ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 توزيع المساهمات على المحاور (Axis Allocation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Axis Allocation                                                            ║
│  ────────────────                                                           ║
│                                                                              ║
│  MFA (Role: Likelihood):                                                    ║
│  ────────────────────────                                                   ║
│  C_L = 34.30%  (100% to Likelihood)                                        ║
│  C_I = 0%                                                                     ║
│                                                                              ║
│  PAM (Role: Likelihood):                                                    ║
│  ────────────────────────                                                   ║
│  C_L = 27.07%  (100% to Likelihood)                                        ║
│  C_I = 0%                                                                     ║
│                                                                              ║
│  RBAC (Role = Both, Allocation = 50/50):                                   ║
│  ────────────────────────────────────────                                   ║
│  C_L = 18.82% × 50% = 9.41%                                                ║
│  C_I = 18.82% × 50% = 9.41%                                                ║
│                                                                              ║
│  ┌─────────────────────────────────────────────────────────────────────┐    ║
│  │  Total Likelihood Contribution: 34.30% + 27.07% + 9.41% = 70.78% │    ║
│  │  Total Impact Contribution: 0% + 0% + 9.41% = 9.41%              │    ║
│  └─────────────────────────────────────────────────────────────────────┘    ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 حساب تقليل المخاطرة (Risk Reduction)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Risk Reduction Calculation                                                 ║
│  ──────────────────────────                                                 ║
│                                                                              ║
│  Raw Axis Reductions:                                                       ║
│  ─────────────────────                                                      ║
│  CR_L = 70.78%                                                              ║
│  CR_I = 9.41%                                                               ║
│                                                                              ║
│  Relationship Adjustment:                                                   ║
│  ────────────────────────                                                   ║
│  MFA-PAM: Complementary → +10% boost                                       ║
│  Overall Factor: 1.1                                                        ║
│                                                                              ║
│  Adjusted Reductions:                                                       ║
│  ─────────────────────                                                      ║
│  CR_L_adj = 70.78% × 1.1 = 77.86%                                          ║
│  CR_I_adj = 9.41% × 1.1 = 10.35%                                           ║
│                                                                              ║
│  Apply Maximum Reduction Cap (75%):                                         ║
│  ──────────────────────────────────                                         ║
│  CR_L_eff = min(77.86%, 75%) = 75%  ← Cap Applied!                         ║
│  CR_I_eff = min(10.35%, 75%) = 10.35%  ← No cap needed                     ║
│                                                                              ║
│  ┌─────────────────────────────────────────────────────────────────────┐    ║
│  │  Effective Likelihood Reduction: 75.00%                            │    ║
│  │  Effective Impact Reduction: 10.35%                                 │    ║
│  │  Overall Combined Reduction: Calculated from axis reductions        │    ║
│  └─────────────────────────────────────────────────────────────────────┘    ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 حساب المخاطرة المتبقية (Residual Risk Calculation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Residual Risk Calculation                                                  ║
│  ──────────────────────────                                                 ║
│  Method: Axis-Based (ISO 27005)                                            ║
│                                                                              ║
│  Residual Likelihood:                                                       ║
│  ────────────────────                                                       ║
│  L_R = L × (1 - CR_L_eff)                                                   ║
│  L_R = 4 × (1 - 0.75)                                                       ║
│  L_R = 4 × 0.25                                                             ║
│  L_R = 1.00                                                                 ║
│                                                                              ║
│  Residual Impact:                                                           ║
│  ───────────────                                                            ║
│  I_R = I × (1 - CR_I_eff)                                                   ║
│  I_R = 4 × (1 - 0.1035)                                                     ║
│  I_R = 4 × 0.8965                                                           ║
│  I_R = 3.586                                                                ║
│                                                                              ║
│  Residual Risk:                                                              ║
│  ──────────────                                                              ║
│  RR = L_R × I_R                                                              ║
│  RR = 1.00 × 3.586                                                          ║
│  RR = 3.586                                                                 ║
│                                                                              ║
│  Apply Floor (Min Residual = 1):                                           ║
║  ──────────────────────────────                                            ║
│  RR = max(3.586, 1) = 3.586                                                ║
│                                                                              ║
│  Final Score (rounded):                                                     ║
║  ──────────────────────                                                     ║
│  RR = 4                                                                     ║
│                                                                              ║
│  ┌─────────────────────────────────────────────────────────────────────┐    ║
│  │  Residual Risk Score: 4 / 25                                         │    ║
│  │  Residual Level: LOW (4 < 6)                                        │    ║
│  │  Raw Residual Value: 3.586 (preserved for audit)                   │    ║
│  └─────────────────────────────────────────────────────────────────────┘    ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 5: قرار المعالجة (Treatment Decision)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Treatment Decision                                                         ║
║  ──────────────────                                                         ║
║                                                                              ║
│  Risk Appetite Check:                                                       ║
║  ────────────────────                                                       ║
║  Residual Risk: 4                                                           ║
║  Appetite Limit: 8                                                          ║
║  Tolerance Limit: 12                                                        ║
║                                                                              ║
║  Status: Within Appetite ✓                                                  ║
║                                                                              ║
│  Treatment Decision: MODIFY (Accept current controls)                      ║
║  ──────────────────────────────────────────────────                        ║
║                                                                              ║
│  Justification:                                                             ║
║  Residual risk (4) is within appetite (8). Current controls are            ║
║  sufficient. Continue monitoring via KRIs.                                 ║
║                                                                              ║
│  Alternative Decisions Considered:                                         ║
║  ────────────────────────────────                                         ║
║  • RETAIN: Not acceptable (inherent too high at 16)                       ║
║  • AVOID: Not practical (business requires privileged access)             ║
║  • SHARE: Consider cyber insurance for residual                            ║
║                                                                              ║
│  Approval:                                                                  ║
║  ────────                                                                   ║
║  Risk Owner: Head of IT Security → Approved                                ║
║  CISO: Reviewed → Approved                                                 ║
║  Risk Committee: Not required (within appetite)                            ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 6: المراقبة المستمرة (Ongoing Monitoring)

### 6.1 مؤشرات المخاطرة الرئيسية (KRIs)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Key Risk Indicators (KRIs)                                                 ║
║  ──────────────────────────                                                 ║
║                                                                              ║
│  ┌─────────┬────────────────────────┬────────┬────────┬────────┬────────┐  ║
│  │ KRI     │ Description            │ Green  │ Amber  │  Red   │Current │  ║
│  ├─────────┼────────────────────────┼────────┼────────┼────────┼────────┤  ║
│  │         │                        │        │        │        │        │  ║
│  │ KRI-01  │ MFA Coverage %         │ >95%   │ 85-95% │ <85%   │  92%   │  ║
│  │         │                        │        │        │        │        │  ║
│  │ KRI-02  │ Failed Auth Attempts   │ <100   │ 100-500│ >500   │  45    │  ║
│  │         │ (monthly)              │        │        │        │        │  ║
│  │ KRI-03  │ PAM Session            │ >90%   │ 70-90% │ <70%   │  88%   │  ║
│  │         │ Recording %            │        │        │        │        │  ║
│  │ KRI-04  │ RBAC Review            │ 100%   │ 80-99% │ <80%   │  85%   │  ║
│  │         │ Completion %           │        │        │        │        │  ║
│  │ KRI-05  │ Bypass Incidents       │ 0      │ 1-2    │ >2     │   0    │  ║
│  │         │ (quarterly)            │        │        │        │        │  ║
│  │ KRI-06  │ Dormant Account        │ <5%    │ 5-10%  │ >10%   │  3%    │  ║
│  │         │ %                      │        │        │        │        │  ║
│  └─────────┴────────────────────────┴────────┴────────┴────────┴────────┘  ║
│                                                                              ║
│  KRI Impact on Risk Score:                                                  ║
║  ────────────────────────                                                  ║
║  If KRI-01 drops below 85% → CE(MFA) decreases → Likelihood increases      ║
║  If KRI-05 > 2 incidents → Immediate reassessment triggered               ║
║  If KRI-04 < 80% → RBAC effectiveness downgraded                          ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 شروط إعادة التقييم (Reassessment Triggers)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Reassessment Triggers                                                      ║
║  ────────────────────                                                       ║
║                                                                              ║
│  Scheduled:                                                                 ║
║  ──────────                                                                 ║
║  • Quarterly (every 3 months)                                              ║
║  • Annual full reassessment                                                ║
║                                                                              ║
│  Event-Based (Immediate):                                                  ║
║  ────────────────────────                                                  ║
║  • Control failure (KRI-05 > 2)                                           ║
║  • Security incident related to this risk                                 ║
║  • Regulatory change (CBE new requirements)                               ║
║  • Significant infrastructure change                                      ║
║  • KRI threshold breach (any KRI in Red for 2 consecutive periods)        ║
║  • Third-party control failure (if applicable)                            ║
║                                                                              ║
│  Escalation:                                                                ║
║  ────────────                                                               ║
║  • Risk moves to Above Appetite → CISO notification                       ║
║  • Risk moves to Outside Tolerance → Risk Committee escalation            ║
║  • Control failure → Immediate Risk Owner notification                    ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 7: الإغلاق (Closure)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Risk Closure Criteria                                                      ║
║  ────────────────────                                                       ║
║                                                                              ║
│  Risk can be closed when:                                                   ║
║  ────────────────────────                                                   ║
║  ✓ Residual risk within appetite for 4 consecutive quarters               ║
║  ✓ All controls operating effectively (CE > 80% for all)                  ║
║  ✓ No incidents related to this risk in 12 months                         ║
║  ✓ KRIs consistently Green for 4 quarters                                ║
║  ✓ Risk Owner and CISO approve closure                                    ║
║                                                                              ║
│  Closure Approval Workflow:                                                 ║
║  ──────────────────────────                                                 ║
║  1. Risk Owner requests closure with evidence                             ║
║  2. CISO reviews and approves                                             ║
║  3. Risk Committee notified (information only if within appetite)         ║
║  4. Risk status changed to "Closed"                                       ║
║  5. Risk archived with full audit trail                                   ║
║                                                                              ║
│  Post-Closure:                                                              ║
║  ──────────────                                                             ║
║  • Risk archived (retained for 7 years for audit)                         ║
║  • Controls remain in place (operational)                                 ║
║  • Annual verification that risk remains closed                           ║
║  • Reopen if any trigger condition occurs                                 ║
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 8: ملخص الدورة الكاملة (Lifecycle Summary)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RISK LIFECYCLE SUMMARY                                    ║
║                    Risk R-2026-042                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  INHERIT RISK                                                         │    ║
║  │  L=4, I=4 → IR = 4×4 = 16 (HIGH)                                    │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  CONTROLS                                                            │    ║
║  │  MFA (90.25%, 95%, 40%, Likelihood)                                │    ║
║  │  PAM (85.95%, 90%, 35%, Likelihood)                                │    ║
║  │  RBAC (88.55%, 85%, 25%, Both 50/50)                               │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  RISK REDUCTION                                                      │    ║
║  │  CR_L = 70.78% × 1.1 = 77.86% → Cap → 75%                          │    ║
║  │  CR_I = 9.41% × 1.1 = 10.35% → No cap                              │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  RESIDUAL RISK                                                       │    ║
║  │  L_R = 4 × (1-0.75) = 1.00                                         │    ║
║  │  I_R = 4 × (1-0.1035) = 3.59                                       │    ║
║  │  RR = 1.00 × 3.59 = 3.59 → 4 (LOW)                                 │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  APPETITE DECISION                                                   │    ║
║  │  RR=4 ≤ Appetite=8 → Within Appetite ✓                              │    ║
║  │  Treatment: MODIFY (accept controls, monitor)                       │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  MONITORING                                                          │    ║
║  │  KRIs: 6 indicators tracked monthly                                 │    ║
║  │  Reassessment: Quarterly                                            │    ║
║  │  Triggers: Incident, KRI breach, Regulatory change                  │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  CLOSURE (Future)                                                    │    ║
║  │  Criteria: 4 quarters within appetite + no incidents                │    ║
║  │  Approval: Risk Owner → CISO → Risk Committee                       │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## ملخص المعادلات الكاملة

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE EQUATION REFERENCE                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  1. IMPACT                                                                   ║
║     I_raw = Σ (Sᵢ × Wᵢ)                                                     ║
║     I = round(I_raw)                                                         ║
║                                                                              ║
║  2. INHERENT RISK                                                            ║
║     IR = L × I                                                               ║
║                                                                              ║
║  3. CONTROL EFFECTIVENESS                                                    ║
║     CE = Σ (Fⱼ × Wⱼ)                                                        ║
║                                                                              ║
║  4. CONTROL CONTRIBUTION                                                     ║
║     C = CE × R × W                                                           ║
║     C_L = C × A_L  (if role = BOTH)                                         ║
║     C_I = C × A_I  (if role = BOTH)                                         ║
║                                                                              ║
║  5. AXIS REDUCTION                                                           ║
║     CR_L = Σ C_L                                                             ║
║     CR_I = Σ C_I                                                             ║
║     CR_adj = CR × RelationshipFactor                                         ║
║     CR_eff = min(CR_adj, 75%)                                                ║
║                                                                              ║
║  6. RESIDUAL RISK                                                            ║
║     L_R = L × (1 - CR_L_eff)                                                 ║
║     I_R = I × (1 - CR_I_eff)                                                 ║
║     RR = L_R × I_R                                                           ║
║     RR = max(RR, 1)                                                          ║
║                                                                              ║
║  7. APPETITE                                                                 ║
║     RR ≤ 8  → Within Appetite                                               ║
║     8 < RR ≤ 12 → Above Appetite / Within Tolerance                         ║
║     RR > 12 → Outside Tolerance                                              ║
║                                                                              ║
║  8. OVERRIDE GOVERNANCE                                                      ║
║     Deviation = |User - Suggested| / Suggested                               ║
║     0-10%: Normal | 10-20%: Warning | 20-40%: Justification | >40%: Approval║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## الـ RACI Matrix الكامل

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         RACI MATRIX                                         ║
╠═════════════════════════╦═══════╦═══════╦═══════╦═══════╦════════════════════╣
║ Activity                ║ 1st L ║ 2nd L ║ 3rd L ║ CISO ║ Risk Committee     ║
╠═════════════════════════╬═══════╬═══════╬═══════╬═══════╬════════════════════╣
║ Identify Risk           ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Assess Inherent Risk    ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Define Impact Weights   ║   C   ║   R   ║   I   ║   A   ║   I               ║
║ Select Controls         ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Assess Control CE       ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Assign Relevance/Weight ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Calculate Residual      ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Treatment Decision      ║   C   ║   R   ║   I   ║   A   ║   I               ║
║ Override (<20%)         ║   R   ║   I   ║   I   ║   I   ║   I               ║
║ Override (20-40%)       ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Override (>40%)         ║   C   ║   C   ║   I   ║   A   ║   A               ║
║ Monitor KRIs            ║   R   ║   C   ║   I   ║   I   ║   I               ║
║ Quarterly Reassessment  ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Risk Closure            ║   R   ║   C   ║   I   ║   A   ║   I               ║
║ Annual Methodology      ║   C   ║   R   ║   C   ║   A   ║   A               ║
╠═════════════════════════╬═══════╬═══════╬═══════╬═══════╬════════════════════╣
║ R = Responsible         ║ 1st Line = Business/Operations                    ║
║ A = Accountable         ║ 2nd Line = Risk/Compliance                        ║
║ C = Consulted           ║ 3rd Line = Internal Audit                         ║
║ I = Informed            ║                                                    ║
╚═════════════════════════╩═════════════════════════════════════════════════╝
```

---

**المصدر:** WADJET GRC Risk Engine v2.0
**التاريخ:** 2026-08-22
**الحالة:** Production Ready
