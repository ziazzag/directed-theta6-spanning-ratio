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
      name: 'Directed Θ6: d(s,t) ≤ 5‖st‖₉₈ ≤ 5|st| (Theorem 1)', 
      what: 'max of d(s,t)/‖st‖₉₈ over 200 random sets; also strong connectivity',
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
      name: 'Norm sandwich ‖·‖₉₈ ≤ ‖·‖₂ ≤ ‖·‖₉₇',
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
      name: 'Lemma 2: ‖uv‖₉₇ = ‖uv‖₉₈ + ½·min(side of C_u^i ∩ C_v^{i±2})',
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
