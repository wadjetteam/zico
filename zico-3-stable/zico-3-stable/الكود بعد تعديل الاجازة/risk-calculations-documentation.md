# 📐 جميع معادلات حساب المخاطرة المتبقية (Residual Risk) في منصة WADJET GRC

---

## نظرة عامة على المحرك

```
┌─────────────────────────────────────────────────────────────────┐
│                    RISK CALCULATION PIPELINE                     │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  INPUT   │──▶│  IMPACT  │──▶│ INHERENT │──▶│ RESIDUAL │    │
│  │ L + I    │   │ SCORE    │   │  RISK    │   │   RISK   │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │Controls  │   │ Control  │   │   Risk   │   │ Appetite │    │
│  │Selection │──▶│Reduction │──▶│  Level   │──▶│ Status   │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## المرحلة الأولى: حساب التأثير (Impact Calculation)

### 1. طريقة المتوسط المرجح (Weighted Impact) - الافتراضية

**الصيغة:**
```
        n
I = Σ (Sᵢ × Wᵢ)
       i=1
```

**حيث:**
- `Sᵢ` = قيمة المعيار i (1-5)
- `Wᵢ` = وزن المعيار i (مجموع الأوزان = 1)
- `n` = عدد المعايير (8 معايير)

**مثال:**
```
Financial       = 5 × 0.125 = 0.625
Regulatory      = 4 × 0.125 = 0.500
Reputational    = 3 × 0.125 = 0.375
Safety          = 2 × 0.125 = 0.250
Operational     = 4 × 0.125 = 0.500
Confidentiality = 3 × 0.125 = 0.375
Integrity       = 4 × 0.125 = 0.500
Availability    = 3 × 0.125 = 0.375
─────────────────────────────────
المجموع = 3.500 → Impact = 4 (تقريب)
```

---

### 2. طريقة القيمة القصوى (Max Impact)

**الصيغة:**
```
I = max(S₁, S₂, S₃, ..., Sₙ)
```

**مثال:**
```
S = [5, 4, 3, 2, 4, 3, 4, 3]
I = max(5, 4, 3, 2, 4, 3, 4, 3) = 5
```

---

### 3. طريقة المتوسط الحسابي (Average Impact)

**الصيغة:**
```
        n
I = (1/n) × Σ Sᵢ
            i=1
```

**مثال:**
```
S = [5, 4, 3, 2, 4, 3, 4, 3]
I = (5+4+3+2+4+3+4+3) / 8 = 28/8 = 3.5 → 4
```

---

### 4. طريقة المصفوفة (Matrix Lookup)

**الصيغة:**
```
I = Matrix[L_row][I_col]
```

**حيث:**
- المصفوفة 5×5 مُعرّفة في إعدادات الباراميتر
- الصف = متوسط القيم التقريبي
- العمود = نفس الصف

---

## المرحلة الثانية: حساب المخاطرة الذاتية (Inherent Risk)

### 1. طريقة الضرب البسيط (Multiplicative) - الافتراضية

**الصيغة:**
```
IR = L × I
```

**حيث:**
- `L` = الاحتمالية (1-5)
- `I` = التأثير (1-5)
- `IR` = المخاطرة الذاتية (1-25)

**مثال:**
```
L = 4, I = 5
IR = 4 × 5 = 20 (Critical)
```

---

### 2. طريقة الجمع المرجح (Weighted Additive)

**الصيغة:**
```
IR = (wL × L + wI × I) × SCALE_FACTOR
```

**حيث:**
- `wL` = وزن الاحتمالية (افتراضي 0.5)
- `wI` = وزن التأثير (افتراضي 0.5)
- `SCALE_FACTOR` = 5

**مثال:**
```
L = 4, I = 5, wL = 0.5, wI = 0.5
IR = (0.5×4 + 0.5×5) × 5 = (2 + 2.5) × 5 = 22.5 → 23
```

---

### 3. طريقة المصفوفة (Matrix Lookup)

**الصيغة:**
```
IR = Matrix[L-1][I-1]
```

---

## المرحلة الثالثة: حساب فعالية الرقابة (Control Effectiveness)

### 1. نموذج العوامل المتعددة (Default Model)

**الصيغة:**
```
        n
CE = Σ (Fᵢ × Wᵢ)
       i=1
