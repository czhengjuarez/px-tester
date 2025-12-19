# Deployment Guide - PX Tester

## ✅ Deployment Status

**Worker URL**: https://px-tester-api.px-tester.workers.dev  
**Database**: px-tester-db (04077aab-abb7-4663-8049-6a2ba62f95d5)  
**Account**: PX-Tester

## 🎯 What's Deployed

- ✅ Cloudflare Worker with all API endpoints
- ✅ D1 Database with schema, auth tables, and seed data (8 sites)
- ✅ CORS configuration
- ⚠️ Google OAuth secrets (needs setup)

## 🔑 Required: Set Up Google OAuth Secrets

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `https://px-tester-api.px-tester.workers.dev`
     - `http://localhost:3000` (for local dev)
   - Authorized redirect URIs:
     - `https://px-tester-api.px-tester.workers.dev/api/auth/google/callback`
     - `http://localhost:8787/api/auth/google/callback` (for local dev)

### 2. Set Secrets in Cloudflare Workers

Run this command and paste your Google Client Secret when prompted:

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 3. Update wrangler.toml for Production

Update the environment variables in `wrangler.toml`:

```toml
[vars]
FRONTEND_URL = "https://your-frontend-domain.com"  # Update with your actual frontend URL
GOOGLE_CLIENT_ID = "your-actual-client-id.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://px-tester-api.px-tester.workers.dev/api/auth/google/callback"
```

**Note**: Remove `GOOGLE_CLIENT_SECRET` from `wrangler.toml` - it's now stored as a secret!

### 4. Redeploy Worker

After updating the configuration:

```bash
wrangler deploy
```

## 🧪 Test Your Deployment

### Test API Endpoints

```bash
# Health check
curl https://px-tester-api.px-tester.workers.dev/api/health

# Get sites
curl https://px-tester-api.px-tester.workers.dev/api/sites?limit=3

# Get categories
curl https://px-tester-api.px-tester.workers.dev/api/categories

# Get specific site
curl https://px-tester-api.px-tester.workers.dev/api/sites/1
```

### Test Authentication (after OAuth setup)

```bash
# Get Google OAuth URL
curl https://px-tester-api.px-tester.workers.dev/api/auth/google

# Check current user (with session cookie)
curl -H "Cookie: session=YOUR_TOKEN" https://px-tester-api.px-tester.workers.dev/api/auth/me
```

## 🌐 Frontend Configuration

Update your frontend `.env` file to use the production API:

```env
# For production
VITE_API_URL=https://px-tester-api.px-tester.workers.dev/api

# For local development
# VITE_API_URL=http://localhost:8787/api
```

## 📊 Database Management

### View Database

```bash
# List all databases
wrangler d1 list

# Query the database
wrangler d1 execute px-tester-db --remote --command "SELECT COUNT(*) as total FROM sites"

# View users
wrangler d1 execute px-tester-db --remote --command "SELECT id, email, name, role FROM users"
```

### Backup Database

```bash
# Export database
wrangler d1 export px-tester-db --remote --output=backup.sql
```

### Run Migrations

```bash
# Run new migrations on remote database
wrangler d1 execute px-tester-db --remote --file=./worker/migrations/003_new_migration.sql --yes
```

## 🔒 Security Checklist

- ✅ Database ID in wrangler.toml (public)
- ✅ Google Client ID in wrangler.toml (public)
- ⚠️ Google Client Secret stored as Cloudflare Secret (DO NOT commit to git)
- ⚠️ Update FRONTEND_URL to your actual domain
- ⚠️ Update CORS settings for production
- ⚠️ Enable HTTPS only cookies in production

## 🚀 Deployment Commands Reference

```bash
# Deploy Worker
wrangler deploy

# View logs
wrangler tail

# Set a secret
wrangler secret put SECRET_NAME

# List secrets
wrangler secret list

# Delete a secret
wrangler secret delete SECRET_NAME

# Rollback deployment
wrangler rollback
```

## 📈 Monitoring

View your Worker analytics in the Cloudflare Dashboard:
- https://dash.cloudflare.com/
- Navigate to Workers & Pages > px-tester-api
- View metrics, logs, and errors

## 🐛 Troubleshooting

### OAuth Not Working
- Verify redirect URI matches exactly in Google Console
- Check that GOOGLE_CLIENT_SECRET is set: `wrangler secret list`
- Ensure FRONTEND_URL is correct in wrangler.toml
- Check Worker logs: `wrangler tail`

### CORS Errors
- Update FRONTEND_URL in wrangler.toml to match your frontend domain
- Redeploy after changes: `wrangler deploy`

### Database Issues
- Check database exists: `wrangler d1 list`
- Verify database_id in wrangler.toml matches
- Test query: `wrangler d1 execute px-tester-db --remote --command "SELECT 1"`

## 📝 Environment Variables Summary

| Variable | Location | Value |
|----------|----------|-------|
| FRONTEND_URL | wrangler.toml [vars] | Your frontend URL |
| GOOGLE_CLIENT_ID | wrangler.toml [vars] | Public OAuth client ID |
| GOOGLE_CLIENT_SECRET | Cloudflare Secret | Secret OAuth key |
| GOOGLE_REDIRECT_URI | wrangler.toml [vars] | Worker callback URL |

## 🎯 Next Steps

1. ✅ Set up Google OAuth credentials in Google Cloud Console
2. ✅ Run `wrangler secret put GOOGLE_CLIENT_SECRET`
3. ✅ Update `wrangler.toml` with production values
4. ✅ Redeploy: `wrangler deploy`
5. ✅ Update frontend `.env` with production API URL
6. ✅ Test authentication flow end-to-end
7. ✅ Deploy frontend to Cloudflare Pages or Vercel

---

**Deployment Complete!** 🎉  
Your Worker is live and ready for Google OAuth setup.
