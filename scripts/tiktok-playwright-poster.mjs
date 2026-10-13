#!/usr/bin/env node
/**
 * QED Math Studio — TikTok Playwright Auto-Poster
 *
 * Automated video publishing to TikTok Creator Studio using Playwright
 * with persistent login sessions and stealth configuration.
 *
 * Usage:
 *   node scripts/tiktok-playwright-poster.mjs --video "./exports/lesson.mp4" --caption "مربع مجموع (a+b)²" --tags "#math #bac2026 #qed"
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const profileDir = path.resolve(rootDir, '.tiktok-browser-profile');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    video: '',
    caption: 'QED Math Lesson ∎',
    tags: '#math #bac2026 #qed',
    headless: false,
    privacy: 'public', // public, friends, private
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--video' && args[i + 1]) params.video = args[++i];
    else if (arg === '--caption' && args[i + 1]) params.caption = args[++i];
    else if (arg === '--tags' && args[i + 1]) params.tags = args[++i];
    else if (arg === '--headless') params.headless = args[++i] === 'true';
    else if (arg === '--privacy' && args[i + 1]) params.privacy = args[++i];
  }
  return params;
}

async function run() {
  const params = parseArgs();

  console.log('\n========================================');
  console.log('  QED TikTok Playwright Auto-Poster     ');
  console.log('========================================\n');

  if (!params.video) {
    console.error('❌ Error: Missing --video argument.');
    console.log('Usage: node scripts/tiktok-playwright-poster.mjs --video <path_to_mp4> --caption "<text>"');
    process.exit(1);
  }

  const videoPath = path.resolve(process.cwd(), params.video);
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Error: Video file not found at: ${videoPath}`);
    process.exit(1);
  }

  console.log(`📁 Video file: ${videoPath} (${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`📝 Caption: ${params.caption}`);
  console.log(`🏷️  Tags: ${params.tags}`);
  console.log(`👤 Profile storage: ${profileDir}\n`);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  // Launch persistent context with stealth flags
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: params.headless,
    viewport: { width: 1280, height: 860 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    console.log('🌐 Opening TikTok Creator Studio upload page...');
    await page.goto('https://www.tiktok.com/creator-center/upload', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    // Check if login is required
    const url = page.url();
    if (url.includes('/login') || (await page.$('button:has-text("Log in")')) || (await page.$('a[href*="/login"]'))) {
      console.log('\n⚠️  LOGIN REQUIRED:');
      console.log('Please log into your TikTok account in the browser window.');
      console.log('Your session will be saved in .tiktok-browser-profile for future headless runs.\n');
      console.log('Waiting for login to complete...');

      // Wait until navigated back to upload or creator center
      await page.waitForURL(/creator-center\/upload|tiktokstudio\/upload|upload/, {
        timeout: 180000,
      });
      console.log('✅ Logged in successfully!');
      await page.waitForTimeout(4000);
    }

    console.log('📤 Locating video upload input...');

    // Wait for the file input
    const fileInput = await page.waitForSelector('input[type="file"]', {
      timeout: 30000,
    });

    console.log('🚀 Uploading video file to TikTok...');
    await fileInput.setInputFiles(videoPath);

    console.log('⏳ Video upload initiated. Waiting for processing...');

    // Locate caption editor
    const captionSelector =
      'div[contenteditable="true"], .DraftEditor-editorContainer div[contenteditable="true"], div[role="combobox"]';
    const editor = await page.waitForSelector(captionSelector, {
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    const fullCaption = `${params.caption}\n\n${params.tags}`;
    console.log('✍️  Filling caption and hashtags...');

    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // Type with human-like pace
    await page.keyboard.type(fullCaption, { delay: 35 });
    console.log('✅ Caption applied.');

    // Wait for upload progress to finish
    console.log('⏳ Waiting for video upload to finish (100%)...');
    let uploaded = false;
    for (let attempts = 0; attempts < 90; attempts++) {
      const pageText = await page.textContent('body');
      const isUploading =
        pageText?.includes('Uploading') ||
        pageText?.includes('Chargement') ||
        pageText?.includes('جاري الرفع') ||
        pageText?.includes('%');

      const postBtn = await page.$(
        'button:has-text("Post"), button:has-text("Publier"), button:has-text("نشر"), button[data-e2e="post_video_button"]'
      );

      const isDisabled = postBtn ? await postBtn.isDisabled() : true;

      if (!isUploading && !isDisabled) {
        uploaded = true;
        break;
      }
      await page.waitForTimeout(2000);
    }

    if (!uploaded) {
      console.log('⚠️ Upload verification timed out, attempting to proceed if post button is available.');
    } else {
      console.log('✅ Video upload completed 100%!');
    }

    await page.waitForTimeout(3000);

    // Click Post button
    const postButton = await page.$(
      'button:has-text("Post"), button:has-text("Publier"), button:has-text("نشر"), button[data-e2e="post_video_button"]'
    );

    if (postButton) {
      console.log('🚀 Clicking "Post" button...');
      await postButton.click();

      // Wait for success confirmation or modal
      await page.waitForTimeout(5000);
      console.log('🎉 Video successfully submitted for publishing on TikTok!');
    } else {
      console.error('❌ Could not locate the Post button.');
    }
  } catch (error) {
    console.error('❌ Error during auto-posting:', error);
  } finally {
    console.log('Closing browser context...');
    await context.close();
    console.log('Done.');
  }
}

run();
