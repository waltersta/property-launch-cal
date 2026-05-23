# Property Launch Calendar

A reusable listing launch schedule for real estate: dual-month calendar, milestone timeline, client date-picking, admin editing, and `.ics` export.

## Deploy on Render (recommended)

Everything runs as **one free Web Service** (API + UI). First deploy may take a few minutes.

### 1. Push to GitHub

```bash
cd property-launch-cal
git init   # if needed
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:YOU/property-launch-cal.git
git push -u origin main
```

### 2. Create a Render account

Sign up at [render.com](https://render.com) (GitHub login is fine).

### 3. New Blueprint / Web Service

- **Dashboard → New → Blueprint** (if `render.yaml` is in the repo) or **Web Service** connected to the same repo.
- Render reads [`render.yaml`](render.yaml): Python service, build script, health check at `/api/health`.
- After deploy, your app URL looks like `https://property-launch-cal-xxxx.onrender.com`.

### 4. Required environment variable

In **Render → your service → Environment**:

| Variable | Value |
|----------|--------|
| `ADMIN_PASSCODE` | A strong secret (not `rainbow`) |

Copied client links use `RENDER_EXTERNAL_URL` automatically. When you add a custom subdomain later, set:

| Variable | Value |
|----------|--------|
| `PUBLIC_BASE_URL` | `https://schedule.santacruzarea.com` |

### 5. Share with clients

1. Open your Render URL.
2. Toggle **Admin** → enter passcode.
3. **Send to client** → copy **Schedule link** or **Pick-a-date link**.

**Free tier:** the service **spins down** after idle; the first visit may take 30–60 seconds. SQLite data usually persists but can reset on **redeploy** — use **Reset demo** if needed.

### Optional: email when client picks

Add in Render environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

---

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ADMIN_PASSCODE=rainbow uvicorn app.main:app --reload --port 8000
```

### Frontend (hot reload)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API is proxied to port 8000.

### Local production-style (single port)

```bash
cd frontend && npm run build
cd ../backend && source .venv/bin/activate
ADMIN_PASSCODE=rainbow uvicorn app.main:app --port 8000
```

Open [http://localhost:8000](http://localhost:8000).

---

## Send links to your client

1. Open the schedule, toggle **Admin**, enter your passcode.
2. In **Send to client**, copy either link:
   - **Schedule link** — full calendar + timeline (`/?view=share`).
   - **Pick-a-date link** — key handover date choice only (`/pick/...`).
3. When the client submits a date, you see a **green banner** on the admin page (polls every ~30s). Email goes to `walter@831.net` if SMTP is configured.

## Rebrand for a new listing

1. Sign in as admin.
2. Edit events or use **Reset demo**.
3. Update branding via `PUT /api/config` (property name, images, calendar months, etc.).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSCODE` | `rainbow` (local only) | Admin passcode (hashed on first run) |
| `PUBLIC_BASE_URL` | `RENDER_EXTERNAL_URL` on Render | Base URL for copied share/pick links |
| `RENDER_EXTERNAL_URL` | (set by Render) | Used when `PUBLIC_BASE_URL` is unset |
| `DATABASE_URL` | `sqlite:///.../backend/data/schedule.db` | SQLAlchemy database URL |
| `VITE_BACKEND_URL` | empty | Leave empty on Render (same-origin `/api`) |

## API overview

- `GET /api/config` — property branding + calendar range
- `GET /api/events` — all milestones
- `POST /api/events/{id}/pick` — client date selection `{ date, picked_by }`
- `POST /api/admin/verify` — `{ passcode }` → `{ valid, admin_token }`
- Admin routes require header `X-Admin-Token`

## Verification checklist

- [ ] `/api/health` returns `{"ok": true}`
- [ ] Home page loads calendar + timeline
- [ ] Share URL `/?view=share` hides admin controls
- [ ] Key handover shows **?** on option days until client picks
- [ ] Pick flow sets event to `picked` with chosen date
- [ ] Admin passcode unlocks CRUD
- [ ] Export `.ics` downloads a valid file
