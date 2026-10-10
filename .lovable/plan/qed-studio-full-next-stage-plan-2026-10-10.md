# QED Studio — Full Next-Stage Plan

## Goal
Turn the reference-style workspace into a complete mathematics video studio: create a lesson, edit its visuals and timing, add narration, and download a finished video. Keep the supplied near-black-and-mint direction; do not redesign the editor again.

## Where the editor stands
- Working: scene editing, scene ordering, add/duplicate/delete, undo/redo, portrait/landscape switching, basic animated preview, browser autosave, and editable project download/import.
- Limited: the curve artwork is illustrative rather than calculated from the entered expression; timeline clips do not yet reflect duration proportionally; audio is temporary and is not included in saved projects.
- Missing: finished video export, a real multi-project library, advanced visual models, original curriculum/diagnosis tools, persistent media, and connected AI/publishing services.
- Compatibility gap: the current simplified project import does not fully migrate the original v4.1 scene format. Existing source-project files need a tested conversion path.

## 1. Reliable project foundation
**Result:** old projects open safely, new projects retain all edits, and media no longer disappears silently.

- Add a versioned project format with validation and migration from original `.cmb.json` files, including text layers, timing, formulas, narration, visual settings, and brand data.
- Preserve unsupported legacy fields for round-trip export; show which original effects cannot yet be reproduced instead of discarding them.
- Make preview, timeline, audio, and export use the same project data and playback position.
- Group continuous typing and dragging into useful undo steps; isolate history when switching projects.
- Add explicit save failure, recovery, missing-media, and import-error states. Downloaded files remain a backup, not a claim that assets are embedded.

**Acceptance:** import representative original files, edit them, export/reimport, and verify retained content and timing; reject invalid files without replacing the open project.

## 2. Real animation and video export — first delivery milestone
**Result:** download an actual video that matches the editor preview.

- Introduce a time-driven renderer: each frame is calculated from project data and elapsed scene time, including draw-in, fade, slide, and no-motion modes.
- Give the preview, thumbnails, and export one shared scene-rendering definition, retaining the shared ScenePreview boundary.
- Implement browser-side MP4 export using WebCodecs and a maintained muxing library; detect encoding support before starting.
- Offer portrait and landscape output with a small set of resolution/quality choices. Start with silent video, then add verified audio mixing before calling the milestone complete.
- Include progress, cancel, completion/download, and actionable failure states. Never label JSON downloads as video export.
- If MP4 encoding is unsupported, offer a verified browser-compatible alternative where available, otherwise explain the supported-browser requirement. Do not silently change the selected format.
- Add still-frame PNG export. Restore self-contained HTML playback after the video path is stable.

**Acceptance:** export a real multi-scene project in both aspect ratios; inspect dimensions, duration, scene transitions, text, and audio; play the downloaded video outside the editor.

## 3. Precise canvas and timeline controls
**Result:** place content directly and adjust timing without fighting the workspace.

- Add selectable text and formula layers with drag/resize, alignment, snapping, duplicate/delete, layer ordering, and visible selection handles.
- Add font, size, weight, alignment, and token-based color controls; preserve mixed Arabic text and left-to-right mathematical notation.
- Make timeline widths proportional to scene duration; add time-based ruler positioning, playhead, timeline zoom, drag reordering, and clip-edge duration adjustment.
- Make scrub, pause, resume, restart, and scene selection agree with animation and audio time, including after edits and undo.
- Add scene transitions and editable entrance timing/easing, with stable controls and reduced-motion behavior for the editor interface.
- Keep scene navigation and the inspector usable at the current compact preview size; avoid adding clutter or overlapping panels.

**Acceptance:** reposition a layer, trim a scene, reorder clips, scrub mid-animation, undo changes, and verify the same result in a video download.

## 4. Genuine mathematics tools and restored content
**Result:** entered mathematics controls the artwork, and lessons regain the original educational depth.

- Use a proven safe expression parser; never execute user formulas with eval.
- Render function plots from the expression, with range/axis controls, invalid-expression feedback, tangent points, and slope values.
- Expand in stages: function/tangent → number line/balance/area → geometry → probability, sequences, vectors, and complex numbers.
- Migrate the original mistake, ready-video, intuition, and solved-exercise libraries through automated extraction rather than manual rewriting; retain curriculum labels and Arabic content.
- Add searchable/filterable lesson and template browsing with artwork previews. Applying a lesson creates a new project rather than replacing unsaved work without warning.
- Restore worked-solution steps, diagnostic cases, verified retests, and the hook/teaching quality audit as separate tested tools.
- Keep factual mathematical checks deterministic; AI suggestions must not be treated as verified solutions.

