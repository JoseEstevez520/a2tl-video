import type { VDSLSpec, Scene, Component, Theme } from "../parser/types";
import { themes, resolveTheme } from "../themes";

export function renderToHTML(spec: VDSLSpec, themeName?: string): string {
  const theme = themeName ? resolveTheme(themeName) : (spec.theme ? resolveTheme(spec.theme) : resolveTheme("cobalt-grid"));
  const fps = 30;
  const width = spec.canvas?.width ?? 1920;
  const height = spec.canvas?.height ?? 1080;

  const sceneHtml = spec.scenes.map((scene, si) => renderScene(scene, si, spec, theme, fps)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VDSL Player</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #111; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui; }
  #player { position: relative; width: ${width}px; height: ${height}px; background: ${theme.colors.bg}; border-radius: 8px; box-shadow: 0 0 60px rgba(0,0,0,0.5); overflow: hidden; transform-origin: top left; }
  #controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; align-items: center; background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 12px; z-index: 1000; }
  #controls button { background: #333; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  #controls button:hover { background: #555; }
  #controls input[type=range] { width: 200px; }
  #controls label { color: #aaa; font-size: 12px; min-width: 60px; }
  .scene-layer { position: absolute; inset: 0; }
  .vdsl-el { position: absolute; will-change: transform, opacity; }
  .theme-grid { width: 100%; height: 100%; position: absolute; inset: 0; pointer-events: none; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes typewriter { from { width: 0; } to { width: 100%; } }
</style>
</head>
<body>
<div id="player">
  ${sceneHtml}
</div>
<div id="controls">
  <button id="playBtn">▶</button>
  <input type="range" id="seekBar" min="0" max="100" value="0">
  <label id="timeLabel">0:00</label>
</div>
<script>
(function() {
  const player = document.getElementById('player');
  const fps = ${fps};
  const totalFrames = ${spec.scenes.reduce((s, sc) => s + Math.round(sc.duration * fps), 0)};
  const scenes = ${JSON.stringify(spec.scenes.map((s) => ({ duration: Math.round(s.duration * fps), startFrame: 0 })))};
  let currentFrame = -1;
  let playing = false;
  let rafId = null;

  let acc = 0;
  const sceneStarts = scenes.map((s) => { const start = acc; acc += s.duration; return start; });

  function getSceneForFrame(frame) {
    for (let i = sceneStarts.length - 1; i >= 0; i--) {
      if (frame >= sceneStarts[i]) return i;
    }
    return 0;
  }

  function updateDisplay(frame) {
    // Hide all layers
    document.querySelectorAll('.scene-layer').forEach(l => l.style.display = 'none');
    // Show only active scene layers
    const si = getSceneForFrame(frame);
    const sceneLayer = document.querySelector('.scene-layer[data-scene="' + si + '"]');
    if (sceneLayer) sceneLayer.style.display = 'block';

    // Update individual element visibility based on timing
    document.querySelectorAll('[data-el]').forEach(el => {
      const start = parseFloat(el.getAttribute('data-start'));
      const endAttr = el.getAttribute('data-end');
      const end = endAttr ? parseFloat(endAttr) : Infinity;
      const reveal = el.getAttribute('data-reveal') || 'fade';
      const elFrame = frame - start * fps;
      const elEndFrame = end !== Infinity ? (end - parseFloat(el.getAttribute('data-start'))) * fps : Infinity;

      if (frame >= start * fps && frame < end * fps) {
        el.style.display = '';
        el.style.pointerEvents = 'none';

        if (reveal === 'word-stagger') {
          const words = el.querySelectorAll('.word');
          words.forEach((w, i) => {
            const wf = elFrame - i * 4;
            const opacity = Math.min(1, Math.max(0, wf / 10));
            const ty = Math.max(0, 30 - wf / 14 * 30);
            w.style.opacity = opacity;
            w.style.transform = 'translateY(' + ty + 'px)';
            w.style.filter = wf < 12 ? 'blur(' + Math.max(0, 4 - wf / 12 * 4) + 'px)' : 'none';
          });
        } else if (reveal === 'typewriter') {
          const chars = Math.floor(Math.max(0, elFrame) / 2);
          el.style.setProperty('--chars', String(chars));
        } else {
          el.style.opacity = Math.min(1, Math.max(0, (elFrame - 0) / 6));
          if (elFrame > elEndFrame - 10) {
            el.style.opacity = Math.max(0, (elEndFrame - elFrame) / 10);
          }
        }
      } else {
        el.style.display = 'none';
      }
    });
  }

  function tick() {
    if (!playing) return;
    currentFrame++;
    if (currentFrame >= totalFrames) { currentFrame = 0; }
    updateDisplay(currentFrame);
    const t = currentFrame / fps;
    document.getElementById('seekBar').value = (currentFrame / totalFrames) * 100;
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    document.getElementById('timeLabel').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    rafId = requestAnimationFrame(tick);
  }

  document.getElementById('playBtn').addEventListener('click', function() {
    playing = !playing;
    this.textContent = playing ? '⏸' : '▶';
    if (playing) { if (currentFrame < 0) currentFrame = 0; rafId = requestAnimationFrame(tick); }
    else { if (rafId) cancelAnimationFrame(rafId); }
  });

  document.getElementById('seekBar').addEventListener('input', function() {
    const pct = parseFloat(this.value) / 100;
    currentFrame = Math.floor(pct * totalFrames);
    if (!playing) updateDisplay(currentFrame);
    const t = currentFrame / fps;
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    document.getElementById('timeLabel').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
  });

  currentFrame = 0;
  updateDisplay(0);
  // Hide controls after mouse idle
  let hideTimer = null;
  document.addEventListener('mousemove', function() {
    document.getElementById('controls').style.opacity = '1';
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function() {
      if (playing) document.getElementById('controls').style.opacity = '0.2';
    }, 3000);
  });
})();
</script>
</body>
</html>`;
}

function renderScene(scene: Scene, si: number, spec: VDSLSpec, theme: Theme, fps: number): string {
  const startFrame = spec.scenes.slice(0, si).reduce((s, sc) => s + Math.round(sc.duration * fps), 0);
  const durFrames = Math.round(scene.duration * fps);
  const startSec = startFrame / fps;
  const endSec = (startFrame + durFrames) / fps;

  const gridHtml = theme.grid ? renderGrid(theme) : "";

  const componentHtml = scene.components.map((comp) => renderComponent(comp, theme, startSec)).join("\n");

  return `<div class="scene-layer" data-scene="${si}" style="display:none">
    ${gridHtml}
    ${componentHtml}
  </div>`;
}

function renderGrid(theme: Theme): string {
  return `<svg class="theme-grid" viewBox="0 0 1920 1080">
    <defs>
      <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
        <line x1="48" y1="0" x2="48" y2="48" stroke="${theme.colors.grid}" stroke-width="0.5" opacity="0.15"/>
        <line x1="0" y1="48" x2="48" y2="48" stroke="${theme.colors.grid}" stroke-width="0.5" opacity="0.15"/>
        <circle cx="48" cy="48" r="1" fill="${theme.colors.grid}" opacity="0.2"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderComponent(comp: Component, theme: Theme, sceneStartSec: number): string {
  switch (comp.type) {
    case "text": return renderText(comp, theme);
    case "label": return renderLabel(comp, theme);
    case "code": return renderCode(comp, theme);
    case "byline": return renderByline(comp, theme);
    case "text-cycle": return renderTextCycle(comp, theme);
    case "triptych": return renderTriptych(comp, theme);
    case "step-sequence": return renderStepSequence(comp, theme);
    case "comparison": return renderComparison(comp, theme);
    default: return "";
  }
}

// --- Text ---
function renderText(comp: any, theme: Theme): string {
  const reveal = comp.reveal || "fade";
  const font = comp.font === "hero" || comp.font === "display" ? theme.fonts.display : theme.fonts.body;
  const fontSize = comp.font === "hero" ? 56 : comp.font === "display" ? 48 : 32;
  const fontWeight = comp.font === "hero" ? 800 : 600;
  const pos = posToStyle(comp.position || "center");

  if (reveal === "word-stagger") {
    const words = comp.content.split(" ").map((w: string) => `<span class="word" style="display:inline-block;opacity:0;transform:translateY(30px)">${escapeHtml(w)}</span>`).join(" ");
    return `<div class="vdsl-el" data-el="text" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="word-stagger" style="${pos}">
      <div style="font-family:${font};font-size:${fontSize}px;font-weight:${fontWeight};color:${theme.colors.ink};max-width:85%;line-height:1.3;text-align:${comp.position === "center" ? "center" : "left"}">${words}</div>
    </div>`;
  }

  if (reveal === "typewriter") {
    const chars = comp.content.length;
    return `<div class="vdsl-el" data-el="text" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="typewriter" data-chars="${chars}" style="${pos};font-family:${font};font-size:${fontSize}px;font-weight:${fontWeight};color:${theme.colors.ink};overflow:hidden;white-space:pre-wrap;">
      <span style="display:inline">${escapeHtml(comp.content)}</span><span style="opacity:0.8">█</span>
    </div>`;
  }

  return `<div class="vdsl-el" data-el="text" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="${pos};font-family:${font};font-size:${fontSize}px;font-weight:${fontWeight};color:${theme.colors.ink};max-width:85%;line-height:1.3;text-align:${comp.position === "center" ? "center" : "left"}">${escapeHtml(comp.content)}</div>`;
}

// --- Label ---
function renderLabel(comp: any, theme: Theme): string {
  const pos = posToStyle(comp.position || "center");
  return `<div class="vdsl-el" data-el="label" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="${pos};font-family:${theme.fonts.mono};font-size:13px;font-weight:700;color:${theme.colors.inkSoft};letter-spacing:0.12em;text-transform:uppercase;background:${theme.colors.ink}08;padding:5px 14px;border-radius:6px;border:1px solid ${theme.colors.grid}">${escapeHtml(comp.text)}</div>`;
}

// --- Code ---
function renderCode(comp: any, theme: Theme): string {
  const pos = posToStyle("center");
  return `<div class="vdsl-el" data-el="code" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="typewriter" style="${pos};font-family:${theme.fonts.mono};font-size:28px;color:${theme.colors.ink};background:${theme.colors.bg2};padding:16px 24px;border-radius:8px;border:1px solid ${theme.colors.grid};white-space:pre;">
    <span>${escapeHtml(comp.content)}</span><span style="opacity:0.8">█</span>
  </div>`;
}

// --- Byline ---
function renderByline(comp: any, theme: Theme): string {
  const pos = posToStyle(comp.position || "bottom-right");
  return `<div class="vdsl-el" data-el="byline" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="${pos};font-family:${theme.fonts.body};font-size:14px;color:${theme.colors.inkSoft}">${escapeHtml(comp.text)}</div>`;
}

// --- TextCycle ---
function renderTextCycle(comp: any, theme: Theme): string {
  const items = comp.phrases || comp.items || [];
  const fontSize = 48;
  const html = items.map((item: any, i: number) => {
    const accent = item.accent || "";
    const decoration = accent === "underline" ? "underline" : accent === "strike" ? "line-through" : "none";
    const opacity = accent === "dim" ? "0.45" : "1";
    return `<div class="vdsl-el" data-el="textcycle" data-start="${item.timing.start}" data-end="${item.timing.end ?? ""}" data-reveal="fade" style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-family:${theme.fonts.display};font-size:${fontSize}px;font-weight:700;color:${theme.colors.ink};text-decoration:${decoration};opacity:${opacity}">${escapeHtml(item.text)}</div>`;
  }).join("\n");
  return html;
}

// --- Triptych ---
function renderTriptych(comp: any, theme: Theme): string {
  const itemsHtml = comp.items.map((item: any) => {
    const text = item.tokens ? item.tokens.join(" ") : "";
    return `<div style="flex:1;display:flex;justify-content:center;align-items:center;padding:24px;background:${theme.colors.ink}06;border-radius:12px;border:1px solid ${theme.colors.grid};font-family:${theme.fonts.display};font-size:22px;font-weight:600;color:${theme.colors.ink};text-align:center;min-height:120px">${escapeHtml(text)}</div>`;
  }).join("\n");

  const staggerHtml = comp.items.map((_: any, i: number) => {
    const delay = i * 8 / 30;
    return `<div class="vdsl-el" data-el="triptych-item-${i}" data-start="${comp.timing.start + delay}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:20px;padding:0 60px">${itemsHtml}</div>`;
  }).join("\n");

  return staggerHtml;
}

// --- StepSequence ---
function renderStepSequence(comp: any, theme: Theme): string {
  return comp.steps.map((step: any, i: number) => {
    const delay = i * 12 / 30;
    return `<div class="vdsl-el" data-el="step" data-start="${comp.timing.start + delay}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:60px 80px">
      <div style="display:flex;align-items:center;gap:16px;width:65%;padding:12px 20px;border-radius:10px;background:${theme.colors.ink}04;border:1px solid ${theme.colors.grid}">
        <div style="width:32px;height:32px;border-radius:16px;background:${theme.colors.ink};color:${theme.colors.bg};display:flex;justify-content:center;align-items:center;font-family:${theme.fonts.mono};font-size:13px;font-weight:700;flex-shrink:0">${i + 1}</div>
        <div><div style="font-family:${theme.fonts.display};font-size:17px;font-weight:600;color:${theme.colors.ink}">${escapeHtml(step.label)}</div>${step.description ? `<div style="font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.inkSoft}">${escapeHtml(step.description)}</div>` : ""}</div>
      </div>
    </div>`;
  }).join("\n");
}

// --- Comparison ---
function renderComparison(comp: any, theme: Theme): string {
  const left = comp.sides?.find((s: any) => s.side === "left") || comp.left;
  const right = comp.sides?.find((s: any) => s.side === "right") || comp.right;
  if (!left || !right) return "";

  const card = (side: any, _color: string) => `
    <div style="flex:1;padding:24px;border-radius:14px;background:${theme.colors.bg2};border:1px solid ${theme.colors.grid}">
      ${side.badge ? `<div style="display:inline-block;padding:3px 10px;border-radius:12px;background:${side.badge.color}22;border:1px solid ${side.badge.color}66;margin-bottom:8px"><span style="font-family:${theme.fonts.mono};font-size:10px;font-weight:700;color:${side.badge.color}">${escapeHtml(side.badge.text)}</span></div>` : ""}
      <div style="font-family:${theme.fonts.display};font-size:22px;font-weight:700;color:${theme.colors.ink};margin-bottom:4px">${escapeHtml(side.title)}</div>
      <div style="font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.inkSoft}">${escapeHtml(side.subtitle)}</div>
    </div>`;

  return `<div class="vdsl-el" data-el="comparison" data-start="${comp.timing.start}" data-end="${comp.timing.end ?? ""}" data-reveal="fade" style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:20px;padding:0 80px">
    ${card(left, "purple")}
    ${card(right, "green")}
  </div>`;
}

// --- Viz blocks (simple stub) ---
// Viz is complex; for web renderer we show a placeholder

// --- Helpers ---
function posToStyle(position: string): string {
  const base = "position:absolute;inset:0;display:flex;";
  switch (position) {
    case "upper-left": return base + "justify-content:flex-start;align-items:flex-start;padding:60px 60px";
    case "upper-right": return base + "justify-content:flex-end;align-items:flex-start;padding:60px 60px";
    case "bottom-center": return base + "justify-content:center;align-items:flex-end;padding:0 0 50px";
    case "bottom-right": return base + "justify-content:flex-end;align-items:flex-end;padding:0 60px 50px";
    default: return base + "justify-content:center;align-items:center";
  }
}
