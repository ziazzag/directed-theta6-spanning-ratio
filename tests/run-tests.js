// Numerical checks for theta6.js.  Run with:  node tests/run-tests.js
const T = require('../js/theta6.js');
const { SQRT3 } = T;
let failures = 0;
const check = (name, ok, extra) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (!ok) failures++;
};

function randomPoints(n, rand) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x: rand(), y: rand() });
  return pts;
}

// 1. the two definitions of the edges agree
{
  const rand = T.rng(1);
  let same = true, sets = 0;
  for (let trial = 0; trial < 300 && same; trial++) {
    const pts = randomPoints(3 + Math.floor(rand() * 30), rand);
    const a = T.buildTheta6(pts), b = T.buildTheta6ByTriangles(pts);
    same = JSON.stringify(a) === JSON.stringify(b);
    sets++;
  }
  check('projection definition = empty-triangle definition', same, `${sets} random sets`);
}

// 2. undirected Θ6 has spanning ratio ≤ 2, directed Θ6 ≤ 5 (Euclidean) and ≤ 5 w.r.t. ‖·‖⬡ (Thm 1)
{
  const rand = T.rng(2);
  let maxU = 0, maxD = 0, maxD98 = 0, allConnected = true;
  for (let trial = 0; trial < 400; trial++) {
    const pts = randomPoints(4 + Math.floor(rand() * 40), rand);
    const out = T.buildTheta6(pts);
    maxU = Math.max(maxU, T.spanningRatio(pts, out, { undirected: true }).ratio);
    const r = T.spanningRatio(pts, out);
    allConnected = allConnected && r.connected;
    maxD = Math.max(maxD, r.ratio);
    maxD98 = Math.max(maxD98, T.spanningRatio(pts, out, { norm: (p, q) => T.tippedNorm(q.x - p.x, q.y - p.y) }).ratio);
  }
  check('directed Θ6 strongly connected', allConnected);
  check('undirected Θ6: ratio ≤ 2', maxU <= 2 + 1e-9, `max seen ${maxU.toFixed(4)}`);
  check('directed Θ6: ratio ≤ 5', maxD <= 5 + 1e-9, `max seen ${maxD.toFixed(4)}`);
  check('directed Θ6: d(s,t) ≤ 5‖st‖⬡ (Theorem 1)', maxD98 <= 5 + 1e-9, `max seen ${maxD98.toFixed(4)}`);
}

// 3. norms: ‖·‖⬡ ≤ ‖·‖_2 ≤ ‖·‖⬣, and within a cone hex norm = (2/√3)·projection
{
  const rand = T.rng(3);
  let ok = true, ok2 = true;
  for (let i = 0; i < 100000; i++) {
    const x = rand() * 2 - 1, y = rand() * 2 - 1;
    const h = T.hexNorm(x, y), e = Math.hypot(x, y), tp = T.tippedNorm(x, y);
    if (!(tp <= e + 1e-12 && e <= h + 1e-12)) ok = false;
    const c = T.coneOf(x, y);
    const pr = x * T.BIS[c][0] + y * T.BIS[c][1];
    if (Math.abs(h - 2 / SQRT3 * pr) > 1e-12) ok2 = false;
  }
  check('‖·‖⬡ ≤ ‖·‖_2 ≤ ‖·‖⬣', ok);
  check('inside a cone: ‖·‖⬣ = (2/√3)·projection on bisector', ok2);
}

// 4. Lemma 2: ‖uv‖⬣ = ‖uv‖⬡ + ½ min(‖C_u^i ∩ C_v^{i−2}‖, ‖C_u^i ∩ C_v^{i+2}‖), checked for i = 0 directly
{
  const rand = T.rng(4);
  let ok = true, worst = 0;
  for (let k = 0; k < 100000; k++) {
    const v = { x: rand() * 2 - 1, y: rand() * 2 - 1 };
    const i = T.coneOf(v.x, v.y);
    // side of C_u^i ∩ C_v^{i±2}: distance from v, along the boundary direction, to u's boundary ray
    const sides = [];
    for (const j of [T.mod6(i - 2), T.mod6(i + 2)]) {
      // the triangle C_u^i ∩ C_v^j has apex v; its side length = hex distance from v to the far side,
      // computed as the smallest hex norm of the intersections of v's cone-j rays with u's cone-i rays
      let L = Infinity;
      for (const r of T.BND[j]) for (const s of T.BND[i]) {
        const X = T.rayIntersect(v, r, { x: 0, y: 0 }, s);
        if (X && X.alpha > 1e-12 && X.beta > 0) L = Math.min(L, T.hexNorm(X.x - v.x, X.y - v.y));
      }
      sides.push(L);
    }
    const lhs = T.hexNorm(v.x, v.y), rhs = T.tippedNorm(v.x, v.y) + 0.5 * Math.min(...sides);
    worst = Math.max(worst, Math.abs(lhs - rhs));
    if (Math.abs(lhs - rhs) > 1e-9) ok = false;
  }
  check('Lemma 2 (hex = tipped + ½·min triangle)', ok, `max error ${worst.toExponential(2)}`);
}

