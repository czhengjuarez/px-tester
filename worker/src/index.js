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
} from './routes.js';
import {
  handleGetPendingSites,
  handleApproveSite,
  handleRejectSite
} from './admin-routes.js';
import { authenticate } from './auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
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
        return handleAuthGoogle(env, corsHeaders);
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
        return handleGetSites(request, env, corsHeaders);
      }

      if (url.pathname === '/api/sites' && request.method === 'POST') {
        return handleCreateSite(request, env, user, corsHeaders, ctx);
      }

      if (url.pathname === '/api/sites/my' && request.method === 'GET') {
        return handleGetMySites(env, user, corsHeaders);
      }
      
      if (url.pathname.match(/^\/api\/sites\/[^/]+$/) && request.method === 'GET') {
        const id = url.pathname.split('/').pop();
        return handleGetSiteById(id, env, corsHeaders);
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

      // AI Search
      if (url.pathname === '/api/search' && request.method === 'GET') {
        return handleAISearch(request, env, corsHeaders);
      }

      // Similar sites
      if (url.pathname.match(/^\/api\/sites\/[^/]+\/similar$/) && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        return handleGetSimilarSites(id, env, corsHeaders);
      }

      // Screenshot serving
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

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
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
