# WADJET GRC Risk Engine v2.0 — Risk Lifecycle Summary

## Risk R-2026-042: Unauthorized Privileged Access

**Prepared for:** Risk Committee Review  
**Date:** 2026-08-22  
**Version:** 2.0 (Corrected)  
**Status:** Approved for Implementation  

---

## 1. Risk Lifecycle Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RISK LIFECYCLE SUMMARY                                    ║
║                    Risk R-2026-042                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  INHERENT RISK (Before Controls)                                     │    ║
║  │  L=4, I=4 → IR = 4×4 = 16 (HIGH)                                    │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  CONTROLS                                                            │    ║
║  │  MFA (90.25%, 95%, 40%, Likelihood, Complementary)                  │    ║
║  │  PAM (85.95%, 90%, 35%, Likelihood, Complementary)                  │    ║
║  │  RBAC (88.55%, 85%, 25%, Both 50/50, Independent)                   │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  RISK REDUCTION                                                      │    ║
║  │  CR_L = 56.59% (Diminishing Returns)                                │    ║
║  │  CR_I = 9.41%                                                        │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  RESIDUAL RISK                                                       │    ║
║  │  L_R = 4 × (1-0.5659) = 1.74                                        │    ║
║  │  I_R = 4 × (1-0.0941) = 3.62                                        │    ║
║  │  RR = 1.74 × 3.62 = 6.29 → 6 (MEDIUM)                               │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                              │                                                ║
║                              ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────────┐    ║
║  │  APPETITE DECISION                                                   │    ║
║  │  RR=6 ≤ Appetite=8 → Within Appetite ✓                              │    ║
║  │  Treatment: MODIFY (accept controls, monitor)                       │    ║
║  └──────────────────────────────────────────────────────────────────────┘    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Equation Reference

### 2.1 Impact Calculation

| Criterion | Score (Sᵢ) | Weight (Wᵢ) | Contribution (Sᵢ × Wᵢ) |
|-----------|------------|-------------|------------------------|
| Financial | 5 | 12.5% | 0.625 |
| Regulatory | 4 | 12.5% | 0.500 |
| Reputational | 3 | 12.5% | 0.375 |
| Safety | 2 | 12.5% | 0.250 |
| Operational | 4 | 12.5% | 0.500 |
| Confidentiality | 3 | 12.5% | 0.375 |
| Integrity | 4 | 12.5% | 0.500 |
| Availability | 3 | 12.5% | 0.375 |
| **Total** | — | **100%** | **I_raw = 3.500** |

```
I_raw = Σ (Sᵢ × Wᵢ) = 3.500
I = round(3.500) = 4
```

### 2.2 Inherent Risk

```
IR = L × I = 4 × 4 = 16 (HIGH)
```

### 2.3 Control Effectiveness

| Control | Design | Operating | Coverage | Testing | CE |
|---------|--------|-----------|----------|---------|-----|
| MFA | 90 (25%) | 85 (35%) | 92 (25%) | 100 (15%) | **90.25%** |
| PAM | 88 (25%) | 82 (35%) | 90 (25%) | 85 (15%) | **85.95%** |
| RBAC | 92 (25%) | 88 (35%) | 85 (25%) | 90 (15%) | **88.55%** |

```
CE = Σ (Factor × Weight)
```

### 2.4 Control Contribution

| Control | CE | Relevance (R) | Weight (W) | Contribution (C=CE×R×W) | Role | Relationship |
|---------|-----|---------------|------------|------------------------|------|--------------|
| MFA | 90.25% | 95% | 40% | **34.29%** | Likelihood | Complementary |
| PAM | 85.95% | 90% | 35% | **27.07%** | Likelihood | Complementary |
| RBAC | 88.55% | 85% | 25% | **18.82%** | Both (50/50) | Independent |

### 2.5 Axis Allocation

```
MFA (Likelihood):  C_L = 34.29%,  C_I = 0%
PAM (Likelihood):  C_L = 27.07%,  C_I = 0%
RBAC (Both 50/50): C_L = 9.41%,   C_I = 9.41%

Total Likelihood Contribution: 34.29% + 27.07% + 9.41% = 70.78%
Total Impact Contribution: 9.41%
```

### 2.6 Risk Reduction (Diminishing Returns)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Methodology: Diminishing Returns Aggregation                               │
│  ──────────────────────────────────────────                                 │
│  Formula: CR_combined = 1 - Π(1 - Cᵢ)                                       │
│                                                                             │
│  For Likelihood axis (MFA + PAM + RBAC):                                   ║
│  CR_L = 1 - (1-0.3429)(1-0.2707)(1-0.0941)                                 ║
│  CR_L = 1 - (0.6571)(0.7293)(0.9059)                                       ║
│  CR_L = 1 - 0.4341                                                         ║
│  CR_L = 56.59%                                                              ║
│                                                                             │
│  For Impact axis (RBAC only):                                              ║
│  CR_I = 9.41%                                                               ║
│                                                                             │
│  Cap Application (75%):                                                    ║
│  CR_L_eff = min(56.59%, 75%) = 56.59% (No cap needed)                     ║
│  CR_I_eff = min(9.41%, 75%) = 9.41% (No cap needed)                        ║
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.7 Residual Risk

```
L_R = L × (1 - CR_L_eff) = 4 × (1 - 0.5659) = 4 × 0.4341 = 1.74
I_R = I × (1 - CR_I_eff) = 4 × (1 - 0.0941) = 4 × 0.9059 = 3.62

RR = L_R × I_R = 1.74 × 3.62 = 6.29

RR (rounded) = 6 (MEDIUM: 6 ≤ RR < 12)
```

### 2.8 Appetite & Treatment Decision

