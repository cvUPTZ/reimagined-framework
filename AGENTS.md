<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep editor state in typed project objects and pure transformation helpers so preview, persistence, and export share one data model.

- Reference demo scenes live separately from the original project defaults; optional scene presentation fields preserve existing saved project compatibility.
- Render scene artwork through the shared ScenePreview component so sidebar thumbnails and the main canvas always display the same project content.
- Keep diagram clipping and open-curve construction in shared pure geometry helpers so library artwork cannot escape its drawing area or accidentally close curves.
- Version and validate project interchange in a dedicated migration module, retaining legacy payloads so unsupported original effects are not silently lost.
- Compute motion from scene-local time and export the shared ScenePreview artwork through browser canvas and WebCodecs so scrubbing and downloads use the same scene definition.
- Derive clip geometry and edits through pure timeline helpers; duration-proportional coordinates keep ruler, playhead, trimming, and export synchronized.
- Bundle artwork fonts locally and embed them in exported SVG frames; self-contained image decoding cannot inherit page web fonts.
