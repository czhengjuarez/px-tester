import { generateEmbedding } from './embeddings.js';

export async function handleSearch(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query || query.trim().length === 0) {
    return new Response(JSON.stringify({ sites: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('[Search] Query:', query);
    
    // 1. Generate query embedding for semantic search
    const queryEmbedding = await generateEmbedding(query, env);
    
    // 2. Perform vector search
    const vectorResults = await env.VECTORIZE.query(queryEmbedding, {
      topK: 20,
      returnMetadata: true
    });
    
    console.log('[Search] Vector results:', vectorResults.matches.length);
    
    // 3. Get site IDs from vector search
    const vectorSiteIds = vectorResults.matches.map(m => m.id);
    
    // 4. Perform full-text search in D1 for approved sites
    const textSearchQuery = `%${query}%`;
    const textResults = await env.DB.prepare(`
      SELECT * FROM sites 
      WHERE status = 'approved' 
      AND (
        name LIKE ? OR 
        description LIKE ? OR 
        short_description LIKE ? OR 
        tags LIKE ?
      )
      LIMIT 20
    `).bind(textSearchQuery, textSearchQuery, textSearchQuery, textSearchQuery).all();
    
    console.log('[Search] Text results:', textResults.results.length);
    
    // 5. Fetch full site data for vector results
    let vectorSites = [];
    if (vectorSiteIds.length > 0) {
      const placeholders = vectorSiteIds.map(() => '?').join(',');
      const vectorSitesQuery = await env.DB.prepare(`
        SELECT * FROM sites 
        WHERE id IN (${placeholders}) 
        AND status = 'approved'
      `).bind(...vectorSiteIds).all();
      
      // Maintain vector search order and add scores
      vectorSites = vectorSiteIds
        .map(id => {
          const site = vectorSitesQuery.results.find(s => s.id === id);
          const match = vectorResults.matches.find(m => m.id === id);
          if (site) {
            return {
              ...site,
              score: match?.score || 0,
              source: 'semantic'
            };
          }
          return null;
        })
        .filter(Boolean);
    }
    
    // 6. Merge results - prioritize vector search, then add unique text results
    const siteIds = new Set(vectorSites.map(s => s.id));
    const mergedResults = [...vectorSites];
    
    for (const site of textResults.results) {
      if (!siteIds.has(site.id)) {
        mergedResults.push({
          ...site,
          source: 'text'
        });
      }
    }
    
    console.log('[Search] Merged results:', mergedResults.length);
    
    return new Response(JSON.stringify({ 
      sites: mergedResults,
      query,
      count: mergedResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Search failed',
      details: error.message,
      sites: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
