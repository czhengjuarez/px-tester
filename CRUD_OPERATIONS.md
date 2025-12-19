# CRUD Operations Reference

## 🎯 Site Management - User Perspective

### ✅ CREATE - Submit a Site

**Who:** Authenticated users  
**Route:** `POST /api/sites`  
**UI:** Submit Site page (`/submit`)

**Request:**
```json
{
  "name": "My Awesome Portfolio",
  "url": "https://example.com",
  "description": "A modern portfolio showcasing my work...",
  "category": "portfolio",
  "tags": ["design", "portfolio", "modern"]
}
```

**Process:**
1. Validate URL (check format, not duplicate)
2. Capture screenshot automatically
3. Generate AI-enhanced description
4. Create embeddings for search
5. Store in D1 (status: pending)
6. Upload screenshot to R2
7. Store vectors in Vectorize
8. Return site ID

**Response:**
```json
{
  "id": "abc123",
  "status": "pending",
  "message": "Site submitted for review"
}
```

---

### 📖 READ - View Sites

#### Public: List All Approved Sites
**Who:** Anyone  
**Route:** `GET /api/sites?category=portfolio&sort=newest`  
**UI:** Home page, Browse page

**Response:**
```json
{
  "sites": [
    {
      "id": "abc123",
      "name": "My Awesome Portfolio",
      "url": "https://example.com",
      "short_description": "A modern portfolio...",
      "category": "portfolio",
      "tags": ["design", "portfolio"],
      "thumbnail_url": "https://r2.../thumb.jpg",
      "likes": 42,
      "views": 1337,
      "submitted_at": 1703001234567
    }
  ],
  "total": 100,
  "page": 1
}
```

#### User: My Submitted Sites
**Who:** Authenticated users  
**Route:** `GET /api/dashboard/sites`  
**UI:** My Dashboard (`/dashboard`)

**Response includes pending/rejected sites:**
```json
{
  "sites": [
    {
      "id": "abc123",
      "name": "My Awesome Portfolio",
      "status": "approved",
      "views": 1337,
      "likes": 42
    },
    {
      "id": "def456",
      "name": "Another Site",
      "status": "pending",
      "submitted_at": 1703001234567
    },
    {
      "id": "ghi789",
      "name": "Rejected Site",
      "status": "rejected",
      "rejection_reason": "URL not accessible"
    }
  ]
}
```

---

### ✏️ UPDATE - Edit a Site

**Who:** Site owner OR admin  
**Route:** `PUT /api/sites/:id`  
**UI:** Edit Site page (`/site/:id/edit`)

**Authorization Check:**
```javascript
// User can edit if:
// 1. They own the site (user_id matches)
// 2. They are an admin/super_admin
const canEdit = site.user_id === user.id || 
                ['admin', 'super_admin'].includes(user.role);
```

**Request:**
```json
{
  "name": "Updated Portfolio Name",
  "description": "Updated description...",
  "category": "portfolio",
  "tags": ["design", "portfolio", "updated"],
  "recapture_screenshot": true
}
```

**Process:**
1. Verify ownership or admin role
2. Update site details in D1
3. If description changed, regenerate embeddings
4. If recapture_screenshot=true, capture new screenshot
5. Update timestamp

**Response:**
```json
{
  "id": "abc123",
  "message": "Site updated successfully",
  "updated_at": 1703002345678
}
```

---

### 🗑️ DELETE - Remove a Site

**Who:** Site owner OR admin  
**Route:** `DELETE /api/sites/:id`  
**UI:** My Dashboard or Admin Dashboard

**Authorization Check:**
```javascript
const canDelete = site.user_id === user.id || 
                  ['admin', 'super_admin'].includes(user.role);
```

**Process:**
1. Verify ownership or admin role
2. Delete from D1 (cascades to embeddings, likes)
3. Delete screenshot from R2
4. Delete vectors from Vectorize
5. Log action if deleted by admin

**Response:**
```json
{
  "message": "Site deleted successfully"
}
```

---

## 👨‍💼 Admin Operations

### ✅ APPROVE - Approve Pending Site

**Who:** Admin or Super Admin  
**Route:** `POST /api/admin/sites/:id/approve`  
**UI:** Admin Dashboard (`/admin`)

**Process:**
1. Check admin role
2. Update status to 'approved'
3. Set approved_by and approved_at
4. Log action in admin_logs
5. Notify user (optional)

**Request:**
```json
{
  "featured": false
}
```

**Response:**
```json
{
  "message": "Site approved",
  "site_id": "abc123"
}
```

---

### ❌ REJECT - Reject Pending Site

**Who:** Admin or Super Admin  
**Route:** `POST /api/admin/sites/:id/reject`  
**UI:** Admin Dashboard

**Request:**
```json
{
  "reason": "URL is not accessible"
}
```

**Process:**
1. Check admin role
2. Update status to 'rejected'
3. Store rejection reason
4. Log action in admin_logs
5. Notify user (optional)

**Response:**
```json
{
  "message": "Site rejected",
  "site_id": "abc123"
}
```

---

