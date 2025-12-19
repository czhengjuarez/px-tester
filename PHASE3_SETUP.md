# Phase 3: Authentication Setup Guide

## 🎯 Overview
Phase 3 adds Google OAuth authentication, allowing users to sign in and access protected features like submitting sites and managing their dashboard.

## 📋 Prerequisites
- Phase 2 completed (Worker API and D1 database running)
- Google Cloud Console account
- Node.js 18+ installed

## 🔑 Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: PX Tester (or your app name)
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: PX Tester Local Dev
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:8787`
   - Authorized redirect URIs:
     - `http://localhost:8787/api/auth/google/callback`
7. Click **Create** and copy your credentials

### 2. Update Environment Variables

Update `wrangler.toml` with your Google OAuth credentials:

```toml
[vars]
FRONTEND_URL = "http://localhost:3000"
GOOGLE_CLIENT_ID = "your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "your-actual-client-secret"
GOOGLE_REDIRECT_URI = "http://localhost:8787/api/auth/google/callback"
```

**⚠️ Security Note**: For production, use Cloudflare Secrets instead:
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 3. Run Database Migration

Add authentication tables to your D1 database:

```bash
wrangler d1 execute px-tester-db --file=./worker/migrations/002_add_auth_tables.sql
```

This creates:
- `users` table - Store user accounts
- `sessions` table - Manage authentication sessions

### 4. Restart Services

Restart the Worker to pick up new environment variables:

```bash
# Stop the current Worker (Ctrl+C in the terminal)
# Then restart:
wrangler dev
```

The frontend should automatically pick up changes via hot reload.

## 🧪 Testing Authentication

### 1. Test the Login Flow

1. Visit http://localhost:3000
2. Click **"Sign in with Google"** in the header
3. You'll be redirected to Google's OAuth consent screen
4. Select your Google account
5. Grant permissions
6. You'll be redirected back to http://localhost:3000/dashboard

### 2. Verify User Session

Check that your session is working:

```bash
# Get your session cookie from browser DevTools > Application > Cookies
# Then test the /auth/me endpoint:
curl -H "Cookie: session=YOUR_SESSION_TOKEN" http://localhost:8787/api/auth/me
```

Should return:
```json
{
  "user": {
    "id": "...",
    "email": "your@email.com",
    "name": "Your Name",
    "avatar_url": "https://...",
    "role": "user"
  }
}
```

### 3. Test Protected Routes

- Try accessing `/dashboard` without logging in → Should redirect to home
- Log in and access `/dashboard` → Should show your dashboard
- Click your avatar → Should show user menu with logout option

## 📁 New Files Created

### Backend
```
worker/
├── src/
│   ├── auth.js           # Authentication middleware
│   ├── oauth.js          # Google OAuth handlers
│   ├── routes.js         # All API routes including auth
│   └── index.js          # Updated main Worker
└── migrations/
    └── 002_add_auth_tables.sql  # Auth database schema
```

### Frontend
```
src/
├── contexts/
│   └── AuthContext.jsx   # Auth state management
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx  # Route guard
│   │   ├── UserMenu.jsx        # User dropdown menu
│   │   └── LoginButton.jsx     # Google sign-in button
│   └── layout/
│       └── Header.jsx    # Updated with auth UI
└── pages/
    └── Dashboard.jsx     # User dashboard page
```

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/google` | Initiate Google OAuth | No |
| GET | `/api/auth/google/callback` | OAuth callback | No |
| GET | `/api/auth/me` | Get current user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Example Requests

```bash
# Get auth URL
curl http://localhost:8787/api/auth/google

# Check current user
curl -H "Cookie: session=TOKEN" http://localhost:8787/api/auth/me

# Logout
curl -X POST -H "Cookie: session=TOKEN" http://localhost:8787/api/auth/logout
```

## 🎨 UI Components

### AuthProvider
Wraps the entire app and provides authentication state:
- `user` - Current user object or null
- `loading` - Loading state
- `login()` - Initiate Google OAuth
- `logout()` - Sign out user
- `isAuthenticated` - Boolean
- `isAdmin` - Boolean
- `isSuperAdmin` - Boolean

### Usage Example

```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={login}>Sign In</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### ProtectedRoute
Wraps routes that require authentication:

```jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// With role requirements
<ProtectedRoute requireAdmin>
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute requireSuperAdmin>
  <UserManagement />
</ProtectedRoute>
```

## 🔒 Security Features

### Session Management
- **HttpOnly cookies** - Prevents XSS attacks
- **Secure flag** - HTTPS only in production
- **SameSite=Lax** - CSRF protection
- **30-day expiration** - Automatic session cleanup

### Role-Based Access Control (RBAC)
Three user roles:
- **user** - Can submit and manage own sites
- **admin** - Can approve/reject submissions, manage all sites
- **super_admin** - Can manage users and promote admins

### Database Security
- Foreign key constraints
- Cascade deletes for data integrity
- Indexed queries for performance
- Session expiration checks

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check that Google OAuth credentials are correct
- Verify redirect URI matches exactly
- Ensure cookies are enabled in browser
- Check CORS settings in wrangler.toml

### OAuth Redirect Fails
- Verify `GOOGLE_REDIRECT_URI` in wrangler.toml
- Check that redirect URI is added in Google Console
- Ensure Worker is running on correct port (8787)

### Session Not Persisting
- Check browser cookies in DevTools
- Verify session table exists in D1
- Check session expiration time
- Ensure `credentials: 'include'` in fetch requests

### CORS Issues
- Verify `FRONTEND_URL` matches your frontend port
- Check `Access-Control-Allow-Credentials: true` header
- Ensure `Cookie` is in `Access-Control-Allow-Headers`

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_login INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🎯 What's Next (Phase 4)

Phase 4 will add site submission functionality:
- Multi-step submission form
- URL validation
- POST /api/sites endpoint
- "My Sites" management
- Edit/delete own sites
- Pending/approved status workflow

---

**Status**: ✅ Phase 3 Implementation Complete  
**Ready for**: Testing and Phase 4 - Site Submission
