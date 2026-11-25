// the linear programs of Section 4 of the paper (arXiv version, pp. 14, 19, 20)
// - a small simplex (two phases, Bland's rule) to test if a case can happen
// - a Farkas certificate: weights that add the inequalities up to "0 < 0"
(function (root) {
  'use strict';

  // ---- simplex: max c.x  s.t.  A x <= b, x >= 0 ----
  // returns { status: 'optimal' | 'infeasible' | 'unbounded', x, value }
  function simplex(A, b, c) {
    const m = A.length, n = c.length, EPS = 1e-9;
    // columns: n originals, m slacks, then artificials for rows with b < 0
    const neg = [];
    for (let i = 0; i < m; i++) if (b[i] < 0) neg.push(i);
    const W = n + m + neg.length;
    const tab = [], basis = [];
    for (let i = 0; i < m; i++) {
      const r = new Array(W + 1).fill(0);
      const sg = b[i] < 0 ? -1 : 1;
      for (let j = 0; j < n; j++) r[j] = sg * A[i][j];
      r[n + i] = sg;
      r[W] = sg * b[i];
      const k = neg.indexOf(i);
      if (k >= 0) { r[n + m + k] = 1; basis.push(n + m + k); } else basis.push(n + i);
      tab.push(r);
    }
    function pivot(r, col) {
      const p = tab[r][col];
      for (let j = 0; j <= W; j++) tab[r][j] /= p;
      for (let i = 0; i < m; i++) {
        if (i === r) continue;
        const f = tab[i][col];
        if (Math.abs(f) > 1e-15) for (let j = 0; j <= W; j++) tab[i][j] -= f * tab[r][j];
      }
      basis[r] = col;
    }
    // runs max obj.x on the current tableau, cols >= limit are not allowed to enter
    function run(obj, limit) {
      for (let it = 0; it < 5000; it++) {
        // reduced costs
        let col = -1;
        for (let j = 0; j < limit; j++) {
          if (basis.includes(j)) continue;
          let rc = obj[j] || 0;
          for (let i = 0; i < m; i++) rc -= (obj[basis[i]] || 0) * tab[i][j];
          if (rc > EPS) { col = j; break; } // Bland: first improving column
        }
        if (col < 0) return 'optimal';
        let row = -1, best = Infinity;
        for (let i = 0; i < m; i++) {
          if (tab[i][col] > EPS) {
            const q = tab[i][W] / tab[i][col];
            if (q < best - 1e-12 || (Math.abs(q - best) <= 1e-12 && basis[i] < basis[row])) { best = q; row = i; }
          }
        }
        if (row < 0) return 'unbounded';
        pivot(row, col);
      }
      return 'iterations';
    }
    if (neg.length) {
      const obj1 = new Array(W).fill(0);
      for (let k = 0; k < neg.length; k++) obj1[n + m + k] = -1;
      run(obj1, W);
      let art = 0;
      for (let i = 0; i < m; i++) if (basis[i] >= n + m) art += tab[i][W];
      if (art > 1e-7) return { status: 'infeasible' };
      // drive artificials out of the basis
      for (let i = 0; i < m; i++) {
        if (basis[i] < n + m) continue;
        let col = -1;
        for (let j = 0; j < n + m; j++) if (Math.abs(tab[i][j]) > 1e-9) { col = j; break; }
        if (col >= 0) pivot(i, col);
      }
    }
    const st = run(c, n + m);
    if (st !== 'optimal') return { status: st };
    const x = new Array(n).fill(0);
    for (let i = 0; i < m; i++) if (basis[i] < n) x[basis[i]] = tab[i][W];
    return { status: 'optimal', x, value: c.reduce((s, ci, j) => s + ci * x[j], 0) };
  }

  // ---- exact fractions with BigInt, only to check certificates ----
  const big = (x) => BigInt(x);
  function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; }
  function Q(n, d) { if (d === undefined) d = 1n; if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; }
  const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qsign = (a) => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
  function qstr(a) { return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`; }
  // float -> fraction with small denominator (continued fractions)
  function toFrac(x, maxDen) {
    maxDen = maxDen || 2000;
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, v = x;
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(v);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(v - a) < 1e-12) break;
      v = 1 / (v - a);
    }
    return Q(big(h1), big(k1));
  }
  // the coefficients we use are multiples of 1/2
  const coefQ = (x) => Q(big(Math.round(2 * x)), 2n);

  // ---- the inequalities ----
  // variables, all >= 0 (they are lengths)
  //  y0..y5, a1..a5 (a_i = |C_t^i ∩ C^{i-2}_{y^i}|), Y0..Y5
  //  x0,x2..x5, b0,b2..b5 (b_i = |C_t^i ∩ C^{i+2}_{x^i}|), X0..X5, vy = |v^y t|, vx = |v^x t|
  const VARS = ['y0', 'y1', 'y2', 'y3', 'y4', 'y5', 'a1', 'a2', 'a3', 'a4', 'a5', 'Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5',
    'x0', 'x2', 'x3', 'x4', 'x5', 'b0', 'b2', 'b3', 'b4', 'b5', 'X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'vy', 'vx'];
  const TEX = (v) => ({ vy: '\\|v^yt\\|_{\\tipn}', vx: '\\|v^xt\\|_{\\tipn}' })[v] || v[0] + '_' + v.slice(1);

  // one inequality: sum coef*var  (< or <=)  rhs
  function ineq(src, coef, rhs, strict, tex) { return { src, coef, rhs, strict: !!strict, tex }; }

  const CASES = [];
  for (const y of ['Y0', 'Y1']) for (const x of ['X0', 'X1']) for (const j of ['(18)', 'J2', 'J3', 'J4', 'J5']) CASES.push({ y, x, j, name: `${x}, ${y}, ${j}` });
  // the 4 cases the paper does not close with linear programming (p. 20)
  const PAPER_OPEN = ['X1, Y1, J2', 'X1, Y1, J3', 'X1, Y1, J4', 'X0, Y0, J3'];

  function system(cs) {
    const L = [];
    L.push(ineq('(2)', { y0: 2.5, y1: 3.5 }, 1, true, '2.5\\,y_0+3.5\\,y_1<1'));
    L.push(ineq('(4)', { y0: 1, Y1: 1 }, 1, false, 'y_0+Y_1\\le 1'));
    for (let i = 1; i <= 5; i++) {
      const n = (i + 1) % 6;
      L.push(ineq('(4)', { ['Y' + n]: 1, ['a' + i]: -1 }, 0, false, `Y_${n}\\le a_${i}`));
      L.push(ineq('(4)', { ['y' + i]: 1, ['a' + i]: 1, ['Y' + i]: -1 }, 0, false, `y_${i}+a_${i}\\le Y_${i}`));
    }
    L.push(ineq('(5)', { X0: 1 }, 1, false, 'X_0\\le 1'));
    for (const i of [5, 4, 3, 2, 1]) {
      const n = (i + 1) % 6;
      L.push(ineq('(5)', { ['X' + i]: 1, ['b' + n]: -1 }, 0, false, `X_${i}\\le b_${n}`));
      L.push(ineq('(5)', { ['x' + n]: 1, ['b' + n]: 1, ['X' + n]: -1 }, 0, false, `x_${n}+b_${n}\\le X_${n}`));
    }
    // (6), (7): strict, because they start from the assumption d(s,t) > 5|st|
    const c6 = { y0: -2.5, y1: 1, vy: -5 }; for (let i = 0; i < 6; i++) c6['Y' + i] = -1;
    L.push(ineq('(6)', c6, -4, true, '5-2.5\\,y_0<(1-y_1)+Y_1+Y_2+Y_3+Y_4+Y_5+Y_0+5\\|v^yt\\|_{\\tipn}'));
    const c7 = { y0: -1.5, x0: 1, vx: -5 }; for (let i = 0; i < 6; i++) c7['X' + i] = -1;
    L.push(ineq('(7)', c7, -4, true, '5-2.5\\,y_0<(1-y_0-x_0)+X_0+X_5+X_4+X_3+X_2+X_1+5\\|v^xt\\|_{\\tipn}'));
    if (cs.y === 'Y0') {
      L.push(ineq('(10)', { vy: 1, y1: -1 }, 0, false, '\\|v^yt\\|_{\\tipn}\\le y_1'));
      for (const k of [2, 3, 4]) L.push(ineq('(11)', { vy: 1, ['y' + k]: -0.5 }, 0, false, `\\|v^yt\\|_{\\tipn}\\le y_${k}/2`));
    } else {
      L.push(ineq('(12)', { vy: 1, x0: -1 }, 0, false, '\\|v^yt\\|_{\\tipn}\\le x_0'));
      L.push(ineq('(13)', { vy: 1, Y0: -0.5 }, 0, false, '\\|v^yt\\|_{\\tipn}\\le Y_0/2'));
    }
    if (cs.x === 'X0') {
      L.push(ineq('(14)', { vx: 1, y1: -1 }, 0, false, '\\|v^xt\\|_{\\tipn}\\le y_1'));
      L.push(ineq('(15)', { vx: 1, X1: -0.5 }, 0, false, '\\|v^xt\\|_{\\tipn}\\le X_1/2'));
    } else {
      L.push(ineq('(16)', { vx: 1, x0: -1 }, 0, false, '\\|v^xt\\|_{\\tipn}\\le x_0'));
      for (const k of [5, 4, 3]) L.push(ineq('(17)', { vx: 1, ['x' + k]: -0.5 }, 0, false, `\\|v^xt\\|_{\\tipn}\\le x_${k}/2`));
    }
    const j = cs.j === '(18)' ? 1 : +cs.j[1];
    const tag = cs.j === '(18)' ? '(18)' : '(19)';
    for (let i = j + 1; i <= 5; i++) L.push(ineq(tag, { ['a' + i]: 1, ['x' + i]: -1 }, 0, false, `a_${i}\\le x_${i}`));
    for (let k = 2; k <= j; k++) L.push(ineq(tag, { ['X' + (k - 1)]: 1, ['y' + k]: -1 }, 0, false, `X_${k - 1}\\le y_${k}`));
    return L;
  }

  // can all inequalities hold together? maximise the slack e of the strict ones (e <= 1)
  function feasible(cs) {
    const L = system(cs), n = VARS.length;
    const A = L.map((q) => { const r = VARS.map((v) => q.coef[v] || 0); r.push(q.strict ? 1 : 0); return r; });
    const b = L.map((q) => q.rhs);
    A.push(new Array(n).fill(0).concat([1])); b.push(1);
    const c = new Array(n).fill(0).concat([1]);
    const r = simplex(A, b, c);
    if (r.status !== 'optimal') return { feasible: false, status: r.status };
    const point = {}; VARS.forEach((v, k) => (point[v] = r.x[k]));
    return { feasible: r.value > 1e-9, slack: r.value, point };
  }

  // Farkas: weights w >= 0 with sum(w * lhs) having only coefficients >= 0 and
  // sum(w * rhs) < 0, or = 0 with some weight on a strict inequality. Then adding up gives a contradiction.
  function certificate(cs) {
    const L = system(cs), m = L.length, n = VARS.length;
    // max -rhs.w  s.t. -sum_i w_i coef_ij <= 0 for each var, sum(strict w) = 1
    const A = [], b = [];
    for (const v of VARS) { A.push(L.map((q) => -(q.coef[v] || 0))); b.push(0); }
    A.push(L.map((q) => (q.strict ? 1 : 0))); b.push(1);
    A.push(L.map((q) => (q.strict ? -1 : 0))); b.push(-1);
    const r = simplex(A, b, L.map((q) => -q.rhs));
    if (r.status !== 'optimal' || r.value < -1e-9) return null;
    const w = r.x.map((x) => toFrac(x));
    // exact check
    const tot = {}; VARS.forEach((v) => (tot[v] = Q(0n)));
    let rhs = Q(0n), strictW = Q(0n);
    L.forEach((q, i) => {
      if (!w[i].n) return;
      for (const v in q.coef) tot[v] = qadd(tot[v], qmul(w[i], coefQ(q.coef[v])));
      rhs = qadd(rhs, qmul(w[i], coefQ(q.rhs)));
      if (q.strict) strictW = qadd(strictW, w[i]);
    });
    const okCoef = VARS.every((v) => qsign(tot[v]) >= 0);
    const ok = okCoef && (qsign(rhs) < 0 || (qsign(rhs) === 0 && qsign(strictW) > 0));
    return {
      ok, rhs, strict: qsign(strictW) > 0,
      rows: L.map((q, i) => ({ q, w: w[i] })).filter((r) => r.w.n !== 0n),
      sum: VARS.filter((v) => tot[v].n !== 0n).map((v) => ({ v, c: tot[v] })),
    };
  }

  function solveAll() {
    return CASES.map((cs) => {
      const f = feasible(cs);
      return Object.assign({}, cs, f, { cert: f.feasible ? null : certificate(cs), paperOpen: PAPER_OPEN.includes(cs.name) });
    });
  }

  const api = { simplex, system, feasible, certificate, solveAll, CASES, PAPER_OPEN, VARS, TEX, qstr };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LP6 = api;
})(typeof window !== 'undefined' ? window : globalThis);
