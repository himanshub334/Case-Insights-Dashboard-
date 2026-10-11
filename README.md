# Case Insights Dashboard

An internal-tool-style case analytics dashboard built with **React, Vite, TypeScript, Tailwind CSS, Framer Motion, Express, PostgreSQL, and REST APIs**. It includes responsive KPI cards, interactive charts, searchable/filterable case records, CSV import with server-side validation, and CSV export.

> **Demo mode:** If the API/database is unavailable, the UI shows clearly labelled sample metrics and sample case records so the interface can be explored without setup. Live imports require PostgreSQL.

## Features

- Responsive dark operations dashboard with reusable metric, chart, table, and upload components.
- Animated entry/hover transitions with Framer Motion.
- Case volume over time, case-type distribution, priority breakdown, and operational KPI summaries using Recharts.
- Search by case ID/type/owner and filter by status and reporting window.
- CSV import with file-size/type checks, required-column validation, row-level validation, numeric ranges, and transaction-backed PostgreSQL writes.
- CSV export of currently displayed cases.
- Express REST endpoints for health, cases, summaries, and CSV uploads.
- PostgreSQL schema with indexes for common filters and time-series queries.
- API error handling and validation tests.

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide icons.
- Backend: Node.js, Express, TypeScript, `csv-parse`, Zod, Multer.
- Database: PostgreSQL 16, `pg` connection pool.
- Tests: Node test runner via `tsx`.

## Requirements

- Node.js 20+
- npm 10+
- Docker Desktop (recommended for PostgreSQL) or a local PostgreSQL instance

## Quick start

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

   The initialization script creates the `datasets` and `cases` tables and their indexes.

2. Install workspace dependencies from the project root:

   ```bash
   npm install
   ```

3. Configure the API environment:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`. The defaults match the included Docker Compose database. The server loads `.env` automatically through `dotenv`. For convenience, you can also set `DATABASE_URL` directly before starting the server.

   **PowerShell example:**

   ```powershell
   $env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/caseinsights"
   $env:CLIENT_ORIGIN = "http://localhost:5173"
   ```

   **macOS/Linux example:**

   ```bash
   export DATABASE_URL="postgres://postgres:postgres@localhost:5432/caseinsights"
   export CLIENT_ORIGIN="http://localhost:5173"
   ```

4. Start frontend and API in separate terminals:

   ```bash
   # Terminal 1, project root
   npm run dev -w server

   # Terminal 2, project root
   npm run dev -w client
   ```

5. Open <http://localhost:5173>. API health is available at <http://localhost:4000/api/health>.

Or start both with `npm run dev` after setting the environment variables in the same shell.

## CSV import format

Required headers:

```csv
id,case_type,status,priority,owner,created_at,resolution_hours,satisfaction,amount
CS-1001,Billing,Resolved,High,Jordan Lee,2026-09-10T12:30:00Z,3.5,4,120.00
CS-1002,Access request,Open,Medium,Maya Chen,2026-09-11T08:00:00Z,,,
```

Only `case_type`, `status`, `priority`, `owner`, and `created_at` are required. `id` is optional and generated when absent. `resolution_hours` must be non-negative; `satisfaction` must be between 1 and 5; `amount` must be numeric. Invalid rows are reported while valid rows are imported. The upload is capped at 10 MB by default; change `MAX_UPLOAD_MB` to adjust it.

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API and database status |
| `GET` | `/api/cases?period=30d&status=Open&q=CS-10` | Search/filter cases; returns up to 200 rows plus total count |
| `GET` | `/api/summary?period=30d` | KPI aggregates and chart breakdowns |
| `POST` | `/api/upload` | Multipart CSV import; field name is `file` |

Supported periods: `7d`, `30d`, `90d`, `all`. The case list endpoint supports optional `status` and `q` query parameters.

## Tests and build

```bash
npm test
npm run build
```

The server validation tests cover valid row normalization, missing headers, invalid dates/ranges, and empty files. The frontend build runs TypeScript checking and Vite bundling.

## Project structure

```text
CaseInsightsDashboard/
├── client/
│   └── src/
│       ├── components/       # reusable metric and CSV upload components
│       ├── lib/              # API client and shared types
│       ├── App.tsx            # dashboard composition and charts
│       └── styles.css         # responsive Tailwind-backed dashboard styles
├── server/
│   ├── src/                   # Express routes, DB pool, validation and tests
│   └── sql/schema.sql         # PostgreSQL tables and indexes
├── docs/USAGE.md
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Notes

- The dashboard's sample mode is intentionally a UI preview; it is not live data.
- Database writes use a transaction. CSV validation is performed before inserts, and invalid row details are returned to the client.
- This is a portfolio/demo application. Add authentication, authorization, audit trails, stricter import quotas, and deployment secrets management before using it with real internal or customer data.
- The dashboard uses illustrative sample numbers in preview mode; do not represent them as production analytics.
# Case-Insights-Dashboard-
