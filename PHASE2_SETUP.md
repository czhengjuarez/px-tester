# Phase 2: Backend & Database Setup Guide

## 🎯 Overview
Phase 2 implements the backend infrastructure with Cloudflare Workers and D1 database, replacing mock data with real API calls.

## 📋 Prerequisites
- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI installed globally: `npm install -g wrangler`

## 🚀 Setup Steps

### 1. Install Wrangler (if not already installed)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create D1 Database
```bash
cd worker
wrangler d1 create px-tester-db
```

This will output a database ID. Copy it and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "px-tester-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### 4. Run Database Migrations
```bash
# Create tables
wrangler d1 execute px-tester-db --file=./schema.sql

# Seed with initial data
wrangler d1 execute px-tester-db --file=./seed.sql
```

Or use the npm scripts:
```bash
npm run db:setup
```

### 5. Start the Worker (Development)
```bash
# In the worker directory
wrangler dev

# Or from root
cd worker && wrangler dev
```

The API will be available at `http://localhost:8787`

### 6. Start the Frontend
```bash
# In a new terminal, from project root
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/sites` - List all approved sites
  - Query params: `category`, `sort`, `page`, `limit`
- `GET /api/sites/:id` - Get site details
- `GET /api/categories` - Get all categories

### Example Requests
```bash
# Get all sites
curl http://localhost:8787/api/sites

# Filter by category
curl http://localhost:8787/api/sites?category=saas

# Sort by popularity
curl http://localhost:8787/api/sites?sort=popular

# Pagination
curl http://localhost:8787/api/sites?page=2&limit=6

# Get specific site
curl http://localhost:8787/api/sites/1

# Get categories
curl http://localhost:8787/api/categories
```

## 🧪 Testing the Integration

1. **Start both servers**:
   - Worker: `cd worker && wrangler dev` (port 8787)
   - Frontend: `npm run dev` (port 5173)

2. **Test the Browse page**:
   - Visit `http://localhost:5173/browse`
   - Try filtering by category
   - Try different sort options
   - Test pagination

3. **Test Site Detail page**:
   - Click on any site card
   - Verify data loads from API
   - Check similar sites section

## 📁 Project Structure

```
px-tester/
├── worker/                    # Cloudflare Workers backend
│   ├── src/
│   │   └── index.js          # Main Worker code
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # Seed data
│   └── package.json          # Worker scripts
├── wrangler.toml             # Worker configuration
├── src/                      # Frontend (React)
│   ├── services/
│   │   └── api.js           # API client
│   ├── hooks/
│   │   └── useSites.js      # React Query hooks
│   └── components/
│       └── common/
│           └── LoadingStates.jsx  # Loading components
└── .env                      # Environment variables
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in project root:
```env
VITE_API_URL=http://localhost:8787/api
```

For production, update to your deployed Worker URL:
```env
VITE_API_URL=https://your-worker.workers.dev/api
```

### CORS Configuration
The Worker is configured to allow requests from `http://localhost:5173` in development. Update `wrangler.toml` for production:
```toml
[vars]
FRONTEND_URL = "https://your-frontend-domain.com"
```

## 🐛 Troubleshooting

### Worker not starting
- Ensure you're logged in: `wrangler whoami`
- Check database ID in `wrangler.toml` matches your D1 database

### Database errors
- Verify tables exist: `wrangler d1 execute px-tester-db --command="SELECT name FROM sqlite_master WHERE type='table'"`
- Re-run migrations if needed

### CORS errors
- Check `FRONTEND_URL` in `wrangler.toml`
- Verify both servers are running on correct ports

### API not responding
- Check Worker logs: `wrangler tail`
- Verify `.env` has correct `VITE_API_URL`

## 📊 Database Schema

### Sites Table
- `id` - Unique identifier
- `name` - Site name
- `url` - Site URL
- `description` - Full description
- `short_description` - Brief summary
- `category` - Category (saas, portfolio, etc.)
- `tags` - JSON array of tags
- `screenshot_url` - Full screenshot URL
- `thumbnail_url` - Thumbnail URL
- `status` - approval status (pending, approved, rejected)
- `views` - View count
- `likes` - Like count
- `is_featured` - Featured flag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🚢 Deployment

### Deploy Worker to Production
```bash
cd worker
wrangler deploy
```

### Deploy Frontend to Cloudflare Pages
```bash
npm run build
wrangler pages deploy dist
```

## ✅ Phase 2 Checklist

- [x] Create Cloudflare Workers project structure
- [x] Set up D1 database schema
- [x] Build REST API endpoints (GET sites, GET site by ID)
- [x] Create API service layer in frontend
- [x] Add React Query for data fetching
- [x] Implement loading states
- [x] Add error handling
- [x] Update Browse page with real API
- [x] Update SiteDetail page with real API
- [x] Add pagination support
- [x] Add filtering by category
- [x] Add sorting options

## 🎯 Next Steps (Phase 3)

Phase 3 will add authentication with Google OAuth:
- Set up Google OAuth credentials
- Add users and sessions tables
- Implement OAuth flow in Workers
- Create AuthProvider in React
- Add protected routes

---

**Status**: ✅ Phase 2 Complete  
**Ready for**: Phase 3 - Authentication
