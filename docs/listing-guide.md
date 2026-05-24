# Listing guide

## 1) Edit data for this listing (Rainbow Drive)

1. Open your site (not the `?view=share` link):  
   https://property-launch-cal.onrender.com/?property=rainbow-drive
2. Toggle **Admin** → enter your **admin** passcode (set in Render as `ADMIN_PASSCODE`).
3. Edit:
   - **Events** — timeline pencil icon, or **Add event**
   - **Notes** — section **02 — Notes** (add / edit / delete rows)
   - **Client passcode** — **Listing settings** panel (under Send to client)
4. **Reset demo** only restores the seeded Rainbow Drive sample (slug `rainbow-drive`).

## 2) Add another listing

1. Admin on → scroll to **Listing settings** → **Add another listing**.
2. Enter property name, optional URL slug, optional **client passcode**.
3. You are redirected to the new listing URL:  
   `/?property=your-slug`  
   Share link:  
   `/?view=share&property=your-slug`
4. Add events and notes for that listing separately.

Each listing is isolated by `property_slug` in the URL.

## 3) Client passcode (per listing)

- Set in **Listing settings** → **Save client passcode**.
- Clients opening the share link must enter it once per browser (session stored).
- Clear the field and save to remove protection.

Admin passcode (Render env) is separate — only you use it for editing.
