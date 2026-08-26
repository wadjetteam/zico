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

<!-- Move items here from "🚀 Next phase" when finished. Group by area. -->

---
## 🚀 Next phase

**Goal:** _Validate and extend Risk Management only where a concrete workflow gap is identified._

### Acceptance criteria
1. _`/risk` opens the Risk Register and Risk sub-navigation exposes implemented workflows._
2. _Continuous CE output and specification-compatible route aliases are active._

### Files to create / edit
| Type | File | Content |
|---|---|---|
| done | `client/src/lib/nav.js` | Following Up sidebar section |
| done | `client/src/App.jsx` | Following Up route |
| done | `client/src/pages/risk/FollowingUp.jsx` | Risk follow-up dashboard |
| done | `client/src/pages/settings/RiskOwners.jsx` | Risk Owner CRUD/status UI |
| done | `server/mock-data.mjs` | User model fields |
| done | `server/mock-server.mjs` | User and risk-owner validation |
| done | `server/riskEngine.js` | Continuous CE precision |
| done | `client/src/App.jsx` | Risk specification route aliases |
| done | `server/import-risk-sheet.mjs` | Idempotent 48-risk spreadsheet importer |

### Closed decisions
- Use the existing `risks` resource and calculate due-date urgency in the client.
- Use the existing in-memory `USERS` collection, preserving legacy `fullName`/`username` fields.
- Preserve existing `/risk/*` routes while supporting the specification's `/risks/*` aliases.
- The attached specification's criteria list sums to raw impact 3.375; the stated 3.625 example value is inconsistent with its own inputs.

### Open decisions
- Whether follow-up email sending should be enabled from this page after SMTP settings are finalized.
- No countdown email worker currently exists in this mock API; add one when SMTP/job requirements are ready.
- The attached functional specification was used as the Risk implementation acceptance criteria.

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
