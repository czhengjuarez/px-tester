import { authenticate } from './auth.js';
import { 
  getGoogleAuthUrl, 
  exchangeCodeForTokens, 
  getGoogleUserInfo, 
  findOrCreateUser 
} from './oauth.js';
import { createSession, deleteSession, setSessionCookie, clearSessionCookie } from './auth.js';
import { generateSiteEmbedding, searchSimilar, findSimilarSites } from './ai.js';
import { captureScreenshot, getScreenshot } from './screenshots.js';

// Auth routes
export async function handleAuthGoogle(env, corsHeaders) {
  const authUrl = getGoogleAuthUrl(env);
  return new Response(JSON.stringify({ url: authUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleAuthCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error || !code) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${env.FRONTEND_URL}/?error=auth_failed`,
        ...corsHeaders
      }
    });
  }
  
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(env, code);
    
    // Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    
    // Find or create user
    const user = await findOrCreateUser(env, googleUser);
    
    // Create session
    const { token, expiresAt } = await createSession(env, user.id);
    
    // Redirect with session cookie
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${env.FRONTEND_URL}/`,
        'Set-Cookie': setSessionCookie(token, expiresAt),
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${env.FRONTEND_URL}/?error=auth_failed`,
        ...corsHeaders
      }
    });
  }
}

export async function handleAuthMe(request, env, corsHeaders) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ 
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleAuthLogout(request, env, corsHeaders) {
  const cookie = request.headers.get('Cookie');
  const sessionToken = cookie?.match(/session=([^;]+)/)?.[1];
  
  if (sessionToken) {
    await deleteSession(env, sessionToken);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie()
    }
  });
}

// Sites routes
export async function handleCreateSite(request, env, user, corsHeaders, ctx) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { name, url, description, short_description, category, tags, thumbnail_url } = data;

    // Validate required fields
    if (!name || !url || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if URL already exists
    const existingSite = await env.DB.prepare(
      'SELECT id FROM sites WHERE url = ?'
    ).bind(url).first();

    if (existingSite) {
      return new Response(JSON.stringify({ 
        error: 'This URL has already been submitted',
        details: 'A site with this URL already exists in our database'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate ID and timestamps
    const id = crypto.randomUUID();
    const now = Date.now();

    // Insert site with pending status (including thumbnail_url if provided)
    await env.DB.prepare(`
      INSERT INTO sites (
        id, name, url, description, short_description, category, tags,
        thumbnail_url, user_id, submitted_at, status, views, likes, is_featured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, name, url, description || '', short_description || '',
      category, JSON.stringify(tags || []), thumbnail_url || null,
      user.id, now, 'pending', 0, 0, 0, now, now
    ).run();

    // Capture screenshot and generate embeddings asynchronously
    // Don't wait for these to complete to avoid timeout
    const site = { id, name, url, description, short_description, category, tags };
    
    // Schedule async tasks with better error handling
    // Use context.waitUntil to ensure they complete
    const asyncTasks = async () => {
      try {
        console.log('Starting AI embedding generation for:', site.name);
        const embedding = await generateSiteEmbedding(env, site);
        console.log('AI embedding generated:', embedding ? 'success' : 'failed');
        
        if (embedding) {
          await env.DB.prepare(
            'UPDATE sites SET embedding_id = ? WHERE id = ?'
          ).bind(id, id).run();
          console.log('AI embedding saved to database');
        }
      } catch (err) {
        console.error('AI embedding failed:', err.message, err.stack);
      }
    };

    // Execute async tasks using ctx.waitUntil to keep Worker alive
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(asyncTasks());
    } else {
      // Fallback if context not available
      asyncTasks().catch(err => console.error('Async tasks error:', err));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      id,
      message: 'Site submitted for review. Screenshot and AI processing in progress...' 
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create site error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create site',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function handleLikeSite(env, user, siteId, corsHeaders) {
  try {
    // Get current likes count
    const { results } = await env.DB.prepare(
      'SELECT likes FROM sites WHERE id = ?'
    ).bind(siteId).all();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentLikes = results[0].likes || 0;
    const newLikes = currentLikes + 1;

    // Update likes count
    await env.DB.prepare(
      'UPDATE sites SET likes = ? WHERE id = ?'
    ).bind(newLikes, siteId).run();

    return new Response(JSON.stringify({ likes: newLikes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Like site error:', error);
    return new Response(JSON.stringify({ error: 'Failed to like site' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function handleGetMySites(env, user, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  const sites = results.map(site => ({
    ...site,
    tags: site.tags ? JSON.parse(site.tags) : []
  }));

  return new Response(JSON.stringify({ sites }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleUpdateSite(request, env, user, id, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check ownership
  const site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
  
  if (!site) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (site.user_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { name, url, description, short_description, category, tags, thumbnail_url } = data;

    await env.DB.prepare(`
      UPDATE sites 
      SET name = ?, url = ?, description = ?, short_description = ?,
          category = ?, tags = ?, thumbnail_url = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      name || site.name,
      url || site.url,
      description !== undefined ? description : site.description,
      short_description !== undefined ? short_description : site.short_description,
      category || site.category,
      tags ? JSON.stringify(tags) : site.tags,
      thumbnail_url !== undefined ? thumbnail_url : site.thumbnail_url,
      Date.now(),
      id
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update site error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update site' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function handleDeleteSite(env, user, id, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check ownership
  const site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
  
  if (!site) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (site.user_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleGetSites(request, env, corsHeaders) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const sort = url.searchParams.get('sort') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM sites WHERE status = ?';
  const params = ['approved'];

  if (featured === 'true') {
    query += ' AND is_featured = 1';
  }

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  switch (sort) {
    case 'popular':
      query += ' ORDER BY (views * 0.3 + likes * 0.7) DESC';
      break;
    case 'likes':
      query += ' ORDER BY likes DESC';
      break;
    case 'views':
      query += ' ORDER BY views DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY created_at DESC';
      break;
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  let countQuery = 'SELECT COUNT(*) as total FROM sites WHERE status = ?';
  const countParams = ['approved'];
  if (category && category !== 'all') {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }
  const { total } = await env.DB.prepare(countQuery).bind(...countParams).first();

  const sites = results.map(site => ({
    ...site,
    tags: site.tags ? JSON.parse(site.tags) : []
  }));

  return new Response(JSON.stringify({
    sites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleGetSiteById(id, env, corsHeaders) {
  const site = await env.DB.prepare(
    'SELECT * FROM sites WHERE id = ? AND status = ?'
  ).bind(id, 'approved').first();

  if (!site) {
    return new Response(JSON.stringify({ error: 'Site not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'UPDATE sites SET views = views + 1 WHERE id = ?'
  ).bind(id).run();

  site.tags = site.tags ? JSON.parse(site.tags) : [];

  const { results: similarSites } = await env.DB.prepare(
    'SELECT * FROM sites WHERE category = ? AND id != ? AND status = ? ORDER BY RANDOM() LIMIT 3'
  ).bind(site.category, id, 'approved').all();

  const similar = similarSites.map(s => ({
    ...s,
    tags: s.tags ? JSON.parse(s.tags) : []
  }));

  return new Response(JSON.stringify({
    site,
    similarSites: similar
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Admin routes
export async function handleGetPendingSites(env, user, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM sites WHERE status = ? ORDER BY created_at DESC'
  ).bind('pending').all();

  return new Response(JSON.stringify({ sites: results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleApproveSite(env, user, siteId, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'UPDATE sites SET status = ? WHERE id = ?'
  ).bind('approved', siteId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleRejectSite(env, user, siteId, corsHeaders) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'UPDATE sites SET status = ? WHERE id = ?'
  ).bind('rejected', siteId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleGetCategories(env, corsHeaders) {
  const categories = [
    { id: 'saas', name: 'SaaS', count: 0 },
    { id: 'portfolio', name: 'Portfolio', count: 0 },
    { id: 'ecommerce', name: 'E-commerce', count: 0 },
    { id: 'blog', name: 'Blog', count: 0 },
    { id: 'agency', name: 'Agency', count: 0 },
    { id: 'productivity', name: 'Productivity', count: 0 },
    { id: 'design', name: 'Design', count: 0 },
    { id: 'development', name: 'Development', count: 0 }
  ];

  return new Response(JSON.stringify({ categories }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// AI Search endpoint
export async function handleAISearch(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const matches = await searchSimilar(env, query, limit);
    const siteIds = matches.map(m => m.id);

    if (siteIds.length === 0) {
      return new Response(JSON.stringify({ sites: [], total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const placeholders = siteIds.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT * FROM sites WHERE id IN (${placeholders}) AND status = 'approved'`
    ).bind(...siteIds).all();

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
