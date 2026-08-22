# تقرير موديول Governance & Policy — الوضع الحالي الفعلي

> وصف تفصيلي لما هو موجود فعليًا ومشتغل في موديول الحوكمة والسياسات (Governance & Policy) من تطبيق **Wadjet GRC Suite**، بدون أي تعديل على الكود. الغرض: تقييم من خبير GRC.

---

## 1. نظرة عامة

الموديول بيغطّي ٩ شاشات رئيسية (list + detail) مقسّمة على ٨ مسارات، وكلها بتخدم أهداف الحوكمة التقليدية:

1. إدارة دورة حياة السياسات (إنشاء/مراجعة/اعتماد/نشر/نسخ/مقارنة).
2. ربط السياسات بالمخاطر والضوابط والأدلة (traceability).
3. الإقرارات والاستثناءات من السياسة (Attestation & Exceptions).
4. التسلسل الهرمي للسياسات (Hierarchy) وملكية الوثائق.
5. سجل تدقيق كامل لكل سياسة (Audit Trail).
6. إدارة استثناءات السياسة المنظمة (Exception Types + Approval Rules).
7. برنامج إدارة الوثائق التنظيمية (Document Program).
8. الأدوار والصلاحيات عبر المنصة (Roles & Permissions Matrix).
9. اللجان الحوكمية (Committees) مع الأعضاء والاجتماعات والقرارات.
10. لوحة تنفيذية مجمّعة عبر كل الموديولات (Executive Dashboard).

---

## 2. التقنية والبنية (إجمالي، يخص الموديول)

- **الواجهة:** React + React Router، وبياكلم السيرفر عبر `api/client.js` (و `resource(path)` للـ REST الموحّد).
- **السيرفر:** `server/mock-server.mjs` — سيرفر Node (http) **mock / in-memory** على `http://localhost:5000`، شغال عليه فعليًا الآن. كل البيانات في ذاكرة العملية وبتترست عند إعادة التشغيل.
- **المصادقة:** Bearer token على شكل `wadjet.<username>.<ts>`، صالحة ٨ ساعات. حسابات demo: `admin/admin123`، `analyst/analyst123`، `auditor/auditor123`.
- **التوثيقات:** مفيش قاعدة بيانات حقيقية؛ الملفات المُرفعة بتتحفظ في `Map` (`FILES`) في الذاكرة وبتترجع من `/api/files/:id`.
- **الأسماء المرجعية للسياسات:** `POL-001` ... بتولّد تلقائيًا (تسلسلي) عند الإنشاء.
- البيانات التجريبية اللي بتفضل على الشاشة في كل الصفحات في `server/mock-data.mjs` (قسم `POLICIES`, `COMMITTEES`, `EXCEPTION_TYPES`, `ROLES`, `DOCUMENT_PROGRAM`).

---

## 3. المسارات (Routes)

| المسار | الصفحة |
|---|---|
| `/governance/policies` | قائمة السياسات (Policy Management) |
| `/governance/policies/:id` | تفاصيل السياسة (11 تبويب) |
| `/governance/exceptions` | تعريف أنواع الاستثناءات (Define Exceptions) |
| `/governance/documents` | برنامج الوثائق (Document Program) |
| `/governance/roles` | الأدوار والصلاحيات (Roles & Permissions) |
| `/governance/roles/:id` | تفاصيل الدور (Matrix / Users / Authority) |
| `/governance/committees` | اللجان (Committees) |
| `/governance/committees/:id` | تفاصيل اللجنة (4 تبويبات) |
| `/governance/executive` | اللوحة التنفيذية (Executive Dashboard) |

---

## 4. قائمة السياسات — `/governance/policies` (PolicyManagement)

