# eSihagBa Frontend

React + TypeScript + Vite frontend for the eSihagBa City Budget Tracker.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- @dfinity/agent for ICP integration

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Configuration

- Backend canister ID: `src/lib/icp.ts` (`CANISTER_ID`)
- Environment variables: `.env` (see `.env.example`)

## Deployment

See `DEPLOY_FRONTEND.md` in the project root for deployment instructions.
