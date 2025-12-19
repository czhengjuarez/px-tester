// AI and Vector Search utilities

export async function generateEmbedding(env, text) {
  try {
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [text]
    });
    return response.data[0];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export async function storeEmbedding(env, siteId, embedding, metadata) {
  try {
    await env.VECTORIZE.upsert([{
      id: siteId,
      values: embedding,
      metadata: metadata
    }]);
    return true;
  } catch (error) {
    console.error('Error storing embedding:', error);
    return false;
  }
}

export async function searchSimilar(env, queryText, limit = 10) {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(env, queryText);
    if (!queryEmbedding) return [];

    // Search in Vectorize
    const results = await env.VECTORIZE.query(queryEmbedding, {
      topK: limit,
      returnMetadata: true
    });

    return results.matches || [];
  } catch (error) {
    console.error('Error searching similar:', error);
    return [];
  }
}

export async function generateSiteEmbedding(env, site) {
  // Combine site information for better embeddings
  const text = `${site.name}. ${site.short_description || ''}. ${site.description || ''}. Category: ${site.category}. Tags: ${site.tags?.join(', ') || ''}`;
  
  const embedding = await generateEmbedding(env, text);
  if (!embedding) return null;

  const metadata = {
    name: site.name,
    category: site.category,
    url: site.url
  };

  await storeEmbedding(env, site.id, embedding, metadata);
  return embedding;
}

export async function findSimilarSites(env, siteId, limit = 5) {
  try {
    // Get the site details
    const site = await env.DB.prepare(
      'SELECT * FROM sites WHERE id = ?'
    ).bind(siteId).first();

    if (!site) return [];

    // Generate search text
    const searchText = `${site.name} ${site.short_description || ''} ${site.category}`;
    
    // Search for similar sites
    const matches = await searchSimilar(env, searchText, limit + 1);
    
    // Filter out the current site and get site details
    const similarIds = matches
      .filter(m => m.id !== siteId)
      .slice(0, limit)
      .map(m => m.id);

    if (similarIds.length === 0) return [];

    const placeholders = similarIds.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT * FROM sites WHERE id IN (${placeholders}) AND status = 'approved'`
    ).bind(...similarIds).all();

    return results.map(s => ({
      ...s,
      tags: s.tags ? JSON.parse(s.tags) : []
    }));
  } catch (error) {
    console.error('Error finding similar sites:', error);
    return [];
  }
}
