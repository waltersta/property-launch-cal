# Faster loads on Render free tier

Free services **spin down** after ~15 minutes idle. The first visit can take **60–90 seconds** while the server starts.

## Option A — Keep the app warm (free)

Use [UptimeRobot](https://uptimerobot.com) (or similar):

1. New monitor → **HTTP(s)**
2. URL: `https://property-launch-cal.onrender.com/api/health`
3. Interval: **5 minutes**

That reduces cold starts for clients. Render may still spin down occasionally.

## Option B — Always on (~$7/mo)

In Render → your service → change **Plan** from Free to **Starter**. No spin-down.

## Option C — Static front + API (advanced)

Host the built `frontend/dist` on Netlify (instant HTML/JS). Keep only the API on Render. First API call can still be slow if cold.
