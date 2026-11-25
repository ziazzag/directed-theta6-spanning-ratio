(function () {
  'use strict';
  const T = window.Theta6;
  const randomPoints = (n, rand) => Array.from({ length: n }, () => ({ x: rand(), y: rand() }));

  const CHECKS = [  
    {
      name: 'Two definitions of the edges agree',
      what: 'closest projection on the bisector ⇔ empty canonical triangle, 150 random sets of 3–30 points',
     run() {
        const rand = T.rng(1);
        for (let k = 0; k < 150; k++) {
         const pts = randomPoints(3 + Math.floor(rand() * 28), rand);
          if (JSON.stringify(T.buildTheta6(pts)) !== JSON.stringify(T.buildTheta6ByTriangles(pts))) return [false, `differ on set #${k}`];
        }
        return [true, '150 / 150 identical'];
      },
    },
    {
      name: 'Undirected Θ6 is a 2-spanner', 
      what: 'max ratio over 200 random sets of 4–40 points',
      run() {
        const rand = T.rng(2); let m = 0;
        for (let k = 0; k < 200; k++) { const p = randomPoints(4 + Math.floor(rand() * 37), rand); m = Math.max(m, T.spanningRatio(p, T.buildTheta6(p), { undirected: true }).ratio); }
        return [m <= 2 + 1e-9, `max = ${m.toFixed(4)} ≤ 2`];
      },
    },
    {
      name: 'Directed Θ6: d(s,t) ≤ 5‖st‖⬡ ≤ 5|st| (Theorem 1)', 
      what: 'max of d(s,t)/‖st‖⬡ over 200 random sets; also strong connectivity',
      run() {
        const rand = T.rng(3); let m = 0, conn = true;  
        for (let k = 0; k < 200; k++) {
          const p = randomPoints(4 + Math.floor(rand() * 37), rand);
          const r = T.spanningRatio(p, T.buildTheta6(p), { norm: (a, b) => T.tippedNorm(b.x - a.x, b.y - a.y) });
          m = Math.max(m, r.ratio); conn = conn && r.connected;
        }
        return [m <= 5 + 1e-9 && conn, `max = ${m.toFixed(4)} ≤ 5, strongly connected: ${conn}`];
      },
    },
    {
      name: 'Norm sandwich ‖·‖⬡ ≤ ‖·‖₂ ≤ ‖·‖⬣',
      what: '50 000 random vectors',
      run() {
        const rand = T.rng(4);
        for (let k = 0; k < 50000; k++) {
          const x = rand() * 2 - 1, y = rand() * 2 - 1;
         if (!(T.tippedNorm(x, y) <= Math.hypot(x, y) + 1e-12 && Math.hypot(x, y) <= T.hexNorm(x, y) + 1e-12)) return [false, `fails at (${x}, ${y})`];
        }
        return [true, 'holds on all samples'];
      },
    },
    {
      name: 'Lemma 2: ‖uv‖⬣ = ‖uv‖⬡ + ½·min(side of C_u^i ∩ C_v^{i±2})',
      what: '50 000 random vectors, triangle sides computed geometrically',
      run() {
        const rand = T.rng(5); let worst = 0;
        for (let k = 0; k < 50000; k++) {
          const v = { x: rand() * 2 - 1, y: rand() * 2 - 1 };
          const i = T.coneOf(v.x, v.y);
          const sides = [T.mod6(i - 2), T.mod6(i + 2)].map((j) => {
             let L = Infinity;
            for (const r of T.BND[j]) for (const s of T.BND[i]) {
              const X = T.rayIntersect(v, r, { x: 0, y: 0 }, s);  
              if (X && X.alpha > 1e-12 && X.beta > 0) L = Math.min(L, T.hexNorm(X.x - v.x, X.y - v.y));
            }
            return L;
          });
          worst = Math.max(worst, Math.abs(T.hexNorm(v.x, v.y) - T.tippedNorm(v.x, v.y) - 0.5 * Math.min(...sides)));
        }
        return [worst < 1e-9, `max error ${worst.toExponential(1)}`];
      },
    },
    {
      name: 'Lemma 4: going through Q costs nothing in ‖·‖⬡',
      what: 'for w in the parallelogram Q = sqtp: ‖sw‖⬡ + ‖wt‖⬡ = ‖st‖⬡ and ‖sw‖⬣, ‖wt‖⬣ < 1; 20 000 random s, w',
      run() {
        const rand = T.rng(4), S3 = Math.sqrt(3), t = { x: 0, y: 0 }; let worst = 0, shorter = true;
        for (let k = 0; k < 20000; k++) {
          const s = { x: 0.001 + 0.498 * rand(), y: -S3 / 2 };
          const p = T.rayIntersect(s, T.BIS[3], t, T.BIS[1]), q = T.rayIntersect(s, T.BIS[4], t, T.BIS[0]);
          const a = 0.001 + 0.998 * rand(), b = 0.001 + 0.998 * rand();
          const w = { x: s.x + a * (q.x - s.x) + b * (p.x - s.x), y: s.y + a * (q.y - s.y) + b * (p.y - s.y) };
          const tp = (u, v) => T.tippedNorm(v.x - u.x, v.y - u.y);
          worst = Math.max(worst, Math.abs(tp(s, w) + tp(w, t) - tp(s, t)));
          if (T.hexNorm(w.x - s.x, w.y - s.y) >= 1 || T.hexNorm(w.x, w.y) >= 1) shorter = false;
        }
        return [worst < 1e-12 && shorter, `max error ${worst.toExponential(1)}, both pieces shorter: ${shorter}`];
      },
    },
    {
      name: 'Lemma 3: ‖uv‖⬣ ≤ 2(‖ut‖⬡ − ‖vt‖⬡)',
      what: 'u, v between B_t^i and B_t^{i+1}, v ∈ C_u^{i+3} ∪ C_u^{i+4}; 100 000 random tries',
      run() {
        const rand = T.rng(6); let n = 0, bad = 0;
        for (let k = 0; k < 100000; k++) {
          const i = Math.floor(rand() * 6), lo = 270 + 60 * i;
          const pick = () => { const a = (lo + 60 * rand()) * Math.PI / 180, r = rand(); return { x: r * Math.cos(a), y: r * Math.sin(a) }; };
          const u = pick(), v = pick(), cu = T.coneOf(v.x - u.x, v.y - u.y);
          if (cu !== T.mod6(i + 3) && cu !== T.mod6(i + 4)) continue;
          n++;
          if (T.hexNorm(v.x - u.x, v.y - u.y) > 2 * (T.tippedNorm(u.x, u.y) - T.tippedNorm(v.x, v.y)) + 1e-9) bad++;
        }
        return [n > 1000 && bad === 0, `${n} configurations, ${bad} violations`];
      },
    },
    {
      name: 'Lemma 9: 2‖vt‖⬡ ≤ ‖uv‖⬣',
      what: 'v in ∇_u^t and uv crosses both B_t^0 and B_t^1; 200 000 random tries',
      run() {
        const rand = T.rng(9), t = { x: 0, y: 0 }; let n = 0, bad = 0;
        for (let k = 0; k < 200000; k++) {
          const u = { x: rand() * 2 - 1, y: rand() * 2 - 1 };
          const [A, B, C] = T.canonicalTriangle(u, t);
          let r1 = rand(), r2 = rand(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
          const v = { x: A.x + r1 * (B.x - A.x) + r2 * (C.x - A.x), y: A.y + r1 * (B.y - A.y) + r2 * (C.y - A.y) };
          if (!T.segmentCrossesRay(u, v, t, T.BIS[0]) || !T.segmentCrossesRay(u, v, t, T.BIS[1])) continue;
          n++;
          if (2 * T.tippedNorm(v.x, v.y) > T.hexNorm(v.x - u.x, v.y - u.y) + 1e-9) bad++;
        }
        return [n > 500 && bad === 0, `${n} configurations, ${bad} violations`];
      },
    },
    {
      name: 'The 20 linear programs of Section 4',
      what: '16 infeasible (with an exact certificate each), and the 4 others are the ones the paper names',
      run() {
        const R = window.LP6.solveAll();
        const open = R.filter((r) => r.feasible).map((r) => r.name).sort().join(' | ');
        const certs = R.filter((r) => !r.feasible && r.cert && r.cert.ok).length;
        const ok = open === [...window.LP6.PAPER_OPEN].sort().join(' | ') && certs === 16;
        return [ok, `${20 - R.filter((r) => r.feasible).length} infeasible, ${certs} certificates checked, open: ${open}`];
      },
    },
    {
      name: '5 points give a ratio close to 4',
      what: 's, a, b, c, t of Lemma 1 without the zig-zag, δ = 0.001',
      run() {
        const d = 0.001, S = Math.sqrt(3);
        const p = [{ x: -1 + d, y: -d }, { x: 0, y: 0 }, { x: -0.5 + d, y: S / 2 - 2 * d }, { x: 0.5 - 2 * d, y: S / 2 - 3 * d }, { x: 1 - 6 * d, y: d }];
        const sp = T.shortestPath(p, T.buildTheta6(p), 0, 1), r = sp.length / T.dist(p[0], p[1]);
        return [sp.path.join('') === '02341' && r > 3.98, `path s a b c t, ratio ${r.toFixed(4)}`];
      },
    },
    {
      name: 'Greedy routing can spiral',
      what: 'hexagonal spiral of 25 points around t (turn 60°, shrink 0.65); also checks that Dijkstra finds the same path',
      run() {
        const p = T.spiralPoints(25, 0.65, 45), out = T.buildTheta6(p), g = T.greedyRoute(p, out, 1, 0, 500);
        const turns = T.windingAround(p, g.path), same = T.shortestPath(p, out, 1, 0).path.join() === g.path.join();
        return [g.reached && turns >= 3.9 && same, `greedy visits ${g.path.length} points and turns ${turns.toFixed(2)} times around t; shortest path = greedy path: ${same}`];
      },
    },
    ...[0.03, 0.01, 0.005].map((d) => ({
      name: `Lemma 1 construction, δ = ${d}`,
      what: 'shortest path is s a b c p⁰ q⁰ … pᵏ t and ratio ≥ 5 − 72δ',
      run() {
          const L = T.lowerBound5(d), out = T.buildTheta6(L.pts), sp = T.shortestPath(L.pts, out, L.s, L.t);
        const r = sp.length / T.dist(L.pts[L.s], L.pts[L.t]);
        const exp = ['s', 'a', 'b', 'c']; for (let i = 0; i < L.k; i++) exp.push('p' + i, 'q' + i); exp.push('p' + L.k, 't');
        const same = sp.path.map((i) => L.labels[i]).join() === exp.join();
        return [same && r >= 5 - 72 * d, `n = ${L.pts.length}, ratio ${r.toFixed(4)} ≥ ${(5 - 72 * d).toFixed(3)}, path as in paper: ${same}`];
      },
    })),
  ];

  function initChecks() {
    const root = document.getElementById('checks');
    if (!root) return;
    const tbody = root.querySelector('tbody'), btn = root.querySelector('button');
    tbody.innerHTML = CHECKS.map((c, i) => `<tr data-i="${i}"><td class="st">·</td><td><b>${c.name}</b><br><span class="muted">${c.what}</span></td><td class="res muted">not run</td></tr>`).join('');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      let i = 0;
      const next = () => {
        const row = tbody.querySelector(`tr[data-i="${i}"]`);
        row.querySelector('.res').textContent = 'running…';
        setTimeout(() => {
          const t0 = performance.now();
          let ok, msg;
          try { [ok, msg] = CHECKS[i].run(); } catch (e) { ok = false; msg = 'error: ' + e.message; }
          row.querySelector('.st').textContent = ok ? 'PASS' : 'FAIL';
          row.dataset.ok = ok;
          row.querySelector('.res').textContent = `${msg} · ${(performance.now() - t0).toFixed(0)} ms`;
          row.querySelector('.res').classList.remove('muted');
          if (++i < CHECKS.length) next(); else { btn.disabled = false; btn.textContent = 'Run again'; }
        }, 30);
      };
      next();
    });
  }
  window.initChecks = initChecks;
})();
