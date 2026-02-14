# CodeDuo Deployment Guide

This repo is split into:
- Frontend: SvelteKit app at repo root (deploy to Vercel)
- Backend: Bun + TypeScript API in `server/` (deploy to GCP Cloud Run)

## 1. Local Development

### Prerequisites
- Node.js 20+
- Bun 1.1+
- MongoDB
- Redis

### Install
```bash
npm install
cd server && bun install
```

### Configure env files
```bash
cp .env.example .env
cp server/.env.example server/.env
```

### Run
```bash
npm run dev:all
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

## 2. Frontend Deploy (Vercel)

Project root for Vercel is this repo root.

### Required Vercel environment variables
- `VITE_API_URL=https://<your-backend-domain>/api`
- `VITE_SOCKET_URL=https://<your-backend-domain>`
- `PUBLIC_WS_URL=wss://<your-backend-domain>`
- `API_URL=https://<your-backend-domain>/api` (for server-side route loads)

### Build settings
- Framework preset: `SvelteKit`
- Install command: `npm ci`
- Build command: `npm run build`

## 3. Backend Deploy (GCP Cloud Run)

Deploy from `server/` using Docker.

### Required Cloud Run environment variables
- `NODE_ENV=production`
- `PORT=8080`
- `HOST=0.0.0.0`
- `MONGODB_URI=...`
- `REDIS_URL=...`
- `JWT_SECRET=...`
- `REFRESH_TOKEN_SECRET=...`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `FRONTEND_URLS=https://<your-vercel-domain>[,https://<extra-domain>]`
- `ALLOW_VERCEL_PREVIEW_ORIGINS=true` (optional, enables `*.vercel.app` preview domains)
- `BACKEND_URL=https://<your-backend-domain>`
- `GITHUB_CLIENT_ID=...` (if OAuth enabled)
- `GITHUB_CLIENT_SECRET=...` (if OAuth enabled)
- `GITHUB_CALLBACK_URL=https://<your-backend-domain>/api/auth/github/callback` (optional, auto-derived from `BACKEND_URL`)

### Option A: one-command Cloud Build + Cloud Run deploy
```bash
gcloud builds submit server --config server/cloudbuild.yaml
```

### Option B: manual deploy
```bash
gcloud run deploy codeduo-server \
  --source server \
  --region us-central1 \
  --allow-unauthenticated
```

## 4. Important Production Notes

- Cross-site auth cookies are configured for Vercel frontend + GCP backend in production (`SameSite=None; Secure`).
- CORS allows:
  - `FRONTEND_URL`
  - all values in `FRONTEND_URLS`
  - optional Vercel previews when `ALLOW_VERCEL_PREVIEW_ORIGINS=true`
- For GitHub OAuth, set callback URL in GitHub App settings to:
  - `https://<your-backend-domain>/api/auth/github/callback`

## 5. Verification

Frontend:
```bash
npm run build
npm run check
```

Backend:
```bash
cd server
bun run build
```