```
Appetite Limit: 8
Tolerance Limit: 12
Residual Risk: 6

Status: RR=6 ≤ Appetite=8 → Within Appetite ✓

Treatment Decision: MODIFY
Justification: Residual risk within appetite. Current controls sufficient.
```

---

## 3. Methodology Justification

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  METHODOLOGY JUSTIFICATION                                                   ║
║  ─────────────────────                                                       ║
║                                                                              ║
║  Aggregation Method: Diminishing Returns                                     ║
║  ───────────────────────────────────                                         ║
║  Formula: CR_combined = 1 - Π(1 - Cᵢ)                                       ║
║                                                                              ║
║  Justification:                                                              ║
║  ──────────────                                                              ║
║  MFA and PAM are both preventive controls targeting the same attack         ║
║  vector (privileged access). While they are complementary in design         ║
║  (MFA verifies identity, PAM monitors sessions), their contributions        ║
║  are not fully independent — they overlap in preventing unauthorized        ║
║  access. Using Simple Sum would over-credit the combined effect.            ║
║                                                                              ║
║  Source: Expert Judgment signed by CISO (Ahmed Hassan) on 2026-08-20       ║
║  Reference: NIST SP 800-39 (Risk Management Framework)                      ║
║  Review Date: 2027-02-20 (6-month review cycle)                             ║
║                                                                              ║
║  Relationship Classification:                                                ║
║  ──────────────────────────                                                  ║
║  • MFA ↔ PAM: Complementary (different control types, same objective)       ║
║  • RBAC: Independent (separate control mechanism)                           ║
║                                                                              ║
║  Note: No external adjustment factor applied. The Diminishing Returns       ║
║  formula naturally accounts for overlapping effects without requiring       ║
║  arbitrary boost/reduction factors.                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 4. RACI Matrix

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         RACI MATRIX v2.0                                    ║
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
║ Override (>40%)         ║   R   ║   C   ║   I   ║   C   ║   A               ║
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

## 5. Closure Criteria (Detailed)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  RISK CLOSURE CRITERIA                                                      ║
║  ────────────────────                                                       ║
║                                                                              ║
║  A risk may be closed when ALL of the following are met:                    ║
║                                                                              ║
║  1. Residual Risk Within Appetite                                          ║
║     ─────────────────────────────                                          ║
║     • Residual Risk ≤ Appetite Limit (currently 8)                         ║
║     • Must be within appetite for 4 consecutive quarters                   ║
║     • Reset Behavior: If risk exits appetite at any point, the 4-quarter   ║
║       counter RESETS to zero. Risk must return to within appetite and       ║
║       complete 4 new consecutive quarters.                                 ║
║       Example: Q1=Within, Q2=Within, Q3=Above, Q4=Within, Q5=Within,      ║
║       Q6=Within, Q7=Within, Q8=Within → Eligible at Q8                    ║
║                                                                              ║
║  2. No Related Incidents                                                   ║
║     ─────────────────────                                                   ║
║     • Zero incidents RELATED to this specific risk                         ║
║     • Scope Definition: Incidents are scoped to the specific risk          ║
║       category (Unauthorized Privileged Access). This includes:            ║
║       - Successful or attempted privileged access breaches                 ║
║       - Bypass of privileged access controls                               ║
║       - Unauthorized escalation of privileges                              ║
║     • Does NOT include general security incidents (e.g., phishing,         ║
║       malware) unless they directly resulted in privileged access          ║
║                                                                              ║
║  3. Control Effectiveness                                                  ║
║     ─────────────────────                                                   ║
║     • All linked controls have CE ≥ 80%                                    ║
║     • No control has been in "Ineffective" status for any quarter          ║
║                                                                              ║
║  4. KRI Status                                                              ║
║     ─────────────                                                           ║
║     • All KRIs have been Green for 4 consecutive quarters                 ║
║     • No KRI has been in Red for more than 1 quarter                       ║
║                                                                              ║
║  Closure Approval Workflow:                                                 ║
║  ──────────────────────────                                                 ║
║  1. Risk Owner prepares closure request with evidence                      ║
║  2. CISO reviews and approves                                              ║
║  3. Risk Committee notified (information only)                             ║
║  4. Risk status changed to "Closed"                                        ║
║  5. Risk archived with full audit trail                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 6. Document Control

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT CONTROL                                                           ║
║  ────────────────                                                           ║
║                                                                              ║
║  Version: 2.0 (Corrected)                                                   ║
║  Date: 2026-08-22                                                           ║
║  Author: GRC Methodology Team                                              ║
║  Reviewer: Risk Committee                                                  ║
║  Status: Pending Approval                                                  ║
║                                                                              ║
║  Changes from v1.0:                                                         ║
║  ──────────────────                                                         ║
║  1. Fixed: Typo "INHERIT" → "INHERENT"                                    ║
║  2. Fixed: Relationship Factor replaced with documented Diminishing Returns ║
║  3. Fixed: RACI Override row - clarified Responsible and Accountable       ║
║  4. Fixed: Closure Criteria - added reset behavior and incident scope      ║
║  5. Added: Methodology Justification paragraph                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Appendix: Corrected Values Summary

| Metric | v1.0 (Incorrect) | v2.0 (Corrected) |
|--------|------------------|------------------|
| Aggregation | Simple Sum + 1.1 factor | Diminishing Returns |
| CR_L | 75% (with undocumented boost) | 56.59% |
| CR_I | 9.41% | 9.41% |
| L_R | 1.00 | 1.74 |
| I_R | 3.59 | 3.62 |
| RR | 4 (LOW) | 6 (MEDIUM) |
| Status | Within Appetite | Within Appetite |
| Treatment | MODIFY | MODIFY |

---

**END OF DOCUMENT**
