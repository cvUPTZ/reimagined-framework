import parentsVoice from '@/assets/qed-parents-voice.mp3.asset.json';
import syncedVoice from '@/assets/qed-final-synced-audio.mp3.asset.json';
import type { StudioProject } from './studio';

// Only known bundled recordings are restored; stale upload blob URLs are not reusable.
export function campaignAudio(project: StudioProject) {
  const name = project.mediaName ?? project.audioTrack?.name;
  if (name === 'QED_final_synced_audio.mp3') return { name, url: syncedVoice.url };
  if (name === 'qed-parents-voice.mp3') return { name, url: parentsVoice.url };
  return undefined;
}