// 5. Lemma 1: the 5 − ε construction
for (const delta of [0.02, 0.01, 0.005, 0.002, 0.001]) {
  const L = T.lowerBound5(delta);
  const out = T.buildTheta6(L.pts);
  const sp = T.shortestPath(L.pts, out, L.s, L.t);
  const ratio = sp.length / T.dist(L.pts[L.s], L.pts[L.t]);
  const labels = sp.path.map((i) => L.labels[i]);
  const expected = ['s', 'a', 'b', 'c'].concat(...Array.from({ length: L.k }, (_, i) => ['p' + i, 'q' + i]), ['p' + L.k, 't']);
  const samePath = JSON.stringify(labels) === JSON.stringify(expected);
  check(`Lemma 1, δ=${delta}: ratio ≥ 5 − 72δ`, ratio >= 5 - 72 * delta - 1e-9,
    `n=${L.pts.length}, k=${L.k}, ratio=${ratio.toFixed(5)}, bound=${(5 - 72 * delta).toFixed(4)}, path as in paper: ${samePath}`);
  check(`Lemma 1, δ=${delta}: shortest path is s a b c p0 q0 … p${L.k} t`, samePath);
  check(`Lemma 1, δ=${delta}: general position`, T.inGeneralPosition(L.pts, 1e-12));
}

// ---- Exploratory (not counted as failures): my reading of Lemmas 3 and 9 is missing a hypothesis
// or uses the wrong norm; see AI journal. Kept to document the investigation.
const info = (name, extra) => console.log(`INFO  ${name}  — ${extra}`);

