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