```

**العوامل الافتراضية:**

| العامل | الوزن | الوصف |
|--------|-------|-------|
| Design | 25% | فعالية التصميم |
| Operating | 35% | فعالية التشغيل |
| Coverage | 25% | نسبة التغطية |
| Testing | 15% | نتيجة الاختبار |

**مثال:**
```
Design       = 90 × 0.25 = 22.5
Operating    = 85 × 0.35 = 29.75
Coverage     = 92 × 0.25 = 23.0
Testing      = 80 × 0.15 = 12.0
─────────────────────────────
CE = 87.25% → 87%
```

---

### 2. طريقة النطاقات الجاهزة (Band-based)

**الصيغة:**
```
CE = ControlEffectivenessWeights[Rating]
```

**النطاقات:**

| التقييم | الفعالية |
|---------|----------|
| Effective | 75% |
| Partially Effective | 50% |
| Ineffective | 25% |
| Not Assessed | 0% |

---

## المرحلة الرابعة: حساب تقليل المخاطرة (Risk Reduction)

### 1. مساهمة كل رقابة (Control Contribution)

**الصيغة:**
```
Contributionᵢ = (CEᵢ / 100) × Relevanceᵢ × Weightᵢ
```

**حيث:**
- `CEᵢ` = فعالية الرقابة i (0-100)
- `Relevanceᵢ` = مدى الصلة (0-1)
- `Weightᵢ` = الوزن (مجموع الأوزان = 1)

---

### 2. التقليل الكلي (Combined Reduction)

**الصيغة (طريقة التراكم):**
```
Combined = 1 - Π(1 - Contributionᵢ)
```

**أو طريقة الجمع البسيطة (الافتراضية):**
```
        n
CR = Σ Contributionᵢ
       i=1
```

**مثال:**
```
MFA:          CE=87%, Relevance=0.95, Weight=0.40 → 0.329
PAM:          CE=82%, Relevance=0.90, Weight=0.35 → 0.258
Access Review: CE=75%, Relevance=0.80, Weight=0.25 → 0.150
─────────────────────────────────────────────────────
CR = 0.329 + 0.258 + 0.150 = 0.737 (73.7%)
```

---

### 3. تطبيق الحد الأقصى (Maximum Risk Reduction Cap)

**الصيغة:**
```
Effective_CR = min(Raw_CR, MaxReduction)
```

**حيث:**
- `MaxReduction` = 0.75 (75%) افتراضياً
- `Raw_CR` = التقليل المحسوب

**مثال:**
```
Raw_CR = 85%
MaxReduction = 75%
Effective_CR = min(85%, 75%) = 75% (Cap Applied!)
```

---

## المرحلة الخامسة: حساب المخاطرة المتبقية (Residual Risk)

### الطريقة الأولى: طريقة الـ CE الشاملة (Overall CE) - الافتراضية

**الصيغة:**
```
RR = IR × (1 - Effective_CR)
```

**مع الحد الأدنى:**
```
RR = max(RR, MinResidualScore)
```

**مثال:**
```
IR = 20
Effective_CR = 0.737
RR = 20 × (1 - 0.737) = 20 × 0.263 = 5.26 → 5

مع الحد الأدنى:
MinResidualScore = 1
RR = max(5, 1) = 5
```

---

### الطريقة الثانية: طريقة المحاور (Axis Reduction / ISO 27005)

**الصيغة:**
```
Residual_L = L × (1 - CE_likelihood)
Residual_I = I × (1 - CE_impact)
RR = Residual_L × Residual_I
```

**حيث:**
- `CE_likelihood` = فعاليات الرقابات الوقائية
- `CE_impact` = فعاليات الرقابات الاستكشافية/التصحيحية

**مثال:**
```
L = 4, I = 5
CE_likelihood = 0.6 (من MFA, PAM)
CE_impact = 0.4 (من Backup, Detective)

Residual_L = 4 × (1 - 0.6) = 4 × 0.4 = 1.6
Residual_I = 5 × (1 - 0.4) = 5 × 0.6 = 3.0

RR = 1.6 × 3.0 = 4.8 → 5
```

---

## المرحلة السادسة: تحديد مستوى المخاطرة (Risk Level)

**الصيغة:**
```
if (Score >= Critical) → Critical  (≥20)
if (Score >= High)     → High      (≥12)
if (Score >= Medium)   → Medium    (≥6)
else                   → Low       (<6)
```

---

## المرحلة السابعة: تقييم الشهية (Appetite Evaluation)

**الصيغة:**
```
if (RR <= AppetiteLimit)              → "Within Appetite" (أخضر)
if (RR > Appetite && RR <= Tolerance) → "Above Appetite / Within Tolerance" (برتقالي)
if (RR > Tolerance)                   → "Outside Tolerance" (أحمر)
```

**مثال:**
```
AppetiteLimit = 8
ToleranceLimit = 12

