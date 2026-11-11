(function () {
  'use strict';
  const T = window.Theta6, { View, interact, pick, D, C, withAlpha } = window.Viz;
  const S3 = Math.sqrt(3);
  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 3 : d) : '∞');

  // lower bound
  function initLowerBound() {
    const root = document.getElementById('lb');
    if (!root) return;
    const $ = (s) => document.querySelector(s);
      const canvas = root.querySelector('canvas'); 
    const st = { delta: 0.03, L: null, out: null, sp: null, showAll: false, unfold: true, walk: null };
    function compute() {
      st.L = T.lowerBound5(st.delta);
      st.out = T.buildTheta6(st.L.pts);
      st.sp = T.shortestPath(st.L.pts, st.out, st.L.s, st.L.t);
      const L = st.L;
      const labels = st.sp.path.map((i) => L.labels[i]);
      const expected = ['s', 'a', 'b', 'c'];
      for (let i = 0; i < L.k; i++) expected.push('p' + i, 'q' + i);
      expected.push('p' + L.k, 't');
      const same = labels.join() === expected.join();
      const d = T.dist(L.pts[L.s], L.pts[L.t]);
      // point r for the unfolding
      const p0 = L.pts[L.labels.indexOf('p0')], pk = L.pts[L.labels.indexOf('p' + L.k)];
        const r = T.rayIntersect(pk, [1, S3 - st.delta], p0, [-1, -(st.delta - S3)]);
      st.r = r; st.p0 = p0; st.pk = pk;
      $('#lb-n').textContent = L.pts.length;
      $('#lb-k').textContent = L.k;
      $('#lb-len').textContent = fmt(st.sp.length, 4);
      $('#lb-st').textContent = fmt(d, 4);
      $('#lb-ratio').textContent = fmt(st.sp.length / d, 4);
      $('#lb-bound').textContent = fmt(5 - 72 * st.delta, 4);
      $('#lb-path').textContent = same ? 'yes: s a b c p⁰ q⁰ p¹ … pᵏ t' : 'NO: ' + labels.slice(0, 12).join(' ') + '…';
        $('#lb-path').dataset.ok = same;
      if (r) $('#lb-unf').textContent = fmt(T.dist(p0, r) + T.dist(r, pk), 4);
      let zz = 0;
      const i0 = st.sp.path.indexOf(L.labels.indexOf('p0'));
      for (let i = i0; i + 1 < st.sp.path.length - 1; i++) zz += T.dist(L.pts[st.sp.path[i]], L.pts[st.sp.path[i + 1]]);
      $('#lb-zz').textContent = fmt(zz, 4);
      view.requestDraw();
    }

    const view = new View(canvas, {
     pad: 22, pan: true, zoom: true, box: { minX: -1.12, maxX: 1.12, minY: -0.2, maxY: 1.0 },
      draw(ctx, v) {
        if (!st.L) return;
        const { pts, labels } = st.L;
        // hexagon around t
        const hex = [0, 60, 120, 180, 240, 300].map((a) => ({ x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) }));
        D.poly(ctx, v, hex, null, withAlpha(C.muted, 0.6), 1, [6, 5]);
        if (st.showAll) window.drawTheta6.drawGraph(ctx, v, pts, st.out, { r: 3 });
        if (st.unfold && st.r) {
          D.line(ctx, v, st.p0, st.r, C.greedy, 1.6, [6, 4]); 
          D.line(ctx, v, st.r, st.pk, C.greedy, 1.6, [6, 4]);
          D.dot(ctx, v, st.r, 4, C.greedy);
          D.text(ctx, v, st.r, 'r', C.greedy, { dx: 9, dy: -9, mono: true, weight: '700', halo: C.surface });
        }
        const path = st.sp.path;
        window.drawTheta6.drawPath(ctx, v, pts, st.walk ? path.slice(0, st.walk.i + 2) : path, C.sp, 2.6);
        const rad = Math.max(1.4, Math.min(4, v.scale * st.delta * 0.25));
        for (let i = 0; i < pts.length; i++) {
          const big = i < 5;
          D.dot(ctx, v, pts[i], big ? 5 : rad, labels[i][0] === 'q' ? C.cone[1] : C.ink, big ? C.surface : null, 1.5);
        }
        for (let i = 0; i < 5; i++) D.text(ctx, v, pts[i], labels[i], C.ink, { dx: i === 1 ? -12 : 10, dy: i === 0 || i === 1 ? 12 : -10, mono: true, weight: '700', halo: C.surface });
        if (st.walk && st.walk.pos) D.dot(ctx, v, st.walk.pos, 6.5, C.greedy, C.surface, 2);
      },
    });
    interact(view, {});

      const slider = $('#lb-delta');
    const toDelta = () => Math.pow(10, +slider.value);
    let timer = 0;
    slider.addEventListener('input', () => {
      st.delta = toDelta();
      $('#lb-delta-out').textContent = st.delta.toFixed(4);
      clearTimeout(timer);
      timer = setTimeout(compute, st.delta < 0.006 ? 160 : 10);
   });
    $('#lb-all').addEventListener('change', (e) => { st.showAll = e.target.checked; view.requestDraw(); });
   $('#lb-unfold').addEventListener('change', (e) => { st.unfold = e.target.checked; view.requestDraw(); });
    $('#lb-fit').addEventListener('click', () => { view.userMoved = false; view.fit({ minX: -1.12, maxX: 1.12, minY: -0.2, maxY: 1.0 }); });
    $('#lb-zoom').addEventListener('click', () => {
      const x = Math.min(0.5, 30 * st.delta);
      view.fit({ minX: -0.02 * x, maxX: x, minY: -0.3 * x, maxY: 0.3 * x }); view.userMoved = true;
    });
    $('#lb-zoomin').addEventListener('click', () => view.zoomAt(view.w / 2, view.h / 2, 1.6));
     $('#lb-zoomout').addEventListener('click', () => view.zoomAt(view.w / 2, view.h / 2, 1 / 1.6));
    $('#lb-walk').addEventListener('click', () => {
      const path = st.sp.path, pts = st.L.pts;
      const seg = []; let total = 0;
      for (let i = 0; i + 1 < path.length; i++) { const L = T.dist(pts[path[i]], pts[path[i + 1]]); seg.push(L); total += L; }
      const d = T.dist(pts[st.L.s], pts[st.L.t]);
      const t0 = performance.now(), dur = 7000;
      const odo = $('#lb-odo');
      if (st.walk && st.walk.raf) cancelAnimationFrame(st.walk.raf);
      const tick = (now) => {
        const f = Math.min(1, (now - t0) / dur);
       let rem = f * total, i = 0;
        while (i < seg.length - 1 && rem > seg[i]) { rem -= seg[i]; i++; }
          const a = pts[path[i]], b = pts[path[i + 1]], u = seg[i] ? Math.min(1, rem / seg[i]) : 1;
        st.walk = { i, pos: { x: a.x + u * (b.x - a.x), y: a.y + u * (b.y - a.y) }, raf: 0 };
        odo.textContent = `travelled ${(f * total).toFixed(3)} = ${(f * total / d).toFixed(3)} × |st|`;
        view.requestDraw();
        if (f < 1) st.walk.raf = requestAnimationFrame(tick);
        else setTimeout(() => { st.walk = null; view.requestDraw(); }, 1200);
      };
      st.walk = { i: 0, raf: requestAnimationFrame(tick) };
    });
    slider.value = Math.log10(st.delta);
    $('#lb-delta-out').textContent = st.delta.toFixed(4);
   compute();
  }

  // chart
  function initChart() {
    const root = document.getElementById('lb-chart');
    if (!root) return;
    const btn = root.querySelector('button');
    const svg = root.querySelector('svg');
    const tbody = root.querySelector('tbody');
    const tip = root.querySelector('.tip');
    const deltas = [0.05, 0.04, 0.03, 0.02, 0.015, 0.01, 0.007, 0.005, 0.003, 0.002];
   let data = [];
    function render() {
      const W = svg.clientWidth || 600, H = 260, m = { l: 44, r: 112, t: 14, b: 38 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const lx = (d) => Math.log10(d);
      const x0 = lx(0.0018), x1 = lx(0.055);
      const X = (d) => m.l + (lx(d) - x0) / (x1 - x0) * (W - m.l - m.r);
      const y0 = 1.2, y1 = 5.15;
      const Y = (r) => m.t + (y1 - r) / (y1 - y0) * (H - m.t - m.b);  
      let s = '';
      for (const r of [2, 3, 4, 5]) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(r)}" y2="${Y(r)}" class="grid"/><text x="${m.l - 8}" y="${Y(r) + 4}" class="tick" text-anchor="end">${r}</text>`;
      for (const d of [0.002, 0.005, 0.01, 0.02, 0.05]) s += `<text x="${X(d)}" y="${H - m.b + 18}" class="tick" text-anchor="middle">${d}</text>`;
      s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 4}" class="axis" text-anchor="middle">δ (log scale)</text>`;
      const bpts = []; for (let e = x0; e <= x1 + 1e-9; e += (x1 - x0) / 60) { const d = Math.pow(10, e); const b = 5 - 72 * d; if (b >= y0) bpts.push(`${X(d)},${Y(b)}`); }
      s += `<polyline points="${bpts.join(' ')}" class="s2"/>`;
      if (data.length) {
        s += `<polyline points="${data.map((p) => `${X(p.d)},${Y(p.r)}`).join(' ')}" class="s1"/>`;
        s += data.map((p, i) => `<circle cx="${X(p.d)}" cy="${Y(p.r)}" r="4.5" class="m1" data-i="${i}"/>`).join('');
        const first = data[0];
        s += `<text x="${X(first.d) + 10}" y="${Y(first.r) + 4}" class="lab">measured</text>`;
      }
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(5)}" y2="${Y(5)}" class="ref"/>`;
      s += `<text x="${X(0.05) + 10}" y="${Y(5 - 72 * 0.05) + 4}" class="lab">5 − 72δ</text>`;  
      svg.innerHTML = s;
      svg.querySelectorAll('circle').forEach((c) => {
        c.addEventListener('pointerenter', () => {
          const p = data[+c.dataset.i];
          tip.innerHTML = `δ = ${p.d}<br>n = ${p.n} points<br>ratio <b>${p.r.toFixed(4)}</b><br>5 − ratio = ${(5 - p.r).toFixed(4)} ≈ ${((5 - p.r) / p.d).toFixed(1)}·δ`;
          tip.style.left = c.getAttribute('cx') + 'px'; tip.style.top = c.getAttribute('cy') + 'px'; tip.hidden = false;
        });
        c.addEventListener('pointerleave', () => { tip.hidden = true; });
      });
    }
    btn.addEventListener('click', () => {
      btn.disabled = true; data = []; tbody.innerHTML = '';
      let i = 0;
      const step = () => {
        const d = deltas[i]; 
        const L = T.lowerBound5(d), out = T.buildTheta6(L.pts);
        const sp = T.shortestPath(L.pts, out, L.s, L.t);
        const r = sp.length / T.dist(L.pts[L.s], L.pts[L.t]);
        data.push({ d, r, n: L.pts.length });
        tbody.insertAdjacentHTML('beforeend', `<tr><td>${d}</td><td>${L.pts.length}</td><td>${r.toFixed(4)}</td><td>${(5 - 72 * d).toFixed(3)}</td><td>${((5 - r) / d).toFixed(1)}</td></tr>`); 
        render();
        btn.textContent = `Computing… ${i + 1}/${deltas.length}`;
        if (++i < deltas.length) setTimeout(step, 20);
        else { btn.textContent = 'Recompute'; btn.disabled = false; }
      };
       setTimeout(step, 20);
    });
    new ResizeObserver(render).observe(svg);
    render();
  }

  // game
  function initGame() {
    const root = document.getElementById('game');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const canvas = root.querySelector('canvas');
    const key = (n) => 'theta6-best-' + n;
    const load = (n) => { try { return JSON.parse(localStorage.getItem(key(n)) || 'null'); } catch (e) { return null; } };
    const save = (n, v) => { try { localStorage.setItem(key(n), JSON.stringify(v)); } catch (e) { /* private mode */ } };
    let rand = T.rng(Date.now() % 1e9);
    const st = { n: 6, pts: [], out: [], res: null, hover: null, search: null };


    function reset() {
      st.n = +$('#g-n').value;
      st.pts = Array.from({ length: st.n }, () => ({ x: 0.08 + 0.84 * rand(), y: 0.08 + 0.84 * rand() }));
      stopSearch(); recompute();
    }
    function recompute() {
     st.out = T.buildTheta6(st.pts);
      st.res = T.spanningRatio(st.pts, st.out);
      const best = load(st.n);
      if (!best || st.res.ratio > best.score) save(st.n, { score: st.res.ratio, pts: st.pts });
      const b = load(st.n);
      $('#g-score').textContent = st.res.ratio.toFixed(3);
      $('#g-best').textContent = b ? b.score.toFixed(3) : '—';
      const tiers = [[3.5, 'Spiral architect'], [3, 'Detour designer'], [2.5, 'Arrow bender'], [2, 'Getting there'], [0, 'Warm-up']];
      $('#g-tier').textContent = tiers.find((x) => st.res.ratio >= x[0])[1];
      $('#g-meter').style.setProperty('--v', Math.min(1, (st.res.ratio - 1) / 4));
      view.requestDraw();
    }
    const view = new View(canvas, {
      pad: 16,
     draw(ctx, v) {
        window.drawTheta6.drawGraph(ctx, v, st.pts, st.out, { dim: false });
          if (st.res && st.res.path) {
          window.drawTheta6.drawPath(ctx, v, st.pts, st.res.path, C.sp, 3.6);
          D.line(ctx, v, st.pts[st.res.s], st.pts[st.res.t], C.muted, 1.2, [5, 5]);
        }
        window.drawTheta6.drawPoints(ctx, v, st.pts, { r: 6 });
        if (st.res && st.res.s >= 0) {
          D.text(ctx, v, st.pts[st.res.s], 's', C.ink, { dx: 11, dy: -11, weight: '700', mono: true, halo: C.surface });
          D.text(ctx, v, st.pts[st.res.t], 't', C.ink, { dx: 11, dy: -11, weight: '700', mono: true, halo: C.surface });
        }
        if (st.hover != null) D.dot(ctx, v, st.pts[st.hover], 10, null, C.ink, 1.5);
      },
     });
    interact(view, {
      hit: (w) => pick(view, st.pts, w, 16),
      hover: (h) => { st.hover = h; view.requestDraw(); },
      move: (i, w) => { stopSearch(); st.pts[i] = { x: Math.min(1, Math.max(0, w.x)) + (rand() - 0.5) * 1e-7, y: Math.min(1, Math.max(0, w.y)) + (rand() - 0.5) * 1e-7 }; recompute(); },
    });

    function stopSearch() {
      if (st.search) { cancelAnimationFrame(st.search.raf); st.search = null; $('#g-search').textContent = 'Let the computer try (annealing)'; }
    }
    $('#g-search').addEventListener('click', () => {
      if (st.search) return stopSearch();
      const iters = 2500;
      const S = T.newSearch(st.pts);
      $('#g-search').textContent = 'Stop';
      const tick = () => {
        for (let k = 0; k < 12 && S.iter < iters; k++) T.searchStep(S, rand, { iters });
        st.pts = S.pts.map((p) => ({ x: p.x, y: p.y }));
        recompute();
        $('#g-progress').textContent = `iteration ${S.iter}/${iters} · best ${S.bestScore.toFixed(3)}`;
        if (S.iter < iters) st.search.raf = requestAnimationFrame(tick);
        else { st.pts = S.best; recompute(); stopSearch(); }
      };
      st.search = { raf: requestAnimationFrame(tick) };
    });
    $('#g-reset').addEventListener('click', reset);
    $('#g-n').addEventListener('input', () => { $('#g-n-out').textContent = $('#g-n').value; reset(); });
    $('#g-loadbest').addEventListener('click', () => { const b = load(st.n); if (b) { stopSearch(); st.pts = b.pts; recompute(); } });
    reset();
  }

  window.initWorst = function () { initLowerBound(); initChart(); initGame(); };
})();