- **البيانات:** `GET /api/policies` مع فلاتر (بحث نصي، فلترة بالحالة، بالتصنيف، بالمالك) و Pagination من السيرفر.
- **العرض:** جدول فيه: رقم السياسة، العنوان، الفئة (category)، التصنيف (classification)، الحالة (Draft/Review/Approval/Approved/Published/Retired)، رقم النسخة، المالك، تاريخ المراجعة القادمة، علامة متأخرة عن موعد المراجعة.
- **الإجراءات:** إنشاء سياسة جديدة (مودال)، تعديل سريع، حذف، الدخول لتفاصيل السياسة، وتصدير CSV من المتصفح.
- **عدادات أعلى الصفحة:** عدد السياسات، المنشورة، قيد المراجعة، قيد الاعتماد، المتأخرة عن المراجعة — كلها من `GET /api/policies/stats` اللي بترجع كمان الحالات القديمة (`Pending Review`/`Pending Approval`) مع الجديدة في العدّ.
- **نموذج الإنشاء:** العنوان، الوصف، الفئة، التصنيف، المالك، القسم، `reviewPeriodDays`، `tags`، المحتوى. الحالة الافتراضية `Draft` والنسخة `1.0`. `policyId` بيتولد تلقائيًا (`POL-00X`).

---

## 5. تفاصيل السياسة — `/governance/policies/:id` (PolicyDetail)

الصفحة فيها رأس فيه: رقم السياسة، النسخة، الحالة، وزر **PDF Export** (بيفتح نافذة طباعة بكل الحقول والمحتوى). وتحتها **شريط دورة الحياة** (Stepper): Draft → Review → Approval → Approved → Published.

### التبويبات الـ 11 بالتفصيل:

**5.1 Policy Details**
- عرض/تعديل كل بيانات السياسة (نفس حقول الإنشاء + تواريخ السريان/الانتهاء + المراجعة القادمة).
- الحفظ بـ `PUT /api/policies/:id` وبيتسجل في السجل action = `Updated`.

**5.2 Workflow & Approval**
- شريط تقدم + أزرار انتقال حسب الحالة الحالية.
- الأزرار: **Submit for Review** (Draft→Review)، **Approve** (Review→Approval أو Approval→Approved)، **Reject** (Review/Approval→Draft)، **Publish** (Approved→Published)، و **Publish Direct** (Draft→Published مباشرة).
- كل انتقال بيتم عبر `POST /api/policies/:id/workflow` بجسم `{ action }`. السيرفر بيفحص صحة الانتقال: لو الإجراء مش مسموح للحالة بيرجع `422` برسالة واضحة.
- عند النشر: بيضبط `effectiveDate` (لو فاضي)، `lastReviewAt`، و `nextReviewDate` = تاريخ النشر + `reviewPeriodDays` (افتراضي 365 يوم).
- **Workflow Stages** (مراحل عمل مخصصة) بتتحفظ عبر `PUT /api/policies/:id` كجزء من بيانات السياسة (بيانات اختيارية على السيرفر، السيرفر بيخزّنها زي ما هي).
- **Audit log** لكل حركة بيظهر في نفس التبويب (ومن `GET /api/policies/:id/audit-logs`).

**5.3 Documents**
- إدارة وثائق السياسة: رفع ملف (multipart حقيقي من المتصفح) أو إدخال مرجع يدوي.
- حقول: fileName, displayName, fileType, version, size, classification (Public/Internal/Confidential/Restricted), role, tags.
- فلاتر بالنوع والدور والتصنيف + بحث + معاينة + فتح الملف من `/api/files/:fileId`.
- `GET/POST /api/policies/:id/documents` و `PUT/DELETE .../documents/:docId`.

**5.4 Risk Mapping**
- ربط سياسة بمخاطر من سجل المخاطر (`GET /api/risks`).
- نوع الربط: `Primary` أو `Support` + rationale.
- الجدول بيعرض: رقم المخاطرة، العنوان، مستوى المخاطرة الإجمالي، نوع الربط، المبرر، من ربط، متى.
- `GET/POST /api/policies/:id/risk-mappings` و `DELETE .../risk-mappings/:id`. ملحوظة: `mappedBy` اسمه مفيش في توليد السيرفر للـ nested (بيترجع اسم الـ user لو الجسم فيه `userId`، وإلا فاضي) — من نقاط الاتساق اللي ناقصة.

**5.5 Control Mapping**
- ربط سياسة بضوابط من سجل الضوابط (`GET /api/compliance/controls`).
- `GET/POST /api/policies/:id/control-mappings` و `DELETE .../control-mappings/:id`.

**5.6 Evidence Mapping**
- ربط "سياسة ← ضابط (Control ID من إطار/إطار Framework) ← دليل" مع رفع ملف دليل أو إدخال وصف.
- فيه علامة `reviewed` (نعم/لا) قابلة للتبديل بـ `PUT`.
- `GET/POST /api/policies/:id/evidence` و `PUT/DELETE .../evidence/:id`.
- السيرفر بيخزّن الرفع multipart في `FILES` وبيحط `fileId`.

