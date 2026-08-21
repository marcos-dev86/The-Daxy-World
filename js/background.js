/* ===================================================================
   THE DAXY'S WORLD - fundo interativo
   Uma rede de "olhos" digitais espalhados como as telas do complexo.
   Quando o cursor (ou o dedo, no toque) se aproxima, os nós acordam e
   se conectam a ele - como se algo, em algum monitor, tivesse acabado
   de notar você.
   =================================================================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  let W, H, DPR;
  let nodes = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let running = true;
  let rafId = null;
  let touchIdleTimer = null;

  const CYAN = '95,228,255';
  const WINE = '212,58,92';

  function sizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function nodeCount() {
    const area = W * H;
    const divisor = isCoarsePointer ? 30000 : 22000;
    const cap = isCoarsePointer ? 70 : 110;
    const base = Math.round(area / divisor);
    return Math.max(22, Math.min(base, cap));
  }

  function makeNodes() {
    const count = nodeCount();
    nodes = new Array(count).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1.1 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  const LINK_DIST = isCoarsePointer ? 130 : 150;
  const MOUSE_DIST = isCoarsePointer ? 180 : 210;

  function step(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    // update
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;

      // gentle repel from cursor/dedo
      if (mouse.active) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const rad = 130;
        if (d2 < rad * rad) {
          const d = Math.sqrt(d2) || 1;
          const f = (rad - d) / rad * 0.045;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }
      // gentle drag so it doesn't accelerate forever
      n.vx *= 0.994;
      n.vy *= 0.994;
    }

    // links between nearby nodes
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const op = (1 - dist / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(${CYAN},${op})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // links + glow toward o cursor/dedo ("Daxy notando você")
    if (mouse.active) {
      for (const n of nodes) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const op = (1 - dist / MOUSE_DIST);
          ctx.strokeStyle = `rgba(${WINE},${op * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();

          ctx.fillStyle = `rgba(${WINE},${0.5 + op * 0.5})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + op * 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawIdleNode(n, t);
        }
      }

      // cursor glow
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_DIST);
      grad.addColorStop(0, `rgba(${WINE},0.10)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, MOUSE_DIST, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (const n of nodes) drawIdleNode(n, t);
    }

    if (!reduceMotion) {
      rafId = requestAnimationFrame(step);
    }
  }

  function drawIdleNode(n, t) {
    const pulse = 0.55 + Math.sin((t || 0) * 0.0015 + n.phase) * 0.25;
    ctx.fillStyle = `rgba(${CYAN},${pulse})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function activateAt(x, y) {
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
  }

  function onMouseMove(e) {
    activateAt(e.clientX, e.clientY);
  }
  function onMouseLeave() {
    mouse.active = false;
  }

  // No toque, um simples "tap" já ativa o efeito (não depende de arrastar o dedo),
  // e ele se desliga sozinho depois de um instante parado.
  function onTouchStart(e) {
    const p = e.touches && e.touches[0];
    if (!p) return;
    activateAt(p.clientX, p.clientY);
    clearTimeout(touchIdleTimer);
  }
  function onTouchMove(e) {
    const p = e.touches && e.touches[0];
    if (!p) return;
    activateAt(p.clientX, p.clientY);
    clearTimeout(touchIdleTimer);
  }
  function onTouchEnd() {
    clearTimeout(touchIdleTimer);
    touchIdleTimer = setTimeout(() => { mouse.active = false; }, 900);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mouseleave', onMouseLeave, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });

  // No mobile, a barra de endereço do navegador aparecer/sumir dispara
  // "resize" só por causa da altura - isso recriava a cena a cada scroll
  // e deixava o fundo "quebrado". Agora só recalculamos quando a LARGURA
  // muda de verdade, e com um pequeno debounce.
  let resizeTimer = null;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const widthChanged = Math.abs(window.innerWidth - lastW) > 2;
      sizeCanvas();
      if (widthChanged) {
        lastW = window.innerWidth;
        makeNodes();
      }
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduceMotion && rafId === null) {
      rafId = requestAnimationFrame(step);
    }
  });

  sizeCanvas();
  makeNodes();

  if (reduceMotion) {
    // desenha um único quadro estático, sem loop contínuo
    step(0);
  } else {
    rafId = requestAnimationFrame(step);
  }
})();
