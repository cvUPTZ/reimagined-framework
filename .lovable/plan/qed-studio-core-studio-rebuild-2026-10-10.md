# QED Studio — Core Studio Rebuild

## Goal
Rebuild the uploaded QED Studio as a modern, Arabic-first desktop editing application using React and TanStack Start. Preserve the strongest core workflows while replacing the long stacked-form interface with a faster, clearer professional workspace.

## Product direction
- Arabic RTL interface, optimized for desktop keyboards and pointer controls.
- Premium cinematic editing-suite layout: navigation rail, large central preview, contextual properties panel, and bottom scene timeline.
- Dark, high-contrast visual system with a restrained warm accent, consistent iconography, compact controls, and clear hierarchy.
- Purposeful motion for panel changes, timeline actions, playback, and feedback, with reduced-motion support.

## First rebuild scope

### 1. Studio shell and navigation
- Build a persistent application shell with project identity and autosave status, undo/redo, portrait/landscape switching, safe-zone controls, and preview zoom.
- Organize core destinations into Ideas, Scenes, Audio, and Export instead of rendering dozens of cards together.
- Add command tooltips, keyboard shortcuts, focus states, and correct RTL reading and navigation behavior.

### 2. Project and scene model
- Recreate the project structure for format, theme, brand settings, scenes, durations, overlays, audio references, and export settings.
- Support create, rename, duplicate, delete, import, and export for projects.
- Persist projects locally in the browser, restore the last project, autosave changes, and isolate undo/redo history per project.
- Preserve compatibility with the uploaded `.cmb.json` project shape where practical and validate imported files safely.

### 3. Ideas and content creation
- Rebuild the curriculum/topic selection, mistake diagnosis, expression, remediation, visual model, intuition, audience, story arc, duration, CTA, and hook selection workflow.
- Replace oversized native selectors with searchable, grouped controls and progressive disclosure.
- Include the existing local brainstorming workflow; external AI generation remains outside this first core pass.

### 4. Scene editor and direct manipulation
- Make the live 9:16 or 16:9 canvas the center of the application.
- Rebuild scene creation, duplication, deletion, reordering, duration editing, and bulk duration controls.
- Preserve on-canvas text overlays with selection, drag, resize, snapping guides, and safe boundaries.
- Add a thumbnail timeline with playhead, scrubber, scene selection, direct reordering, and stable transport controls.
- Keep preview overlays—safe zones, prompter, subtitles, face-cam framing—as clear toggles rather than competing layers.

### 5. Audio and playback
- Rebuild narration/voice-over attachment, music selection, levels, muting, timing, and playback synchronization.
- Preserve the teleprompter as a focused recording aid.
- Show clear recording, missing-media, and unsupported-browser states without blocking unrelated editing.

### 6. Export workspace
- Rebuild resolution, format, frame rate, quality, and output controls.
- Preserve the preflight checks for codec support, aspect ratio, duration, safe zones, and missing assets.
- Implement the browser-supported video export path and project/standalone data export, with visible progress, cancellation, and useful errors.
- TikTok auto-publishing, batch production, advanced AI/TTS, diagnosis libraries, Solve/Intuition makers, and planning tools are explicitly deferred beyond the core rebuild.

## Technical approach
- Use TanStack Start, React 19, TypeScript, Tailwind CSS v4 semantic tokens, and focused reusable editor components.
- Split the legacy global-script behavior into typed modules for project state, command history, timeline math, canvas rendering, audio, persistence, and export.
- Use an explicit state store with command-based undo/redo and IndexedDB-backed project persistence; keep runtime media blobs outside normal React state.
- Adapt proven browser media/export code from the uploaded project where it remains reliable, while removing global variables and inline event wiring.
- Keep rendering and editor state deterministic so preview, playback, saved projects, and exported output use the same scene data.

## Quality and verification
- Add targeted tests for project persistence, import compatibility, undo/redo isolation, scene ordering, duration calculations, and portrait/landscape dimensions.
- Verify the real core flow end to end: create a project, build and reorder scenes, edit an overlay, add audio, preview, reload, reopen, and export.
- Test Arabic RTL layout, keyboard operation, reduced motion, empty/error states, and desktop viewport stability.
- Confirm every control remains readable and non-overlapping in both portrait and landscape editing modes.