### ⭐ FEATURE - Feature/Unfeature Site

**Who:** Admin or Super Admin  
**Route:** `POST /api/admin/sites/:id/feature`  
**UI:** Admin Sites Management

**Request:**
```json
{
  "featured": true
}
```

**Process:**
1. Check admin role
2. Toggle is_featured flag
3. Log action in admin_logs

**Response:**
```json
{
  "message": "Site featured",
  "is_featured": true
}
```

---

## 👥 User Management (Super Admin Only)

### 📖 READ - List All Users

**Who:** Super Admin only  
**Route:** `GET /api/admin/users?role=user&status=active`  
**UI:** Admin Users (`/admin/users`)

**Response:**
```json
{
  "users": [
    {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "is_active": 1,
      "sites_count": 5,
      "created_at": 1703001234567,
      "last_login": 1703005678901
    }
  ],
  "total": 250
}
```

---

### ✏️ UPDATE - Change User Role

**Who:** Super Admin only  
**Route:** `PUT /api/admin/users/:id/role`  
**UI:** Admin Users

**Request:**
```json
{
  "role": "admin"
}
```

**Process:**
1. Verify super_admin role
2. Update user role in D1
3. Log action in admin_logs
4. Cannot demote yourself

**Response:**
```json
{
  "message": "User role updated to admin",
  "user_id": "user123"
}
```

---

### 🚫 BAN - Ban User

**Who:** Super Admin only  
**Route:** `POST /api/admin/users/:id/ban`  
**UI:** Admin Users

**Request:**
```json
{
  "reason": "Spam submissions"
}
```

**Process:**
1. Verify super_admin role
2. Set is_active = 0
3. Invalidate all user sessions
4. Log action with reason
5. Cannot ban yourself

**Response:**
```json
{
  "message": "User banned",
  "user_id": "user123"
}
```

---

### ✅ UNBAN - Unban User

**Who:** Super Admin only  
**Route:** `POST /api/admin/users/:id/unban`  
**UI:** Admin Users

**Process:**
1. Verify super_admin role
2. Set is_active = 1
3. Log action

**Response:**
```json
{
  "message": "User unbanned",
  "user_id": "user123"
}
```

---

### 🗑️ DELETE - Delete User Account

**Who:** Super Admin only  
**Route:** `DELETE /api/admin/users/:id`  
**UI:** Admin Users

**Process:**
1. Verify super_admin role
2. Delete user from D1 (cascades to sessions, sites, likes)
3. Delete all user's site screenshots from R2
4. Delete all user's site vectors from Vectorize
5. Log action
6. Cannot delete yourself

**Response:**
```json
{
  "message": "User account deleted",
  "sites_deleted": 5
}
```

---

## 💡 Additional Operations

### ❤️ LIKE - Like/Unlike Site

**Who:** Authenticated users  
**Route:** `POST /api/sites/:id/like`  
**UI:** Site Detail page, Site Cards

**Process:**
1. Check if already liked
2. If liked: remove from site_likes, decrement likes count
3. If not liked: add to site_likes, increment likes count

**Response:**
```json
{
  "liked": true,
  "likes_count": 43
}
```

---

### 🔍 SEARCH - AI Semantic Search

**Who:** Anyone  
**Route:** `POST /api/search`  
**UI:** Search Bar (everywhere)

**Request:**
```json
{
  "query": "modern portfolio designs",
  "filters": {
    "category": "portfolio",
    "tags": ["modern"]
  },
  "limit": 20
}
```

**Process:**
1. Generate embedding from query
2. Search Vectorize for similar sites
3. Apply filters
4. Fetch full site data from D1
5. Rank by relevance + popularity
6. Log search query

**Response:**
```json
{
  "results": [
    {
      "id": "abc123",
      "name": "Modern Portfolio",
      "relevance_score": 0.95,
      "thumbnail_url": "...",
      "short_description": "..."
    }
  ],
  "total": 15,
  "query_time_ms": 45
}
```

---

## 🔐 Authorization Summary

| Operation | User (Owner) | User (Other) | Admin | Super Admin |
|-----------|--------------|--------------|-------|-------------|
| Create site | ✅ | ✅ | ✅ | ✅ |
| View public sites | ✅ | ✅ | ✅ | ✅ |
| View own sites | ✅ | ❌ | ✅ | ✅ |
| Edit own site | ✅ | ❌ | ✅ | ✅ |
| Edit any site | ❌ | ❌ | ✅ | ✅ |
| Delete own site | ✅ | ❌ | ✅ | ✅ |
| Delete any site | ❌ | ❌ | ✅ | ✅ |
| Like sites | ✅ | ✅ | ✅ | ✅ |
| Approve sites | ❌ | ❌ | ✅ | ✅ |
| Reject sites | ❌ | ❌ | ✅ | ✅ |
| Feature sites | ❌ | ❌ | ✅ | ✅ |
| View users | ❌ | ❌ | ❌ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ✅ |
| Ban users | ❌ | ❌ | ❌ | ✅ |

---

**Implementation Tip:** Always verify authorization on the backend, never trust frontend checks alone!
