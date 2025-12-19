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

export async function handleGetUsers(env, user, corsHeaders, searchQuery = '') {
  if (!user || user.role !== 'admin' && user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let query = 'SELECT id, email, name, avatar_url, role, is_active, created_at, last_login FROM users';
  let params = [];
  
  if (searchQuery) {
    query += ' WHERE email LIKE ? OR name LIKE ?';
    params = [`%${searchQuery}%`, `%${searchQuery}%`];
  }
  
  query += ' ORDER BY created_at DESC';
  
  const { results } = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ users: results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleUpgradeUser(env, user, userId, newRole, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only super admins can upgrade users' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const validRoles = ['user', 'admin', 'super_admin'];
  if (!validRoles.includes(newRole)) {
    return new Response(JSON.stringify({ error: 'Invalid role' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'UPDATE users SET role = ?, updated_at = ? WHERE id = ?'
  ).bind(newRole, Date.now(), userId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleDeleteUser(env, user, userId, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only super admins can delete users' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Prevent deleting yourself
  if (user.id === userId) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Delete user's sessions first
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  
  // Delete the user
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Invite system
export async function handleCreateInvite(env, user, email, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only super admins can create invites' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const inviteId = crypto.randomUUID();
  const inviteCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
  const now = Date.now();
  const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

  await env.DB.prepare(`
    INSERT INTO invites (id, code, email, invited_by, invited_by_name, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(inviteId, inviteCode, email || null, user.id, user.name, now, expiresAt).run();

  // Send email if email address is provided
  let emailSent = false;
  if (email) {
    try {
      const { sendInviteEmail } = await import('./email.js');
      await sendInviteEmail(email, inviteCode, user.name, env);
      emailSent = true;
    } catch (error) {
      console.error('Failed to send invite email:', error);
      // Don't fail the whole request if email fails
    }
  }

  return new Response(JSON.stringify({ 
    success: true,
    emailSent,
    invite: {
      id: inviteId,
      code: inviteCode,
      email,
      expiresAt
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleGetInvites(env, user, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only super admins can view invites' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { results } = await env.DB.prepare(`
    SELECT i.*, u.name as used_by_name, u.email as used_by_email
    FROM invites i
    LEFT JOIN users u ON i.used_by = u.id
    ORDER BY i.created_at DESC
  `).all();

  return new Response(JSON.stringify({ invites: results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function handleRevokeInvite(env, user, inviteId, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only super admins can revoke invites' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(`
    UPDATE invites SET status = 'revoked' WHERE id = ?
  `).bind(inviteId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