**5.7 Attestation & Exceptions**
- **Attestations:** تسجيل إقرار (الاسم + نص الإقرار) — `POST /api/policies/:id/attestations`، وحذفه.
- **Exceptions:** طلب استثناء من السياسة بـ: نوع الاستثناء (من أنواع مُعرّفة "Active" في Define Exceptions)، السبب، التغيير المطلوب، تاريخ انتهاء مقترح (بسقف أقصى = مدة النوع الأقصى `maxDurationDays` من اليوم).
  - `GET/POST /api/policies/:id/exceptions` و `DELETE .../exceptions/:id`.
  - الحالة بتظهر `Pending / Approved / Rejected` (قيم في الـ UI). **لا يوجد handler للاعتماد/الرفض في السيرفر** — النوع بيحدد دور المعتمد والاسكليشن، لكن قرار الاعتماد/الرفض بيعتمد على التعديل المباشر للبيانات (نقطة قصور يجب أن تذكرها للخبير).

**5.8 Version History**
- لقطات نسخ (snapshots) كل نسخة فيها `version`, `status`, `changeType` (Major/Minor), `summary`, `publishedBy`, `createdAt`, `isCurrent`.
- **Create Version:** بياخد النوع (Major/Minor) والملخص، والسيرفر بيخزّن لقطة، والـ UI بيحسب النسخة الجديدة (`v2.0` لـ Major، `v1.x` لـ Minor). ملحوظة: السيرفر بيخزّن الـ record زي ما هو — **مش بيعمل auto-increment للنسخة** ولا بيحدّث `policy.version`؛ الترقيم المتوقع حاليًا بيبقى اختياري من الـ UI.
- حذف لقطة، وترتيب بترتيب الإصدارات.

**5.9 Version Compare**
- اختيار نسختين (older/newer) وعرض **Diff سطري** (خوارزمية LCS) بألوان إضافة/حذف/ثابت.
- نفس مصدر الـ versions (`GET /api/policies/:id/versions`).

**5.10 Hierarchy**
- شجرة السياسات (بضغط/توسيع)، كل عقدة: الرقم، العنوان، الحالة، النسخة، وشارة Root للجذور.
- **Set Parent:** اختيار سياسة منشورة لتصبح أبًا — `PUT /api/policies/:id/hierarchy { parentPolicy }`. القواعد: الأب لازم يكون Published، وممنوع يكون هو نفسه (`422`).
- **Link Policy as Child:** اختيار سياسة جذر (مش ليها أب) وربطها — `PUT /api/policies/:id/hierarchy` على الابن.
- **Detach:** `DELETE /api/policies/:id/hierarchy` لفك الارتباط.
- الشجرة من `GET /api/policies/:id/hierarchy` (ترجع كل الجذور ونسلها، مش الفرع فقط). كل تعديل بيسجل audit `Hierarchy Updated`.
- الـ `withJoins` بيدّي كل سياسة `parentPolicy` و `childPolicies` (لازم للعرض).

**5.11 Audit History**
- سجل تدقيق كامل للسياسة: timestamp، الإجراء (actionType)، المستخدم والدور، التفاصيل (بصيغة `key=value`).
- فلاتر: بالإجراء، بالمستخدم، بمدى تاريخي (from/to).
- الإجراءات اللي بتتسجل فعليًا من السيرفر: `Created`, `Updated`, `Submitted for Review`, `Approved`, `Rejected`, `Published`, `Published Direct`, `Hierarchy Updated`.

---

## 6. لوحة Executive Dashboard — `/governance/executive`

مصدر البيانات `GET /api/governance/executive-dashboard` (read-only rollup عبر كل الموديولات):

