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

export async function handleDeleteCategory(request, env, user, categoryId, corsHeaders) {
  if (!user || user.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Check if category exists
    const category = await env.DB.prepare(
      'SELECT id, name FROM categories WHERE id = ?'
    ).bind(categoryId).first();

    if (!category) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if any sites are using this category
    const sitesUsingCategory = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM sites WHERE category = ?'
    ).bind(category.name).first();

    if (sitesUsingCategory && sitesUsingCategory.count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete category',
        message: `This category is being used by ${sitesUsingCategory.count} site(s). Please reassign those sites first.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete the category
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(categoryId).run();

    console.log('[DeleteCategory] Deleted category:', category.name);

    return new Response(JSON.stringify({
      success: true,
      message: 'Category deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[DeleteCategory] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete category',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
