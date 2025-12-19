# PX LAB - Site Showcase Platform

A modern site showcase platform built with Cloudflare Workers, React, and Cloudflare's Kumo design system. Users can submit, browse, and discover beautiful websites with an admin approval workflow.

## 🚀 Live Demo

- **Frontend**: https://demo.px-tester.workers.dev
- **API**: https://px-tester-api.px-tester.workers.dev

## ✅ What's Working

### Core Features (Phases 1-4, 7)

#### 1. **User Interface**
- ✅ Modern, responsive design with light/dark theme
- ✅ Beautiful UI using Cloudflare Kumo components
- ✅ Home page with featured sites
- ✅ Browse page with filtering by category
- ✅ Site detail pages
- ✅ Search page (UI only, backend pending)

#### 2. **Authentication**
- ✅ Google OAuth integration
- ✅ Session management with secure cookies
- ✅ Protected routes for authenticated users
- ✅ User profile menu

#### 3. **Site Submission**
- ✅ Submit site form with validation
- ✅ Site metadata (name, URL, description, category, tags)
- ✅ Sites saved to Cloudflare D1 database
- ✅ Pending approval workflow

#### 4. **Site Management**
- ✅ User dashboard to view submitted sites
- ✅ Edit site details
- ✅ Delete sites
- ✅ View submission status (pending/approved/rejected)

#### 5. **Admin Panel** (Phase 7)
- ✅ Admin page at `/admin`
- ✅ View all pending submissions
- ✅ Approve sites (publishes to Browse page)
- ✅ Reject sites (hides from public view)
- ✅ Visit button to preview sites
- ✅ Authentication-protected admin routes

#### 6. **Browse & Discovery**
- ✅ Browse all approved sites
- ✅ Filter by category (SaaS, Portfolio, E-commerce, etc.)
- ✅ Sort by newest/oldest
- ✅ Pagination
- ✅ Placeholder gradients for sites without screenshots

## ⚠️ What's Missing (Known Issues)

### Phase 5: AI Semantic Search
**Status**: Backend implemented but not working

- ❌ **AI Embeddings**: Backend code ready, but Workers AI times out
  - `generateSiteEmbedding()` function starts but doesn't complete
  - No embeddings saved to Vectorize index
  - Issue: Workers AI API appears to timeout silently
  
- ❌ **Semantic Search**: Cannot search by meaning/description
  - Search UI exists but returns no results
  - Vectorize index is empty (no embeddings)

**Root Cause**: Cloudflare Workers AI API starts execution but times out after 60+ seconds without logging errors. May require account-level API access verification or paid plan.

### Phase 6: Automatic Screenshots
**Status**: Backend implemented but not working

- ❌ **Screenshot Capture**: Browser Rendering API times out
  - `@cloudflare/puppeteer` installed and configured
  - Browser launches but screenshot capture doesn't complete
  - No screenshots saved to R2 bucket
  - Issue: Browser Rendering API times out even for simple sites like google.com

- ❌ **Thumbnail Generation**: Depends on screenshot capture

**Root Cause**: Cloudflare Browser Rendering API launches browser but times out during page load/screenshot capture. Tested with simple sites (google.com, example.com) - all timeout. May require additional API enablement or account verification.

**Current Workaround**: Sites display with beautiful gradient placeholders instead of screenshots.

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Cloudflare Kumo** - Component library and design system
- **TailwindCSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Phosphor Icons** - Icon library

### Backend
- **Cloudflare Workers** - Serverless compute
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Object storage (for screenshots)
- **Cloudflare Vectorize** - Vector database (for AI embeddings)
- **Cloudflare Workers AI** - AI/ML inference (not working)
- **Cloudflare Browser Rendering** - Headless browser (not working)

## 📦 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm
- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler`)
- Google OAuth credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd px-tester
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` file:
```
VITE_API_URL=https://px-tester-api.px-tester.workers.dev/api
```

4. **Set up Cloudflare Workers secrets**
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SESSION_SECRET
```

### Development

**Frontend**:
```bash
npm run dev
```
Opens at `http://localhost:5173`

**Backend** (local):
```bash
wrangler dev
```

### Deployment

**Deploy Backend**:
```bash
wrangler deploy
```

**Deploy Frontend**:
```bash
npm run build
wrangler deploy --config wrangler-frontend.toml
```

## 📁 Project Structure