- **KPIs (5):** نسبة الالتزام الإجمالية (% من الضوابط Fully/Largely)، النتائج الحرجة المفتوحة (Critical/High gaps + findings غير المغلقة)، السياسات المعلّقة على الاعتماد، الـ CAPAs المتأخرة، والتدقيقات الجارية + عدد أنواع الاستثناءات النشطة.
- **Compliance trend:** خط 12 شهر لنسبة نجاح تقييمات الضوابط شهريًا (لو مفيش تقييم في شهر بيسيب فجوة null).
- **Audit status summary:** دونات بتوزيع مراحل التدقيق (Planning/Fieldwork/Findings Review/Reporting/CAPA/Closed).
- **Top open risks/gaps:** أعلى 8 بنود مفتوحة (gaps + findings) مرتبة بالشدة، مع نوعها وصاحبها وتاريخ الاستحقاق وروابط مباشرة.
- **Policy health:** عدد السياسات المنشورة المتأخرة عن المراجعة، المستحقة خلال 90 يوم، وقائمة الـ 6 القادمة للمراجعة (مرتبة بالتاريخ).
- **Governance calendar:** أقرب 10 أحداث (اختبار ضوابط، تدقيقات، CAPA، اجتماعات لجان) خلال 90 يوم.

---

## 7. Define Exceptions — `/governance/exceptions`

- **البيانات:** `GET /api/governance/exception-types` + `GET /api/governance/roles` (لاختيار أدوار المعتمدين).
- **الجداول/العدادات:** عدد الأنواع، النشطة، عدد الاستثناءات المستخدمة لهذه الأنواع (`usageCount`)، عدد أدوار الاعتماد المتاحة.
- **CRUD نوع استثناء:** الاسم، الوصف، **أقصى مدة (أيام)**، **دور المعتمد المطلوب** (إجباري)، **الاسكليشن** (بعد كام يوم + إلى أي دور)، والحالة Active/Inactive.
- **استخدامه:** نفس النوع بيظهر في تبويب Attestation & Exceptions بأي سياسة، وبيحدد السقف الأقصى لتاريخ الانتهاء.
- **الحفظ:** `POST/PUT/DELETE /api/governance/exception-types/:id`.

---

## 8. Document Program — `/governance/documents`

- **البيانات:** `GET /api/governance/document-program` (كائن واحد).
- **5 أقسام قابلة للتعديل والحفظ (`PUT`):**
  1. **Classification Schema:** مستويات التصنيف (Level/Description/Handling requirements/Color) — إضافة/حذف صفوف.
  2. **Retention Policy:** لكل مستوى: مدة الاحتفاظ (سنوات)، طريقة التخلص (Delete/Archive/Review)، وتجاوز الحجز القانوني (Legal hold).
  3. **Numbering Convention:** لكل نوع سجل: prefix، عرض التعبئة (padding)، الرقم التالي، ومعاينة المثال.
  4. **Versioning Rules:** ماذا يسبب Major vs Minor، وهل Major يحتاج إعادة اعتماد كاملة.
  5. **Allowed File Types & Limits:** قائمة امتدادات مسموحة (14 امتداد) + أقصى حجم ملف (MB).
- ملحوظة: السيرفر بيحفظ الكائن كما هو بدون تحقق؛ شعار "الألوان بتقود شارات التصنيف عبر الموديولات" ده تمثيل بصري في الـ UI.

---

## 9. Roles & Permissions — `/governance/roles` + `/governance/roles/:id`

### القائمة
- `GET /api/governance/roles` → كل دور مع `usersAssigned` (عدد المستخدمين المرتبطين، محسوب من `/governance/roles/:id/users`).
- CRUD دور (اسم، وصف، حالة Active/Inactive). حذف/تعديل/إنشاء مباشر.
- عداد: الأدوار، النشطة، إجمالي التعيينات.

### تفاصيل الدور — 3 تبويبات:
1. **Permissions Matrix:**
   - جدول **5 وحدات** (Policy, Compliance, Audit, Context, Governance) × **5 إجراءات** (view, create, edit, delete, approve) — مربعات Check/Uncheck.
   - الحفظ بـ `PUT /api/governance/roles/:id { permissionsMatrix }`.
   - **مهم للخبير:** الماتريكس شكلي (بيتخزن ويترجع)، لكن **لا يوجد أي تحقق فوري أثناء التنفيذ في السيرفر** يمنع مستخدم من إجراء غير مسموح — الماتريكس حاليًا "مصدر حقيقة" معروض فقط، مش مفعّل كطبقة أمان فعلية على الـ handlers.
2. **Assigned Users:**
   - `GET /api/governance/roles/:id/users`، إسناد مستخدم (`POST .../users { userId }` — بيترجع كائن user كامل)، وإلغاء الإسناد (`DELETE .../users/:userId`).
