# Deploying Resilience Forge OS — Step by Step

You'll have a live web app on your phone and laptop in about 30–45 minutes.
You need two free accounts and one API key. Follow in order.

---

## WHAT YOU'RE SETTING UP
- A live website (your OS) hosted free on Vercel
- Your own Anthropic API key so the AI features work (you control the spend)
- Your data saved on your device via the browser

---

## STEP 1 — Get your Anthropic API key (~5 min)
1. Go to: https://console.anthropic.com
2. Sign up or log in.
3. Click **Settings → API Keys** (or "Get API Keys").
4. Click **Create Key**, name it "Resilience Forge OS", and COPY the key.
   (It starts with `sk-ant-`. Save it somewhere safe — you only see it once.)
5. Add a small amount of credit under **Billing** (even $5 goes a long way).

> Your key stays private. It lives only in Vercel's settings, never in the app code.

---

## STEP 2 — Put the code on GitHub (~10 min)
Vercel deploys from GitHub. It's the cleanest path.
1. Go to https://github.com and make a free account (if you don't have one).
2. Click the **+** (top right) → **New repository**.
3. Name it `resilience-forge-os`, keep it Private, click **Create repository**.
4. On the next page click **uploading an existing file**.
5. Unzip the folder I gave you, then drag ALL the files and folders into the upload box.
6. Click **Commit changes**.

---

## STEP 3 — Deploy on Vercel (~10 min)
1. Go to https://vercel.com and click **Sign Up** → **Continue with GitHub**.
2. Click **Add New… → Project**.
3. Find `resilience-forge-os` in the list and click **Import**.
4. BEFORE clicking Deploy — expand **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your `sk-ant-...` key from Step 1
   - Click **Add**.
5. Click **Deploy**. Wait ~1 minute.
6. You'll get a live URL like `resilience-forge-os.vercel.app`. That's your app.

---

## STEP 4 — Use it everywhere
- Open the URL on your laptop. Bookmark it.
- Open it on your phone's browser → tap Share → **Add to Home Screen**.
  Now it sits on your phone like a real app.
- Your tasks, clients, library, and calendar save on each device.

---

## TROUBLESHOOTING
- **AI features say "API key not configured"** → You missed Step 3.4. In Vercel go to
  your project → Settings → Environment Variables, add `ANTHROPIC_API_KEY`, then
  Deployments → click the "…" on the latest → **Redeploy**.
- **Generation fails** → Check you added billing credit in Step 1.5.
- **Data didn't carry over from phone to laptop** → That's expected. Browser storage is
  per-device. (If you ever want synced data across devices, that's a future upgrade.)

---

## COSTS
- Vercel: free tier is plenty for personal use.
- GitHub: free.
- Anthropic API: pay only for what you generate — typically pennies per piece of content.

That's it. You now own your OS.
