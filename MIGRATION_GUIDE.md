# eSihagBa Migration Guide: Moving Development to a New Laptop

This guide explains how to transfer the eSihagBa project to another laptop so you can continue developing and retain SuperAdmin access.

---

## Prerequisites on the New Laptop

Install these before starting:

| Tool | Purpose | Install |
|------|---------|--------|
| **Node.js** (v18+) | Frontend runtime | [nodejs.org](https://nodejs.org) or `nvm install 18` |
| **npm** | Package manager | Comes with Node.js |
| **DFX** (DFINITY SDK) | Deploy & interact with canisters | `dfxvm install` or [dfinity.org/docs](https://internetcomputer.org/docs/current/developer-docs/setup/install) |
| **Git** (optional) | Version control | [git-scm.com](https://git-scm.com) |

---

## Step 1: Copy the Project

### Option A: Using a USB drive, cloud storage, or network share

1. Copy the entire `eSihagBaV2` folder to the new laptop.
2. Ensure these are included (they may be hidden or in `.gitignore`):
   - `frontend/.env` (environment variables)
   - `canister_ids.json` (if you have IC-deployed canisters)

### Option B: Using Git (recommended)

1. Push your code to a Git remote (GitHub, GitLab, etc.) from the old laptop:
   ```bash
   git add .
   git commit -m "Pre-migration snapshot"
   git push origin main
   ```

2. Clone on the new laptop:
   ```bash
   git clone <your-repo-url> eSihagBaV2
   cd eSihagBaV2
   ```

3. **Manually copy** these from the old laptop (they are not in Git):
   - `frontend/.env`
   - `canister_ids.json` (if present in project root)

---

## Step 2: Copy Critical Files (Not in Git)

These files are usually ignored by Git. Copy them manually:

| File | Location | Purpose |
|------|----------|---------|
| `.env` | `frontend/.env` | Backend canister ID, mainnet flag |
| `canister_ids.json` | Project root | IC canister IDs (if deployed to mainnet) |

### Example `frontend/.env` for mainnet

```env
VITE_USE_MAINNET=true
VITE_BACKEND_CANISTER_ID=<your-backend-canister-id>
```

### Example `frontend/.env` for local development

```env
# Leave VITE_USE_MAINNET unset or false
VITE_BACKEND_CANISTER_ID=<local-backend-id-from-dfx-canister-id-backend>
```

---

## Step 3: Set Up the New Environment

### 3.1 Install frontend dependencies

```bash
cd frontend
rm -rf node_modules package-lock.json   # Clean slate
npm install
```

### 3.2 Verify DFX

```bash
dfx --version
```

If not installed, use [dfxvm](https://github.com/dfinity/dfxvm) or the official installer.

---

## Step 4: SuperAdmin Identity

Your SuperAdmin role is tied to your **Principal**, which comes from **Internet Identity**.

### How it works

- The first user to call `registerUser` with role `SuperAdmin` becomes the SuperAdmin.
- That user is identified by their **Principal** (from Internet Identity).
- The Principal is the same on any device when you log in with the same Internet Identity anchor.

### What you need to do

1. **Use the same Internet Identity** on the new laptop:
   - Go to [identity.ic0.app](https://identity.ic0.app)
   - Log in with the same anchor/device you used on the old laptop
   - Or add a new device to your existing anchor and use that

2. **No need to copy DFX identity** if you use Internet Identity for auth. The app uses `@dfinity/auth-client` and Internet Identity, not `dfx identity`.

3. **If canisters are already deployed to IC mainnet:**
   - Your SuperAdmin status is stored in the backend canister
   - Log in with the same Internet Identity on the new laptop
   - You will have the same Principal and thus the same SuperAdmin access

4. **If you are starting with a fresh local replica:**
   - Run `dfx start` and `dfx deploy backend`
   - Open the app, log in with Internet Identity
   - Register as the first user with role `SuperAdmin`
   - You will be SuperAdmin for that local deployment

---

## Step 5: Run the Project

### Local development (local replica)

```bash
# Terminal 1: Start the replica
dfx start --background

# Deploy canisters (first time or after code changes)
dfx deploy

# Get backend canister ID for .env
dfx canister id backend

# Terminal 2: Run frontend dev server
cd frontend
npm run dev
```

### Local frontend, mainnet backend

If your canisters are already on IC mainnet:

1. Set `frontend/.env`:
   ```env
   VITE_USE_MAINNET=true
   VITE_BACKEND_CANISTER_ID=<your-ic-backend-canister-id>
   ```

2. Run:
   ```bash
   cd frontend
   npm run dev
   ```

No need to run `dfx start` in this case.

---

## Step 6: Checklist Before Selling the Old PC

- [ ] Pushed latest code to Git (if using)
- [ ] Copied `frontend/.env` to the new laptop
- [ ] Copied `canister_ids.json` if you use IC mainnet
- [ ] Confirmed you can log in with Internet Identity on the new laptop
- [ ] Confirmed SuperAdmin access (e.g. via Profile or Admin features)
- [ ] Removed sensitive data from the old PC (or securely wipe the drive)

---

## Troubleshooting

### "Cannot find module @rollup/rollup-*"

You installed dependencies on a different OS (e.g. Windows vs WSL/Linux). Reinstall on the target OS:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Not connected to backend"

- Check `VITE_BACKEND_CANISTER_ID` in `frontend/.env`
- For local: ensure `dfx start` is running and the ID matches `dfx canister id backend`
- For mainnet: ensure `VITE_USE_MAINNET=true` and the ID is correct

### Lost SuperAdmin access

- SuperAdmin is the first registered user. If the canister was reinstalled or data was wiped, you must register again as the first user with role `SuperAdmin`.
- If someone else registered first, you need an existing SuperAdmin to create your admin account via `registerUserByAdmin` (if available) or to reinstall the canister (which wipes data).

---

## Summary

| Item | Action |
|------|--------|
| Project code | Copy folder or `git clone` |
| `frontend/.env` | Copy manually |
| `canister_ids.json` | Copy if using IC mainnet |
| SuperAdmin | Use same Internet Identity; no file copy needed |
| Dependencies | Run `npm install` on the new laptop |
| DFX | Install on new laptop; replica/canisters are redeployed or already on IC |
