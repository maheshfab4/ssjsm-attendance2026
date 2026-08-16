# Deploying this attendance app to Vercel

This is a **Vite + React** app. It is a SEPARATE project from GroupFlow
(the Next.js + Neon app). Do not mix them in one repository — Vercel builds
a Next.js repo using `src/app/`, and will silently ignore this app's
`App.tsx` and `src/components/`, reporting a successful deploy while
changing nothing.

## 1. New GitHub repository

1. github.com -> **+** -> **New repository**
2. Name it `ssjsm-attendance` -> Private -> **Create repository**
3. Click **"uploading an existing file"**
4. Drag in **everything from this folder**: `src`, `index.html`,
   `package.json`, `vite.config.ts`, `tsconfig.json`
   (do NOT upload `node_modules` or `dist`)
5. **Commit changes**

The config files at the root matter. Uploading only `src` is not enough —
without `package.json` and `vite.config.ts`, Vercel cannot build the app.

## 2. New Vercel project

1. vercel.com -> **Add New...** -> **Project**
2. Import `ssjsm-attendance`
3. Framework Preset should auto-detect as **Vite**. If it says Next.js,
   change it to Vite.
4. No environment variables are needed — this app stores its API URL in
   the browser.
5. **Deploy**

## 3. First run

Open the new URL. It will ask for your Apps Script Web App URL — paste the
same `/exec` URL you were using before. Your Google Sheet data loads
unchanged.

## 4. Verify the fix is live

Open a group -> **Add Member**. You should now see a date field labelled
**"Attendance counts from"** between Firm Name and Photo URL.

If that field is visible, the new code is running.

## Checking the Apps Script side

The matching backend is `google-apps-script.js` in this folder. Paste it
into Extensions -> Apps Script, then Deploy -> **Manage deployments** ->
pencil icon -> Version: **New version** -> Deploy.

Editing the existing deployment keeps your URL. Creating a *new* deployment
gives a different URL that the app is not pointing at.
