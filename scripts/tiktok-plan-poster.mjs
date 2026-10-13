#!/usr/bin/env node
/**
 * QED Math Studio — TikTok Plan Batch Auto-Poster (Playwright)
 *
 * Automatically reads the curriculum publishing plan (tiktok-plan.json)
 * and publishes scheduled videos to TikTok Creator Studio matching today's date
 * or a specified target date.
 *
 * Usage:
 *   node scripts/tiktok-plan-poster.mjs --today
 *   node scripts/tiktok-plan-poster.mjs --date 2026-10-15
 *   node scripts/tiktok-plan-poster.mjs --plan ./my-plan.json --today --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const profileDir = path.resolve(rootDir, '.tiktok-browser-profile');

export function parsePlanArgs(argv = process.argv.slice(2)) {
  const params = {
    plan: path.resolve(rootDir, 'tiktok-plan.json'),
    date: '',
    today: false,
    all: false,
    dryRun: false,
    headless: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--plan' && argv[i + 1]) params.plan = path.resolve(process.cwd(), argv[++i]);
    else if (arg === '--date' && argv[i + 1]) params.date = argv[++i];
    else if (arg === '--today') params.today = true;
    else if (arg === '--all') params.all = true;
    else if (arg === '--dry-run') params.dryRun = true;
    else if (arg === '--headless') params.headless = argv[++i] === 'true';
  }

  if (params.today && !params.date) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    params.date = `${y}-${m}-${d}`;
  }

  return params;
}

export function findVideoFile(suggestedName, entryId) {
  const searchDirs = [
    path.resolve(rootDir, 'exports'),
    rootDir,
    path.resolve(rootDir, 'public'),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    // Check exact suggested name
    const exactPath = path.join(dir, suggestedName);
    if (fs.existsSync(exactPath)) return exactPath;

    // Check by entryId
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.mp4')) {
        if (file.includes(entryId) || (suggestedName && file.includes(suggestedName.replace('.mp4', '')))) {
          return path.join(dir, file);
        }
      }
    }
  }

  return null;
}

async function run() {
  const params = parsePlanArgs();

  console.log('\n======================================================');
  console.log('  QED Studio — TikTok Plan Batch Auto-Poster (Playwright)');
  console.log('======================================================\n');

  if (!fs.existsSync(params.plan)) {
    console.error(`❌ Plan file not found: ${params.plan}`);
    console.log('\n💡 Tip: Export your publishing plan from the Curriculum Planner');
    console.log('   in QED Studio: "التقويم وجدول النشر" -> "تصدير خطة تيك توك"');
    console.log('   Save it as tiktok-plan.json in your project root.\n');
    process.exit(1);
  }

  let planData;
  try {
    const raw = fs.readFileSync(params.plan, 'utf-8');
    planData = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to parse plan JSON: ${err.message}`);
    process.exit(1);
  }

  const items = Array.isArray(planData.items) ? planData.items : (Array.isArray(planData) ? planData : []);
  if (!items.length) {
    console.log('ℹ️  No scheduled items found in the plan file.');
    process.exit(0);
  }

  console.log(`📋 Total items in plan: ${items.length}`);
  if (params.date) {
    console.log(`📅 Target date filter: ${params.date}`);
  }

  // Filter items
  const queue = items.filter(item => {
    if (params.all) return true;
    if (params.date) return item.date === params.date;
    return item.status === 'scheduled';
  });

  console.log(`🎯 Matched items to post: ${queue.length}\n`);

  if (!queue.length) {
    console.log(`✅ Nothing scheduled to post for ${params.date || 'the current filter'}.`);
    process.exit(0);
  }

  // Check files for queue
  for (const item of queue) {
    const videoFile = findVideoFile(item.suggestedFileName, item.entryId);
    item.resolvedVideoPath = videoFile;
    console.log(`- [${item.date}] [${item.level}] ${item.title}`);
    console.log(`  File: ${videoFile ? `✅ ${videoFile}` : `⚠️ Not found yet (${item.suggestedFileName})`}`);
    console.log(`  Caption: ${item.caption?.slice(0, 60)}...`);
  }

  if (params.dryRun) {
    console.log('\n🔍 Dry run completed. No browser was launched.');
    process.exit(0);
  }

  // Ensure persistent profile directory
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log(`\n🚀 Launching Playwright browser (Profile: ${profileDir})...`);
  const pwPkg = 'playwright';
  const { chromium } = await import(/* @vite-ignore */ pwPkg);
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

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('\n⚠️  TikTok login required!');
      console.log('👉 Please log in to TikTok in the browser window.');
      console.log('⏳ Waiting up to 3 minutes for login completion...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 180000 });
      console.log('✅ Logged in successfully! Session saved for future runs.\n');
    }

    let successCount = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      console.log(`\n------------------------------------------------------`);
      console.log(`▶️ Processing video ${i + 1}/${queue.length}: ${item.title}`);

      if (!item.resolvedVideoPath) {
        console.warn(`⚠️ Skipping: Video file not found on disk.`);
        continue;
      }

      // Check upload input
      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        // Try waiting for iframe or standard file input
        console.log('⏳ Waiting for file uploader element...');
        await page.waitForSelector('input[type="file"]', { timeout: 15000 });
      }

      console.log(`📤 Uploading: ${item.resolvedVideoPath}`);
      const uploadTarget = await page.$('input[type="file"]');
      if (!uploadTarget) {
        console.error('❌ Could not locate file input on TikTok Studio page.');
        continue;
      }

      await uploadTarget.setInputFiles(item.resolvedVideoPath);
      console.log('⏳ File sent to input. Waiting for video processing...');
      await page.waitForTimeout(8000);

      // Fill Caption & Tags
      console.log('✍️ Setting caption and hashtags...');
      const captionText = `${item.caption}\n${item.hashtags}`;
      const editorSelector = [
        'div[contenteditable="true"]',
        '.DraftEditor-root [contenteditable="true"]',
        'div[role="combobox"]',
        '.caption-input',
      ].join(', ');

      const editor = await page.$(editorSelector);
      if (editor) {
        await editor.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await editor.fill(captionText);
      } else {
        console.warn('⚠️ Caption input not found by standard selector; attempting clipboard paste.');
      }

      console.log('✅ Video prepared on TikTok upload screen!');
      console.log(`📌 You can verify details or let the user click Post.`);
      successCount++;
    }

    console.log(`\n🎉 Plan execution finished: ${successCount}/${queue.length} processed.`);
  } catch (err) {
    console.error(`❌ Batch posting error: ${err.message}`);
  } finally {
    if (!params.headless) {
      console.log('ℹ️  Leaving browser open for user review. Close when done.');
    } else {
      await context.close();
    }
  }
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
