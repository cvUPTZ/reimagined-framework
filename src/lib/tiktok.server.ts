import { TIKTOK_SCOPES, type TikTokCreator } from './tiktok-rules';
import { callAsAppUser, appUserReconnectRequired } from '@/integrations/lovable/appUserConnector';
import { getConnectionKeyForUser } from '@/server/appUserConnections.server';
export const GATEWAY = 'https://connector-gateway.lovable.dev';
export async function tiktokRequest<T>(userId: string, path: string, body: unknown): Promise<T> {
  const key = await getConnectionKeyForUser(userId, 'tiktok');
  if (!key) throw new Error('Connect your TikTok account first.');
  const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: 'tiktok', path, requiredScopes: TIKTOK_SCOPES, init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } });
  if (await appUserReconnectRequired(res)) throw new Error('Reconnect TikTok to renew publishing access.');
  const result = await res.json() as { data?: T; error?: { code?: string; message?: string } };
  if (!res.ok || result.error?.code && result.error.code !== 'ok') {
    const code = result.error?.code;
    const msg = result.error?.message;
    console.error('TikTok API error response:', JSON.stringify(result.error ?? { status: res.status }));
    if (code === 'unaudited_client_can_only_post_to_private_accounts') throw new Error('TikTok review mode requires a private account and an Only me audience.');
    if (code === 'scope_not_authorized') throw new Error('TikTok has not granted publishing permission. Enable Content Posting and video.publish in your TikTok developer application, then reconnect.');
    if (code === 'spam_risk_too_many_posts') throw new Error('TikTok’s posting limit has been reached. Try again later.');
    const details = [code, msg].filter(Boolean).join(': ');
    throw new Error(`TikTok could not complete this request${details ? ` (${details})` : ''}.`);
  }
  if (!result.data) throw new Error('TikTok returned an incomplete response.');
  return result.data;
}
export const creatorInfo = (userId: string) => tiktokRequest<TikTokCreator>(userId, '/post/publish/creator_info/query/', {});