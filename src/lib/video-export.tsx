import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScenePreview } from '@/components/studio/scene-preview';
import { sceneAtTime } from './project-file';
import { totalDuration, type StudioProject } from './studio';
import { embeddedArtworkFonts } from './artwork-fonts';

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Snapshot semantic artwork styling once; scene content remains the shared ScenePreview.
function artworkStyles() {
  const styles = new Map<string, string>();
  document.querySelectorAll('.video-stage svg, .video-stage svg [class]').forEach(element => {
    const css = getComputedStyle(element);
    const properties = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-style', 'font-size', 'font-weight'];
    styles.set(element.getAttribute('class') ?? '', properties.map(p => `${p}:${css.getPropertyValue(p)}`).join(';'));
  });
  return styles;
}

function sharedArtworkCss() {
  const tokens = getComputedStyle(document.documentElement);
  const rules: string[] = [];
  function collect(list: CSSRuleList) {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule && /^\.(art-|scene-art)/.test(rule.selectorText)) {
        rules.push(rule.cssText.replace(/var\((--[\w-]+)\)/g, (_, name: string) => tokens.getPropertyValue(name).trim()));
      } else if (rule instanceof CSSGroupingRule) collect(rule.cssRules);
    }
  }
  for (const sheet of document.styleSheets) { try { collect(sheet.cssRules); } catch { /* Cross-origin font sheets are not artwork styles. */ } }
  return rules.join('\n');
}

export async function createFrameRenderer(project: StudioProject, resolution: number) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = project.format === 'portrait' ? resolution * 9 / 16 : resolution;
  canvas.height = project.format === 'portrait' ? resolution : resolution * 9 / 16;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  const styles = artworkStyles();
  const sharedCss = `${await embeddedArtworkFonts()}\n${sharedArtworkCss()}`;
  return { canvas, async draw(time: number) {
    const position = sceneAtTime(project, time);
    const markup = renderToStaticMarkup(createElement(ScenePreview, { project, scene: position.scene, elapsed: position.localTime }));
    const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    svg.setAttribute('width', String(canvas.width)); svg.setAttribute('height', String(canvas.height));
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style'); style.textContent = sharedCss; svg.prepend(style);
    [svg, ...svg.querySelectorAll('[class]')].forEach(element => {
      const css = styles.get(element.getAttribute('class') ?? '');
      const inline = element.getAttribute('style') ?? '';
      if (css) element.setAttribute('style', inline ? `${css};${inline}` : css);
      // These are dynamic attributes, not CSS-animation state.
      if (element.hasAttribute('opacity')) element.setAttribute('style', `${element.getAttribute('style') ?? ''};opacity:${element.getAttribute('opacity')}`);
      if (element.hasAttribute('font-size')) element.setAttribute('style', `${element.getAttribute('style') ?? ''};font-size:${element.getAttribute('font-size')}px`);
      if (element.hasAttribute('font-weight')) element.setAttribute('style', `${element.getAttribute('style') ?? ''};font-weight:${element.getAttribute('font-weight')}`);
      if (element.hasAttribute('font-family')) element.setAttribute('style', `${element.getAttribute('style') ?? ''};font-family:${element.getAttribute('font-family')}`);
    });
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0);
    } finally { URL.revokeObjectURL(url); }
  } };
}

export async function exportVideo(options: { project: StudioProject; resolution: number; container: 'mp4' | 'webm'; audioUrl: string; volume: number; muted: boolean; signal: AbortSignal; onProgress: (n: number) => void }) {
  options.signal.throwIfAborted();
  const { Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource, AudioBufferSource, canEncodeVideo, canEncodeAudio } = await import('mediabunny');
  const renderer = await createFrameRenderer(options.project, options.resolution);
  const { width, height } = renderer.canvas;
  const codec = options.container === 'mp4' ? 'avc' : 'vp9';
  const audioCodec = options.container === 'mp4' ? 'aac' : 'opus';
  if (!await canEncodeVideo(codec, { width, height, frameRate: 30 })) throw new Error(`${options.container.toUpperCase()} encoding is unavailable in this browser. Try the other video format or download your editable project.`);
  const duration = totalDuration(options.project.scenes);
  let mixed: AudioBuffer | undefined;
  if (options.audioUrl && !options.muted && options.volume > 0) {
    if (!await canEncodeAudio(audioCodec, { numberOfChannels: 2, sampleRate: 48000 })) throw new Error('This browser cannot encode audio in the selected format. Try WebM or mute the track for a silent export.');
    const decoder = new AudioContext();
    let decoded: AudioBuffer;
    try { decoded = await decoder.decodeAudioData(await (await fetch(options.audioUrl)).arrayBuffer()); }
    finally { await decoder.close(); }
    const mixer = new OfflineAudioContext(2, Math.ceil(duration * 48000), 48000);
    options.signal.throwIfAborted();
    const source = mixer.createBufferSource(); source.buffer = decoded;
    const gain = mixer.createGain(); gain.gain.value = options.volume / 100;
    source.connect(gain); gain.connect(mixer.destination); source.start(0);
    mixed = await mixer.startRendering();
  }
  options.signal.throwIfAborted();
  const target = new BufferTarget();
  const output = new Output({ target, format: options.container === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat() });
  const video = new CanvasSource(renderer.canvas, { codec, bitrate: options.resolution === 1920 ? 8_000_000 : 3_000_000 });
  output.addVideoTrack(video, { frameRate: 30 });
  const audio = mixed ? new AudioBufferSource({ codec: audioCodec, bitrate: 128000 }) : undefined;
  if (audio) output.addAudioTrack(audio);
  try {
    await output.start();
    if (audio && mixed) { await audio.add(mixed); audio.close(); }
    const frames = Math.ceil(duration * 30);
    for (let frame = 0; frame < frames; frame++) {
      options.signal.throwIfAborted();
      await renderer.draw(frame / 30);
      await video.add(frame / 30, Math.min(1 / 30, duration - frame / 30));
      if (frame % 10 === 0) { options.onProgress(frame / frames); await new Promise(resolve => setTimeout(resolve, 0)); }
    }
    video.close(); await output.finalize();
    options.signal.throwIfAborted();
    if (!target.buffer) throw new Error('The encoder did not return a video.');
    options.onProgress(1);
    return new Blob([target.buffer], { type: `video/${options.container}` });
  } catch (error) { if (output.state !== 'finalized') await output.cancel(); throw error; }
}

export async function exportStill(project: StudioProject, time: number) {
  const renderer = await createFrameRenderer(project, 1920); await renderer.draw(time);
  return new Promise<Blob>((resolve, reject) => renderer.canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image.')), 'image/png'));
}