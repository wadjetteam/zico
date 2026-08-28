## Session note — 2026-08-24

- Connected Context hierarchy navigation: `/context` → Organizations → Domains → Parameters → filtered Risks, with Submit Risk using the selected Domain's Parameter.
- New Organization and New Domain now show automatic read-only IDs before save (`ORG-xxx` and `DMN-xxx`); backend also generates them for direct API creates.
- Completed Context-to-Risk navigation links: Organizations → Domains → Parameters → filtered Risks.
- Parameters now show calculated Overall Impact and separate Likelihood metrics from linked risks.
- Moved the calculated Overall Impact and distinct Likelihood columns from Parameters to Risk View as requested.
- Removed the redundant Risk Heat Map sidebar item; the view remains available inside `/risk/view` and via its legacy route.
- Removed duplicate Risk Parameters navigation; the canonical page remains under `/context/parameters`.

> Single source of truth for resuming work. Read this FIRST when starting a session.
## Session note — 2026-08-24

- Resolved the Vite frontend `ERR_CONNECTION_REFUSED` incident. The application at `zico-3-stable/zico-3-stable/الكود بعد تعديل الاجازة/client` responds at `http://localhost:5173/`.
- Start it with `npm run dev` from that `client` directory.
- The mock API backend is running from the application root at `http://localhost:5000`; `POST /api/auth/login` succeeds.
- The Audit API is running at `http://localhost:5002`; all Audit Module endpoints are available through the Vite proxy at `/audit-api`.
- Risks now reference Asset Management records by `assetId`; the backend validates selections and supplies the linked asset name for display.

---
---
description: session handoff, regenerate with /handoff when a quest finishes
budget_tokens: 1000
---
# STATUS — new code

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-08-24

---

## ✅ Done

- Completed the treatment workflow so status is explicitly separated from overdue and notification state.
- Added workflow transitions for draft → submitted → approved/rejected → in progress → effectiveness review → completed.
- Implemented reminder, acknowledgement, escalation-stage, and notification-history behavior on the treatment API.
- Hardened server-side closure gating so completion requires evidence and the documented review thresholds.
- Updated the treatment register UI to surface workflow status, overdue flags, and reminder/acknowledgement actions.
- Verified the React client still builds successfully after the workflow changes.

---
## 🚀 Next phase

**Goal:** Await user review of the finalized Risk Treatment lifecycle implementation.

### Acceptance criteria
1. Risk Treatment supports the documented governance workflow and explicit gates.
2. The register includes workflow state, overdue tracking, reminder handling, and evidence-driven completion checks.

### Files to create / edit
| Type | File | Content |
|---|---|---|
| modified | `client/src/pages/risk/RiskTreatment.jsx` | Treatment workflow UI and reminder/acknowledgement actions |
| modified | `server/mock-server.mjs` | Workflow, reminders, escalation, and closure enforcement |
| modified | `server/migrations/001_risk_treatments.sql` | Workflow and overdue metadata |
| modified | `server/migrations/002_risk_treatment_governance.sql` | Reminder, acknowledgement, escalation, and notification metadata |

### Closed decisions
- Workflow and overdue state are distinct fields so status is not overloaded with operational escalations.
- Treatment completion is evidence-driven instead of progress-only.
- Closure monitoring remains gated by effectiveness evidence, appetite checks, KRIs, and incident criteria.

### Open decisions
- None at this stage; the implementation is ready for review.

---

## 📁 Active architecture

- **Stack:** _<frameworks, libraries, runtime>_
- **Key tables / modules:** _<list>_
- **Patterns:** _<conventions enforced project-wide>_

---

## ⚠️ External blockers (don't block coding)

- _<env vars, secrets, external accounts, manual steps>_

---

## 🔧 Useful commands

```bash
# add the most-used commands here so the next session has them ready
```

---

## 📚 References (read IF needed)

- `.wolf/cerebrum.md` — User Preferences + Do-Not-Repeat + Decision Log
- `.wolf/anatomy.md` — token-efficient file index
- `.wolf/buglog.json` — known bugs + fixes
