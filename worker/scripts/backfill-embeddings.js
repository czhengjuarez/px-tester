/**
 * Backfill embeddings for existing approved sites
 * 
 * Usage:
 * wrangler dev worker/scripts/backfill-embeddings.js
 * Then visit: http://localhost:8787/backfill
 */

import { upsertSiteEmbedding } from '../src/embeddings.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname !== '/backfill') {
      return new Response('Visit /backfill to start the backfill process', { status: 404 });
    }

    try {
      console.log('[Backfill] Starting embedding backfill for approved sites...');
      
      // Get all approved sites
      const { results: sites } = await env.DB.prepare(`
        SELECT id, name, url, short_description as tagline, description, category as category_id, tags, thumbnail_url as image_url
        FROM sites 
        WHERE status = 'approved'
        ORDER BY id
      `).all();
      
      console.log(`[Backfill] Found ${sites.length} approved sites`);
      
      const results = {
        total: sites.length,
        success: 0,
        failed: 0,
        errors: []
      };
      
      // Process sites one by one
      for (const site of sites) {
        try {
          console.log(`[Backfill] Processing site ${site.id}: ${site.name}`);
          
          const success = await upsertSiteEmbedding(site, env);
          
          if (success) {
            results.success++;
            console.log(`[Backfill] ✓ Success for site ${site.id}`);
          } else {
            results.failed++;
            results.errors.push({ id: site.id, name: site.name, error: 'upsertSiteEmbedding returned false' });
            console.log(`[Backfill] ✗ Failed for site ${site.id}`);
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.errors.push({ id: site.id, name: site.name, error: error.message });
          console.error(`[Backfill] Error processing site ${site.id}:`, error);
        }
      }
      
      console.log('[Backfill] Completed!');
      console.log(`[Backfill] Success: ${results.success}, Failed: ${results.failed}`);
      
      return new Response(JSON.stringify({
        message: 'Backfill completed',
        ...results
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('[Backfill] Fatal error:', error);
      return new Response(JSON.stringify({
        error: 'Backfill failed',
        message: error.message,
        stack: error.stack
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
