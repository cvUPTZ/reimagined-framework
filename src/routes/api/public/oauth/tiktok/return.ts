import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/public/oauth/tiktok/return')({
  server: { handlers: { GET: ({ request }) => {
    const url = new URL(request.url);
    const success = url.searchParams.get('success') === 'true';
    const result = { type: 'qed-tiktok-oauth', connectorId: url.searchParams.get('connector_id'), code: url.searchParams.get('code'), attempt: url.searchParams.get('attempt'), success, offline: url.searchParams.get('offline_access_allowed') !== 'false' };
    const json = JSON.stringify(result).replace(/</g, '\\u003c');
    return new Response(`<!doctype html><html><head><title>QED Studio — TikTok connection</title></head><body><p>${success ? 'TikTok consent completed. Returning to QED Studio…' : 'TikTok connection was not completed. Return to QED Studio and try again.'}</p><script>if(window.opener){window.opener.postMessage(${json},window.location.origin);window.close();}</script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" } });
  } } },
});