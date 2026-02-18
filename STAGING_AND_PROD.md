# Staging and Production Practice

How to stage changes locally (or on a staging canister) before deploying to IC mainnet.

---

## Overview

| Environment | What | Cycles | Use for |
|-------------|------|--------|---------|
| **Staging** | Local replica + local canisters, or dedicated staging canisters on IC | Local: none. IC staging: yes | Develop, test, QA |
| **Production** | Mainnet canisters (`backend`, `frontend` on `ic`) | Yes | Live users |

**Right practice:** Test in staging first. Deploy to prod only after staging checks pass.

---

## Staging = Local Replica (Recommended)

Use the local IC replica as staging. No cycles, fast iteration.

### 1. Start the local replica

```bash
dfx start --background
```

### 2. Deploy backend and frontend locally

```bash
dfx deploy backend
dfx deploy frontend
```

### 3. Get the local backend canister ID

```bash
dfx canister id backend
```

Use this for the frontend when running against local (see step 4).

### 4. Run the frontend against local (staging)

**Option A: Dev server**

- Create `frontend/.env` (do not commit):
  ```
  VITE_BACKEND_CANISTER_ID=<local-backend-id-from-step-3>
  ```
  Do **not** set `VITE_USE_MAINNET`. The app will use `http://127.0.0.1:4943` and the local backend.

- From `frontend/`:
  ```bash
  npm run dev
  ```
- Open the dev URL (e.g. http://localhost:8080). Test fully.

**Option B: Built assets**

- Set `VITE_BACKEND_CANISTER_ID` as above, then:
  ```bash
  cd frontend && npm run build && cd ..
  ```
- Frontend is in `frontend/dist`. Serve it (e.g. `npx serve frontend/dist`) or use the locally deployed frontend canister URL:
  ```
  http://<local-frontend-canister-id>.localhost:4943
  ```
  Get the ID with `dfx canister id frontend`.

### 5. Verify in staging

- Register user, create wallet, record transaction.
- Confirm no errors in browser console or backend logs.
- Run any automated tests you have.

### 6. Stop local replica when done

```bash
dfx stop
```

---

## Production = IC Mainnet

Deploy to prod only after staging looks good.

### 1. Backend

```bash
export DFX_WARNING=-mainnet_plaintext_identity   # if using plaintext identity
dfx deploy --network ic backend
```

### 2. Frontend

```bash
cd frontend
# Ensure .env does NOT set VITE_BACKEND_CANISTER_ID (or delete .env for prod build)
npm run build
cd ..
dfx deploy --network ic frontend
```

The built frontend uses `CANISTER_ID` in `icp.ts` (your mainnet backend) and `https://ic0.app`. No staging overrides.

### 3. Verify prod

- Open the frontend URL (`https://<frontend-canister-id>.icp0.io/`).
- Check "Connected to ICP", then smoke-test core flows.

---

## Git Workflow (Staging Before Prod)

1. **Work on a branch**
   ```bash
   git checkout -b feature/my-change
   ```

2. **Implement and test locally (staging)**
   - `dfx start`, `dfx deploy backend`, `dfx deploy frontend`
   - Frontend with `VITE_BACKEND_CANISTER_ID` pointing at local backend
   - Run `npm run dev`, test, fix.

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Describe change"
   git push -u origin feature/my-change
   ```

4. **Open a PR** into `main` (or your prod branch). Review, fix, ensure CI passes if you have it.

5. **Merge to main** when ready for prod.

6. **Deploy to prod**
   - Pull latest `main`
   - Deploy backend and frontend to `ic` as above.

---

## Env Quick Reference

| Env var | Staging (local) | Production |
|--------|------------------|------------|
| `VITE_BACKEND_CANISTER_ID` | Local backend canister ID (`dfx canister id backend`) | Unset (uses `CANISTER_ID` in `icp.ts`) |
| `VITE_USE_MAINNET` | Unset (use local replica) | Unset when deploying; frontend is on IC so it uses mainnet anyway |

---

## Optional: Staging Canisters on IC

If you want staging on real IC (same network as prod, different canisters):

1. Create separate backend and frontend canisters on `ic` (e.g. `backend-staging`, `frontend-staging` in `dfx.json`, or separate project).
2. Deploy to those canisters. Uses cycles.
3. Point frontend at staging backend via `VITE_BACKEND_CANISTER_ID` and deploy frontend to staging canister.
4. Test there, then deploy to **prod** canisters when ready.

Use this only if you need to test against mainnet (e.g. integrations, specific IC behavior). For most development, local staging is enough.

---

## Checklist Before Prod Deploy

- [ ] Changes tested on local staging (backend + frontend).
- [ ] No `VITE_BACKEND_CANISTER_ID` (or staging-specific env) in prod build.
- [ ] `CANISTER_ID` in `frontend/src/lib/icp.ts` matches your **mainnet** backend.
- [ ] Wallet has enough cycles for deploy.
- [ ] Code merged to `main` (or your prod branch) and up to date.

---

## Summary

1. **Staging:** Local replica + `VITE_BACKEND_CANISTER_ID` = local backend. No cycles.
2. **Prod:** Deploy to `ic`, no staging env. Uses cycles.
3. **Git:** Branch → test in staging → PR → merge to main → deploy to IC.
