import {
  handleAuthGoogle,
  handleAuthCallback,
  handleAuthMe,
  handleAuthLogout,
  handleGetSites,
  handleGetSiteById,
  handleGetCategories,
  handleCreateSite,
  handleGetMySites,
  handleUpdateSite,
  handleDeleteSite,
  handleLikeSite,
  handleGetInvite,
  handleAcceptInvite
} from './routes.js';
import { handleSearch } from './search.js';
import { handleCreateCategory } from './category-routes.js';
import {
  handleGetPendingSites,
  handleApproveSite,
  handleRejectSite,
  handleGetUsers,
  handleUpgradeUser,
  handleDeleteUser,
  handleCreateInvite,
  handleGetInvites,
  handleRevokeInvite,
  handleDeleteInvite,
  handleGetAllSites,
  handleToggleFeatured,
  handleUpdateSiteStatus
} from './admin-routes.js';
import { handleImageUpload } from './upload-routes.js';
import { handleGetScreenshot } from './screenshot-routes.js';
import { authenticate } from './auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers - support multiple frontend origins
    const allowedOrigins = [
      'https://demo.px-tester.workers.dev',
      'https://demo.pxtester.com',
      'http://localhost:5173' // for local development
    ];
    
    const origin = request.headers.get('Origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Authenticate user for protected routes
      const user = await authenticate(request, env);

      // Auth routes
      if (url.pathname === '/api/auth/google' && request.method === 'GET') {
        return handleAuthGoogle(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/auth/google/callback' && request.method === 'GET') {
        return handleAuthCallback(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        return handleAuthMe(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return handleAuthLogout(request, env, corsHeaders);
      }

      // Sites routes
      if (url.pathname === '/api/sites' && request.method === 'GET') {
        return handleGetSites(request, env, user, corsHeaders);
      }

      if (url.pathname === '/api/sites' && request.method === 'POST') {
        return handleCreateSite(request, env, user, corsHeaders, ctx);
      }

      if (url.pathname === '/api/sites/my' && request.method === 'GET') {
        return handleGetMySites(env, user, corsHeaders);
      }
      
      if (url.pathname.match(/^\/api\/sites\/[^/]+$/) && request.method === 'GET') {
        const id = url.pathname.split('/').pop();
        return handleGetSiteById(id, env, user, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/sites\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        return handleUpdateSite(request, env, user, id, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/sites\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return handleDeleteSite(env, user, id, corsHeaders);
      }

      if (url.pathname === '/api/categories' && request.method === 'GET') {
        return handleGetCategories(env, corsHeaders);
      }

      if (url.pathname === '/api/categories' && request.method === 'POST') {
        return handleCreateCategory(request, env, user, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/sites\/[^/]+\/like$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        return handleLikeSite(env, user, id, corsHeaders);
      }

      // Search route
      if (url.pathname === '/api/search' && request.method === 'GET') {
        return handleSearch(request, env, corsHeaders);
      }

      // Backfill embeddings (admin only, one-time use)
      if (url.pathname === '/api/admin/backfill-embeddings' && request.method === 'POST') {
        if (!user || user.role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const { upsertSiteEmbedding } = await import('./embeddings.js');
          
          const { results: sites } = await env.DB.prepare(`
            SELECT id, name, url, short_description as tagline, description, 
                   category as category_id, tags, thumbnail_url as image_url
            FROM sites 
            WHERE status = 'approved'
            ORDER BY id
          `).all();
          
          const results = { total: sites.length, success: 0, failed: 0, errors: [] };
          
          for (const site of sites) {
            try {
              const success = await upsertSiteEmbedding(site, env);
              if (success) {
                results.success++;
              } else {
                results.failed++;
                results.errors.push({ id: site.id, name: site.name });
              }
            } catch (error) {
              results.failed++;
              results.errors.push({ id: site.id, name: site.name, error: error.message });
            }
          }
          
          return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Invite routes
      if (url.pathname.match(/^\/api\/invites\/[^/]+$/) && request.method === 'GET') {
        const code = url.pathname.split('/')[3];
        return handleGetInvite(env, code, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/invites\/[^/]+\/accept$/) && request.method === 'POST') {
        const code = url.pathname.split('/')[3];
        return handleAcceptInvite(request, env, code, corsHeaders);
      }

      // Admin routes
      if (url.pathname === '/api/admin/pending' && request.method === 'GET') {
        return handleGetPendingSites(env, user, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/admin\/sites\/[^/]+\/approve$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[4];
        return handleApproveSite(env, user, id, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/admin\/sites\/[^/]+\/reject$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[4];
        return handleRejectSite(env, user, id, corsHeaders);
      }

      if (url.pathname === '/api/admin/users' && request.method === 'GET') {
        const searchQuery = url.searchParams.get('search') || '';
        return handleGetUsers(env, user, corsHeaders, searchQuery);
      }

      if (url.pathname.match(/^\/api\/admin\/users\/[^/]+\/upgrade$/) && request.method === 'POST') {
        const userId = url.pathname.split('/')[4];
        const body = await request.json();
        return handleUpgradeUser(env, user, userId, body.role, corsHeaders);
      }

      // Delete user
      if (url.pathname.match(/^\/api\/admin\/users\/[^/]+$/) && request.method === 'DELETE') {
        const userId = url.pathname.split('/')[4];
        return handleDeleteUser(env, user, userId, corsHeaders);
      }

      // Invite system
      if (url.pathname === '/api/admin/invites' && request.method === 'GET') {
        return handleGetInvites(env, user, corsHeaders);
      }

      if (url.pathname === '/api/admin/invites' && request.method === 'POST') {
        const body = await request.json();
        return handleCreateInvite(env, user, body.email, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/admin\/invites\/[^/]+\/revoke$/) && request.method === 'POST') {
        const inviteId = url.pathname.split('/')[4];
        return handleRevokeInvite(env, user, inviteId, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/admin\/invites\/[^/]+$/) && request.method === 'DELETE') {
        const inviteId = url.pathname.split('/')[4];
        return handleDeleteInvite(env, user, inviteId, corsHeaders);
      }

      // Manage Sites
      if (url.pathname === '/api/admin/sites' && request.method === 'GET') {
        const searchQuery = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || '';
        return handleGetAllSites(env, user, corsHeaders, searchQuery, status);
      }

      if (url.pathname.match(/^\/api\/admin\/sites\/[^/]+\/toggle-featured$/) && request.method === 'POST') {
        const siteId = url.pathname.split('/')[4];
        return handleToggleFeatured(env, user, siteId, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/admin\/sites\/[^/]+\/status$/) && request.method === 'PUT') {
        const siteId = url.pathname.split('/')[4];
        const body = await request.json();
        return handleUpdateSiteStatus(env, user, siteId, body.status, corsHeaders);
      }

      // Image upload (requires authentication)
      if (url.pathname === '/api/upload/image' && request.method === 'POST') {
        return handleImageUpload(request, env, user, corsHeaders);
      }

      // Screenshot serving (public access)
      if (url.pathname.match(/^\/screenshots\/.+$/)) {
        const filename = url.pathname.replace('/screenshots/', '');
        return handleGetScreenshot(filename, env, corsHeaders);
      }

      // Health check
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Root path handler
      if (url.pathname === '/' || url.pathname === '') {
        return new Response(JSON.stringify({ 
          message: 'PX Tester API',
          version: '1.0.0',
          endpoints: {
            health: '/api/health',
            sites: '/api/sites',
            auth: '/api/auth/me'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Cloudflare Access authorized callback - redirect to root
      if (url.pathname === '/cdn-cgi/access/authorized') {
        return Response.redirect(new URL('/', url.origin).toString(), 302);
      }

      // 404 - but provide helpful message
      return new Response(JSON.stringify({ 
        error: 'Not found',
        message: `Path ${url.pathname} not found`,
        availableEndpoints: {
          root: '/',
          health: '/api/health',
          sites: '/api/sites',
          auth: '/api/auth/me'
        }
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
