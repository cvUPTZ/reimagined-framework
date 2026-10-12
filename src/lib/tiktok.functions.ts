import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { postSchema, uploadPlan, chunkEnd, validatePost, TIKTOK_SCOPES } from './tiktok-rules';

export const startTikTokConnect = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const clientKey = process.env['TIKTOK_APP_USER_CONNECTOR_CLIENT_API_KEY'];
  if (!clientKey) throw new Error('TikTok client setup is missing.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: attempt, error } = await supabaseAdmin.from('tiktok_oauth_attempts').insert({ user_id: context.userId }).select('id').single();
  if (error || !attempt) throw new Error('Could not start a secure connection.');
  const request = getRequest();
  const url = new URL(request.url);
  const forwarded = url.hostname === 'localhost' ? request.headers.get('x-forwarded-host') : null;
  const returnUrl = new URL('/api/public/oauth/tiktok/return', forwarded ? `https://${forwarded}` : url.origin);
  returnUrl.searchParams.set('attempt', attempt.id);
  const { authorizeAppUserOAuth } = await import('@/integrations/lovable/appUserConnector');
  const { getConnectionKeyForUser } = await import('@/server/appUserConnections.server');
  const connectionAPIKey = await getConnectionKeyForUser(context.userId, 'tiktok');
  const result = await authorizeAppUserOAuth({ gatewayBaseUrl: 'https://connector-gateway.lovable.dev', connectorId: 'tiktok', appUserId: context.userId, clientAPIKey: clientKey, returnUrl: returnUrl.toString(), ...(connectionAPIKey ? { connectionAPIKey } : {}), credentialsConfiguration: { scopes: TIKTOK_SCOPES } });
  return { authorizationUrl: result.authorizationUrl, attempt: attempt.id };
});
export const completeTikTokConnect = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ code: z.string().min(1).max(4096), attempt: z.string().uuid() })).handler(async ({ context, data }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: attempt, error } = await supabaseAdmin.from('tiktok_oauth_attempts').delete().eq('id', data.attempt).eq('user_id', context.userId).gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()).select('id').maybeSingle();
  if (error || !attempt) throw new Error('Connection expired. Try connecting again.');
  const { exchangeAppUserOAuthCode } = await import('@/integrations/lovable/appUserConnector');
  const result = await exchangeAppUserOAuthCode('https://connector-gateway.lovable.dev', data.code);
  if (result.connectorId !== 'tiktok') throw new Error('Unexpected connection provider.');
  const { saveConnectionKeyForUser } = await import('@/server/appUserConnections.server');
  await saveConnectionKeyForUser(context.userId, 'tiktok', result.connectionAPIKey);
  return { ok: true };
});
export const getTikTokAccount = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { getConnectionKeyForUser } = await import('@/server/appUserConnections.server');
  if (!await getConnectionKeyForUser(context.userId, 'tiktok')) return { connected: false as const, reconnectRequired: false, creator: null };
  const { creatorInfo } = await import('./tiktok.server');
  try { return { connected: true as const, reconnectRequired: false, creator: await creatorInfo(context.userId) }; }
  catch (error) {
    if (error instanceof Error && error.message.startsWith('Reconnect TikTok')) return { connected: false as const, reconnectRequired: true, creator: null };
    throw error;
  }
});
export const disconnectTikTok = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { getConnectionKeyForUser, deleteConnectionKeyForUser } = await import('@/server/appUserConnections.server');
  const key = await getConnectionKeyForUser(context.userId, 'tiktok');
  if (key) { const { disconnectAppUser } = await import('@/integrations/lovable/appUserConnector'); await disconnectAppUser({ gatewayBaseUrl: 'https://connector-gateway.lovable.dev', connectorId: 'tiktok', connectionAPIKey: key }); }
  await deleteConnectionKeyForUser(context.userId, 'tiktok');
  return { ok: true };
});
export const beginTikTokPost = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(postSchema).handler(async ({ context, data }) => {
  const { creatorInfo, tiktokRequest } = await import('./tiktok.server');
  validatePost(data, await creatorInfo(context.userId));
  const plan = uploadPlan(data.size);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: job, error } = await supabaseAdmin.from('tiktok_publish_jobs').insert({ user_id: context.userId, project_name: data.projectName, video_size: data.size, chunk_size: plan.chunkSize, chunk_count: plan.chunkCount }).select('id').single();
  if (error || !job) throw new Error('Could not create a publishing record.');
  try {
    const isPrivate = data.privacy === 'SELF_ONLY';
    const post_info: Record<string, unknown> = {
      title: data.title,
      privacy_level: data.privacy,
      disable_comment: !data.allowComment,
      disable_duet: isPrivate ? true : !data.allowDuet,
      disable_stitch: isPrivate ? true : !data.allowStitch,
    };
    if (data.ownBrand) post_info.brand_organic_toggle = true;
    if (data.paidBrand) post_info.brand_content_toggle = true;

    const result = await tiktokRequest<{ publish_id: string; upload_url: string }>(context.userId, '/post/publish/video/init/', {
      post_info,
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: data.size,
        chunk_size: plan.chunkSize,
        total_chunk_count: plan.chunkCount,
      },
    });
    const uploadUrl = new URL(result.upload_url);
    if (uploadUrl.protocol !== 'https:' || !(uploadUrl.hostname === 'open-upload.tiktokapis.com' || uploadUrl.hostname.endsWith('.tiktokapis.com') || uploadUrl.hostname.endsWith('.tiktok.com') || uploadUrl.hostname.endsWith('.byteoversea.com'))) throw new Error('Unexpected TikTok upload destination.');
    const { encryptConnectionKey } = await import('@/server/connection-key-crypto');
    const { error: saveError } = await supabaseAdmin.from('tiktok_publish_jobs').update({ publish_id: result.publish_id, upload_url_ciphertext: encryptConnectionKey(result.upload_url), status: 'UPLOADING' }).eq('id', job.id).eq('user_id', context.userId);
    if (saveError) throw new Error('Could not save the upload session.');
    return { jobId: job.id, ...plan };
  } catch (error) { await supabaseAdmin.from('tiktok_publish_jobs').update({ status: 'FAILED' }).eq('id', job.id); throw error; }
});
export const uploadTikTokChunk = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: FormData) => {
  if (!(input instanceof FormData)) throw new Error('Invalid video upload.');
  const jobId = z.string().uuid().parse(input.get('jobId'));
  const start = z.coerce.number().int().nonnegative().parse(input.get('start'));
  const file = input.get('chunk');
  if (!(file instanceof Blob) || file.size <= 0 || file.size > 15 * 1024 ** 2) throw new Error('Invalid video chunk.');
  return { jobId, start, file };
}).handler(async ({ context, data }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: job, error } = await supabaseAdmin.from('tiktok_publish_jobs').update({ status: 'SENDING_CHUNK' }).eq('id', data.jobId).eq('user_id', context.userId).eq('uploaded_bytes', data.start).eq('status', 'UPLOADING').select('*').maybeSingle();
  if (error || !job || !job.upload_url_ciphertext) throw new Error('Upload is unavailable or already in progress.');
  try {
    const end = chunkEnd(data.start, job.video_size, job.chunk_size, job.chunk_count);
    if (data.file.size !== end - data.start) throw new Error('Video chunk size does not match.');
    const { decryptConnectionKey } = await import('@/server/connection-key-crypto');
    const res = await fetch(decryptConnectionKey(job.upload_url_ciphertext), { method: 'PUT', redirect: 'error', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(data.file.size), 'Content-Range': `bytes ${data.start}-${end - 1}/${job.video_size}` }, body: data.file, signal: AbortSignal.timeout(55000) });
    if (!res.ok) throw new Error('TikTok video transfer failed. Start a new upload.');
    const { error: updateError } = await supabaseAdmin.from('tiktok_publish_jobs').update({ uploaded_bytes: end, status: end === job.video_size ? 'PROCESSING' : 'UPLOADING', upload_url_ciphertext: end === job.video_size ? null : job.upload_url_ciphertext, updated_at: new Date().toISOString() }).eq('id', job.id).eq('user_id', context.userId);
    if (updateError) throw new Error('Could not save upload progress.');
    return { uploadedBytes: end };
  } catch (error) { await supabaseAdmin.from('tiktok_publish_jobs').update({ status: 'FAILED', upload_url_ciphertext: null }).eq('id', job.id); throw error; }
});
export const getTikTokPosts = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.from('tiktok_publish_jobs').select('id, project_name, status, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(10);
  if (error) throw new Error('Could not load your posts.');
  return data;
});
export const refreshTikTokPost = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ jobId: z.string().uuid() })).handler(async ({ context, data }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: job, error } = await supabaseAdmin.from('tiktok_publish_jobs').select('publish_id, status').eq('id', data.jobId).eq('user_id', context.userId).single();
  if (error || !job?.publish_id) throw new Error('Publishing record not found.');
  const { tiktokRequest } = await import('./tiktok.server');
  const result = await tiktokRequest<{ status: string; fail_reason?: string }>(context.userId, '/post/publish/status/fetch/', { publish_id: job.publish_id });
  const { error: saveError } = await supabaseAdmin.from('tiktok_publish_jobs').update({ status: result.status, fail_reason: result.fail_reason ?? null, updated_at: new Date().toISOString() }).eq('id', data.jobId).eq('user_id', context.userId);
  if (saveError) throw new Error('Could not save TikTok status.');
  return { status: result.status };
});