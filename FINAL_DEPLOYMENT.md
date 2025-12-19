# ✅ Final Deployment - Workers Setup

## 🎉 Both Workers Deployed Successfully

### Frontend Worker
- **URL**: https://demo.px-tester.workers.dev
- **Name**: demo
- **Type**: Workers Sites (serving static assets)
- **Status**: ✅ Live

### Backend Worker (API)
- **URL**: https://px-tester-api.px-tester.workers.dev
- **Name**: px-tester-api
- **Database**: px-tester-db
- **Status**: ✅ Live

## 🔑 Google OAuth Configuration

### GOOGLE_REDIRECT_URI
```
https://px-tester-api.px-tester.workers.dev/api/auth/google/callback
```

### Add to Google Cloud Console

Go to your OAuth 2.0 Client ID and add:

**Authorized JavaScript origins:**
```
https://demo.px-tester.workers.dev
https://px-tester-api.px-tester.workers.dev
```

**Authorized redirect URIs:**
```
https://px-tester-api.px-tester.workers.dev/api/auth/google/callback
```

## ⚙️ Final Configuration Steps

### 1. Update GOOGLE_CLIENT_ID in wrangler.toml

Replace `YOUR_GOOGLE_CLIENT_ID` on line 14 with your actual Google Client ID:

```toml
GOOGLE_CLIENT_ID = "123456789-abcdefg.apps.googleusercontent.com"
```

### 2. Redeploy Backend Worker

```bash
wrangler deploy
```

### 3. Verify Secret

Make sure your Google Client Secret is set:

```bash
wrangler secret list
```

Should show `GOOGLE_CLIENT_SECRET`.

## 🧪 Test Your Deployment

### Test Frontend
Visit: https://demo.px-tester.workers.dev

You should see:
- ✅ Home page loads
- ✅ Browse page shows 8 sites from database
- ✅ Site detail pages work
- ✅ "Sign in with Google" button in header

### Test API
```bash
# Health check
curl https://px-tester-api.px-tester.workers.dev/api/health

# Get sites
curl https://px-tester-api.px-tester.workers.dev/api/sites?limit=3

# Get auth URL
curl https://px-tester-api.px-tester.workers.dev/api/auth/google
```

### Test OAuth Flow
1. Visit https://demo.px-tester.workers.dev
2. Click "Sign in with Google"
3. Complete OAuth
4. Should redirect to https://demo.px-tester.workers.dev/dashboard

## 📁 Project Structure

```
px-tester/
├── worker/                    # Backend API Worker
│   ├── src/
│   │   ├── index.js          # Main API routes
│   │   ├── routes.js         # Route handlers
│   │   ├── auth.js           # Auth middleware
│   │   └── oauth.js          # Google OAuth
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # Seed data
│   └── migrations/           # Database migrations
├── src/                      # Frontend React app
├── dist/                     # Built frontend (deployed)
├── frontend-worker.js        # Frontend Worker
├── wrangler.toml            # Backend Worker config
└── wrangler-frontend.toml   # Frontend Worker config
```

## 🚀 Deployment Commands

### Deploy Backend API
```bash
wrangler deploy
```

### Deploy Frontend
```bash
npm run build
wrangler deploy --config wrangler-frontend.toml
```

### View Logs
```bash
# Backend logs
wrangler tail

# Frontend logs
wrangler tail --name demo
```

## 📊 Current Configuration

### Backend (wrangler.toml)
```toml
name = "px-tester-api"
FRONTEND_URL = "https://demo.px-tester.workers.dev"
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"  # ⚠️ Update this!
GOOGLE_REDIRECT_URI = "https://px-tester-api.px-tester.workers.dev/api/auth/google/callback"
```

### Frontend (wrangler-frontend.toml)
```toml
name = "demo"
bucket = "./dist"
```

### Frontend Environment (.env)
```env
VITE_API_URL=https://px-tester-api.px-tester.workers.dev/api
```

## 🔒 Security

- ✅ GOOGLE_CLIENT_SECRET stored as Cloudflare Secret
- ✅ CORS configured for demo.px-tester.workers.dev
- ✅ HttpOnly cookies for sessions
- ✅ Database credentials managed by Cloudflare
- ⚠️ Update GOOGLE_CLIENT_ID in wrangler.toml

## 🐛 Troubleshooting

### Frontend Not Loading
- Check deployment: `wrangler deployments list --name demo`
- View logs: `wrangler tail --name demo`
- Verify build: `npm run build` should create dist/ folder

### API CORS Errors
- Verify FRONTEND_URL matches: `https://demo.px-tester.workers.dev`
- Redeploy backend: `wrangler deploy`

### OAuth Not Working
1. Update GOOGLE_CLIENT_ID in wrangler.toml
2. Add redirect URI to Google Console (exact match)
3. Verify secret: `wrangler secret list`
4. Redeploy: `wrangler deploy`

## 📝 Quick Reference

| Item | Value |
|------|-------|
| Frontend | https://demo.px-tester.workers.dev |
| Backend API | https://px-tester-api.px-tester.workers.dev |
| OAuth Callback | https://px-tester-api.px-tester.workers.dev/api/auth/google/callback |
| Database | px-tester-db (04077aab-abb7-4663-8049-6a2ba62f95d5) |

## ✅ Deployment Checklist

- [x] Frontend Worker deployed at demo.px-tester.workers.dev
- [x] Backend Worker deployed at px-tester-api.px-tester.workers.dev
- [x] Database created and seeded with 8 sites
- [x] CORS configured for frontend URL
- [x] OAuth redirect URI configured
- [ ] Update GOOGLE_CLIENT_ID in wrangler.toml
- [ ] Add redirect URI to Google Console
- [ ] Redeploy backend with correct Client ID
- [ ] Test OAuth flow end-to-end

---

**Status**: ✅ Deployment Complete  
**Next**: Update Google Client ID and test OAuth!
