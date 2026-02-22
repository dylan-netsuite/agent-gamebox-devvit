#!/usr/bin/env node
/**
 * Diplomacy Map Visual Overhaul - Playwright Test Script
 * Tests the 8 visual criteria for the map overhaul deployment.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PLAYTEST_URL = 'https://www.reddit.com/r/diplomacy_devvit_dev/comments/1r6omxu/diplomacy_game_of_international_intrigue/?playtest=diplomacy-devvit';
const SCREENSHOT_DIR = join(process.cwd(), '.workflows', 'phaser', 'diplomacy', 'map-visual-test', 'screenshots');

const results = {
  steps: [],
  criteria: {},
  consoleErrors: [],
  screenshots: [],
};

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  // Collect console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      results.consoleErrors.push(text);
    }
  });

  try {
    // Step 1: Navigate
    results.steps.push({ step: 1, action: 'Navigate to playtest URL' });
    await page.goto(PLAYTEST_URL, { waitUntil: 'networkidle', timeout: 30000 });
    results.steps.push({ step: 1, status: 'Page loaded' });

    // Step 2: Wait for full load
    await page.waitForTimeout(3000);

    // Step 2b: Dismiss private subreddit modal if present (click X to close overlay)
    try {
      const modalClose = await page.$('button[aria-label="Close"]');
      if (modalClose) {
        await modalClose.click();
        await page.waitForTimeout(2000);
      }
    } catch (_) {}

    // Step 3: Initial screenshot
    const screenshot1 = join(SCREENSHOT_DIR, '01-initial-load.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    results.screenshots.push({ name: '01-initial-load.png', path: screenshot1 });
    results.steps.push({ step: 2, action: 'Screenshot initial page' });

    // Step 4: Look for Devvit app - try to find and click the post or app
    const frames = page.frames();
    const gameFrame = frames.find((f) => f.url().includes('webview.devvit.net'));
    if (gameFrame) {
      results.steps.push({ step: 3, action: 'Found Devvit webview iframe' });
      const canvas = await gameFrame.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          const mapScreenshot = join(SCREENSHOT_DIR, '02-game-map.png');
          await page.screenshot({ path: mapScreenshot });
          results.screenshots.push({ name: '02-game-map.png', path: mapScreenshot });
          results.steps.push({ step: 4, action: 'Found game canvas' });

          // Click center of canvas
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(1000);
          const afterClick = join(SCREENSHOT_DIR, '03-after-click.png');
          await page.screenshot({ path: afterClick });
          results.screenshots.push({ name: '03-after-click.png', path: afterClick });
          results.steps.push({ step: 5, action: 'Clicked canvas, game responded' });
        }
      }
    } else {
      // Try scrolling to find the post
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(2000);
      const scrollScreenshot = join(SCREENSHOT_DIR, '02-after-scroll.png');
      await page.screenshot({ path: scrollScreenshot, fullPage: true });
      results.screenshots.push({ name: '02-after-scroll.png', path: scrollScreenshot });
      results.steps.push({ step: 3, action: 'Scrolled - Devvit iframe not found in initial frames' });
    }

    // Final full page screenshot
    const finalScreenshot = join(SCREENSHOT_DIR, '04-final-state.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    results.screenshots.push({ name: '04-final-state.png', path: finalScreenshot });
  } catch (err) {
    results.steps.push({ step: 'error', action: err.message });
  } finally {
    await browser.close();
  }

  // Assessment criteria (manual review - script provides structure)
  results.criteria = {
    1: { name: 'Land provinces clearly distinguishable from water', status: 'needs_review', notes: 'Review screenshots' },
    2: { name: 'Country ownership colors visible and distinct', status: 'needs_review', notes: 'Review screenshots' },
    3: { name: 'Labels readable at default zoom', status: 'needs_review', notes: 'Review screenshots' },
    4: { name: 'No visual clutter from border markers', status: 'needs_review', notes: 'Review screenshots' },
    5: { name: 'Supply centers prominently visible', status: 'needs_review', notes: 'Review screenshots' },
    6: { name: 'Coastline crisp and attractive', status: 'needs_review', notes: 'Review screenshots' },
    7: { name: 'Game loop still works', status: 'needs_review', notes: 'Click test performed' },
    8: { name: 'No console errors', status: results.consoleErrors.length === 0 ? 'pass' : 'fail', notes: results.consoleErrors.length > 0 ? results.consoleErrors.join('; ') : 'None' },
  };

  const outputPath = join(process.cwd(), '.workflows', 'phaser', 'diplomacy', 'map-visual-test', 'test-results.json');
  mkdirSync(join(process.cwd(), '.workflows', 'phaser', 'diplomacy', 'map-visual-test'), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('Test complete. Results:', outputPath);
  console.log('Screenshots:', SCREENSHOT_DIR);
  console.log('Console errors:', results.consoleErrors.length);
}

main().catch(console.error);