```
px-tester/
├── src/                      # Frontend React app
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Shared components
│   │   └── layout/         # Layout components (Header, Footer)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Browse.jsx
│   │   ├── SiteDetail.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SubmitSite.jsx
│   │   └── Admin.jsx       # Admin approval panel
│   ├── services/           # API services
│   └── App.jsx
├── worker/src/              # Backend Cloudflare Worker
│   ├── index.js            # Main worker entry point
│   ├── routes.js           # API route handlers
│   ├── admin-routes.js     # Admin route handlers
│   ├── auth.js             # Authentication logic
│   ├── ai.js               # AI embeddings (not working)
│   └── screenshots.js      # Screenshot capture (not working)
├── wrangler.toml           # Backend worker config
├── wrangler-frontend.toml  # Frontend worker config
└── package.json
```

## 🗄️ Database Schema

**D1 Tables**:
- `users` - User accounts from Google OAuth
- `sessions` - User sessions
- `sites` - Submitted sites with metadata

**Vectorize Index**:
- `px-tester-embeddings` - AI embeddings (empty, not working)

**R2 Bucket**:
- `px-tester-screenshots` - Site screenshots (empty, not working)

## 🔧 Configuration Files

- `wrangler.toml` - Backend worker configuration with D1, R2, Vectorize, AI, and Browser bindings
- `wrangler-frontend.toml` - Frontend static site configuration
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - TailwindCSS configuration

## 🚦 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Sites
- `GET /api/sites` - List approved sites (with filters)
- `GET /api/sites/:id` - Get site details
- `POST /api/sites` - Submit new site (authenticated)
- `PUT /api/sites/:id` - Update site (authenticated)
- `DELETE /api/sites/:id` - Delete site (authenticated)
- `GET /api/sites/my` - Get user's sites (authenticated)

### Admin
- `GET /api/admin/pending` - List pending sites (authenticated)
- `POST /api/admin/sites/:id/approve` - Approve site (authenticated)
- `POST /api/admin/sites/:id/reject` - Reject site (authenticated)

### Categories
- `GET /api/categories` - List all categories

## 🐛 Known Issues & Troubleshooting

### AI Embeddings Not Generating
**Symptoms**: Sites submitted but `embedding_id` remains null in database

**Attempted Fixes**:
- ✅ Workers AI binding configured
- ✅ `@cf/baai/bge-base-en-v1.5` model specified
- ✅ `ctx.waitUntil()` used to keep worker alive
- ❌ Still times out after 60+ seconds

**Possible Solutions**:
1. Contact Cloudflare Support about Workers AI access
2. Verify account has Workers AI enabled
3. Try different AI model
4. Use external AI service (OpenAI, Cohere)

### Screenshots Not Capturing
**Symptoms**: Browser launches but screenshot remains null

**Attempted Fixes**:
- ✅ `@cloudflare/puppeteer` installed
- ✅ `nodejs_compat` flag enabled
- ✅ Browser Rendering API binding configured
- ✅ Reduced timeouts to 15 seconds
- ❌ Still times out even for simple sites

**Possible Solutions**:
1. Contact Cloudflare Support about Browser Rendering API access
2. Verify account has Browser Rendering enabled
3. Use external screenshot service (ScreenshotAPI, Urlbox)
4. Disable feature and use placeholders (current workaround)

## 📈 Project Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | UI/UX Foundation | ✅ Complete |
| 2 | Backend & Database | ✅ Complete |
| 3 | Authentication | ✅ Complete |
| 4 | Site Submission | ✅ Complete |
| 5 | AI Semantic Search | ⚠️ Backend ready, API not working |
| 6 | Screenshot Capture | ⚠️ Backend ready, API not working |
| 7 | Admin Panel | ✅ Complete |
| 8 | User Management | 📋 Planned |

## 🎯 Next Steps

1. **Resolve Cloudflare API Issues**:
   - Contact support about Workers AI and Browser Rendering API access
   - Verify account tier and API limits

2. **Alternative Implementations**:
   - Integrate external screenshot service
   - Integrate external AI/embedding service

3. **Phase 8 Features**:
   - User roles (admin, super admin)
   - User management interface
   - Ban/unban functionality
   - Admin activity logs

## 📝 Notes

- The app is **fully functional** for core features (submission, browsing, admin approval)
- AI and screenshot features are **optional enhancements** that don't block core functionality
- Gradient placeholders provide a beautiful fallback for missing screenshots
- The codebase is **production-ready** for the working features

## License

MIT
