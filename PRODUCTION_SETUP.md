# Production Deployment - Complete Setup

## 🎉 Deployment Status

### Frontend
- **Deployed URL**: https://b368a2da.demo-7qb.pages.dev
- **Project Name**: demo
- **Status**: ✅ Live

### Backend
- **Worker URL**: https://px-tester-api.px-tester.workers.dev
- **Database**: px-tester-db (04077aab-abb7-4663-8049-6a2ba62f95d5)
- **Status**: ✅ Live with data

## 🔑 Google OAuth Configuration

### What to Add in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized JavaScript origins**:
   ```
   https://b368a2da.demo-7qb.pages.dev
   https://px-tester-api.px-tester.workers.dev
   ```

5. Add these **Authorized redirect URIs**:
   ```
   https://px-tester-api.px-tester.workers.dev/api/auth/google/callback
   ```

### GOOGLE_REDIRECT_URI Value

Use this exact value in your `wrangler.toml`:

```toml
GOOGLE_REDIRECT_URI = "https://px-tester-api.px-tester.workers.dev/api/auth/google/callback"
```

This is the URL where Google will redirect users after they authenticate.

## ⚙️ Final Configuration Steps

### 1. Update wrangler.toml

Replace `YOUR_GOOGLE_CLIENT_ID` in `wrangler.toml` with your actual Google Client ID:

```toml
[vars]
FRONTEND_URL = "https://demo.px-tester.workers.dev"
GOOGLE_CLIENT_ID = "123456789-abcdefg.apps.googleusercontent.com"  # Replace with your actual ID
GOOGLE_REDIRECT_URI = "https://px-tester-api.px-tester.workers.dev/api/auth/google/callback"
```

### 2. Verify Secret is Set

Check that your Google Client Secret is stored as a Cloudflare Secret:

```bash
wrangler secret list
```

You should see `GOOGLE_CLIENT_SECRET` in the list.

### 3. Redeploy Worker

After updating the Client ID in wrangler.toml:

```bash
wrangler deploy
```

### 4. Set Up Custom Domain (Optional)

To use `demo.px-tester.workers.dev` instead of the auto-generated URL:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **demo**
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `demo.px-tester.workers.dev`
6. Follow the DNS setup instructions

After custom domain is set up, update:
- `wrangler.toml` FRONTEND_URL to `https://demo.px-tester.workers.dev`
- Google OAuth authorized origins to include `https://demo.px-tester.workers.dev`
- Redeploy Worker: `wrangler deploy`

## 🧪 Test Your Deployment

### Test API

```bash
# Health check
curl https://px-tester-api.px-tester.workers.dev/api/health

# Get sites
curl https://px-tester-api.px-tester.workers.dev/api/sites?limit=3

# Get auth URL (should return Google OAuth URL)
curl https://px-tester-api.px-tester.workers.dev/api/auth/google
```

### Test Frontend

1. Visit: https://b368a2da.demo-7qb.pages.dev
2. Click "Sign in with Google" in the header
3. Complete OAuth flow
4. You should be redirected to `/dashboard`

## 📊 Current Configuration

### Environment Variables in wrangler.toml
```toml
FRONTEND_URL = "https://demo.px-tester.workers.dev"
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"  # ⚠️ Update this!
GOOGLE_REDIRECT_URI = "https://px-tester-api.px-tester.workers.dev/api/auth/google/callback"
```

### Cloudflare Secrets
```
GOOGLE_CLIENT_SECRET = [stored securely in Cloudflare]
```

### Frontend Environment
```
VITE_API_URL = https://px-tester-api.px-tester.workers.dev/api
```

## 🔄 OAuth Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: /api/auth/google
    ↓
Worker redirects to: Google OAuth consent screen
    ↓
User approves
    ↓
Google redirects to: /api/auth/google/callback
    ↓
Worker creates session and redirects to: /dashboard
    ↓
User is logged in!
```

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error

This means the redirect URI in Google Console doesn't match exactly. Make sure you have:

```
https://px-tester-api.px-tester.workers.dev/api/auth/google/callback
```

in your Google OAuth authorized redirect URIs (exact match, including https://).

### CORS Errors

If you see CORS errors in the browser console:
1. Check that `FRONTEND_URL` in wrangler.toml matches your frontend URL
2. Redeploy the Worker: `wrangler deploy`

### OAuth Not Working

1. Verify `GOOGLE_CLIENT_ID` is correct in wrangler.toml
2. Check secret is set: `wrangler secret list`
3. View Worker logs: `wrangler tail`
4. Verify redirect URI in Google Console matches exactly

## 📝 Quick Reference

| Item | Value |
|------|-------|
| Frontend URL | https://b368a2da.demo-7qb.pages.dev |
| API URL | https://px-tester-api.px-tester.workers.dev |
| OAuth Callback | https://px-tester-api.px-tester.workers.dev/api/auth/google/callback |
| Database ID | 04077aab-abb7-4663-8049-6a2ba62f95d5 |

## ✅ Checklist

- [x] Frontend deployed to Cloudflare Pages
- [x] Backend Worker deployed
- [x] Database created and seeded
- [ ] Update `GOOGLE_CLIENT_ID` in wrangler.toml
- [ ] Add redirect URI to Google Console
- [ ] Redeploy Worker with correct Client ID
- [ ] Test OAuth flow end-to-end
- [ ] (Optional) Set up custom domain demo.px-tester.workers.dev

---

**Next Steps**: Update the Google Client ID in wrangler.toml and redeploy the Worker!
