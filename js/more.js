// figures added for the final version: greedy spiral (§2), Lemma 9 and the linear programs (§5)
(function () {
  'use strict';
  const T = window.Theta6, { View, interact, D, C, withAlpha } = window.Viz;
  const S3 = Math.sqrt(3);
  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 3 : d) : '∞');

  // ---------- spiral ----------
  function initSpiral() {
    const root = document.getElementById('spiral-fig');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    let rho = 0.7, pts, out, g, sp;
    let anim = null, step = -1; // step = index in g.path that is highlighted
    function rebuild() {
      pts = T.spiralPoints(25, rho, 45);
      out = T.buildTheta6(pts);
      g = T.greedyRoute(pts, out, 1, 0, 500);
      sp = T.shortestPath(pts, out, 1, 0);
      const st = T.dist(pts[0], pts[1]);
      $('#sp-turns').textContent = fmt(Math.abs(T.windingAround(pts, g.path)), 2);
      $('#sp-visited').textContent = g.path.length;
      $('#sp-greedy').textContent = fmt(g.length / st);
      $('#sp-short').textContent = fmt(sp.length / st);
      step = -1;
      view.requestDraw();
    }
    const view = new View($('canvas'), {
      pad: 14, zoom: true, pan: true, box: { minX: -1.05, maxX: 1.05, minY: -1.05, maxY: 1.05 },
      draw(ctx, v) {
        const b = v.bounds();
        const tiny = 2.5 / v.scale;
        // all edges, light
        for (let a = 0; a < pts.length; a++) for (const c of out[a]) if (c >= 0) D.arrow(ctx, v, pts[a], pts[c], withAlpha(C.muted, 0.35), 1, 4, 5);
        // greedy path
        const upto = step < 0 ? g.path.length - 1 : step;
        for (let i = 0; i < upto; i++) {
          const a = pts[g.path[i]], c = pts[g.path[i + 1]];
          D.arrow(ctx, v, a, c, C.cone[T.coneOf(c.x - a.x, c.y - a.y)], 2.2, 5, 7);
        }
        if (step >= 0 && step < g.path.length) {
          const a = pts[g.path[step]];
          D.poly(ctx, v, T.canonicalTriangle(a, pts[0]), withAlpha(C.greedy, 0.12), C.greedy, 1, [4, 3]);
          D.dot(ctx, v, a, 9, null, C.ink, 1.5);
        }
        pts.forEach((p, i) => { if (p.x > b.minX - tiny && p.x < b.maxX + tiny) D.dot(ctx, v, p, i === 0 ? 5 : 3.2, i === 0 ? C.ink : C.ink2, C.surface, 1.2); });
        D.text(ctx, v, pts[0], 't', C.ink, { dx: 8, dy: -8, weight: '700', mono: true, halo: C.surface });
        D.text(ctx, v, pts[1], 's', C.ink, { dx: 8, dy: 10, weight: '700', mono: true, halo: C.surface });
        const zoom = 1 / Math.min(1, (b.maxX - b.minX) / 2.1);
        $('#sp-zoom').textContent = zoom < 1.5 ? '' : `zoom ×${zoom < 100 ? zoom.toFixed(1) : Math.round(zoom)}`;
      },
    });
    interact(view, {});
    $('#sp-walk').addEventListener('click', () => {
      if (anim) { cancelAnimationFrame(anim); anim = null; }
      const t0 = performance.now(), per = 650, n = g.path.length - 1;
      const tick = (now) => {
        const f = (now - t0) / per;
        step = Math.min(n, Math.floor(f));
        // zoom smoothly between the distances of two consecutive points
        const k = Math.min(n - 1, Math.floor(f)), fr = Math.min(1, f - k);
        const r0 = Math.hypot(pts[g.path[k]].x, pts[g.path[k]].y), r1 = Math.hypot(pts[g.path[Math.min(k + 1, n - 1)]].x, pts[g.path[Math.min(k + 1, n - 1)]].y);
        const r = Math.exp(Math.log(r0) * (1 - fr) + Math.log(r1) * fr);
        view.cx = 0; view.cy = 0; view.scale = Math.min(view.w, view.h) * 0.42 / r; view.userMoved = true;
        view.requestDraw();
        if (f < n) anim = requestAnimationFrame(tick); else { anim = null; }
      };
      anim = requestAnimationFrame(tick);
    });
    $('#sp-reset').addEventListener('click', () => { if (anim) cancelAnimationFrame(anim); anim = null; step = -1; view.userMoved = false; view.fit(); });
    const sl = $('#sp-rho');
    sl.addEventListener('input', () => { rho = +sl.value; $('#sp-rho-out').textContent = rho.toFixed(2); rebuild(); });
    sl.value = rho; $('#sp-rho-out').textContent = rho.toFixed(2);
    rebuild();
  }

  // ---------- Lemma 9 ----------
  function initLemma9() {
    const root = document.getElementById('l9-fig');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const t = { x: 0, y: 0 };
    let u = { x: -0.12, y: -0.78 }, v = { x: 0.24, y: -0.05 }, hover = null;
    const R = (o, ang, L) => ({ x: o.x + L * Math.cos(ang * Math.PI / 180), y: o.y + L * Math.sin(ang * Math.PI / 180) });
    const view = new View($('canvas'), {
      pad: 14, box: { minX: -0.62, maxX: 0.72, minY: -0.95, maxY: 0.18 },
      draw(ctx, vw) {
        D.cones(ctx, vw, t, 0.035, 30);
        // bisectors B_t^0 (270°) and B_t^1 (330°)
        D.line(ctx, vw, t, R(t, 270, 3), C.cone[0], 1.2, [5, 4]);
        D.line(ctx, vw, t, R(t, 330, 3), C.cone[1], 1.2, [5, 4]);
        D.text(ctx, vw, R(t, 270, 0.9), 'B⁰', C.cone[0], { dx: 6, mono: true, weight: '600', halo: C.surface });
        D.text(ctx, vw, R(t, 330, 0.75), 'B¹', C.cone[1], { dy: -10, mono: true, weight: '600', halo: C.surface });
        // canonical triangle of u towards t
        D.poly(ctx, vw, T.canonicalTriangle(u, t), withAlpha(C.cone[3], 0.14), withAlpha(C.cone[3], 0.8), 1);
        // and the one of u towards v (the proof uses it)
        D.poly(ctx, vw, T.canonicalTriangle(u, v), null, C.ink2, 1.2, [5, 4]);
        // the two helper points of the proof: t' on B_t^0 (ray from v at 240°), v' above v on the line of t
        const tp = { x: 0, y: v.y - S3 * v.x };
        const vp = { x: v.x, y: 0 };
        D.line(ctx, vw, v, tp, C.greedy, 2.2);
        D.line(ctx, vw, t, vp, C.sp, 3);
        D.line(ctx, vw, v, vp, C.muted, 1, [2, 3]);
        D.arrow(ctx, vw, u, v, C.ink, 2, 7, 9);
        for (const [p, l, dx, dy] of [[t, 't', -14, -8], [u, 'u', -14, 6], [v, 'v', 10, 10], [tp, "t'", -18, 0], [vp, "v'", 6, -10]]) {
          const main = l === 't' || l === 'u' || l === 'v';
          D.dot(ctx, vw, p, main ? 6 : 3.5, main ? C.ink : C.ink2, C.surface, 1.5);
          D.text(ctx, vw, p, l, C.ink, { dx, dy, weight: '700', mono: true, halo: C.surface });
        }
        if (hover) D.dot(ctx, vw, hover === 'u' ? u : v, 11, null, C.ink, 1.2);
        // numbers
        const vt = T.tippedNorm(v.x - t.x, v.y - t.y), uv = T.hexNorm(v.x - u.x, v.y - u.y);
        const [A, B, Cc] = T.canonicalTriangle(u, t);
        const inTri = T.strictlyInsideTriangle(v, A, B, Cc, 0);
        const c0 = T.segmentCrossesRay(u, v, t, T.BIS[0]), c1 = T.segmentCrossesRay(u, v, t, T.BIS[1]);
        $('#l9-vt').textContent = fmt(vt);
        $('#l9-vpt').textContent = fmt(T.dist(vp, t));
        $('#l9-vtp').textContent = fmt(T.dist(v, tp));
        $('#l9-uv').textContent = fmt(uv);
        const hyp = inTri && c0 && c1;
        const st = $('#l9-status');
        st.textContent = !inTri ? 'v is not in the triangle of u towards t' : !(c0 && c1) ? 'uv does not cross both B⁰ and B¹' :
          (2 * vt <= uv + 1e-12 ? `holds: 2 × ${fmt(vt)} ≤ ${fmt(uv)}` : 'VIOLATED (should never happen)');
        st.dataset.ok = hyp && 2 * vt <= uv + 1e-12;
      },
    });
    interact(view, {
      hit: (w) => (T.dist(w, u) * view.scale < 14 ? 'u' : T.dist(w, v) * view.scale < 14 ? 'v' : null),
      hover: (h) => { hover = h; view.requestDraw(); },
      move: (h, w) => { if (h === 'u') u = { x: w.x, y: Math.min(-0.05, w.y) }; else v = { x: w.x, y: w.y }; view.requestDraw(); },
    });
  }

  // ---------- linear programs ----------
  function initLP() {
    const root = document.getElementById('lp');
    if (!root || !window.LP6) return;
    const LP = window.LP6, $ = (s) => root.querySelector(s);
    let res = null, sel = 'X0, Y0, (18)';
    const grid = $('#lp-grid');
    const rowsY = [['Y0', 'X0'], ['Y0', 'X1'], ['Y1', 'X0'], ['Y1', 'X1']];
    const cols = ['(18)', 'J2', 'J3', 'J4', 'J5'];
    function drawGrid() {
      let h = '<thead><tr><th></th>' + cols.map((c) => `<th>${c === '(18)' ? 'no j (18)' : c}</th>`).join('') + '</tr></thead><tbody>';
      for (const [y, x] of rowsY) {
        h += `<tr><th>${x}, ${y}</th>`;
        for (const j of cols) {
          const name = `${x}, ${y}, ${j}`;
          const r = res && res.find((q) => q.name === name);
          const cls = !r ? '' : r.feasible ? 'open' : 'closed';
          const txt = !r ? '·' : r.feasible ? 'feasible' : 'infeasible';
          h += `<td><button class="lpcell ${cls}" data-name="${name}" aria-pressed="${name === sel}">${txt}</button></td>`;
        }
        h += '</tr>';
      }
      grid.innerHTML = h + '</tbody>';
      grid.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { sel = b.dataset.name; drawGrid(); detail(); }));
    }
    const qtex = (q) => {
      const n = LP.qstr(q);
      return n.includes('/') ? `\\tfrac{${n.split('/')[0]}}{${n.split('/')[1]}}` : n;
    };
    function detail() {
      const box = $('#lp-detail');
      if (!res) { box.innerHTML = ''; return; }
      const r = res.find((q) => q.name === sel);
      let h = `<h4>Case ${r.name}</h4>`;
      if (r.feasible) {
        h += `<p>The solver finds values of the variables that satisfy all ${LP.system(r).length} inequalities (largest margin on the strict ones: ${r.slack.toFixed(4)}). So linear programming alone does not give a contradiction here.` +
          (r.paperOpen ? ' This is one of the four cases the paper also leaves open at this point, and it closes them in its Section 5.3 with a third path.' : ' <b>This case is not in the list of the paper.</b>') + '</p>';
      } else {
        const c = r.cert;
        h += `<p>No solution. To see it without trusting the solver, multiply each inequality below by its weight and add everything up (all variables are lengths, so they are \\(\\ge 0\\)).</p>`;
        h += '<table class="tbl lptab"><thead><tr><th>weight</th><th>inequality</th><th>from</th></tr></thead><tbody>';
        h += c.rows.map((row) => `<tr><td class="mono">${LP.qstr(row.w)}</td><td>\\(${row.q.tex}\\)</td><td>${row.q.src}</td></tr>`).join('');
        h += '</tbody></table>';
        const lhs = c.sum.length ? c.sum.map((s) => `${qtex(s.c)}\\,${LP.TEX(s.v)}`).join('+') : '0';
        const rel = c.strict ? '<' : '\\le';
        h += `<p class="lpsum">Sum: \\(${lhs} ${rel} ${qtex(c.rhs)}\\). The left side is \\(\\ge 0\\), so this is impossible. Checked with exact fractions: ${c.ok ? '<b>OK</b>' : '<b>failed</b>'}.</p>`;
      }
      box.innerHTML = h;
      if (window.renderMath) window.renderMath(box);
    }
    $('#lp-run').addEventListener('click', () => {
      const t0 = performance.now();
      res = LP.solveAll();
      const open = res.filter((r) => r.feasible);
      $('#lp-summary').textContent = `${20 - open.length} of 20 systems are infeasible, ${res.filter((r) => r.cert && r.cert.ok).length} certificates checked exactly (${(performance.now() - t0).toFixed(0)} ms). ` +
        `Still feasible: ${open.map((r) => '(' + r.name + ')').join(', ')}.`;
      drawGrid(); detail();
    });
    drawGrid();
    // solve once when the section comes into view (it takes a few ms)
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !res) { $('#lp-run').click(); io.disconnect(); } });
    io.observe(root);
  }

  // ---------- 4 - eps with 5 points (§3) ----------
  function initFour() {
    const root = document.getElementById('four-fig');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const NAMES = ['s', 't', 'a', 'b', 'c'];
    let d = 0.02, pts, out, sp;
    function rebuild() {
      // same s, a, b, c as Lemma 1 (§3), t at the origin
      pts = [{ x: -1 + d, y: -d }, { x: 0, y: 0 }, { x: -0.5 + d, y: S3 / 2 - 2 * d }, { x: 0.5 - 2 * d, y: S3 / 2 - 3 * d }, { x: 1 - 6 * d, y: d }];
      out = T.buildTheta6(pts);
      sp = T.shortestPath(pts, out, 0, 1);
      const st = T.dist(pts[0], pts[1]), r = sp.length / st;
      $('#four-delta-out').textContent = d.toFixed(4);
      $('#four-len').textContent = fmt(sp.length, 4);
      $('#four-st').textContent = fmt(st, 4);
      $('#four-ratio').textContent = fmt(r, 4);
      $('#four-gap').textContent = fmt((4 - r) / d, 2);
      $('#four-path').textContent = sp.path.map((i) => NAMES[i]).join(' → ');
      view.requestDraw();
    }
    const view = new View($('canvas'), {
      pad: 18, box: { minX: -1.15, maxX: 1.15, minY: -0.35, maxY: 1.05 },
      draw(ctx, v) {
        const hex = [0, 60, 120, 180, 240, 300].map((a) => ({ x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) }));
        D.poly(ctx, v, hex, null, withAlpha(C.muted, 0.7), 1, [6, 5]);
        if ($('#four-all').checked) for (let a = 0; a < pts.length; a++) for (const c of out[a]) if (c >= 0) D.arrow(ctx, v, pts[a], pts[c], withAlpha(C.muted, 0.6), 1, 7, 7);
        for (let i = 0; i + 1 < sp.path.length; i++) {
          const a = pts[sp.path[i]], c = pts[sp.path[i + 1]];
          D.arrow(ctx, v, a, c, C.cone[T.coneOf(c.x - a.x, c.y - a.y)], 3, 8, 10);
        }
        D.line(ctx, v, pts[0], pts[1], C.muted, 1, [2, 4]);
        pts.forEach((p, i) => {
          D.dot(ctx, v, p, 5.5, C.ink, C.surface, 1.5);
          D.text(ctx, v, p, NAMES[i], C.ink, { dx: i === 4 ? 10 : -16, dy: i === 0 || i === 1 ? 12 : -10, weight: '700', mono: true, halo: C.surface });
        });
      },
    });
    const sl = $('#four-delta');
    sl.value = Math.log10(d);
    sl.addEventListener('input', () => { d = Math.pow(10, +sl.value); rebuild(); });
    $('#four-all').addEventListener('change', () => view.requestDraw());
    rebuild();
  }

  // ---------- the y-path and the x-path (§5) ----------
  function initTwoPaths() {
    const root = document.getElementById('two-fig');
    if (!root) return;
    const $ = (q) => root.querySelector(q);
    const s0 = { x: 0.16, y: -S3 / 2 }, t = { x: 0, y: 0 };
    // pts[0] = s, pts[1] = t, the rest random in a box around t
    function randomSet(seed) {
      const r = T.rng(seed), n = 14 + Math.floor(r() * 16), pts = [{ ...s0 }, { ...t }];
      while (pts.length < n) { const p = { x: r() * 2.2 - 1.1, y: r() * 1.9 - 1.25 }; if (Math.hypot(p.x, p.y) >= 0.05) pts.push(p); }
      return pts;
    }
    const EXAMPLE = 5221; // found with a small search: y-path ccw, x-path cw, both with a few edges
    let pts = randomSet(EXAMPLE), out, Y, X, hover = null, seed = EXAMPLE;
    const rays = (L) => T.BND.map((b) => ({ x: L * b[1][0], y: L * b[1][1] }));
    function compute() {
      out = T.buildTheta6(pts);
      const path = (c) => {
        const v = out[0][c];
        if (v < 0) return null;
        const g = T.greedyRoute(pts, out, v, 1, 500);
        return { path: [0, ...g.path], length: T.dist(pts[0], pts[v]) + g.length, reached: g.reached || v === 1 };
      };
      Y = path(3); X = path(4);
      const sp = T.shortestPath(pts, out, 0, 1);
      const show = (P, l, w, sign) => {
        $(l).textContent = P && P.reached ? fmt(P.length) : 'no edge';
        const turns = P && P.reached ? T.windingAround(pts, P.path, pts[1]) : NaN;
        $(w).textContent = isFinite(turns) ? (turns >= 0 ? '+' : '−') + Math.abs(turns).toFixed(2) : '—';
        $(w).dataset.ok = isFinite(turns) ? (sign * turns > 0) : '';
      };
      show(Y, '#two-ly', '#two-wy', 1); show(X, '#two-lx', '#two-wx', -1);
      const d = { x: pts[0].x - pts[1].x, y: pts[0].y - pts[1].y };
      $('#two-d').textContent = fmt(sp.length);
      $('#two-b').textContent = fmt(5 * T.tippedNorm(d.x, d.y));
      const ok = T.coneOf(d.x, d.y) === 0 && d.x > 0;
      $('#two-ok').textContent = ok ? 'yes' : 'no';
      $('#two-ok').dataset.ok = ok;
      view.requestDraw();
    }
    const view = new View($('canvas'), {
      pad: 12, box: { minX: -1.15, maxX: 1.15, minY: -1.3, maxY: 0.7 },
      draw(ctx, v) {
        rays(4).forEach((r) => D.line(ctx, v, pts[1], { x: pts[1].x + r.x, y: pts[1].y + r.y }, withAlpha(C.muted, 0.6), 1, [2, 4]));
        for (let a = 0; a < pts.length; a++) for (const c of out[a]) if (c >= 0) D.arrow(ctx, v, pts[a], pts[c], withAlpha(C.muted, 0.3), 1, 5, 5);
        const drawPath = (P, color) => {
          if (!P) return;
          for (let i = 0; i + 1 < P.path.length; i++) D.arrow(ctx, v, pts[P.path[i]], pts[P.path[i + 1]], color, 2.6, 7, 9);
        };
        drawPath(X, C.cone[4]); drawPath(Y, C.cone[3]);
        pts.forEach((p, i) => D.dot(ctx, v, p, i < 2 ? 6 : 3.5, i < 2 ? C.ink : C.ink2, C.surface, 1.2));
        const lab = [[0, 's', 10, 12], [1, 't', -14, -10]];
        if (Y) lab.push([out[0][3], 'y', 8, -10]);
        if (X) lab.push([out[0][4], 'x', -16, 4]);
        lab.forEach(([i, l, dx, dy]) => D.text(ctx, v, pts[i], l, C.ink, { dx, dy, weight: '700', mono: true, halo: C.surface }));
        D.text(ctx, v, { x: v.wx(14), y: v.wy(18) }, 'y-path', C.cone[3], { weight: '700', mono: true, halo: C.surface });
        D.text(ctx, v, { x: v.wx(14), y: v.wy(36) }, 'x-path', C.cone[4], { weight: '700', mono: true, halo: C.surface });
        if (hover != null) D.dot(ctx, v, pts[hover], 10, null, C.ink, 1.2);
      },
    });
    interact(view, {
      hit: (w) => { const i = window.Viz.pick(view, pts, w, 12); return i === 1 ? null : i; },
      hover: (h) => { hover = h; view.requestDraw(); },
      move: (i, w) => { pts[i] = { x: w.x + (Math.random() - 0.5) * 1e-7, y: w.y + (Math.random() - 0.5) * 1e-7 }; compute(); },
    });
    $('#two-new').addEventListener('click', () => {
      // keep only sets where both paths exist and turn in the directions of the proof
      for (let k = 0; k < 2000; k++) {
        seed = 10000 + Math.floor(Math.random() * 1e6);
        pts = randomSet(seed); compute();
        const wy = Y && Y.reached ? T.windingAround(pts, Y.path, pts[1]) : 0, wx = X && X.reached ? T.windingAround(pts, X.path, pts[1]) : 0;
        if (T.inGeneralPosition(pts, 1e-6) && wy > 0.1 && wx < -0.1) break;
      }
    });
    $('#two-reset').addEventListener('click', () => { seed = EXAMPLE; pts = randomSet(EXAMPLE); compute(); });
    compute();
  }

  window.initMore = function () { initSpiral(); initLemma9(); initLP(); initFour(); initTwoPaths(); };
})();
