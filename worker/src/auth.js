// Authentication utilities and middleware

export async function authenticate(request, env) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  
  const sessionToken = cookie.match(/session=([^;]+)/)?.[1];
  if (!sessionToken) return null;
  
  const session = await env.DB.prepare(`
    SELECT s.*, u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.is_active = 1
  `).bind(sessionToken, Date.now()).first();
  
  return session;
}

export function requireAuth(handler) {
  return async (request, env, user) => {
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return handler(request, env, user);
  };
}

export function requireRole(requiredRole) {
  const roles = { user: 1, admin: 2, super_admin: 3 };
  
  return (handler) => {
    return async (request, env, user) => {
      if (!user || roles[user.role] < roles[requiredRole]) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return handler(request, env, user);
    };
  };
}

export async function createSession(env, userId) {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
  
  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, userId, token, expiresAt, now).run();
  
  return { token, expiresAt };
}

export async function deleteSession(env, token) {
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export function setSessionCookie(token, expiresAt) {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  // SameSite=None is required for cross-origin cookies (custom domain to API domain)
  return `session=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0';
}
