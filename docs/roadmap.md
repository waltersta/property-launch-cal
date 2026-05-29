# Product roadmap

Priority order is fixed: **Section 5 (Settings) first**, then **multi-agent / beta tester** work.

---

## Phase 1 — `05 — Settings` (do this next)

New admin section below **04 — Admin** on the schedule page (same pattern as Calendar / Notes / Timeline).

### 1. Branding (URLs only in v1)
- Hero image URL
- Header image URL  
- (File upload from computer stays in [v2-feature-list.md](./v2-feature-list.md).)

### 2. Agent contact (settings, not only Parties)
- Agent display name
- Agent email  
- Keep Parties colors/clients/TC as-is; settings are the canonical contact fields for email sign-off and future invites.

### 3. Deal type + milestone line (hero subhead)
- Deal type: **Listing** | **Purchase** (or existing schedule-type labels if we align naming).
- Milestone label auto-derived from events (manual override optional later):
  - **Listing** → “Going live” date from **Listing Live** event
  - **Purchase** → “Closing” date from **COE / Close of Escrow** event
- Show in hero where `launch_date_label` / tagline line lives today.

### 4. New Event dropdown sources
- Editable **Event title** list (presets in New Event dialog).
- Editable **Category** list.  
- Stored per property (or global defaults + per-property override — decide in implementation; default: per property in `property_config` JSON columns).

### Out of scope for Phase 1
- Image upload from disk
- SMS / TXT
- Beta invites
- Multi-agent database

---

## Phase 2 — Multi-agent + beta testers (after Phase 1 ships)

### Goals
- Multiple **agents** on one deployment (you + beta testers).
- **Invite Beta Tester** on admin: you enter name + email → system creates agent + trial transaction scaffold.
- Tester opens one link → **no manual delete/fill/prep** by you.
- **First visit**: short onboarding / how-to (dismissible, don’t show again).

### Data model (sketch)
- `agents` — id, name, email, invite_token (or slug), `onboarding_completed_at`, timestamps.
- `property_config.agent_id` (or equivalent) — each listing belongs to one agent.
- Super-admin (you) vs agent-scoped admin (tester sees only their listings).

### Invite flow (sketch)
1. You click **Invite beta tester** → modal: name, email.
2. Backend creates agent row + default trial `property_config` (preset events/parties/branding from templates).
3. Email or copy link: `https://…/welcome?token=…` (exact path TBD).
4. First load: onboarding panel (steps: toggle admin, add/edit event, share link, etc.) then main schedule for **their** trial property only.

### Trial transaction scaffold (automatic)
- Fictional property name (e.g. “Sample listing — {First name}”).
- Listing or buyer preset events (from seed/template, not your Rainbow Drive data).
- Parties prefilled with invited agent name/email; placeholder clients optional.
- No dependency on `rainbow-drive` or reset-demo.

### Security / isolation
- Testers must not see other agents’ slugs or `/api/properties` without their scope.
- Your production listings remain on your agent account.

### Still later (v2)
- Image upload, SMS, editable lists if not fully covered in Phase 1.

---

## Current app sections (reference)

| Section | Status |
|---------|--------|
| 01 — Calendar | Shipped |
| 02 — Notes | Shipped |
| 03 — Timeline | Shipped |
| 04 — Admin | Shipped (parties, passcode, link for client) |
| **05 — Settings** | **Phase 1 — shipped** (URLs, agent, deal type/milestone, event/category lists) |
| Beta / multi-agent | **Phase 2 — shipped** (invite link, trial listing, scoped admin) |
