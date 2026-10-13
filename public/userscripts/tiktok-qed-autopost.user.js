// ==UserScript==
// @name         QED Math Studio — TikTok Creator Auto-Poster
// @namespace    https://qed.studio/
// @version      1.0.0
// @description  Automates video caption, hashtags, privacy, and posting on TikTok Creator Studio directly from QED Studio
// @author       QED Studio
// @match        https://www.tiktok.com/creator-center/upload*
// @match        https://www.tiktok.com/tiktokstudio/upload*
// @match        https://www.tiktok.com/upload*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        window.focus
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('[QED Auto-Poster] Violentmonkey userscript initialized.');

  // Create floating QED Assistant HUD
  const hud = document.createElement('div');
  hud.id = 'qed-tiktok-hud';
  hud.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: rgba(11, 18, 30, 0.95);
      border: 1.5px solid #f59e0b;
      border-radius: 14px;
      padding: 16px 18px;
      color: #f8fafc;
      font-family: Tajawal, system-ui, -apple-system, sans-serif;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      width: 320px;
      backdrop-filter: blur(12px);
      transition: all 0.25s ease;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px; font-weight: 800; color: #fff;">QED<span style="color: #f59e0b;"> ∎</span></span>
          <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight: 600;">Auto-Poster</span>
        </div>
        <button id="qed-hud-toggle" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">−</button>
      </div>

      <div id="qed-hud-body">
        <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 12px 0; line-height: 1.4;">
          Collez le payload exporté depuis QED Studio pour remplir automatiquement le titre, les hashtags et publier.
        </p>

        <button id="qed-load-clipboard-btn" style="
          width: 100%;
          background: #f59e0b;
          color: #0f172a;
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s;
        ">
          📋 Charger depuis le Presse-papiers
        </button>

        <div id="qed-status-msg" style="
          margin-top: 10px;
          font-size: 11.5px;
          color: #94a3b8;
          min-height: 20px;
          line-height: 1.4;
        ">Prêt. Exportez votre vidéo sur QED Studio.</div>

        <div id="qed-auto-post-box" style="display: none; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <label style="font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="qed-auto-post-toggle" checked style="accent-color: #f59e0b;" />
              Auto-publier après l'upload
            </label>
          </div>
          <button id="qed-post-now-btn" style="
            width: 100%;
            background: #10b981;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-weight: 700;
            font-size: 12.5px;
            cursor: pointer;
          ">
            🚀 Publier Maintenant
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(hud);

  // Minimizing HUD toggle
  let isMinimized = false;
  const toggleBtn = document.getElementById('qed-hud-toggle');
  const hudBody = document.getElementById('qed-hud-body');
  toggleBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    hudBody.style.display = isMinimized ? 'none' : 'block';
    toggleBtn.textContent = isMinimized ? '+' : '−';
  });

  const statusMsg = document.getElementById('qed-status-msg');
  const loadBtn = document.getElementById('qed-load-clipboard-btn');
  const autoPostBox = document.getElementById('qed-auto-post-box');
  const postNowBtn = document.getElementById('qed-post-now-btn');
  const autoPostToggle = document.getElementById('qed-auto-post-toggle');

  function setStatus(text, color = '#94a3b8') {
    statusMsg.innerHTML = text;
    statusMsg.style.color = color;
  }

  // Find TikTok caption input element
  function getCaptionEditor() {
    return (
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('.DraftEditor-editorContainer div[contenteditable="true"]') ||
      document.querySelector('div[role="combobox"]') ||
      document.querySelector('textarea')
    );
  }

  // Set caption inside TikTok's contenteditable / Draft.js editor
  function fillCaption(text) {
    const editor = getCaptionEditor();
    if (!editor) {
      setStatus('⚠️ Éditeur de légende introuvable. Cliquez d’abord sur la zone de description.', '#ef4444');
      return false;
    }

    editor.focus();

    // Select all existing text
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    // Insert new caption using document.execCommand for Draft.js / React compatibility
    document.execCommand('delete', false, null);
    const success = document.execCommand('insertText', false, text);

    if (!success) {
      editor.innerText = text;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  }

  // Find TikTok Post / Publish button
  function getPostButton() {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((btn) => {
      const txt = (btn.textContent || '').trim().toLowerCase();
      return (
        txt === 'post' ||
        txt === 'publier' ||
        txt === 'نشر' ||
        btn.getAttribute('data-e2e') === 'post_video_button'
      );
    });
  }

  // Monitor upload completion
  let uploadWatcher = null;
  function watchUploadAndPost() {
    autoPostBox.style.display = 'block';
    if (uploadWatcher) clearInterval(uploadWatcher);

    uploadWatcher = setInterval(() => {
      const postBtn = getPostButton();
      if (!postBtn) return;

      const isDisabled = postBtn.disabled || postBtn.getAttribute('aria-disabled') === 'true';

      // Check if upload is 100% finished
      const isUploading =
        document.body.innerText.includes('Uploading') ||
        document.body.innerText.includes('Chargement') ||
        document.body.innerText.includes('جاري الرفع');

      if (!isDisabled && !isUploading) {
        clearInterval(uploadWatcher);
        uploadWatcher = null;
        setStatus('✅ Vidéo téléversée avec succès!', '#10b981');

        if (autoPostToggle.checked) {
          let count = 5;
          setStatus(`🚀 Publication automatique dans ${count}s... (Cliquez sur Annuler pour stopper)`, '#f59e0b');
          const countdown = setInterval(() => {
            count--;
            if (!autoPostToggle.checked) {
              clearInterval(countdown);
              setStatus('⏸️ Publication automatique annulée.', '#94a3b8');
              return;
            }
            if (count <= 0) {
              clearInterval(countdown);
              postBtn.click();
              setStatus('🎉 Vidéo publiée sur TikTok!', '#10b981');
            } else {
              setStatus(`🚀 Publication automatique dans ${count}s...`, '#f59e0b');
            }
          }, 1000);
        }
      } else {
        setStatus('⏳ Téléversement de la vidéo en cours...', '#38bdf8');
      }
    }, 1500);
  }

  postNowBtn.addEventListener('click', () => {
    const postBtn = getPostButton();
    if (postBtn && !postBtn.disabled) {
      postBtn.click();
      setStatus('🎉 Vidéo publiée sur TikTok!', '#10b981');
    } else {
      setStatus('⚠️ Le bouton Publier n’est pas encore prêt (attendez la fin de l’upload).', '#ef4444');
    }
  });

  // Load payload from clipboard
  loadBtn.addEventListener('click', async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      let payload = null;
      try {
        payload = JSON.parse(clipText);
      } catch {
        // Plain text fallback
      }

      if (payload && payload.qed) {
        const fullCaption = `${payload.title}\n\n${payload.caption || ''}\n\n${payload.hashtags || '#math #bac2026 #qed'}`.trim();
        const ok = fillCaption(fullCaption);
        if (ok) {
          setStatus(`✨ Légende appliquée: <b>${payload.title}</b>`, '#10b981');
          watchUploadAndPost();
        }
      } else if (clipText && clipText.trim()) {
        const ok = fillCaption(clipText.trim());
        if (ok) {
          setStatus('✨ Texte du presse-papiers collé dans la légende.', '#10b981');
          watchUploadAndPost();
        }
      } else {
        setStatus('⚠️ Presse-papiers vide. Exportez et copiez le payload depuis QED Studio.', '#ef4444');
      }
    } catch (e) {
      setStatus(`⚠️ Erreur d'accès au presse-papiers: ${e.message}`, '#ef4444');
    }
  });
})();
