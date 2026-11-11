(function () {
  'use strict';
    const T = window.Theta6, { View, interact, pick, D, C, withAlpha } = window.Viz;

  function drawGraph(ctx, v, pts, out, opts) {
    opts = opts || {};
    const n = pts.length;
    const r = opts.r || 4.5;
    const seen = opts.undirected ? new Set() : null;
    for (let u = 0; u < n; u++) for (let i = 0; i < 6; i++) {
      const w = out[u][i];
      if (w < 0) continue;
      const col = opts.dim ? withAlpha(C.muted, 0.35) : C.cone[i];
      if (opts.undirected) {
        const key = Math.min(u, w) * n + Math.max(u, w);
        if (seen.has(key)) continue; seen.add(key);
        D.line(ctx, v, pts[u], pts[w], col, opts.width || 1.3);
      } else {
        const L = Math.hypot(v.sx(pts[w].x) - v.sx(pts[u].x), v.sy(pts[w].y) - v.sy(pts[u].y));
        if (opts.arrows === false || L < 16) D.line(ctx, v, pts[u], pts[w], col, opts.width || 1.2);
        else D.arrow(ctx, v, pts[u], pts[w], col, opts.width || 1.3, r + 2, Math.min(7, L / 4));
      }
    }
  }
  function drawPath(ctx, v, pts, path, color, width, dash) {
    if (!path || path.length < 2) return;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    path.forEach((k, i) => (i ? ctx.lineTo(v.sx(pts[k].x), v.sy(pts[k].y)) : ctx.moveTo(v.sx(pts[k].x), v.sy(pts[k].y))));
    ctx.stroke(); ctx.restore();
    for (let i = 0; i + 1 < path.length; i++) {
      const a = pts[path[i]], b = pts[path[i + 1]];
      const L = Math.hypot(v.sx(b.x) - v.sx(a.x), v.sy(b.y) - v.sy(a.y));
      if (L > 26) D.arrow(ctx, v, a, { x: (a.x + b.x) / 2 + (b.x - a.x) * 0.08, y: (a.y + b.y) / 2 + (b.y - a.y) * 0.08 }, color, 0.01, 0, 9);
    }
  }
  function drawPoints(ctx, v, pts, opts) {
    opts = opts || {};
     const r = opts.r || 4.5;
    for (let i = 0; i < pts.length; i++) D.dot(ctx, v, pts[i], r, C.ink, C.surface, 1.5);
  }
  window.drawTheta6 = { drawGraph, drawPath, drawPoints };

  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 3 : d) : '∞');

  function initLab() {
    const root = document.getElementById('lab');
    if (!root) return;
    const canvas = root.querySelector('canvas');
    const $ = (s) => root.querySelector(s);
    const st = {
      pts: [], out: [], mode: 'edit', hover: null, s: null, t: null,
      undirected: false, showCones: true, showTri: true, showWorst: true,
      res: null, und: null, r98: null, greedyMax: null, route: null, anim: null,
    };
    const rand = T.rng(20261111);
    const jitter = () => (rand() - 0.5) * 1e-7; // tiny jitter so no 2 points on a cone line

    function randomSet(n) {
      st.pts = Array.from({ length: n }, () => ({ x: 0.05 + 0.9 * rand(), y: 0.05 + 0.9 * rand() }));
      }
    function preset(name) {
      const n = +$('#lab-n').value;
      st.s = st.t = null; st.route = null; stopAnim();
      if (name === 'random') randomSet(n);
      else if (name === 'grid') {
        const k = Math.max(2, Math.round(Math.sqrt(n)));
        st.pts = [];
        for (let i = 0; i < k; i++) for (let j = 0; j < k; j++)
          st.pts.push({ x: 0.08 + 0.84 * i / (k - 1) + 0.02 * (rand() - 0.5), y: 0.08 + 0.84 * j / (k - 1) + 0.02 * (rand() - 0.5) });
      } else if (name === 'circle') {  
        st.pts = Array.from({ length: n }, (_, i) => {  
          const a = 2 * Math.PI * i / n + 0.05;
          return { x: 0.5 + 0.42 * Math.cos(a) + jitter(), y: 0.5 + 0.42 * Math.sin(a) + jitter() };
        });
      } else if (name === 'five') {
        // lemma 1 points without the zigzag (~3.97)
        const L = T.lowerBound5(0.003);
        st.pts = L.pts.slice(0, 5).map((p) => ({ x: 0.5 + 0.42 * p.x, y: 0.3 + 0.42 * p.y }));
        st.s = 0; st.t = 1;
      } else if (name === 'lower') {
        const L = T.lowerBound5(0.06);
        st.pts = L.pts.map((p) => ({ x: 0.5 + 0.42 * p.x, y: 0.3 + 0.42 * p.y }));
        st.s = 0; st.t = 1;
      } else if (name === 'clear') st.pts = [];
      recompute();
    }
    function recompute() {
      st.out = T.buildTheta6(st.pts);
      const n = st.pts.length;
      if (n >= 2) {
        st.res = T.spanningRatio(st.pts, st.out);
        st.und = T.spanningRatio(st.pts, st.out, { undirected: true });
        st.r98 = T.spanningRatio(st.pts, st.out, { norm: (p, q) => T.tippedNorm(q.x - p.x, q.y - p.y) });
        st.greedyMax = n <= 120 ? T.greedyRatio(st.pts, st.out) : null;
      } else st.res = st.und = st.r98 = st.greedyMax = null;
      if (st.s != null && st.t != null && st.s < n && st.t < n) {
        const sp = T.shortestPath(st.pts, st.out, st.s, st.t, st.undirected);
        const g = T.greedyRoute(st.pts, st.out, st.s, st.t);
        st.route = { sp, g, d: T.dist(st.pts[st.s], st.pts[st.t]) };
      } else st.route = null;
      updatePanel();
      view.requestDraw();
    }
    function updatePanel() {
      const n = st.pts.length;
      let m = 0; st.out.forEach((row) => row.forEach((w) => { if (w >= 0) m++; }));
      $('#lab-stat-n').textContent = n;
      $('#lab-stat-m').textContent = m;
      $('#lab-stat-ratio').textContent = st.res ? fmt(st.res.ratio) : '—';
      $('#lab-stat-und').textContent = st.und ? fmt(st.und.ratio) : '—';
      $('#lab-stat-98').textContent = st.r98 ? fmt(st.r98.ratio) : '—';
      $('#lab-stat-greedy').textContent = st.greedyMax ? fmt(st.greedyMax.ratio) : (n > 120 ? 'n > 120' : '—');
      $('#lab-bar').style.setProperty('--v', st.res ? Math.min(1, (st.res.ratio - 1) / 4) : 0);
      const rt = $('#lab-route');
      if (st.route) {
        const { sp, g, d } = st.route;
        const name = (k) => (k === st.s ? 's' : k === st.t ? 't' : 'v' + k);
        rt.innerHTML =
          `<div class="kv"><span>|st|</span><b>${fmt(d)}</b></div>` +
          `<div class="kv"><span><i class="sw sw-sp"></i>shortest ${st.undirected ? '(undirected)' : '(directed)'}</span><b>${fmt(sp.length)} · ×${fmt(sp.length / d)}</b></div>` +
          `<div class="kv"><span><i class="sw sw-greedy"></i>greedy</span><b>${g.reached ? fmt(g.length) + ' · ×' + fmt(g.length / d) : 'stuck (' + g.reason + ')'}</b></div>` +
          `<p class="hops">greedy: ${g.path.map(name).join(' → ')}</p>`;
      } else rt.innerHTML = `<p class="muted">${st.mode === 'route' ? (st.s == null ? 'Click a source point s.' : 'Now click a target t.') : 'Switch to <b>Route</b> mode and click two points.'}</p>`; 
    }


    // greedy animation
    function stopAnim() { if (st.anim) cancelAnimationFrame(st.anim.raf); st.anim = null; }
    function playGreedy() {
      if (!st.route || st.route.g.path.length < 2) return;
        stopAnim();
      const path = st.route.g.path, pts = st.pts;
     const seg = []; let total = 0;
      for (let i = 0; i + 1 < path.length; i++) { const L = T.dist(pts[path[i]], pts[path[i + 1]]); seg.push(L); total += L; }
      const dur = Math.min(9000, 900 + 650 * path.length);
      const t0 = performance.now();
      const tick = (now) => {
        const f = Math.min(1, (now - t0) / dur);
        let dLeft = f * total, i = 0;
        while (i < seg.length - 1 && dLeft > seg[i]) { dLeft -= seg[i]; i++; }
        const a = pts[path[i]], b = pts[path[i + 1]], u = seg[i] ? Math.min(1, dLeft / seg[i]) : 1;
        st.anim = { raf: 0, pos: { x: a.x + u * (b.x - a.x), y: a.y + u * (b.y - a.y) }, upto: i, travelled: f * total, seg: i };
        view.requestDraw();
        if (f < 1) st.anim.raf = requestAnimationFrame(tick);
      };
      st.anim = { raf: requestAnimationFrame(tick) };
    }

    // draw
    const view = new View(canvas, {
      pad: 18, pan: false,
     draw(ctx, v) {
        const pts = st.pts;
        const focus = st.mode === 'edit' && st.hover != null ? st.hover : null;
        if (focus != null && st.showCones) D.cones(ctx, v, pts[focus], 0.06, 40);  
        const routeShown = !!st.route;
        drawGraph(ctx, v, pts, st.out, { undirected: st.undirected, dim: routeShown || (focus != null) });
          if (focus != null) {
          for (let i = 0; i < 6; i++) {
            const w = st.out[focus][i];
            if (w < 0) continue;
            if (st.showTri) D.poly(ctx, v, T.canonicalTriangle(pts[focus], pts[w]), withAlpha(C.cone[i], 0.14), C.cone[i], 1.2);
            D.arrow(ctx, v, pts[focus], pts[w], C.cone[i], 2.4, 7, 9);
          }
        }
        if (!routeShown && st.showWorst && st.res && st.res.path && focus == null) {
           drawPath(ctx, v, pts, st.res.path, withAlpha(C.ink, 0.85), 3.2);
          const a = pts[st.res.s], b = pts[st.res.t];
          D.line(ctx, v, a, b, C.muted, 1.2, [5, 5]);
          D.text(ctx, v, a, 's', C.ink, { dx: 10, dy: -10, weight: '700', halo: C.surface, mono: true });
          D.text(ctx, v, b, 't', C.ink, { dx: 10, dy: -10, weight: '700', halo: C.surface, mono: true });
          }
        if (routeShown) {
          const { sp, g } = st.route;
          drawPath(ctx, v, pts, sp.path, C.sp, 4);
          const upto = st.anim && st.anim.upto != null ? st.anim.upto + 1 : g.path.length - 1;
          drawPath(ctx, v, pts, g.path.slice(0, upto + 1), C.greedy, 2.6, [7, 5]);
          D.line(ctx, v, pts[st.s], pts[st.t], C.muted, 1.2, [2, 4]);
        }
        drawPoints(ctx, v, pts);
        if (st.s != null && st.s < pts.length) { D.dot(ctx, v, pts[st.s], 8, null, C.ink, 2.5); D.text(ctx, v, pts[st.s], 's', C.ink, { dx: 11, dy: -11, weight: '700', mono: true, halo: C.surface }); }  
          if (st.t != null && st.t < pts.length) { D.dot(ctx, v, pts[st.t], 8, null, C.ink, 2.5); D.text(ctx, v, pts[st.t], 't', C.ink, { dx: 11, dy: -11, weight: '700', mono: true, halo: C.surface }); }
        if (st.anim && st.anim.pos) D.dot(ctx, v, st.anim.pos, 7, C.greedy, C.surface, 2);
        if (focus != null) D.dot(ctx, v, pts[focus], 7, null, C.ink, 2);
        if (!pts.length) D.text(ctx, v, { x: 0.5, y: 0.5 }, 'Click anywhere to add points', C.muted, { align: 'center', size: 15 });
      },
    });

    interact(view, {
      hit: (w) => pick(view, st.pts, w, 12),
      hover: (h) => { if (st.hover !== h) { st.hover = h; view.requestDraw(); } },
      move: (i, w) => {
        if (st.mode !== 'edit') return;
        st.pts[i] = { x: w.x + jitter(), y: w.y + jitter() };
        st.hover = i;
        scheduleRecompute();
      },
      click: (i, w, ev) => {
        if (st.mode === 'edit') {
          if (ev.shiftKey || ev.altKey) removePoint(i);
          return;
        }
        stopAnim();
        if (st.s == null || (st.s != null && st.t != null)) { st.s = i; st.t = null; }
        else if (i !== st.s) st.t = i;
        recompute();
        if (st.t != null) playGreedy();
      },
      empty: (w) => {
        if (st.mode !== 'edit') { st.s = st.t = null; stopAnim(); recompute(); return; }
        st.pts.push({ x: w.x + jitter(), y: w.y + jitter() });
        recompute();
      },
      context: (i) => { if (i != null) removePoint(i); },
    });
    function removePoint(i) {
      st.pts.splice(i, 1);
      const fix = (k) => (k == null ? null : k === i ? null : k > i ? k - 1 : k);
      st.s = fix(st.s); st.t = fix(st.t); st.hover = null; stopAnim();
      recompute();
    }
    let pending = 0;
    function scheduleRecompute() { if (pending) return; pending = requestAnimationFrame(() => { pending = 0; recompute(); }); }

    // controls
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      st.mode = b.dataset.mode;
      root.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      canvas.classList.toggle('route-mode', st.mode === 'route');
      st.hover = null; updatePanel(); view.requestDraw();
    }));
    root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      preset(b.dataset.preset);
      if (st.s != null && st.t != null) {
        root.querySelector('[data-mode="route"]').click();
        playGreedy();
      }
    }));
    $('#lab-n').addEventListener('input', () => { $('#lab-n-out').textContent = $('#lab-n').value; });
    const tog = (id, key) => $(id).addEventListener('change', (e) => { st[key] = e.target.checked; recompute(); });
     tog('#lab-und', 'undirected'); tog('#lab-cones', 'showCones'); tog('#lab-tri', 'showTri'); tog('#lab-worst', 'showWorst');
    $('#lab-play').addEventListener('click', playGreedy);
    $('#lab-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ points: st.pts }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'theta6-points.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#lab-import').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
        try {
          const data = JSON.parse(await f.text());
        const P = (data.points || data).map((p) => ({ x: +p.x, y: +p.y })).filter((p) => isFinite(p.x) && isFinite(p.y));
        if (P.length) { st.pts = P; st.s = st.t = null; const xs = P.map((p) => p.x), ys = P.map((p) => p.y);
          view.fit({ minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }); recompute(); }
      } catch (err) { alert('Could not read this file: ' + err.message); }
      e.target.value = '';
    });
    randomSet(14);
    recompute();
  }

  window.initLab = initLab;
})();
