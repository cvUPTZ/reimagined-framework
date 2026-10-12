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

  it('calculates chunked upload plans correctly', () => {
    // 3 MB video (single chunk upload where chunkSize === size)
    const single = uploadPlan(3 * 1024 * 1024);
    expect(single.chunkSize).toBe(3 * 1024 * 1024);
    expect(single.chunkCount).toBe(1);
    expect(chunkEnd(0, 3 * 1024 * 1024, single.chunkSize, single.chunkCount)).toBe(3 * 1024 * 1024);

    // 12 MB video (multi-chunk: 5MB + 5MB + 2MB)
    const plan = uploadPlan(12 * 1024 * 1024);
    expect(plan.chunkSize).toBe(5 * 1024 * 1024);
    expect(plan.chunkCount).toBe(3);

    // Chunk end calculations
    const end0 = chunkEnd(0, 12 * 1024 * 1024, plan.chunkSize, plan.chunkCount);
    expect(end0).toBe(5 * 1024 * 1024);

    const end1 = chunkEnd(5 * 1024 * 1024, 12 * 1024 * 1024, plan.chunkSize, plan.chunkCount);
    expect(end1).toBe(10 * 1024 * 1024);

    const end2 = chunkEnd(10 * 1024 * 1024, 12 * 1024 * 1024, plan.chunkSize, plan.chunkCount);
    expect(end2).toBe(12 * 1024 * 1024);
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
});
