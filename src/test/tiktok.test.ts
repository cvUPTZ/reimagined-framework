import { describe, expect, it } from 'vitest';
import {
  postSchema,
  uploadPlan,
  chunkEnd,
  validatePost,
  TIKTOK_SCOPES,
  type TikTokCreator,
} from '@/lib/tiktok-rules';

describe('TikTok Integration Rules & Publishing Plan', () => {
  const dummyCreator: TikTokCreator = {
    creator_avatar_url: 'https://example.com/avatar.jpg',
    creator_username: 'math_creator',
    creator_nickname: 'Math Master',
    privacy_level_options: ['SELF_ONLY', 'PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS'],
    comment_disabled: false,
    duet_disabled: false,
    stitch_disabled: true,
    max_video_post_duration_sec: 600,
  };

  it('declares the required TikTok posting scopes', () => {
    expect(TIKTOK_SCOPES).toContain('user.info.basic');
    expect(TIKTOK_SCOPES).toContain('video.publish');
  });

  it('calculates chunked upload plans correctly per TikTok Media Transfer Guide', () => {
    // 3 MB video (single chunk upload where chunkSize === size, chunkCount === 1)
    const single3 = uploadPlan(3 * 1024 * 1024);
    expect(single3.chunkSize).toBe(3 * 1024 * 1024);
    expect(single3.chunkCount).toBe(1);
    expect(chunkEnd(0, 3 * 1024 * 1024, single3.chunkSize, single3.chunkCount)).toBe(3 * 1024 * 1024);

    // 7 MB video (fits under 10 MB single chunk upload)
    const single7 = uploadPlan(7 * 1024 * 1024);
    expect(single7.chunkSize).toBe(7 * 1024 * 1024);
    expect(single7.chunkCount).toBe(1);
    expect(chunkEnd(0, 7 * 1024 * 1024, single7.chunkSize, single7.chunkCount)).toBe(7 * 1024 * 1024);

    // 25 MB video (multi-chunk: floor(25 / 10) = 2 chunks; trailing 5MB merged into final chunk per TikTok specification)
    const plan25 = uploadPlan(25 * 1024 * 1024);
    expect(plan25.chunkSize).toBe(10 * 1024 * 1024);
    expect(plan25.chunkCount).toBe(2);

    const end0 = chunkEnd(0, 25 * 1024 * 1024, plan25.chunkSize, plan25.chunkCount);
    expect(end0).toBe(10 * 1024 * 1024);

    const end1 = chunkEnd(10 * 1024 * 1024, 25 * 1024 * 1024, plan25.chunkSize, plan25.chunkCount);
    expect(end1).toBe(25 * 1024 * 1024);
  });

  it('validates compliant post payloads', () => {
    const post = {
      projectName: 'Quadratic Equation Intuition',
      title: 'Visualizing the roots of quadratic functions #math #qed',
      privacy: 'SELF_ONLY',
      duration: 45,
      size: 15 * 1024 * 1024,
      allowComment: true,
      allowDuet: false,
      allowStitch: false,
      ownBrand: false,
      paidBrand: false,
      consent: true as const,
    };

    expect(() => postSchema.parse(post)).not.toThrow();
    expect(() => validatePost(post, dummyCreator)).not.toThrow();
  });

  it('rejects posts that violate creator limits or platform policies', () => {
    const basePost = {
      projectName: 'Test Video',
      title: 'Title',
      privacy: 'SELF_ONLY',
      duration: 700, // exceeds 600s
      size: 10 * 1024 * 1024,
      allowComment: true,
      allowDuet: false,
      allowStitch: false,
      ownBrand: false,
      paidBrand: false,
      consent: true as const,
    };

    // Duration limit check
    expect(() => validatePost(basePost, dummyCreator)).toThrow(/allows videos up to/);

    // Paid partnership privacy check
    const paidPrivate = {
      ...basePost,
      duration: 30,
      paidBrand: true,
      privacy: 'SELF_ONLY',
    };
    expect(() => validatePost(paidPrivate, dummyCreator)).toThrow(/Paid partnerships cannot be private/);

    // Interaction disabled check (stitch is disabled on dummyCreator)
    const stitchAttempt = {
      ...basePost,
      duration: 30,
      allowStitch: true,
    };
    expect(() => validatePost(stitchAttempt, dummyCreator)).toThrow(/TikTok interaction settings changed/);
  });

  it('enforces mandatory creator consent in schema', () => {
    const withoutConsent = {
      projectName: 'Test Video',
      title: 'Title',
      privacy: 'SELF_ONLY',
      duration: 30,
      size: 10 * 1024 * 1024,
      allowComment: true,
      allowDuet: false,
      allowStitch: false,
      ownBrand: false,
      paidBrand: false,
      consent: false,
    };

    expect(() => postSchema.parse(withoutConsent)).toThrow();
  });

  describe('Alternative Direct Auto-Posting (Violentmonkey & Playwright)', () => {
    it('provides a valid Violentmonkey userscript in public and scripts directories', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const publicPath = path.resolve(process.cwd(), 'public/userscripts/tiktok-qed-autopost.user.js');
      const scriptsPath = path.resolve(process.cwd(), 'scripts/violentmonkey/tiktok-qed-autopost.user.js');

      expect(fs.existsSync(publicPath)).toBe(true);
      expect(fs.existsSync(scriptsPath)).toBe(true);

      const content = fs.readFileSync(publicPath, 'utf-8');
      expect(content).toContain('// ==UserScript==');
      expect(content).toContain('@match        https://www.tiktok.com/creator-center/upload*');
      expect(content).toContain('@name         QED Math Studio — TikTok Creator Auto-Poster');
      expect(content).toContain('qed-tiktok-hud');
    });

    it('provides Playwright automated publishing CLI script and package scripts', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const scriptPath = path.resolve(process.cwd(), 'scripts/tiktok-playwright-poster.mjs');
      expect(fs.existsSync(scriptPath)).toBe(true);

      const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
      expect(scriptContent).toContain('--video');
      expect(scriptContent).toContain('--caption');
      expect(scriptContent).toContain('.tiktok-browser-profile');
      expect(scriptContent).toContain('chromium.launchPersistentContext');

      const pkgJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
      expect(pkgJson.scripts['tiktok:post']).toBe('node scripts/tiktok-playwright-poster.mjs');
      expect(pkgJson.scripts['tiktok:plan']).toBe('node scripts/tiktok-plan-poster.mjs');
      expect(pkgJson.scripts['tiktok:install-browsers']).toBe('playwright install chromium');
    });

    it('provides Playwright plan batch scheduler script with argument parsing and file resolution', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const planPosterPath = path.resolve(process.cwd(), 'scripts/tiktok-plan-poster.mjs');
      expect(fs.existsSync(planPosterPath)).toBe(true);

      const content = fs.readFileSync(planPosterPath, 'utf-8');
      expect(content).toContain('--today');
      expect(content).toContain('--plan');
      expect(content).toContain('--date');
      expect(content).toContain('findVideoFile');
      expect(content).toContain('chromium.launchPersistentContext');

      const cp = await import('node:child_process');
      const testPlanPath = path.resolve(process.cwd(), 'scripts/test-plan-fixture.json');
      fs.writeFileSync(
        testPlanPath,
        JSON.stringify({
          version: 1,
          items: [
            {
              id: 'test-item-1',
              entryId: 'custom-1',
              date: '2026-10-15',
              level: '4AM',
              title: 'مفهوم القاسم المشترك الأكبر',
              caption: 'درس تفاعلي',
              hashtags: '#math #qed',
              status: 'scheduled',
              suggestedFileName: 'QED_4AM_sample.mp4',
            },
          ],
        })
      );

      try {
        const out = cp.execSync(
          `node scripts/tiktok-plan-poster.mjs --plan "${testPlanPath}" --date 2026-10-15 --dry-run`,
          { encoding: 'utf-8' }
        );
        expect(out).toContain('TikTok Plan Batch Auto-Poster');
        expect(out).toContain('Target date filter: 2026-10-15');
        expect(out).toContain('Matched items to post: 1');
        expect(out).toContain('Dry run completed. No browser was launched.');
      } finally {
        if (fs.existsSync(testPlanPath)) fs.unlinkSync(testPlanPath);
      }
    });
  });
});
