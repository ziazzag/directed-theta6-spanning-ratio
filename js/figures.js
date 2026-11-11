(function () {
  'use strict';
  const T = window.Theta6, { View, interact, pick, D, C, withAlpha } = window.Viz;
  const S3 = Math.sqrt(3);
  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 3 : d) : '∞');

  // hero animation
  function initHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = T.rng(7);
    let pts = [], vel = [], W = 10, H = 5, res = null, frame = 0, visible = true;
    const view = new View(canvas, {
      pad: 0,
      draw(ctx, v) {
        if (!pts.length) return;
        const out = T.buildTheta6(pts);
        if (frame % 6 === 0 || !res) res = T.spanningRatio(pts, out);
        for (let u = 0; u < pts.length; u++) for (let i = 0; i < 6; i++) {
          const w = out[u][i]; if (w < 0) continue;
          D.arrow(ctx, v, pts[u], pts[w], withAlpha(C.cone[i], 0.55), 1.2, 5, 6);
        }
        if (res && res.path) window.drawTheta6.drawPath(ctx, v, pts, res.path, withAlpha(C.ink, 0.75), 2.6);
        for (const p of pts) D.dot(ctx, v, p, 2.6, C.ink);
        const ro = document.getElementById('hero-live'); 
        if (ro && res) ro.textContent = res.ratio.toFixed(3);
      },
    });
    function setup() {
      W = Math.max(4, view.w / 90); H = Math.max(3, view.h / 90);
      view.fit({ minX: 0, maxX: W, minY: 0, maxY: H });
      const n = Math.round(Math.min(46, Math.max(18, W * H * 0.9)));
      pts = Array.from({ length: n }, () => ({ x: rand() * W, y: rand() * H }));
      vel = pts.map(() => { const a = rand() * 2 * Math.PI; return { x: 0.004 * Math.cos(a), y: 0.004 * Math.sin(a) }; });
    }
    new ResizeObserver(() => { view.resize(); setup(); view.requestDraw(); }).observe(canvas);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
    function loop() {
      if (visible && !document.hidden && pts.length) {
        frame++;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i], q = vel[i];
          p.x += q.x; p.y += q.y;
          if (p.x < 0 || p.x > W) q.x *= -1;
          if (p.y < 0 || p.y > H) q.y *= -1;
        }
        view.requestDraw();
      }
      requestAnimationFrame(loop);  
    }
    if (!reduce) requestAnimationFrame(loop);
  }

 // fig of section 01
  function initDefinition() {
    const root = document.getElementById('def-fig');
    if (!root) return;
    const canvas = root.querySelector('canvas');
     const rand = T.rng(3);
    const pts = [{ x: 0.5, y: 0.5 }];
    while (pts.length < 15) {
      const p = { x: 0.04 + 0.92 * rand(), y: 0.04 + 0.92 * rand() };
      if (pts.every((q) => T.dist(p, q) > 0.12)) pts.push(p);
    }
    let mode = 'proj', hover = null;
    const view = new View(canvas, {
      pad: 14,
      draw(ctx, v) {
        const u = pts[0];
        const out = T.buildTheta6(pts)[0];
        D.cones(ctx, v, u, 0.07, 30);
        const b = v.bounds(); const R = 3 * Math.hypot(b.maxX - b.minX, b.maxY - b.minY);
        for (let w = 1; w < pts.length; w++) {
          const i = T.coneOf(pts[w].x - u.x, pts[w].y - u.y);
          const win = out[i] === w;
          if (mode === 'proj') {
            const pr = T.proj(u, pts[w], i);
            const f = { x: u.x + pr * T.BIS[i][0], y: u.y + pr * T.BIS[i][1] };
            D.line(ctx, v, pts[w], f, withAlpha(C.cone[i], win ? 0.95 : 0.45), win ? 1.6 : 1, [3, 3]);
            D.dot(ctx, v, f, win ? 3.5 : 2.2, withAlpha(C.cone[i], win ? 1 : 0.6));
          }
       }
        for (let i = 0; i < 6; i++) {
          if (mode === 'proj') D.line(ctx, v, u, { x: u.x + R * T.BIS[i][0], y: u.y + R * T.BIS[i][1] }, withAlpha(C.cone[i], 0.6), 1);
          const w = out[i]; if (w < 0) continue;
          if (mode === 'tri') D.poly(ctx, v, T.canonicalTriangle(u, pts[w]), withAlpha(C.cone[i], 0.16), C.cone[i], 1.4);
          else {
            const tri = T.canonicalTriangle(u, pts[w]);
            D.line(ctx, v, tri[1], tri[2], C.cone[i], 1.4);
          }
          D.arrow(ctx, v, u, pts[w], C.cone[i], 2.4, 7, 9);
        }
        for (let w = 1; w < pts.length; w++) D.dot(ctx, v, pts[w], 4.5, C.ink, C.surface, 1.5);
       D.dot(ctx, v, u, 7, C.ink, C.surface, 2);
        D.text(ctx, v, u, 'u', C.ink, { dx: 11, dy: 12, weight: '700', mono: true, halo: C.surface });
        if (hover != null && hover !== 0) D.dot(ctx, v, pts[hover], 8, null, C.ink, 1.5);
      }, 
    });
    interact(view, {
      hit: (w) => pick(view, pts, w, 14),  
      hover: (h) => { hover = h; view.requestDraw(); },
      move: (i, w) => { pts[i] = { x: Math.min(1.05, Math.max(-0.05, w.x)), y: Math.min(1.05, Math.max(-0.05, w.y)) }; view.requestDraw(); },  
    });
    root.querySelectorAll('[data-defmode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.defmode; 
      root.querySelectorAll('[data-defmode]').forEach((x) => x.setAttribute('aria-pressed', x === b));  
      view.requestDraw();
    }));
  }
  
    // proof figure
  function clip(poly, a, dir) { // keep left side of the line
    const side = (p) => dir[0] * (p.y - a.y) - dir[1] * (p.x - a.x);
    const res = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length];
      const sp = side(P), sq = side(Q);
      if (sp >= 0) res.push(P);
      if ((sp >= 0) !== (sq >= 0)) { const f = sp / (sp - sq); res.push({ x: P.x + f * (Q.x - P.x), y: P.y + f * (Q.y - P.y) }); }
    }
    return res;
  }

  function initProof() {
    const root = document.getElementById('proof-fig');
    if (!root) return;
    const canvas = root.querySelector('canvas');  
    const $ = (s) => root.querySelector(s);
    const t = { x: 0, y: 0 };
    let s = { x: 0.16, y: -S3 / 2 }; 
    let y = { x: 0.32, y: -0.012 };
    let hover = null;
    const ray = (o, i, L) => ({ x: o.x + L * T.BIS[i][0], y: o.y + L * T.BIS[i][1] });

    function geometry() {
      const st97 = T.hexNorm(s.x - t.x, s.y - t.y);
      const st98 = T.tippedNorm(s.x - t.x, s.y - t.y);
      const y0 = 2 * (st97 - st98); // lemma 2
      const p = T.rayIntersect(s, T.BIS[3], t, T.BIS[1]);
      const q = T.rayIntersect(s, T.BIS[4], t, T.BIS[0]);
      const Ttri = [s, { x: s.x + y0, y: s.y }, { x: s.x + y0 / 2, y: s.y + y0 * S3 / 2 }];
      // window from lemma 4
      const hmin = 1 - (1 - 2.5 * y0) / 3.5;
      const [r0, r1] = T.BND[3];
      let win = [{ x: s.x + hmin * r0[0], y: s.y + hmin * r0[1] }, { x: s.x + r0[0], y: s.y + r0[1] },  
        { x: s.x + r1[0], y: s.y + r1[1] }, { x: s.x + hmin * r1[0], y: s.y + hmin * r1[1] }];
      win = clip(win, t, T.BND[1][0]);
      win = clip(win, t, [-T.BND[1][1][0], -T.BND[1][1][1]]);
      return { st97, st98, y0, p, q, Ttri, win, hmin };
    }
    const view = new View(canvas, {
      pad: 16, box: { minX: -0.62, maxX: 0.95, minY: -1.0, maxY: 0.32 },
      draw(ctx, v) {
        const g = geometry();
        // hexagon around t
        const hex = [0, 60, 120, 180, 240, 300].map((a) => ({ x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) }));
        D.poly(ctx, v, hex, null, withAlpha(C.muted, 0.7), 1, [6, 5]);
        D.cones(ctx, v, t, 0.045, 34);
        const L = 3;
        D.line(ctx, v, t, ray(t, 0, L), C.cone[0], 1.3);
        D.line(ctx, v, t, ray(t, 1, L), C.cone[1], 1.3);
        D.line(ctx, v, s, ray(s, 3, L), C.cone[3], 1.3);
        D.line(ctx, v, s, ray(s, 4, L), C.cone[4], 1.3);
        // region R
        if (g.p && g.q) {
          D.poly(ctx, v, T.canonicalTriangle(s, g.p), C.fillR, withAlpha(C.ink2, 0.6), 1);
          D.poly(ctx, v, T.canonicalTriangle(s, g.q), C.fillR, withAlpha(C.ink2, 0.6), 1);
          D.poly(ctx, v, [s, g.q, t, g.p], C.fillR, C.ink2, 1.4);
          D.dot(ctx, v, g.p, 3.5, C.ink2); D.dot(ctx, v, g.q, 3.5, C.ink2);
          D.text(ctx, v, g.p, 'p', C.ink2, { dx: 8, dy: -8, mono: true, weight: '600', halo: C.surface });
          D.text(ctx, v, g.q, 'q', C.ink2, { dx: -14, dy: 0, mono: true, weight: '600', halo: C.surface });
        }
        // triangle T
        D.poly(ctx, v, g.Ttri, withAlpha(C.cone[2], 0.35), C.cone[2], 1.4);
        D.text(ctx, v, g.Ttri[1], 'T', C.ink, { dx: 6, dy: 8, mono: true, weight: '600', halo: C.surface });
        if (g.win.length > 2) D.poly(ctx, v, g.win, withAlpha(C.greedy, 0.28), C.greedy, 1.2);
        const yc = T.coneOf(y.x - s.x, y.y - s.y);
        if (yc === 3) D.poly(ctx, v, T.canonicalTriangle(s, y), null, C.cone[3], 1, [4, 3]);
        D.arrow(ctx, v, s, y, C.ink, 2, 7, 9);
        D.line(ctx, v, s, t, C.muted, 1, [2, 4]);
        for (const [p, l] of [[s, 's'], [t, 't'], [y, 'y']]) {
          D.dot(ctx, v, p, l === 't' ? 5 : 6.5, C.ink, C.surface, 2);
          D.text(ctx, v, p, l, C.ink, { dx: 10, dy: l === 's' ? 12 : -10, weight: '700', mono: true, halo: C.surface });
        }
        if (hover) D.dot(ctx, v, hover === 's' ? s : y, 10, null, C.ink, 1.2);
        // numbers
        const y1 = 1 - T.hexNorm(y.x - s.x, y.y - s.y);
        const inT1 = T.coneOf(y.x, y.y) === 1;
        $('#pf-st2').textContent = fmt(T.dist(s, t));
        $('#pf-st98').textContent = fmt(g.st98);
        $('#pf-y0').textContent = fmt(g.y0);
        $('#pf-bound').textContent = fmt(5 * g.st98);
        $('#pf-bound2').textContent = fmt(5 - 2.5 * g.y0);
        $('#pf-y1').textContent = yc === 3 ? fmt(y1) : '— (y ∉ C_s^3)';
        const lhs = 2.5 * g.y0 + 3.5 * y1;
        const ok = yc === 3 && inT1 && lhs < 1 && y1 >= 0;
        $('#pf-lhs').textContent = yc === 3 ? fmt(lhs) : '—';
        const st = $('#pf-status');
        st.textContent = yc !== 3 ? 'y is not in C_s^3' : y1 < 0 ? 'y is beyond t: sy would not be the Θ6 edge' : !inT1 ? 'y ∉ C_t^1: Lemma 4 rules this out' : ok ? 'compatible with a counterexample (red window)' : '2.5y₀ + 3.5y₁ ≥ 1: Lemma 4 rules this out';
        st.dataset.ok = ok;
      },
    });  
    interact(view, {
      hit: (w) => (T.dist(w, s) * view.scale < 14 ? 's' : T.dist(w, y) * view.scale < 14 ? 'y' : null),
      hover: (h) => { hover = h; view.requestDraw(); },
      move: (h, w) => {
        if (h === 's') s = { x: Math.min(0.49, Math.max(0.005, w.x)), y: -S3 / 2 };
        else y = { x: w.x, y: w.y };
        view.requestDraw();
      },  
     });
  }


  window.initFigures = function () { initHero(); initDefinition(); initProof(); };
})();
