# Deploy Frontend So It Connects to Your Motoko Backend

This guide explains how to deploy the React frontend so it keeps talking to your Motoko backend on the Internet Computer.

---

## How the connection works

The frontend connects to the backend via `frontend/src/lib/icp.ts`:

- **Canister ID**: `CANISTER_ID` in `icp.ts` (must match your deployed backend).
- **Host**:
  - On **localhost** (dev): uses `http://127.0.0.1:4943` (local replica) unless `VITE_USE_MAINNET=true`.
  - **Not localhost** (e.g. deployed app): uses `https://ic0.app` (mainnet).

When you deploy the frontend anywhere other than localhost, it automatically uses `https://ic0.app` and `CANISTER_ID`, so it connects to your **mainnet** backend. No extra config is needed for that.

For **staging before prod** (test locally, then deploy to IC), see **`STAGING_AND_PROD.md`**.

---

## Before you deploy

1. **Backend is deployed on IC**  
   Your Motoko backend must already be deployed to mainnet, e.g.:
   ```bash
   dfx deploy --network ic backend
   ```

2. **Canister ID is correct**  
   In `frontend/src/lib/icp.ts`, `CANISTER_ID` must be your backend’s canister ID.  
   Current value: `bw7nk-yaaaa-aaaan-q3d5a-cai` (update if you use a different backend).

3. **Wallet and cycles**  
   For **Option A** (ICP assets canister), you need a configured wallet and enough cycles to create/deploy the frontend canister.

---

## Option A: Deploy frontend as an ICP assets canister (recommended)

Both frontend and backend live on the IC. Users open the frontend URL; it talks to `ic0.app` and your backend canister.

### 1. Build the frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

Output goes to `frontend/dist`. The build bakes in `CANISTER_ID` from `icp.ts`.

### 2. Deploy the frontend canister

From the **project root** (where `dfx.json` is):

```bash
export DFX_WARNING=-mainnet_plaintext_identity   # if you use plaintext default identity
dfx deploy --network ic frontend
```

If you see *"The default identity is not stored securely"*, run the `export` first, then `dfx deploy`. Omit it only if you use a secure identity (e.g. `dfx identity new` + `--identity`).

- Uses `frontend/dist` (see `dfx.json`).
- Creates the frontend canister on mainnet if it does not exist.
- Consumes cycles from your wallet.

### 3. Get the frontend URL

After deploy, `canister_ids.json` will include the frontend canister ID. The app is served at:

```
https://<FRONTEND_CANISTER_ID>.ic0.app
```

Or via the raw gateway:

```
https://<FRONTEND_CANISTER_ID>.raw.icp0.io
```

Example:

```bash
dfx canister id frontend --network ic
# Use that id in the URLs above
```

### 4. Verify backend connection

1. Open the frontend URL in a browser.
2. Check the UI for “Connected to ICP” or similar.
3. Use Profile / Dashboard: register user, create wallet, record transaction.  
   If those work, the frontend is successfully using the Motoko backend.

---

## Option B: Deploy to Vercel, Netlify, or another static host

You can serve the built frontend from Vercel, Netlify, GitHub Pages, etc. Because the app is **not** on localhost, it will use `https://ic0.app` and `CANISTER_ID`, so it still connects to your mainnet backend.

### 1. Set the backend canister ID

Keep `CANISTER_ID` in `frontend/src/lib/icp.ts` equal to your backend canister ID (or use `VITE_BACKEND_CANISTER_ID` and read it via `import.meta.env` if you prefer).

### 2. Build

```bash
cd frontend
npm install
npm run build
```

### 3. Deploy the `frontend/dist` folder

- **Vercel**: Connect the repo, set root to `frontend`, build command `npm run build`, output directory `dist`.
- **Netlify**: Same idea; publish directory `frontend/dist` (or build from `frontend` with `npm run build`).
- **Other hosts**: Upload the contents of `frontend/dist` to your static hosting.

### 4. Verify

Open the deployed site. It should show “Connected to ICP” and work with the backend. If you ever change the backend canister, update `CANISTER_ID` and redeploy the frontend.

---

## Checklist

| Step | Action |
|------|--------|
| 1 | Backend deployed to IC (`dfx deploy --network ic backend`) |
| 2 | `CANISTER_ID` in `frontend/src/lib/icp.ts` matches backend canister ID |
| 3 | `cd frontend && npm run build` succeeds |
| 4 | Deploy frontend (Option A: `dfx deploy --network ic frontend`; Option B: deploy `frontend/dist`) |
| 5 | Open deployed frontend URL and confirm it connects to the backend |

---

## If the frontend does not connect

1. **Wrong canister ID**  
   Update `CANISTER_ID` in `frontend/src/lib/icp.ts`, rebuild, and redeploy.

2. **Backend not deployed or unreachable**  
   Test the backend directly:
   ```bash
   dfx canister --network ic call backend healthCheck
   ```
   Use the Candid UI for your backend canister if needed.

3. **CORS / blocked requests**  
   When using Option B (external host), if you see CORS or network errors, check that your host allows requests to `https://ic0.app`. Typically the `@dfinity/agent` usage is fine; escalation is rare.

4. **Console errors**  
   Open devtools (F12) and look for errors when the app fetches from the backend. That often points to wrong ID, network, or CORS.

---

## Summary

- **Option A (ICP assets canister)**: Build → `dfx deploy --network ic frontend` → use the frontend canister URL. Stays on IC, same ecosystem as the backend.
- **Option B (Vercel/Netlify/etc.)**: Build → deploy `frontend/dist` → use the hosted URL. Still uses `ic0.app` and `CANISTER_ID`, so the Motoko backend connection works.

In both cases, because the app runs **off localhost**, it uses `https://ic0.app` and your `CANISTER_ID`, so it keeps connecting to your Motoko backend.
