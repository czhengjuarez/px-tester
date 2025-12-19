// Google OAuth handlers

export function getGoogleAuthUrl(env, state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state || crypto.randomUUID(),
    access_type: 'online',
    prompt: 'select_account'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(env, code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }
  
  return response.json();
}

export async function getGoogleUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
}

export async function findOrCreateUser(env, googleUser) {
  const now = Date.now();
  
  // Try to find existing user
  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE google_id = ?'
  ).bind(googleUser.id).first();
  
  if (user) {
    // Update last login
    await env.DB.prepare(`
      UPDATE users SET last_login = ?, avatar_url = ?, updated_at = ?
      WHERE id = ?
    `).bind(now, googleUser.picture, now, user.id).run();
    
    user.last_login = now;
    user.avatar_url = googleUser.picture;
    user.updated_at = now;
  } else {
    // Create new user
    const userId = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO users (id, google_id, email, name, avatar_url, role, is_active, created_at, last_login, updated_at)
      VALUES (?, ?, ?, ?, ?, 'user', 1, ?, ?, ?)
    `).bind(userId, googleUser.id, googleUser.email, googleUser.name, googleUser.picture, now, now, now).run();
    
    user = {
      id: userId,
      google_id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar_url: googleUser.picture,
      role: 'user',
      is_active: 1,
      created_at: now,
      last_login: now,
      updated_at: now
    };
  }
  
  return user;
}