**Acceptance:** known formulas produce known curve/tangent values; migrated library counts and content match the archive; original diagnosis/retest cases pass regression tests.

## 5. Saved projects, media, audio, and brand kits
**Result:** manage multiple projects and return to them from another device with their assets intact.

- Enable Lovable Cloud at this phase, through its approval flow, before implementing connected storage or sign-in.
- Keep the editor usable without signing in; offer sign-in when saving to a personal library.
- Add owned project search, thumbnails, rename, duplicate, delete confirmation, autosave status, and recovery/version snapshots.
- Migrate the current browser-saved project into the user's library only after sign-in and confirmation; never lose the existing local copy during migration.
- Store uploaded media privately with project ownership checks. Save audio references, volume, mute, trim, fades, and start offsets as project data.
- Add microphone recording where supported, narration/music tracks, waveforms, synchronization, and voice-over ducking in preview and export.
- Restore reusable brand kits: accent, typography, logo, end card, CTA, and format-aware placement, without changing the studio's own reference design.

**Acceptance:** create two projects, attach audio, reload, switch projects, and reopen on another signed-in session; verify the assets and edits persist and another user cannot access them.

## 6. AI-assisted creation
**Result:** generate editable lesson drafts and downloadable narration, not just temporary browser speech.

- Add explicit actions for lesson outline, hook suggestions, script rewriting, and narration generation using Lovable AI.
- Let users review generated scenes before applying them; keep edits and undo available.
- Support Arabic and English scripts with voice selection from verified available voices; store generated narration as a project asset.
- Show generation progress, safe errors, and usage implications. Never generate on page load or regenerate unchanged narration automatically.
- Validate structured lesson output and verify mathematics with the deterministic tools from Phase 4.

**Dependency:** Cloud activation, verified AI availability, and usage credits. AI use consumes workspace credits; this is separate from local video rendering.

**Acceptance:** generate a real outline, review/apply it, generate narration, reload the project, and export a playable video containing that narration.

## 7. Planner, batch production, and publishing
**Result:** organize a series and prepare approved videos for distribution.

- Restore topic/idea organization, series templates, scheduled content planning, caption/hashtag drafting, and bounded batch creation with per-item status.
- Add a publish-ready checklist covering aspect ratio, audio, safe zones, captions, and export readiness.
- Deliver manual publishing packages first: video, thumbnail, caption, and metadata.
- Add TikTok account connection and direct posting only after verifying posting API access, required scopes, account eligibility, and application approval. Each user connects their own account.
- Require explicit confirmation before posting; show actual provider status and failures. Scheduled posting also requires a verified durable scheduler.
- Do not port the original local bridge or browser-click automation into the hosted app, or promise direct posting before its permissions are confirmed.

**Acceptance:** prepare/download a complete package; connected posting is complete only when an approved account confirms the uploaded video through TikTok's real status response.

## Technical approach
- Keep TanStack Start, React, and the existing semantic design system; no framework replacement or second routing system.
- Separate typed project transformations, legacy migration, time-based rendering, media handling, export, and educational rule engines into focused modules.
- Keep browser rendering/encoding on the browser side. Hosted server functions cannot run native FFmpeg processes or a desktop canvas renderer; an external rendering service would require a separate decision if browser limits become a blocker.
- Use Lovable Cloud for durable user/project/media data; server-side functions for secret-backed AI and integration calls; authenticated ownership checks for private reads and writes.
- Maintain one project model and one rendering contract across the editor and exports. Add optional fields and migrations so saved projects remain compatible.
- Record structural decisions in AGENTS.md and track delivery milestones in roadmap.md during implementation.

## Delivery order and quality gates
1. Project validation/migration and shared timing/rendering foundation.
2. Finished video export with synchronized uploaded audio.
3. Canvas layers and precise timeline editing.
4. Mathematics engine and library/diagnosis restoration in tested slices.
5. Cloud project/media library, richer audio, and brand kits.
6. AI outline and stored narration.
7. Planner and publishing packages; approved integrations last.

Each milestone gets focused logic tests and a real end-to-end editor flow before being reported complete. Check compact, desktop, and narrow layouts, keyboard operation, error states, and downloaded outputs. Existing editing and project downloads must continue working throughout.

## Approval scope
Approval starts with the first delivery: project compatibility, deterministic rendering, and real video export. The remaining phases form the full roadmap, not a claim that every service is already connected. Cloud activation and external account connections will use their own approval steps when reached. No paid external renderer, TikTok posting, or public deployment is assumed.