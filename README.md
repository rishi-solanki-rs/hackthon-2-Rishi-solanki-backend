# Sidekit Backend Application

REST API and Server-Side Gemini AI Gateway for Sidekit.
Built with **Express**, **TypeScript**, **Zod**, and **@google/genai**.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY`:
```ini
PORT=4000
GEMINI_API_KEY=your_key_here
GEMINI_ENABLED=true
GEMINI_DAILY_CAP=500
```

### 3. Run Development Server
```bash
npm run dev
# Server listens at: http://localhost:4000
# Health check: http://localhost:4000/api/health
```

---

## Automated Verification

```bash
# Run API integration test suite
npm run test

# Run TypeScript type check
npm run typecheck

# Build for production
npm run build
```

---

## Architecture & Endpoints

- `GET /api/health` — Service health check and AI status
- `GET /api/auth/me` — Current demo persona
- `POST /api/auth/switch` — Switch active persona
- `POST /api/auth/join` — Register with society passcode (`PALM2026`)
- `POST /api/plans` — Generate checklist using Gemini AI with deterministic fallback
- `GET /api/plans/:id/options` — 4-tier recommendation comparator matrix
- `POST /api/plans/repair/evaluate` — Laptop Repair vs Replace Advisor (50% rule)
- `GET /api/listings` — Faceted community catalog search
- `POST /api/listings` — Create listing with safety policy validations
- `POST /api/listings/:id/report` — Community reporting (3 reports auto-hide)
- `POST /api/requests` — Submit request (prevents self-request and consumable borrow)
- `POST /api/requests/:id/accept` — Atomic acceptance with automatic competing request decline
- `POST /api/requests/:id/decline` — Decline with reason
- `POST /api/requests/:id/cancel` — Cancel pre-handover with mandatory reason
- `POST /api/requests/:id/handover` — Physical handover confirmation
- `POST /api/requests/:id/return` — Return completion, stock release, and thank-you notes
- `GET /api/impact` — Collective society impact statistics
- `POST /api/admin/reset` — Factory data reset to default seed fixtures
