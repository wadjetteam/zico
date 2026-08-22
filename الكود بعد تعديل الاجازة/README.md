# WADJET GRC

**Eyes on Risk. Control in Action.**

A Governance, Risk & Compliance application for banks and financial institutions —
the internal tool teams log into daily, not a marketing site.

> Note: this monorepo (`/client` + `/server`) is a standalone React + Express + MongoDB
> application. Run it locally with the instructions below; it is not served by the
> Lovable preview, which runs a different runtime.

## Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 18 (Vite), React Router v7, Tailwind CSS, Framer Motion, Recharts, axios |
| Backend  | Node.js + Express (REST) |
| Database | MongoDB + Mongoose |
| Auth     | JWT bearer tokens (no server sessions) |

## Layout

```
/client   React SPA
/server   Express REST API + Mongoose models + seed script
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

## Server setup

```bash
cd server
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm install
npm run seed              # demo users + sample GRC data
npm run dev               # http://localhost:5000
```

`.env` variables:

| Key | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated |

## Client setup

```bash
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Vite also proxies `/api` to `http://localhost:5000` in development.

## Demo credentials

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | admin |
| `analyst` | `analyst123` | user |
| `auditor` | `auditor123` | auditor |

## Auth contract

- `POST /api/auth/login` — `{ username, password }` → `{ token, user }`
- `POST /api/auth/logout` — stateless acknowledgement
- `GET /api/auth/me` — current user from the bearer token
- The client stores the token as `localStorage["wadjet_token"]` and sends
  `Authorization: Bearer <token>` on every request.
- Any missing/invalid/expired token returns **401** (never 403); the axios
  interceptor then clears storage and redirects to `/login`.

## API surface

All routes below require a valid JWT and follow the same CRUD shape:
`GET /` (list, supports `?q=&sort=&order=&page=&limit=` plus field filters),
`GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.

```
/api/frameworks          /api/policies            /api/exceptions
/api/documents           /api/risks               /api/management-reviews
/api/poam                /api/audits              /api/audit-findings
/api/assets              /api/asset-groups        /api/questionnaires
/api/assessments         /api/third-party
```

Plus:

- `GET /api/dashboard/summary` — totals, severity split, category split, 6-month trend, framework coverage
- `GET /api/ai/insights` — derived risk analysis
- `POST /api/ai/chat` — placeholder assistant responses

## Application modules

1. **Governance** — control frameworks, policies, exceptions, document program
2. **Risk Management** — submit, register + heat map, scoring, management reviews, closure, POAM
3. **Compliance** — manage / active / past audits
4. **Asset Management** — assets and asset groups
5. **Artificial Intelligence** — risk insights dashboard, assistant chat
6. **Assessments** — risk assessments, questionnaire templates, third-party assessments
7. **Reporting** — executive summary, dynamic risk report (CSV export), compliance reports

## Brand

Dark surfaces (`#101417` / `#0D0D0D`) with `#1a1a1a → #1f1f1f` card gradients and a gold
palette (`#D4AF37`, `#E8C96A`, `#B8860B`, `#FFD700`). Montserrat for headings, Manrope for body.
The emblem lives in `client/src/components/Logo.jsx` — swap the inner SVG for the production
artwork; the `<Logo size={…} withWordmark />` API is what the app depends on.