3. **Approval Authority:**
   - قائمة مراحل عمل يقدر الدور يعتمدها (`approvalAuthority` = مصفوفة `{ module, workflowStage }`).
   - مثال: "Policy: Approval stage", "Audit: Findings Review stage".
   - بيتخزن بـ `PUT /api/governance/roles/:id` — يُشار إليه في واجهات الـ Exception Type (role المعتمد)، لكن **لا يوجد إنفاذ فعلي** على السيرفر.

---

## 10. Committees — `/governance/committees` + `/governance/committees/:id`

### القائمة
- `GET /api/governance/committees` → كل لجنة مع نوعها ورئيسها (`chair`)، عدد الأعضاء/النصاب، تكرار الاجتماعات، الحالة.
- CRUD لجنة (الاسم، النوع من قائمة، الرئيس من المستخدمين، تكرار الاجتماعات، النصاب المطلوب، الحالة، الميثاق/الوصف).
- عداد: اللجان، النشطة، إجمالي الأعضاء، إجمالي القرارات المسجلة.

### تفاصيل اللجنة — 4 تبويبات:
1. **Details:** عرض/تعديل بيانات اللجنة (`PUT /api/governance/committees/:id`).
2. **Members:**
   - `GET /api/governance/committees/:id/members` — إضافة/حذف عضو وتغيير دوره (Chair/Member/Secretary) فورًا من dropdown.
   - ملحوظة: سجل أعضاء اللجان مش بيسجل `createdAt` في القائمة من السيرفر (بيخزن بدون تاريخ في بعض المسارات) — تفصيلة صغيرة.
3. **Meeting Log:**
   - تسجيل اجتماع: التاريخ، الحضور (checkbox من المستخدمين)، الأجندة، رابط محضر الاجتماع (نص حر).
   - `GET/POST /api/governance/committees/:id/meetings` و `DELETE .../meetings/:id`.
   - الحضور بيخزن IDs، والـ UI بيعرض الأسماء (لكن السيرفر مش بيربطها بأسماء المستخدمين تلقائيًا — الـ attendance بيظهر زي ما اتخزن).
4. **Decisions & Sign-offs:**
   - تسجيل قرار رسمي: التاريخ، الاجتماع المرتبط، نوع السجل المربوط (Audit Report/Policy/Policy Exception/...)، رقم السجل، نتيجة التصويت (Unanimous/Majority/Minority)، نص القرار.
   - `GET/POST /api/governance/committees/:id/decisions` و `DELETE .../decisions/:id`.

---

## 11. الـ API Endpoints الخاصة بالموديول (ملخّص)

| المسار | الطرق | الوظيفة |
|---|---|---|
| `/api/policies` | GET (قائمة+fلاتر+صفحات), POST (إنشاء) | إدارة السياسات |
| `/api/policies/:id` | GET, PUT, DELETE | تفاصيل/تعديل/حذف |
| `/api/policies/stats` | GET | إحصائيات (total, published, pendingReview, pendingApproval, overdue) |
| `/api/policies/:id/workflow` | POST | انتقالات دورة الحياة |
| `/api/policies/:id/hierarchy` | GET, PUT, DELETE | الشجرة / ربط الأب / فك الارتباط |
| `/api/policies/:id/audit-logs` | GET | سجل تدقيق السياسة |
| `/api/policies/:id/versions` | GET, POST (+DELETE لكل نسخة) | لقطات النسخ |
| `/api/policies/:id/documents` | GET, POST | وثائق السياسة (multipart) |
| `/api/policies/:id/evidence` | GET, POST (+PUT/DELETE لكل دليل) | أدلة الضبط |
| `/api/policies/:id/risk-mappings` | GET, POST (+DELETE) | ربط المخاطر |
| `/api/policies/:id/control-mappings` | GET, POST (+DELETE) | ربط الضوابط |
| `/api/policies/:id/attestations` | GET, POST (+DELETE) | الإقرارات |
| `/api/policies/:id/exceptions` | GET, POST (+DELETE) | طلبات الاستثناءات |
| `/api/governance/exception-types` | GET, POST (+PUT/DELETE لكل نوع) | أنواع الاستثناءات |
| `/api/governance/roles` | GET, POST (+PUT/DELETE لكل دور) | الأدوار |
| `/api/governance/roles/:id/users` | GET, POST, DELETE | تعيين/إلغاء مستخدمين للدور |
| `/api/governance/committees` | GET, POST (+PUT/DELETE لكل لجنة) | اللجان |
| `/api/governance/committees/:id/members` | GET, POST (+PUT/DELETE لكل عضو) | أعضاء اللجنة |
| `/api/governance/committees/:id/meetings` | GET, POST (+DELETE لكل اجتماع) | اجتماعات اللجنة |
| `/api/governance/committees/:id/decisions` | GET, POST (+DELETE لكل قرار) | قرارات اللجنة |
| `/api/governance/document-program` | GET, PUT | برنامج الوثائق |
| `/api/governance/executive-dashboard` | GET | اللوحة التنفيذية |
| `/api/files/:id` | GET | استرجاع ملف مرفوع |

