// Screenshot serving routes
export async function handleGetScreenshot(filename, env, corsHeaders) {
  try {
    const object = await env.SCREENSHOTS.get(filename);
    
    if (!object) {
      return new Response('Screenshot not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    const headers = {
      ...corsHeaders,
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    };

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Get screenshot error:', error);
    return new Response('Failed to retrieve screenshot', {
      status: 500,
      headers: corsHeaders
    });
  }
}
