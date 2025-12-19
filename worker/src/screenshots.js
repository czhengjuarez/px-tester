// Screenshot capture utilities using @cloudflare/puppeteer
import puppeteer from '@cloudflare/puppeteer';

export async function captureScreenshot(env, url, siteId) {
  let browser;
  try {
    console.log('Launching browser with @cloudflare/puppeteer...');
    browser = await puppeteer.launch(env.BROWSER);
    console.log('Browser launched, creating new page...');
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    console.log('Setting viewport...');
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate with network idle wait
    console.log('Navigating to URL:', url);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    console.log('Page loaded successfully');

    // Take full screenshot
    console.log('Taking full screenshot...');
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      fullPage: false
    });
    console.log('Full screenshot captured');

    // Take thumbnail screenshot BEFORE closing browser
    console.log('Taking thumbnail screenshot...');
    const thumbnail = await page.screenshot({
      type: 'jpeg',
      quality: 70,
      clip: { x: 0, y: 0, width: 640, height: 400 }
    });
    console.log('Thumbnail captured');

    await browser.close();
    console.log('Browser closed');

    // Upload full screenshot to R2
    const filename = `${siteId}.jpg`;
    await env.SCREENSHOTS.put(filename, screenshot, {
      httpMetadata: {
        contentType: 'image/jpeg'
      }
    });

    // Upload thumbnail to R2
    const thumbnailFilename = `${siteId}-thumb.jpg`;
    await env.SCREENSHOTS.put(thumbnailFilename, thumbnail, {
      httpMetadata: {
        contentType: 'image/jpeg'
      }
    });

    return {
      screenshot_url: `/screenshots/${filename}`,
      thumbnail_url: `/screenshots/${thumbnailFilename}`
    };
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return {
      screenshot_url: null,
      thumbnail_url: null
    };
  }
}

export async function getScreenshot(env, filename) {
  try {
    const object = await env.SCREENSHOTS.get(filename);
    if (!object) return null;

    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || 'image/jpeg'
    };
  } catch (error) {
    console.error('Error getting screenshot:', error);
    return null;
  }
}
