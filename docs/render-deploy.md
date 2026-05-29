# Render deploy from CLI / Cursor agent

Lets you (or the agent) trigger a **Manual Deploy** without opening the Render dashboard.

## One-time setup (recommended: deploy hook)

1. Open [Render Dashboard](https://dashboard.render.com/) → **property-launch-cal** → **Settings**.
2. Scroll to **Deploy Hook** → copy the secret URL (looks like `https://api.render.com/deploy/srv-…?key=…`).
3. In the project root, create `.env` (already gitignored). **Include the variable name** and quote the URL (`?` and `&` need quotes):

   ```bash
   RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-XXXX?key=YYYY"
   ```

   Wrong (bare URL only — will error):

   ```bash
   https://api.render.com/deploy/srv-XXXX?key=YYYY
   ```

4. Test:

   ```bash
   cd /Users/walterstauss/Projects/property-launch-cal
   ./scripts/render-deploy.sh
   ```

5. In Render → **Events**, confirm a new deploy started.

Optional: deploy a specific commit (e.g. after merging a PR):

```bash
./scripts/render-deploy.sh bb16d03
```

## Alternative: Render API key

1. [Account Settings → API Keys](https://dashboard.render.com/u/settings#api-keys) → create a key.
2. Service ID: open the service → **Settings** → copy from the URL (`srv-…`) or use the API list-services endpoint.
3. Add to `.env`:

   ```bash
   RENDER_API_KEY=rnd_…
   RENDER_SERVICE_ID=srv-…
   ```

## Agent usage

After `.env` exists locally, ask: **“Deploy to Render”** or **“Run manual deploy”**. The agent should run:

```bash
cd /Users/walterstauss/Projects/property-launch-cal && ./scripts/render-deploy.sh
```

Do **not** commit `.env` or paste the hook URL into the repo.

## Security

- Treat the deploy hook URL like a password (anyone with it can trigger deploys).
- Rotate it in Render if it is ever exposed.
