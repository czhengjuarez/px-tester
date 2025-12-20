export async function generateEmbedding(text, env) {
  try {
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [text]
    });
    return response.data[0];
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    throw error;
  }
}

export async function upsertSiteEmbedding(site, env) {
  try {
    const searchableText = `${site.name} ${site.tagline || ''} ${site.description || ''} ${site.tags || ''}`.trim();
    
    console.log('[Embeddings] Generating embedding for site:', site.id);
    const embedding = await generateEmbedding(searchableText, env);
    
    await env.VECTORIZE.upsert([{
      id: site.id.toString(),
      values: embedding,
      metadata: {
        name: site.name,
        url: site.url,
        tagline: site.tagline || '',
        category: site.category_id || '',
        image_url: site.image_url || ''
      }
    }]);
    
    console.log('[Embeddings] Successfully stored embedding for site:', site.id);
    return true;
  } catch (error) {
    console.error('[Embeddings] Failed to upsert site embedding:', error);
    return false;
  }
}

export async function deleteSiteEmbedding(siteId, env) {
  try {
    await env.VECTORIZE.deleteByIds([siteId.toString()]);
    console.log('[Embeddings] Deleted embedding for site:', siteId);
    return true;
  } catch (error) {
    console.error('[Embeddings] Failed to delete site embedding:', error);
    return false;
  }
}