> كل الـ nested (versions/documents/evidence/risk-mappings/control-mappings/attestations/exceptions/members/meetings/decisions/users/audit-logs) بتتخزن في `Map` داخلي (`nested`) منفصل عن الـ collections الرئيسية.

---

## 12. دورة حياة السياسة (Workflow) — القواعد الحالية في السيرفر

الحالات الـ canonical: **Draft → Review → Approval → Approved → Published** (+ `Retired` للعرض فقط).

التحولات المسموحة فعليًا في `POST /api/policies/:id/workflow`:

| الحالة الحالية | action | النتيجة | Label في السجل |
|---|---|---|---|
| Draft | `submit-review` | Review | Submitted for Review |
| Draft | `publish-direct` | Published | Published Direct |
| Review | `approve` | Approval | Approved |
| Review | `reject` | Draft | Rejected |
| Approval | `approve` | Approved | Approved |
| Approval | `reject` | Draft | Rejected |
| Approved | `publish` | Published | Published |

- أي انتقال تاني غير مسموح → **HTTP 422** مع رسالة توضح الإجراء غير الصالح للحالة.
- عند الوصول لـ Published: `effectiveDate` (لو فاضي) = الآن، `lastReviewAt` = الآن، `nextReviewDate` = الآن + `reviewPeriodDays` (افتراضي 365).
- **ملاحظة:** لا يوجد انتقال من Published لـ Review/Retired، ولا concept لـ "retire" في الـ workflow؛ الحالة `Retired` موجودة في الألوان فقط (غير مستخدمة في السيرفر).

---

## 13. الـ Data Model والـ Joins والـ Stats

### `withJoins` (بيترجع لكل سياسة):
- `tags` مصفوفة موحّدة (`normalizeTags`).
- `nextReviewAt` = `nextReviewDate` (أو الحقل القديم `nextReviewAt`).
- `parentPolicy` = كائن مختصر للأب (id, policyId, title, status, updatedAt) أو `null`.
- `childPolicies` = مصفوفة أبناء (id, policyId, title).
- للدور: `usersAssigned` = عدد التعيينات من `/governance/roles/:id/users`.

### `statsFor("policies")`:
- `total`, `published`, `pendingReview` (حالات Review + "Pending Review" القديمة), `pendingApproval` (Approval + "Pending Approval" القديمة), `overdue` (Published و `nextReviewDate` قبل اليوم).

### الحالات القديمة:
السيرفر بيعامل `Pending Review` كـ Review و `Pending Approval` كـ Approval في التحويلات والإحصائيات (توافق مع بيانات سابقة).

### الـ Seeds الحالية (demo) في mock-data:
- 5 سياسات (POL-001..005) بحالات: Published، Review، Published، Approval، Draft — منها اثنان متأخران عن المراجعة (POL-003 متأخرة 5 أيام، POL-002 متأخرة 15 يوم) — مفيد لتجربة الفلاتر والعدادات.
- 3 لجان (Risk Committee, Audit Committee, IT Steering Committee) — لكن **بياناتها بصيغة قديمة** (`mandate`/`frequency`/`chair` نصي) بينما الـ UI الحديث بيتوقع `type`/`charter`/`meetingFrequency`/`chair` ككائن مستخدم → بعض الأعمدة بتظهر "—" أو أرقام ناقصة لحد ما اللجنة تتعدل من الـ UI.
- 3 أنواع استثناءات (Technical/Operational/Third-Party) بصيغة قديمة (`defaultExpiryDays`) بينما الـ UI الحديث بيتوقع `maxDurationDays` + `requiredApproverRole` → الحقول الجديدة فاضية في الـ demo وتحتاج إعادة تعريف.
- 4 أدوار (Admin/User/Auditor/Viewer) بصيغة قديمة (`permissionsMatrix` كسلسلة `manage/view/edit` و `approvalAuthority` كسلسلة "Tier 3") بينما الـ UI الحديث بيتوقع matrix كـ `{ module: { action: bool } }` ومصفوفة للمراحل → الماتريكس في الشاشة بتظهر فاضية للنقر عليها حتى يتحدث الدور.

