# Reference direction rebuild
- [x] Switch shared math artwork to the second reference: open diagrams, bounded geometry, readable annotations and staged reveals; verify editable models, library tangent scenes and a downloaded frame.
- [x] Replace the workspace layout and styling with the supplied QED reference.
- [x] Preserve project editing, scene controls, playback, import/export, and undo/redo.
- [x] Verify the editor visually and exercise editing end to end.

# Next-stage planning
- [x] Prepare the full phased plan for production editing, real video export, mathematics tools, saved media, AI, and publishing.

# Approved first delivery
- [x] Validate/migrate original and current project files without discarding legacy data.
- [x] Share deterministic scene timing between preview and export.
- [x] Add support-detected MP4/WebM export with uploaded audio, progress/cancel, and PNG downloads; verify WebM where H.264 encoding is unavailable.
- [x] Verify original import, editor playback and downloaded portrait/landscape WebM videos, including external playback and audio tracks.
- [ ] Verify MP4 downloads in a browser with H.264/AAC encoding support (sandbox Chromium does not provide it).

# Later approved phases
- [x] Duration-proportional timeline, zoom, clip trimming/reordering, and playback synchronization.
- [x] Precise canvas layers, typography controls, and transitions.
- [x] Mathematics engine and original educational library restoration.
- [x] Cloud project/media library, richer audio, and brand kits.
- [ ] AI outlines and stored narration.
- [ ] Planner and publishing packages; approved integrations last.
# Legacy content restoration (Cinematic Math Builder v3 → QED Studio)
- [x] `scripts/extract-legacy-library.mjs`: automated extraction of LIB, READY, INTU and SOLVE into `src/data/legacy/*.json` (122 mistakes, 78 ready videos, 61 intuition videos, 13 solved exercises).
- [x] `src/lib/legacy-library.ts`: typed loader, search/level filters, conversion of every entry into an editable `StudioProject` (legacy visual model and solve-step diagram state preserved in `scene.legacy`).
- [x] Library panel: Lessons / Mistakes / Ready videos / Intuition / Solved exercises tabs with search and level filters.
- [x] Visual-model port started (`src/lib/legacy-visuals.tsx`, pure SVG so preview and export match): groups, area, stair, balance, venn, gcd, fraction — with predict / move / observe / general stages.
- [ ] Port the remaining legacy visual models (`unsupportedLegacyModels()` lists what is still drawn as "none" or as the nearest existing visual).
- [ ] Port the diagnosis engine (case files, prerequisite graphs, re-test checker) and the D1–D7 / H1–H3 audits with their regression tests.
- [ ] Solve step-by-step working panel and per-step diagrams (`drawSolve`).