RR = 5  → Within Appetite ✓
RR = 10 → Above Appetite / Within Tolerance ⚠️
RR = 15 → Outside Tolerance 🚨
```

---

## المرحلة الثامنة: حوكمة التجاوز (Override Governance)

**صيغة نسبة الانحراف:**
```
DeviationRatio = |UserValue - SuggestedValue| / SuggestedValue
```

**مستويات الحوكمة:**

| النسبة | المستوى | المطلوب |
|--------|---------|---------|
| 0-10% | Normal | لا شيء |
| 10-20% | Warning | تحذير |
| 20-40% | Justification | تبرير (20 حرف حد أدنى) |
| >40% | Approval | تبرير + موافقة |

---

## ملخص جميع المعادلات

```
┌──────────────────────────────────────────────────────────────────┐
│  المدخلات                                                        │
│  ─────────                                                       │
│  L = Likelihood (1-5)                                           │
│  S = [S₁, S₂, ..., S₈] = Impact Scores (1-5)                   │
│  W = [W₁, W₂, ..., W₈] = Impact Weights (ΣW = 1)               │
│  Controls = [{CE, Relevance, Weight, Role}]                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Impact = f(S, W)                                            │
│     ├── Weighted: I = Σ(Sᵢ × Wᵢ)                               │
│     ├── Max: I = max(S)                                         │
│     ├── Average: I = mean(S)                                    │
│     └── Matrix: I = Matrix[row][col]                            │
│                                                                  │
│  2. Inherent = f(L, I)                                          │
│     ├── Multiplicative: IR = L × I                              │
│     ├── Weighted Additive: IR = (wL×L + wI×I) × 5              │
│     └── Matrix: IR = Matrix[L][I]                               │
│                                                                  │
│  3. Control Effectiveness = f(Assessment, Model)                │
│     ├── Factors: CE = Σ(Fᵢ × Wᵢ)                               │
│     └── Band: CE = Weights[Rating]                              │
│                                                                  │
│  4. Reduction = f(Controls)                                     │
│     ├── Contribution = (CE/100) × Relevance × Weight            │
│     ├── Combined = Σ(Contributions)                             │
│     └── Effective = min(Raw, MaxReduction=75%)                  │
│                                                                  │
│  5. Residual = f(Inherent, Reduction)                           │
│     ├── Overall CE: RR = IR × (1 - Effective_CR)                │
│     ├── Axis: RR = (L×(1-CE_L)) × (I×(1-CE_I))                 │
│     └── Floor: RR = max(RR, MinResidual=1)                      │
│                                                                  │
│  6. Level = f(Score)                                            │
│     ├── Critical: ≥20                                           │
│     ├── High: ≥12                                               │
│     ├── Medium: ≥6                                              │
│     └── Low: <6                                                 │
│                                                                  │
│  7. Appetite = f(RR, Limits)                                    │
│     ├── Within: RR ≤ 8                                          │
│     ├── Above: 8 < RR ≤ 12                                      │
│     └── Outside: RR > 12                                        │
│                                                                  │
│  8. Governance = f(User, Suggested)                             │
│     └── Deviation = |User - Suggested| / Suggested              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## مثال شامل كامل

```
╔══════════════════════════════════════════════════════════════════╗
│  الريسك: Unauthorized Privileged Access                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. IMPACT CALCULATION (Weighted)                               ║
║     Financial: 5×0.125 = 0.625                                  ║
║     Regulatory: 4×0.125 = 0.500                                 ║
║     Reputational: 3×0.125 = 0.375                               ║
║     Safety: 2×0.125 = 0.250                                     ║
║     Operational: 4×0.125 = 0.500                                ║
║     Confidentiality: 3×0.125 = 0.375                            ║
║     Integrity: 4×0.125 = 0.500                                  ║
║     Availability: 3×0.125 = 0.375                               ║
║     ─────────────────────────────────                           ║
║     Raw Sum = 3.5 → Impact = 4                                  ║
║                                                                  ║
║  2. INHERIT RISK (Multiplicative)                               ║
║     L = 4, I = 4                                                ║
║     IR = 4 × 4 = 16                                             ║
║                                                                  ║
║  3. CONTROL EFFECTIVENESS                                       ║
║     MFA: Design=90, Operating=85, Coverage=92, Testing=100      ║
║     CE = 90×0.25 + 85×0.35 + 92×0.25 + 100×0.15 = 91%         ║
║                                                                  ║
║  4. RISK REDUCTION                                              ║
║     MFA: 0.91 × 0.95 × 0.40 = 0.346                            ║
║     PAM: 0.85 × 0.90 × 0.35 = 0.268                            ║
║     RBAC: 0.90 × 0.85 × 0.25 = 0.191                           ║
║     ─────────────────────────────────                           ║
║     Raw CR = 0.346 + 0.268 + 0.191 = 0.805 (80.5%)            ║
║     Effective CR = min(80.5%, 75%) = 75% (Cap Applied!)         ║
║                                                                  ║
║  5. RESIDUAL RISK                                               ║
║     RR = 16 × (1 - 0.75) = 16 × 0.25 = 4                       ║
║     RR = max(4, 1) = 4                                          ║
║                                                                  ║
║  6. RISK LEVEL                                                  ║
║     Score = 4 < 6 → LOW                                         ║
║                                                                  ║
║  7. APPETITE                                                    ║
║     RR = 4 ≤ 8 → Within Appetite ✓                              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**المصدر:** `server/riskEngine.js` - المحرك الاحترافي لحساب المخاطرة
