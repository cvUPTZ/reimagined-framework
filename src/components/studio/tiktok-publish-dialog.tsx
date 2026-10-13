import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Share2,
  Video,
  LogOut,
  Shield,
  HelpCircle,
  Sparkles,
  Terminal,
  Copy,
  Check,
  Download,
  Code,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreator, CreatorAccount } from '@/components/creator-auth';
import {
  startTikTokConnect,
  completeTikTokConnect,
  getTikTokAccount,
  disconnectTikTok,
  beginTikTokPost,
  uploadTikTokChunk,
  getTikTokPosts,
  refreshTikTokPost,
} from '@/lib/tiktok.functions';
import type { TikTokCreator } from '@/lib/tiktok-rules';
import { totalDuration, type StudioProject } from '@/lib/studio';

interface TikTokPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: StudioProject;
  audioUrl?: string;
  muted?: boolean;
  volume?: number;
}

export function TikTokPublishDialog({
  open,
  onOpenChange,
  project,
  audioUrl = '',
  muted = false,
  volume = 65,
}: TikTokPublishDialogProps) {
  const { user, ready: authReady } = useCreator();

  // TikTok Account State
  const [accountLoading, setAccountLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const [creator, setCreator] = useState<TikTokCreator | null>(null);

  // Form State
  const [title, setTitle] = useState(project.name);
  const [privacy, setPrivacy] = useState('SELF_ONLY');
  const [allowComment, setAllowComment] = useState(true);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [ownBrand, setOwnBrand] = useState(false);
  const [paidBrand, setPaidBrand] = useState(false);
  const [consent, setConsent] = useState(false);

  // Publishing Execution State
  const [publishing, setPublishing] = useState(false);
  const [publishPhase, setPublishPhase] = useState<'idle' | 'rendering' | 'initiating' | 'uploading' | 'processing' | 'done'>('idle');
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStatus, setPublishStatus] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // History State
  const [posts, setPosts] = useState<Array<{ id: string; project_name: string; status: string; created_at: string }>>([]);
  const [refreshingPosts, setRefreshingPosts] = useState(false);

  // Userscript & CLI Automation State
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedPlaywright, setCopiedPlaywright] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const duration = totalDuration(project.scenes);
  const pollTimerRef = useRef<number | null>(null);

  const qedPayload = {
    qed: true,
    title: project.name,
    caption: `${project.topic ? `${project.topic}\n` : ''}${project.mistake ? `الفخ الشائع: ${project.mistake}\n` : ''}${project.remediation ? `الحل: ${project.remediation}` : ''}`.trim(),
    hashtags: '#math #bac2026 #qed #education #bac',
    duration: Math.round(duration),
  };

  const playwrightCliCmd = `npm run tiktok:post -- --video "./${project.name}.mp4" --caption "${project.name}" --tags "#math #bac2026 #qed"`;

  useEffect(() => {
    setTitle(project.name);
  }, [project.name]);

  useEffect(() => {
    if (open && user) {
      void loadAccount();
      void loadPosts();
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [open, user]);

  async function loadAccount() {
    setAccountLoading(true);
    setError('');
    try {
      const res = await getTikTokAccount();
      setConnected(res.connected);
      setReconnectRequired(res.reconnectRequired);
      setCreator(res.creator);
      if (res.creator?.privacy_level_options?.length) {
        // Default to SELF_ONLY if available for unreviewed developer mode, else first option
        const pref = res.creator.privacy_level_options.includes('SELF_ONLY')
          ? 'SELF_ONLY'
          : (res.creator.privacy_level_options[0] ?? 'SELF_ONLY');
        setPrivacy(pref);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch TikTok account.');
    } finally {
      setAccountLoading(false);
    }
  }

  async function loadPosts() {
    if (!user) return;
    setRefreshingPosts(true);
    try {
      const list = await getTikTokPosts();
      setPosts(list ?? []);
    } catch {
      // silent fail on history load
    } finally {
      setRefreshingPosts(false);
    }
  }

  async function connectTikTok() {
    setError('');
    setAccountLoading(true);
    try {
      const res = await startTikTokConnect();
      const popup = window.open(
        res.authorizationUrl,
        'tiktok_oauth',
        'width=620,height=720,menubar=no,toolbar=no,location=no,status=no',
      );

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'qed-tiktok-oauth') {
          window.removeEventListener('message', handleMessage);
          if (event.data.success && event.data.code && event.data.attempt) {
            try {
              await completeTikTokConnect({
                data: { code: event.data.code, attempt: event.data.attempt },
              });
              await loadAccount();
            } catch (authErr) {
              setError(authErr instanceof Error ? authErr.message : 'Failed to finalize connection.');
            }
          } else {
            setError('TikTok authorization was not completed or was cancelled.');
            setAccountLoading(false);
          }
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start TikTok connection.');
      setAccountLoading(false);
    }
  }

  async function disconnectAccount() {
    setAccountLoading(true);
    setError('');
    try {
      await disconnectTikTok();
      setConnected(false);
      setCreator(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect TikTok.');
    } finally {
      setAccountLoading(false);
    }
  }

  async function handlePublish() {
    if (!creator) {
      setError('Connect your TikTok account first.');
      return;
    }
    if (!consent) {
      setError('You must accept the TikTok publishing consent.');
      return;
    }
    if (duration > creator.max_video_post_duration_sec) {
      setError(`Video length (${duration.toFixed(1)}s) exceeds TikTok account limit of ${creator.max_video_post_duration_sec}s.`);
      return;
    }
    if (paidBrand && privacy === 'SELF_ONLY') {
      setError('Paid partnerships cannot be private (SELF_ONLY).');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishProgress(0);
    setPublishPhase('rendering');

    try {
      // Step 1: Render real MP4 video
      const { exportVideo } = await import('@/lib/video-export');
      const abort = new AbortController();
      const blob = await exportVideo({
        project,
        resolution: 1280,
        container: 'mp4',
        audioUrl: audioUrl || '',
        muted,
        volume,
        signal: abort.signal,
        onProgress: (p) => setPublishProgress(Math.round(p * 50)), // first 50%
      });

      // Step 2: Initiate post
      setPublishPhase('initiating');
      const plan = await beginTikTokPost({
        data: {
          projectName: project.name,
          title,
          privacy,
          duration,
          size: blob.size,
          allowComment: !creator.comment_disabled && allowComment,
          allowDuet: !creator.duet_disabled && allowDuet,
          allowStitch: !creator.stitch_disabled && allowStitch,
          ownBrand,
          paidBrand,
          consent: true,
        },
      });

      setActiveJobId(plan.jobId);

      // Step 3: Chunked upload
      setPublishPhase('uploading');
      for (let c = 0; c < plan.chunkCount; c++) {
        const offset = c * plan.chunkSize;
        const end = c === plan.chunkCount - 1 ? blob.size : offset + plan.chunkSize;
        const slice = blob.slice(offset, end, 'video/mp4');
        const fd = new FormData();
        fd.append('jobId', plan.jobId);
        fd.append('start', String(offset));
        fd.append('chunk', slice);

        await uploadTikTokChunk({ data: fd });
        const uploadedRatio = end / blob.size;
        setPublishProgress(50 + Math.round(uploadedRatio * 45)); // 50% to 95%
      }

      // Step 4: Verify real processing status from TikTok endpoint
      setPublishPhase('processing');
      setPublishProgress(98);
      const initialStatus = await refreshTikTokPost({ data: { jobId: plan.jobId } });
      setPublishStatus(initialStatus.status);

      // Poll real TikTok status
      let pollCount = 0;
      pollTimerRef.current = window.setInterval(async () => {
        pollCount++;
        try {
          const res = await refreshTikTokPost({ data: { jobId: plan.jobId } });
          setPublishStatus(res.status);
          if (res.status === 'PUBLISH_COMPLETE' || res.status === 'SUCCESS' || res.status === 'FAILED' || pollCount > 10) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setPublishPhase('done');
            setPublishProgress(100);
            void loadPosts();
          }
        } catch {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TikTok publishing failed.');
      setPublishPhase('idle');
    } finally {
      setPublishing(false);
    }
  }

  async function checkJobStatus(jobId: string) {
    try {
      const res = await refreshTikTokPost({ data: { jobId } });
      setPosts(prev => prev.map(p => p.id === jobId ? { ...p, status: res.status } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh post status.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Share2 className="text-primary" size={20} />
          TikTok Creator Publishing
        </DialogTitle>
        <DialogDescription>
          Publish math stories directly to TikTok with authentic creator consent and verified status.
        </DialogDescription>

        <Tabs defaultValue="violentmonkey" className="w-full mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="violentmonkey" className="text-xs gap-1.5 font-medium">
              <Sparkles size={13} className="text-amber-500" />
              Violentmonkey
            </TabsTrigger>
            <TabsTrigger value="playwright" className="text-xs gap-1.5 font-medium">
              <Terminal size={13} className="text-blue-500" />
              Playwright CLI
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1.5 font-medium">
              <Share2 size={13} className="text-primary" />
              API Officielle
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VIOLENTMONKEY USER SCRIPT */}
          <TabsContent value="violentmonkey" className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs leading-relaxed text-amber-200">
              <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
                <Sparkles size={14} />
                Publication Directe dans votre Navigateur (Zéro attente)
              </div>
              Pendant que l'équipe TikTok examine notre demande d'API, publiez automatiquement depuis votre compte habituel sans blocage, captcha ou restriction.
            </div>

            <div className="space-y-3">
              <div className="p-3 border border-border rounded-lg bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold">1</span>
                    Installer le Userscript QED
                  </span>
                  <a
                    href="/userscripts/tiktok-qed-autopost.user.js"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Download size={12} />
                    Installer (.user.js)
                  </a>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Nécessite l'extension <b>Violentmonkey</b> ou <b>Tampermonkey</b> sur Chrome, Brave, Edge ou Firefox. Le script affiche un assistant HUD sur la page d'upload de TikTok.
                </p>
              </div>

              <div className="p-3 border border-border rounded-lg bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold">2</span>
                    Copier le Payload de la Vidéo
                  </span>
                  <Button
                    size="sm"
                    variant={copiedPayload ? "secondary" : "outline"}
                    className="h-7 text-xs gap-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(JSON.stringify(qedPayload, null, 2));
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                  >
                    {copiedPayload ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                    {copiedPayload ? 'Payload copié !' : 'Copier le Payload'}
                  </Button>
                </div>
                <div className="bg-background/90 p-2 rounded text-[11px] font-mono border border-border/80 text-muted-foreground overflow-x-auto">
                  <div><b>Titre:</b> {qedPayload.title}</div>
                  <div><b>Hashtags:</b> {qedPayload.hashtags}</div>
                </div>
              </div>

              <div className="p-3 border border-border rounded-lg bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold">3</span>
                    Ouvrir TikTok Creator Studio & Publier
                  </span>
                  <a
                    href="https://www.tiktok.com/creator-center/upload"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90"
                  >
                    <ExternalLink size={13} />
                    Ouvrir TikTok Studio
                  </a>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Glissez votre fichier MP4 téléchargé dans TikTok. Dans le HUD flottant QED en bas à droite, cliquez sur <b>« Charger depuis le Presse-papiers »</b> : le titre, les tags et la publication s'exécutent automatiquement !
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: PLAYWRIGHT CLI */}
          <TabsContent value="playwright" className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs leading-relaxed text-blue-200">
              <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1">
                <Terminal size={14} />
                Publication Automatisée via Playwright CLI
              </div>
              Lancez le script autonome pour téléverser votre vidéo MP4 exportée, remplir la description et cliquer sur Publier en arrière-plan.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Commande à exécuter dans votre terminal :</label>
                <div className="relative">
                  <pre className="p-3 bg-background border border-border rounded text-xs font-mono overflow-x-auto pr-16 text-foreground">
                    {playwrightCliCmd}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-xs gap-1"
                    onClick={async () => {
                      await navigator.clipboard.writeText(playwrightCliCmd);
                      setCopiedPlaywright(true);
                      setTimeout(() => setCopiedPlaywright(false), 2000);
                    }}
                  >
                    {copiedPlaywright ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                    {copiedPlaywright ? 'Copié' : 'Copier'}
                  </Button>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1 bg-secondary/30 p-2.5 rounded border border-border">
                <p>💡 <b>Astuce 1er lancement :</b> Lors de la 1ère exécution, Playwright ouvrira une fenêtre Chrome pour vous connecter une seule fois. Votre session est sauvegardée dans <code>.tiktok-browser-profile/</code> pour toutes les publications futures.</p>
                <p>⚙️ <b>Installation :</b> Assurez-vous d'avoir exécuté <code>npm run tiktok:install-browsers</code>.</p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: OFFICIAL API */}
          <TabsContent value="api" className="space-y-4">
            <div className="p-3 bg-secondary/60 border border-border rounded-lg text-xs leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                <HelpCircle size={14} className="text-primary" />
                API Développeur TikTok (En cours de validation)
              </div>
              L'intégration OAuth directe attend l'approbation de l'équipe TikTok pour le scope <code>video.publish</code>. Utilisez les onglets <b>Violentmonkey</b> ou <b>Playwright</b> pour publier immédiatement.
            </div>

            {!user ? (
          <div className="p-6 text-center border border-border rounded-lg bg-card/50 flex flex-col items-center gap-3">
            <Shield className="text-muted-foreground" size={32} />
            <div className="font-semibold text-base">Creator Account Required</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sign in with your creator account to link TikTok and manage verified video posts.
            </p>
            <CreatorAccount />
          </div>
        ) : accountLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="animate-spin" size={24} />
            <span>Checking TikTok connection…</span>
          </div>
        ) : !connected || reconnectRequired ? (
          <div className="p-6 border border-border rounded-lg bg-card/50 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold">
              TT
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {reconnectRequired ? 'Renew TikTok Access' : 'Connect Your TikTok Account'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Grant posting permissions (`user.info.basic`, `video.publish`) to upload videos directly from QED Studio.
              </p>
            </div>
            {reconnectRequired && (
              <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 text-left w-full flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>TikTok publishing authorization has expired. Please reconnect.</span>
              </div>
            )}
            <Button onClick={() => void connectTikTok()} disabled={accountLoading} className="gap-2">
              <ExternalLink size={16} />
              {reconnectRequired ? 'Reconnect TikTok' : 'Authorize with TikTok'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Creator Profile Header */}
            {creator && (
              <div className="p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {creator.creator_avatar_url ? (
                    <img
                      src={creator.creator_avatar_url}
                      alt={creator.creator_nickname}
                      className="w-10 h-10 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {creator.creator_nickname?.[0] ?? 'C'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {creator.creator_nickname}
                      <span className="text-xs text-muted-foreground font-normal">@{creator.creator_username}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>Max {creator.max_video_post_duration_sec}s</span>
                      <span>·</span>
                      <span>Video {duration.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void disconnectAccount()} title="Disconnect TikTok" className="text-muted-foreground hover:text-destructive">
                  <LogOut size={14} className="mr-1" />
                  Disconnect
                </Button>
              </div>
            )}

            {/* Publishing Settings Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Video Caption & Title</label>
                <textarea
                  className="w-full text-xs p-2.5 bg-background border border-border rounded focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  maxLength={2200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Describe your mathematical story…"
                />
                <span className="text-[10px] text-muted-foreground text-right block">{title.length} / 2200</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Audience / Privacy</label>
                  <select
                    className="w-full text-xs p-2 bg-background border border-border rounded"
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                  >
                    {(creator?.privacy_level_options ?? ['SELF_ONLY']).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'SELF_ONLY'
                          ? 'Only me (Private / Review)'
                          : opt === 'PUBLIC_TO_EVERYONE'
                          ? 'Public to everyone'
                          : opt === 'MUTUAL_FOLLOW_FRIENDS'
                          ? 'Friends'
                          : opt === 'FOLLOWER_OF_CREATOR'
                          ? 'Followers'
                          : opt}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    TikTok review mode requires "Only me"
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Interactions</label>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowComment && !creator?.comment_disabled}
                        disabled={creator?.comment_disabled}
                        onChange={(e) => setAllowComment(e.target.checked)}
                      />
                      <span className={creator?.comment_disabled ? 'opacity-50' : ''}>Allow comments</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDuet && !creator?.duet_disabled}
                        disabled={creator?.duet_disabled}
                        onChange={(e) => setAllowDuet(e.target.checked)}
                      />
                      <span className={creator?.duet_disabled ? 'opacity-50' : ''}>Allow duet</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Commercial disclosures */}
              <div className="p-2.5 bg-secondary/20 border border-border rounded text-xs space-y-1.5">
                <span className="font-semibold block text-[11px] text-muted-foreground uppercase tracking-wide">
                  Commercial Content Disclosures
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownBrand}
                    onChange={(e) => setOwnBrand(e.target.checked)}
                  />
                  <span>Promotes your own brand</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paidBrand}
                    onChange={(e) => setPaidBrand(e.target.checked)}
                  />
                  <span>Paid partnership (cannot be private)</span>
                </label>
              </div>

              {/* Consent checkbox */}
              <div className="p-3 border border-primary/30 bg-primary/5 rounded text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    <strong>Creator Consent:</strong> I confirm that I own or have all necessary rights to upload this video and audio to TikTok in compliance with TikTok's Terms of Service.
                  </span>
                </label>
              </div>

              {/* Progress & Status during publish */}
              {publishPhase !== 'idle' && (
                <div className="p-3 bg-secondary/30 border border-border rounded space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>
                      {publishPhase === 'rendering' && 'Rendering MP4 video…'}
                      {publishPhase === 'initiating' && 'Starting TikTok session…'}
                      {publishPhase === 'uploading' && 'Uploading chunks to TikTok…'}
                      {publishPhase === 'processing' && 'Checking live publish status…'}
                      {publishPhase === 'done' && 'Upload Complete'}
                    </span>
                    <span>{publishProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${publishProgress}%` }}
                    />
                  </div>
                  {publishStatus && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-primary" />
                      <span>TikTok status: <strong>{publishStatus}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Publish Action Button */}
              <Button
                className="w-full gap-2 font-medium"
                disabled={publishing || !consent}
                onClick={() => void handlePublish()}
              >
                {publishing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Publishing to TikTok…
                  </>
                ) : (
                  <>
                    <Video size={16} />
                    Publish Now to TikTok
                  </>
                )}
              </Button>
            </div>

            {/* Recent Posts History */}
            {posts.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">Recent Publishing Jobs</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 text-muted-foreground"
                    onClick={() => void loadPosts()}
                    disabled={refreshingPosts}
                  >
                    <RefreshCw size={11} className={refreshingPosts ? 'animate-spin' : ''} />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs p-2 bg-secondary/20 border border-border rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-foreground">{post.project_name}</div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            post.status === 'PUBLISH_COMPLETE' || post.status === 'SUCCESS'
                              ? 'bg-primary/20 text-primary'
                              : post.status === 'FAILED'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {post.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Refresh status"
                          onClick={() => void checkJobStatus(post.id)}
                        >
                          <RefreshCw size={11} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>

    {error && (
          <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
