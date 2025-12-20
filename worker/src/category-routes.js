export async function handleCreateCategory(request, env, user, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Category name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if category already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).bind(name.trim()).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Category already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate slug from name
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Insert new category
    const result = await env.DB.prepare(`
      INSERT INTO categories (name, slug, description)
      VALUES (?, ?, ?)
    `).bind(name.trim(), slug, description?.trim() || null).run();

    console.log('[CreateCategory] Created category:', name, 'with slug:', slug);

    return new Response(JSON.stringify({
      success: true,
      category: {
        id: result.meta.last_row_id,
        name: name.trim(),
        slug,
        description: description?.trim() || null
      }
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[CreateCategory] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create category',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