---

## 14. نقاط قوة موجودة فعلًا

1. **أثر تدقيق كامل لكل سياسة** — كل عملية (إنشاء/تعديل/كل انتقال workflow/هيراركي) بتسجل action+actor+role+details+timestamp.
2. **نموذج توافقي للحالات** — التعامل مع الحالات القديمة والجديدة معًا في الإحصائيات والتحويلات.
3. **قواعد انتقال صارمة** — رفض التحويلات غير الصالحة بـ 422 بدل قبولها.
4. **سقف زمني للاستثناءات** — مدة النوع بتحدد أقصى تاريخ انتهاء مقبول.
5. **تتبع عبر السياسات** — ربط سياسة بمخاطر وضوابط وأدلة (Traceability).
6. **تسلسل هرمي** بقيود منطقية (الأب منشور فقط، ممنوع يكون نفسه أب).
7. **اللوحة التنفيذية** بتجمع مؤشرات من كل الموديولات في شاشة واحدة بروابط تنقل.
8. **إدارة نسخ ومقارنة** + تصدير PDF سريع لكل سياسة.

---

## 15. نقاط قصور/ملاحظات يلزم خبير GRC يقيّمها

1. **سيرفر mock/ذاكرة**: كل التعديلات بتضيع عند إعادة تشغيل السيرفر — مفيش تخزين دائم ولا قاعدة بيانات، ولا صلاحيات أمان حقيقية.
2. **المصادقة شكلية**: الـ token بسيط (username + timestamp) ومفيش تفويض على مستوى الإجراءات؛ أي مستخدم مسجل يقدر ينفذ أي انتقال workflow أو تعديل.
3. **الماتريكس والـ Approval Authority شكليان**: بيتم تخزينهما وعرضهما لكن **مش مفعّلين كطبقة تحكم وصول فعلية** على الـ handlers.
4. **الاعتماد/الرفض للاستثناءات غير منفّذ**: الـ UI بيعرض حالة الاستثناء (Pending/Approved/Rejected) لكن مفيش endpoint حقيقي للاعتماد/الرفض؛ التغيير بيتم بتعديل البيانات مباشرة.
5. **لا يوجد Retire/Archiving workflow** للسياسات في السيرفر رغم وجود لون `Retired`.
6. **النسخ الـ auto-increment غير منفّذ** على السيرفر (الـ UI بيحسب الاسم المقترح فقط، والسيرفر بيحفظ اللقطة بدون ترقية `policy.version`).
7. **عدم تطابق seeds القديمة مع نموذج الواجهة الحديث** (لجان/استثناءات/أدوار) → بيانات demo ناقصة وبعض العدادات بتظهر أرقام غير دقيقة حتى التعديل من الواجهة.
8. **الـ data integrity خفيفة**: مفيش تحقق من المراجع عبر الجداول (مثلاً ربط اجتماع لقرار، ربط member بيوزر غير موجود)، وده مقبول كـ mock لكن غير كافٍ للإنتاج.
9. **حقول اختيارية بلا إنفاذ**: زي `mappedBy` في الـ risk-mappings و `createdAt` في أعضاء اللجان، و`attendees` بدون ربط أسماء من السيرفر.

---

## 16. كيفية التجربة (للتأكد من الوصف)

1. شغّل السيرفر: `node server/mock-server.mjs` (يعمل على `http://localhost:5000`).
2. شغّل الواجهة: `npm run dev` داخل `client/` ثم ادخل على `/governance/policies`.
3. سجّل الدخول بـ `admin/admin123`.
4. جرّب: افتح POL-001 → جرّب Workflow على POL-005 (Draft) → Documents/Evidence/Attestation → Hierarchy على أي سياسة → Executive Dashboard → Committees/Roles/Exceptions/Document Program.