// Notation of the paper: ‖·‖⬣ = hexNorm (filled hexagon, defines the edges),
// ‖·‖⬡ = tippedNorm (outlined hexagon). Lemmas 3 and 9 mix the two norms.
const H = (p, q) => T.hexNorm(q.x - p.x, q.y - p.y);
const TP = (p, q) => T.tippedNorm(q.x - p.x, q.y - p.y);
const angleDeg = (x, y) => ((Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360;

// 6. Lemma 3 (p. 8): u, v ∈ C_t^i ∪ C_t^{i+1} between B_t^i and B_t^{i+1}, v ∈ C_u^{i+3} ∪ C_u^{i+4}
//    ⇒ ‖uv‖⬣ ≤ 2(‖ut‖⬡ − ‖vt‖⬡)
{
  const rand = T.rng(6);
  const t = { x: 0, y: 0 };
  let tested = 0, bad = 0, worst = 0;
  for (let k = 0; k < 400000; k++) {
    const i = Math.floor(rand() * 6);
    const lo = 270 + 60 * i; // B_t^i at 270° + 60°i, B_t^{i+1} at 330° + 60°i
    const pick = () => { const a = (lo + 60 * rand()) * Math.PI / 180, r = rand(); return { x: r * Math.cos(a), y: r * Math.sin(a) }; };
    const u = pick(), v = pick();
    const cu = T.coneOf(v.x - u.x, v.y - u.y);
    if (cu !== T.mod6(i + 3) && cu !== T.mod6(i + 4)) continue;
    tested++;
    const gap = H(u, v) - 2 * (TP(u, t) - TP(v, t));
    if (gap > 1e-9) { bad++; worst = Math.max(worst, gap); }
  }
  check('Lemma 3: ‖uv‖⬣ ≤ 2(‖ut‖⬡ − ‖vt‖⬡)', bad === 0, `${tested} random configurations, ${bad} violations`);
}

// 7. Lemma 9 (p. 15): edge uv contained in ∇_u^t, uv crosses both B_t^0 and B_t^1 ⇒ 2‖vt‖⬡ ≤ ‖uv‖⬣
{
  const rand = T.rng(9);
  const t = { x: 0, y: 0 };
  let tested = 0, bad = 0;
  for (let k = 0; k < 400000; k++) {
    const u = { x: rand() * 2 - 1, y: rand() * 2 - 1 };
    const [A, B, C] = T.canonicalTriangle(u, t);
    let r1 = rand(), r2 = rand(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const v = { x: A.x + r1 * (B.x - A.x) + r2 * (C.x - A.x), y: A.y + r1 * (B.y - A.y) + r2 * (C.y - A.y) };
    if (!T.segmentCrossesRay(u, v, t, T.BIS[0]) || !T.segmentCrossesRay(u, v, t, T.BIS[1])) continue;
    tested++;
    if (2 * TP(v, t) > H(u, v) + 1e-9) bad++;
  }
  check('Lemma 9: 2‖vt‖⬡ ≤ ‖uv‖⬣', tested > 1000 && bad === 0, `${tested} random configurations, ${bad} violations`);
}

// 8. Lemma 1, formula for qⁱ: the paper (p. 5) writes ‖q^{i−1}qⁱ‖/‖tqⁱ‖ = ‖q⁰c‖/‖tc‖. Taken literally,
//    the shortest path skips the qⁱ and the ratio stays below 4; with ‖tq^{i−1}‖ (which also matches
//    the case i = 0) the path is the one of the paper. INFO only: documents why we use ‖tq^{i−1}‖.
{
  const d = 0.005, lb = T.lowerBound5(d);
  const c = lb.pts[4], q0 = lb.pts[lb.labels.indexOf('q0')];
  const g = T.dist(q0, c) / T.dist({ x: 0, y: 0 }, c);
  const ps = lb.labels.map((l, j) => l[0] === 'p' ? lb.pts[j] : null).filter(Boolean);
  const p0 = ps[0], k2 = d - SQRT3;
  const lit = [...lb.pts.slice(0, 5), p0, q0];
  let q = q0, p = p0;
  while (p.x >= d) {
    const qi = { x: q.x / (1 + g), y: q.y / (1 + g) };
    const mu = (qi.y - k2 * qi.x) / (p0.y - k2 * p0.x);
    p = { x: mu * p0.x, y: mu * p0.y };
    lit.push(p); if (p.x >= d) lit.push(qi); q = qi;
  }
  const sp = T.shortestPath(lit, T.buildTheta6(lit), 0, 1);
  const r = sp.length / T.dist(lit[0], lit[1]);
  console.log(`INFO  Lemma 1 with the literal qⁱ formula (δ = ${d}): ratio ${r.toFixed(4)}, path uses ${sp.path.length}/${lit.length} points`);
}

// 8b. Lemma 4 (p. 9): for w in the parallelogram Q = sqtp, |sw| + |wt| = |st| in the tipped norm,
//     and both pieces are shorter than st in the hex norm (so induction applies)
{
  const rand = T.rng(4), t = { x: 0, y: 0 }; let worst = 0, shorter = true;
  for (let k = 0; k < 100000; k++) {
    const s = { x: 0.001 + 0.498 * rand(), y: -SQRT3 / 2 };
    const p = T.rayIntersect(s, T.BIS[3], t, T.BIS[1]), q = T.rayIntersect(s, T.BIS[4], t, T.BIS[0]);
    const a = 0.001 + 0.998 * rand(), b = 0.001 + 0.998 * rand();
    const w = { x: s.x + a * (q.x - s.x) + b * (p.x - s.x), y: s.y + a * (q.y - s.y) + b * (p.y - s.y) };
    worst = Math.max(worst, Math.abs(TP(s, w) + TP(w, t) - TP(s, t)));
    if (H(s, w) >= 1 || H(w, t) >= 1) shorter = false;
  }
  check('Lemma 4: |sw|⬡ + |wt|⬡ = |st|⬡ for w in Q, both pieces shorter in ⬣', worst < 1e-12 && shorter, `max error ${worst.toExponential(1)}`);
}

// 9. the 20 linear programs of Section 4 (pp. 14, 19, 20): the paper says 16 are infeasible and
//    names the 4 others. Each infeasible case also gets a Farkas-type certificate checked with fractions.
{
  const LP = require('../js/lp.js');
  const R = LP.solveAll();
  const open = R.filter((r) => r.feasible).map((r) => r.name).sort();
  check('LP: the 4 feasible cases are the ones of the paper', JSON.stringify(open) === JSON.stringify([...LP.PAPER_OPEN].sort()), open.join(' | '));
  const certs = R.filter((r) => !r.feasible && r.cert && r.cert.ok).length;
  check('LP: 16 infeasible cases, each with an exact certificate', certs === 16, certs + ' certificates');
}

// 10. 5 points s, a, b, c, t: ratio close to 4 (about 4 - 11.3 delta)
for (const d of [0.01, 0.001, 0.0001]) {
  const p = [{ x: -1 + d, y: -d }, { x: 0, y: 0 }, { x: -0.5 + d, y: SQRT3 / 2 - 2 * d }, { x: 0.5 - 2 * d, y: SQRT3 / 2 - 3 * d }, { x: 1 - 6 * d, y: d }];
  const sp = T.shortestPath(p, T.buildTheta6(p), 0, 1), r = sp.length / T.dist(p[0], p[1]);
  check(`5 points, δ=${d}: path s a b c t, ratio close to 4`, sp.path.join('') === '02341' && r > 4 - 12 * d && r < 4, `ratio ${r.toFixed(5)}`);
}

// 11. greedy spiral (my own example): 4 full turns for rho in [0.5, 0.73], start angle 45
{
  let ok = true, worst = '';
  for (let rho = 0.5; rho <= 0.7301; rho += 0.01) {
    const p = T.spiralPoints(25, rho, 45), o = T.buildTheta6(p), g = T.greedyRoute(p, o, 1, 0, 500);
    const turns = T.windingAround(p, g.path);
    const same = T.shortestPath(p, o, 1, 0).path.join() === g.path.join();
    if (!T.inGeneralPosition(p) || !g.reached || Math.abs(turns - 4) > 1e-6 || !same) { ok = false; worst = rho.toFixed(2); }
  }
  check('Greedy spiral: 4 turns around t, and shortest path = greedy path, for every rho in [0.50, 0.73]', ok, worst && 'fails at rho = ' + worst);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exitCode = failures ? 1 : 0;
