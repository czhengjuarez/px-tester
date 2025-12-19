// Image upload routes
export async function handleImageUpload(request, env, user, corsHeaders) {
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image || !image.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid image file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = image.name.split('.').pop();
    const filename = `site-${timestamp}.${extension}`;

    // Upload to R2
    await env.SCREENSHOTS.put(filename, image.stream(), {
      httpMetadata: {
        contentType: image.type,
      },
    });

    // Return the public URL
    const url = `/screenshots/${filename}`;

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
