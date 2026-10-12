import { z } from 'zod';

export const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'];
export interface TikTokCreator {
  creator_avatar_url: string; creator_username: string; creator_nickname: string;
  privacy_level_options: string[]; comment_disabled: boolean; duet_disabled: boolean;
  stitch_disabled: boolean; max_video_post_duration_sec: number;
}
export const postSchema = z.object({
  projectName: z.string().min(1).max(300), title: z.string().max(2200),
  privacy: z.string().min(1), duration: z.number().positive(),
  size: z.number().int().positive().max(4 * 1024 ** 3),
  allowComment: z.boolean(), allowDuet: z.boolean(), allowStitch: z.boolean(),
  ownBrand: z.boolean(), paidBrand: z.boolean(), consent: z.literal(true),
});
export function uploadPlan(size: number) {
  const CHUNK_UNIT = 5 * 1024 * 1024;
  // If video fits in a single chunk (up to 10 MB), TikTok requires chunk_size === video_size and total_chunk_count === 1
  if (size <= 10 * 1024 * 1024) {
    return { chunkSize: size, chunkCount: 1 };
  }
  // For larger videos, total_chunk_count MUST equal Math.floor(video_size / chunk_size) per TikTok Media Transfer Guide
  const chunkCount = Math.floor(size / CHUNK_UNIT);
  return { chunkSize: CHUNK_UNIT, chunkCount };
}
export function chunkEnd(start: number, size: number, chunkSize: number, chunkCount: number) {
  const chunkIndex = Math.floor(start / chunkSize);
  return chunkIndex >= chunkCount - 1 ? size : start + chunkSize;
}
export function validatePost(post: TikTokPost, creator: TikTokCreator) {
  if (!creator.privacy_level_options.includes(post.privacy)) throw new Error('Choose an available TikTok audience.');
  if (post.duration > creator.max_video_post_duration_sec) throw new Error(`This account allows videos up to ${creator.max_video_post_duration_sec} seconds.`);
  if (post.paidBrand && post.privacy === 'SELF_ONLY') throw new Error('Paid partnerships cannot be private.');
  if (post.allowComment && creator.comment_disabled || post.allowDuet && creator.duet_disabled || post.allowStitch && creator.stitch_disabled) throw new Error('Your TikTok interaction settings changed. Refresh the account settings.');
}