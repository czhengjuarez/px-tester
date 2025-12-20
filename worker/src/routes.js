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

// Invite routes
export async function handleGetInvite(env, inviteCode, corsHeaders) {
  const invite = await env.DB.prepare(`
    SELECT id, code, email, invited_by_name, status, expires_at
    FROM invites
    WHERE code = ? AND status = 'pending' AND expires_at > ?
  `).bind(inviteCode, Date.now()).first();

  if (!invite) {
    return new Response(JSON.stringify({ error: 'Invite not found or expired' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ invite }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleAcceptInvite(request, env, inviteCode, corsHeaders) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const invite = await env.DB.prepare(`
    SELECT id, code, email, status, expires_at
    FROM invites
    WHERE code = ? AND status = 'pending' AND expires_at > ?
  `).bind(inviteCode, Date.now()).first();

  if (!invite) {
    return new Response(JSON.stringify({ error: 'Invite not found or expired' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if invite email matches user email (if email was specified)
  if (invite.email && invite.email !== user.email) {
    return new Response(JSON.stringify({ error: 'This invite is for a different email address' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Mark invite as accepted
  await env.DB.prepare(`
    UPDATE invites 
    SET status = 'accepted', used_by = ?, used_by_email = ?, used_by_name = ?, used_at = ?
    WHERE id = ?
  `).bind(user.id, user.email, user.name, Date.now(), invite.id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Auth routes
export async function handleAuthGoogle(request, env, corsHeaders) {
  // Get the origin domain from the Referer header to redirect back after OAuth
  const referer = request.headers.get('Referer') || request.headers.get('Origin');
  let originDomain = env.FRONTEND_URL; // default
  
  console.log('[Auth Google] Referer:', referer);
  console.log('[Auth Google] Origin:', request.headers.get('Origin'));
  
  if (referer) {
    const refererUrl = new URL(referer);
    originDomain = `${refererUrl.protocol}//${refererUrl.host}`;
  }
  
  console.log('[Auth Google] Origin domain:', originDomain);
  
  // Encode origin domain in state parameter
  const state = btoa(JSON.stringify({ origin: originDomain }));
  const authUrl = getGoogleAuthUrl(env, state);
  
  console.log('[Auth Google] Generated OAuth URL:', authUrl);
  console.log('[Auth Google] Client ID:', env.GOOGLE_CLIENT_ID);
  console.log('[Auth Google] Redirect URI:', env.GOOGLE_REDIRECT_URI);
  
  return new Response(JSON.stringify({ url: authUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleAuthCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const stateParam = url.searchParams.get('state');
  
  // Decode origin domain from state parameter
  let originDomain = env.FRONTEND_URL; // default
  if (stateParam) {
    try {
      const decoded = JSON.parse(atob(stateParam));
      originDomain = decoded.origin || env.FRONTEND_URL;
    } catch (e) {
      console.error('Failed to decode state:', e);
    }
  }
  
  if (error || !code) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${originDomain}/?error=auth_failed`,
        ...corsHeaders
      }
    });
  }
  
  try {
    console.log('[OAuth Callback] Starting OAuth flow');
    console.log('[OAuth Callback] Origin domain:', originDomain);
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(env, code);
    console.log('[OAuth Callback] Got tokens');
    
    // Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    console.log('[OAuth Callback] Got user info:', googleUser.email);
    
    // Find or create user
    const user = await findOrCreateUser(env, googleUser);
    console.log('[OAuth Callback] User ID:', user.id, 'Role:', user.role);
    
    // Create session
    const { token, expiresAt } = await createSession(env, user.id);
    console.log('[OAuth Callback] Created session, token:', token.substring(0, 10) + '...');
    
    const cookieHeader = setSessionCookie(token, expiresAt);
    console.log('[OAuth Callback] Cookie header:', cookieHeader);
    
    // For cross-domain scenarios, also pass token via URL parameter
    // Frontend will set its own cookie from this token if needed
    const redirectUrl = new URL(originDomain);
    redirectUrl.searchParams.set('auth_token', token);
    redirectUrl.searchParams.set('expires', expiresAt.toString());
    
    console.log('[OAuth Callback] Redirecting to:', redirectUrl.toString());
    
    // Redirect back to origin domain with both cookie AND URL token
    // Cookie works for same-domain, URL token works for cross-domain
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
        'Set-Cookie': cookieHeader,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);
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
  const cookie = request.headers.get('Cookie');
  console.log('[Auth Me] Cookie header:', cookie);
  console.log('[Auth Me] Origin:', request.headers.get('Origin'));
  
  const user = await authenticate(request, env);
  console.log('[Auth Me] User:', user ? `${user.email} (${user.role})` : 'null');
  
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

    // Get the full site data for embedding
    const siteData = {
      id,
      name,
      url,
      tagline: short_description || '',
      description: description || '',
      category_id: category,
      tags: JSON.stringify(tags || []),
      image_url: thumbnail_url || null
    };
    
    // Generate and store embedding asynchronously
    const asyncTasks = async () => {
      try {
        const { upsertSiteEmbedding } = await import('./embeddings.js');
        await upsertSiteEmbedding(siteData, env);
      } catch (err) {
        console.error('[CreateSite] Embedding generation failed:', err);
      }
    };

    // Execute async tasks using ctx.waitUntil to keep Worker alive
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(asyncTasks());
    } else {
      asyncTasks().catch(err => console.error('[CreateSite] Async tasks error:', err));
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
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Check if user has already liked this site
    const existingLike = await env.DB.prepare(
      'SELECT id FROM user_likes WHERE user_id = ? AND site_id = ?'
    ).bind(user.id, siteId).first();

    let newLikes;
    let liked;

    if (existingLike) {
      // Unlike: Remove the like
      await env.DB.prepare(
        'DELETE FROM user_likes WHERE user_id = ? AND site_id = ?'
      ).bind(user.id, siteId).run();

      // Decrement likes count
      await env.DB.prepare(
        'UPDATE sites SET likes = likes - 1 WHERE id = ?'
      ).bind(siteId).run();

      liked = false;
    } else {
      // Like: Add the like
      await env.DB.prepare(
        'INSERT INTO user_likes (user_id, site_id) VALUES (?, ?)'
      ).bind(user.id, siteId).run();

      // Increment likes count
      await env.DB.prepare(
        'UPDATE sites SET likes = likes + 1 WHERE id = ?'
      ).bind(siteId).run();

      liked = true;
    }

    // Get updated likes count
    const site = await env.DB.prepare(
      'SELECT likes FROM sites WHERE id = ?'
    ).bind(siteId).first();

    if (!site) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    newLikes = site.likes || 0;

    return new Response(JSON.stringify({ likes: newLikes, liked }), {
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

export async function handleGetSites(request, env, user, corsHeaders) {
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

  // Check which sites the user has liked
  let userLikes = new Set();
  if (user) {
    const siteIds = results.map(s => s.id);
    if (siteIds.length > 0) {
      const placeholders = siteIds.map(() => '?').join(',');
      const { results: likes } = await env.DB.prepare(
        `SELECT site_id FROM user_likes WHERE user_id = ? AND site_id IN (${placeholders})`
      ).bind(user.id, ...siteIds).all();
      userLikes = new Set(likes.map(l => l.site_id));
    }
  }

  const sites = results.map(site => ({
    ...site,
    tags: site.tags ? JSON.parse(site.tags) : [],
    liked: userLikes.has(site.id)
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

export async function handleGetSiteById(id, env, user, corsHeaders) {
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

  // Check if current user has liked this site
  let liked = false;
  if (user) {
    const userLike = await env.DB.prepare(
      'SELECT id FROM user_likes WHERE user_id = ? AND site_id = ?'
    ).bind(user.id, id).first();
    liked = !!userLike;
  }

  const { results: similarSites } = await env.DB.prepare(
    'SELECT * FROM sites WHERE category = ? AND id != ? AND status = ? ORDER BY RANDOM() LIMIT 3'
  ).bind(site.category, id, 'approved').all();

  const similar = similarSites.map(s => ({
    ...s,
    tags: s.tags ? JSON.parse(s.tags) : []
  }));

  return new Response(JSON.stringify({
    site: { ...site, liked },
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
  try {
    const { results: categories } = await env.DB.prepare(`
      SELECT id, name, slug, description
      FROM categories
      ORDER BY name ASC
    `).all();

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[GetCategories] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch categories',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
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
