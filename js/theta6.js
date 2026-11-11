(function (root) {
  'use strict';

  const SQRT3 = Math.sqrt(3);
  const DEG = Math.PI / 180;


  const BIS = [];
  const BND = [];
  for (let i = 0; i < 6; i++) {
    const a = (270 + 60 * i) * DEG;
     BIS.push([Math.cos(a), Math.sin(a)]);
    const a0 = (240 + 60 * i) * DEG, a1 = (300 + 60 * i) * DEG;
    BND.push([[Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]]);
  }

  const mod6 = (i) => ((i % 6) + 6) % 6;

  function coneOf(dx, dy) {
    let th = Math.atan2(dy, dx) / DEG;
    th = (((th - 240) % 360) + 360) % 360;
    return Math.min(5, Math.floor(th / 60));
  }

  function hexNorm(x, y) {
    return Math.max(2 * Math.abs(y) / SQRT3, Math.abs(x + y / SQRT3), Math.abs(x - y / SQRT3));
  }
  function tippedNorm(x, y) {
    return Math.max(Math.abs(x), Math.abs(x + SQRT3 * y) / 2, Math.abs(-x + SQRT3 * y) / 2);
  }
  const dist = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);

  function proj(p, q, i) { return (q.x - p.x) * BIS[i][0] + (q.y - p.y) * BIS[i][1]; }

  function buildTheta6(pts) {
    const n = pts.length;
    const out = [];
    for (let u = 0; u < n; u++) {
      const best = [-1, -1, -1, -1, -1, -1];
      const bestD = [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];
     for (let v = 0; v < n; v++) {
        if (v === u) continue;
        const i = coneOf(pts[v].x - pts[u].x, pts[v].y - pts[u].y);
        const d = proj(pts[u], pts[v], i);
        if (d < bestD[i]) { bestD[i] = d; best[i] = v; }
      }
      out.push(best);
    }
    return out;
  }

  function canonicalTriangle(u, v) {
    const i = coneOf(v.x - u.x, v.y - u.y);
    const L = hexNorm(v.x - u.x, v.y - u.y); 
    const [r0, r1] = BND[i];
    return [{ x: u.x, y: u.y }, { x: u.x + L * r0[0], y: u.y + L * r0[1] }, { x: u.x + L * r1[0], y: u.y + L * r1[1] }];
  }
  function strictlyInsideTriangle(p, a, b, c, eps) {
    const s1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const s2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
    const s3 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
    return (s1 > eps && s2 > eps && s3 > eps) || (s1 < -eps && s2 < -eps && s3 < -eps);  
  }

  function buildTheta6ByTriangles(pts) {
    const n = pts.length;
    const out = [];
    for (let u = 0; u < n; u++) {
      const row = [-1, -1, -1, -1, -1, -1];
      for (let v = 0; v < n; v++) {
        if (v === u) continue;
        const [a, b, c] = canonicalTriangle(pts[u], pts[v]);
        let empty = true;
        for (let w = 0; w < n && empty; w++) {
          if (w === u || w === v) continue;
         if (strictlyInsideTriangle(pts[w], a, b, c, 1e-12)) empty = false;
        }
        if (empty) {
          const i = coneOf(pts[v].x - pts[u].x, pts[v].y - pts[u].y);
          if (row[i] !== -1) row[i] = -2; // shouldn't happen
          else row[i] = v;
        }
      }
      out.push(row);
    }
    return out;
  }

  function adjacency(pts, out, undirected) {
    const n = pts.length;
    const adj = Array.from({ length: n }, () => []);
    const seen = new Set();
    for (let u = 0; u < n; u++) for (const v of out[u]) {
      if (v < 0) continue;
      const w = dist(pts[u], pts[v]);
      if (!undirected) { adj[u].push([v, w]); continue; }
      const key = Math.min(u, v) * n + Math.max(u, v);
      if (seen.has(key)) continue;
      seen.add(key);
      adj[u].push([v, w]); adj[v].push([u, w]);
     }
    return adj;
  }

  function dijkstra(adj, src) {
    const n = adj.length;
    const d = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    d[src] = 0;
    const heap = [[0, src]];
    const push = (e) => {
      heap.push(e); let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();  
      if (heap.length) {
        heap[0] = last; let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
     }
      return top;
    };
    while (heap.length) {
      const [du, u] = pop();
      if (du > d[u]) continue;
      for (const [v, w] of adj[u]) if (du + w < d[v]) { d[v] = du + w; prev[v] = u; push([d[v], v]); }
    }
    return { d, prev };
  }

  function pathFromPrev(prev, s, t) {
    const path = [];
    for (let v = t; v !== -1; v = prev[v]) { path.push(v); if (v === s) break; }
    path.reverse();
    return path[0] === s ? path : null;
  }  

  function spanningRatio(pts, out, opts) {
    opts = opts || {};
    const adj = adjacency(pts, out, !!opts.undirected);
    const norm = opts.norm || ((p, q) => dist(p, q));
    let best = { ratio: 1, s: -1, t: -1, path: null, length: 0 };
    let connected = true;
    for (let s = 0; s < pts.length; s++) {
      const { d, prev } = dijkstra(adj, s);
      for (let t = 0; t < pts.length; t++) {
        if (t === s) continue;
        if (!isFinite(d[t])) { connected = false; continue; }
        const r = d[t] / norm(pts[s], pts[t]);
        if (r > best.ratio) best = { ratio: r, s, t, length: d[t], prev };
      }
    }
    if (best.s >= 0) best.path = pathFromPrev(best.prev, best.s, best.t);
    delete best.prev;
    best.connected = connected;
    return best;
  }
  function shortestPath(pts, out, s, t, undirected) {
    const { d, prev } = dijkstra(adjacency(pts, out, undirected), s); 
   return { length: d[t], path: isFinite(d[t]) ? pathFromPrev(prev, s, t) : null };
  }

  function greedyRoute(pts, out, s, t, maxSteps) {
    maxSteps = maxSteps || 10 * pts.length + 10;
    const path = [s];
    const seen = new Set([s]);
   let a = s, length = 0;
    while (a !== t && path.length <= maxSteps) {
      const i = coneOf(pts[t].x - pts[a].x, pts[t].y - pts[a].y);
      const b = out[a][i];
      if (b < 0) return { path, length, reached: false, reason: 'no edge' };
      length += dist(pts[a], pts[b]);
      path.push(b);
      if (seen.has(b) && b !== t) return { path, length, reached: false, reason: 'cycle' };
      seen.add(b);
      a = b;
    }
    return { path, length, reached: a === t };
  }


  function greedyRatio(pts, out) {
    let best = { ratio: 1, s: -1, t: -1 };
    for (let s = 0; s < pts.length; s++) for (let t = 0; t < pts.length; t++) {
      if (s === t) continue;
      const g = greedyRoute(pts, out, s, t);
      const r = g.reached ? g.length / dist(pts[s], pts[t]) : Infinity;
      if (r > best.ratio) best = { ratio: r, s, t, path: g.path };
    }
    return best;
 }
  function lowerBound5(delta) {
    const d = delta;
    const t = { x: 0, y: 0 }; 
    const s = { x: -1 + d, y: -d };  
    const a = { x: -0.5 + d, y: SQRT3 / 2 - 2 * d };
    const b = { x: 0.5 - 2 * d, y: SQRT3 / 2 - 3 * d };
    const c = { x: 1 - 6 * d, y: d };
    // p0: slope(t,p0) = -d and slope(p0,c) = sqrt3 - d
    const m = SQRT3 - d;
    const x0 = (m * c.x - c.y) / (m + d);
    const p0 = { x: x0, y: -d * x0 };
    // q0 on segment ct
    const k2 = d - SQRT3;
    const lam0 = (p0.y - k2 * p0.x) / (c.y - k2 * c.x);
    const q0 = { x: lam0 * c.x, y: lam0 * c.y };
     // q^i: the paper (p.5) has |t q^i| in the denominator but then the path
    // skips the q^i and the ratio goes to 4. with |t q^(i-1)| it works -> typo?
    const rho = dist(t, q0) / dist(t, c);
    const ps = [p0], qs = [q0];
    const MAXK = 100000;
    for (let i = 1; i < MAXK; i++) {
      if (ps[i - 1].x < d) break;
      const f = Math.pow(rho, i);
      const qi = { x: q0.x * f, y: q0.y * f };
      const mu = (qi.y - k2 * qi.x) / (p0.y - k2 * p0.x);
      qs.push(qi);
      ps.push({ x: mu * p0.x, y: mu * p0.y });
    }
    qs.length = ps.length - 1;
    const pts = [], labels = [];
    const add = (p, l) => { pts.push(p); labels.push(l); };
    add(s, 's'); add(t, 't'); add(a, 'a'); add(b, 'b'); add(c, 'c');
    ps.forEach((p, i) => add(p, 'p' + i));
    qs.forEach((q, i) => add(q, 'q' + i));
      return { pts, labels, s: 0, t: 1, k: ps.length - 1 };
  }

  function rayIntersect(p, dp, q, dq) { 
    // solve p + a*dp = q + b*dq
   const det = dp[0] * (-dq[1]) - dp[1] * (-dq[0]);
    if (Math.abs(det) < 1e-15) return null;
    const rx = q.x - p.x, ry = q.y - p.y;
    const alpha = (rx * (-dq[1]) - ry * (-dq[0])) / det;
    const beta = (dp[0] * ry - dp[1] * rx) / det;
    return { x: p.x + alpha * dp[0], y: p.y + alpha * dp[1], alpha, beta };
  }
  function segmentCrossesRay(a, b, o, dir) {
    const r = rayIntersect(a, [b.x - a.x, b.y - a.y], o, dir);
    return !!r && r.alpha > 0 && r.alpha < 1 && r.beta > 0;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function inGeneralPosition(pts, tol) {
    tol = tol || 1e-9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
       const dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y;
      if (Math.abs(dy) < tol || Math.abs(dy - SQRT3 * dx) < tol || Math.abs(dy + SQRT3 * dx) < tol) return false;
    }
    return true;
  }

  function searchStep(state, rand, opts) {
    opts = opts || {};
    const iters = opts.iters || 2000;
    const T0 = opts.T0 == null ? 0.05 : opts.T0;
    const frac = Math.min(1, state.iter / iters);
    const temp = T0 * (1 - frac) + 1e-6;
    const sigma = (opts.sigma || 0.15) * (1 - 0.9 * frac);
    const i = Math.floor(rand() * state.pts.length);
    const old = state.pts[i];
    const g = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
      const refl = (v) => { v = Math.abs(v) % 2; return v > 1 ? 2 - v : v; };
    const cand = { x: refl(old.x + sigma * g()), y: refl(old.y + sigma * g()) };
    // reject moves that break general position
    const minSep = opts.minSep || 1e-3, minAngle = opts.minAngle || 1e-3;
    for (let j = 0; j < state.pts.length; j++) {
      if (j === i) continue;
      const dx = state.pts[j].x - cand.x, dy = state.pts[j].y - cand.y;
      if (Math.hypot(dx, dy) < minSep) { state.iter++; return state; }
      const a = ((Math.atan2(dy, dx) % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3);
      if (Math.min(a, Math.PI / 3 - a) < minAngle) { state.iter++; return state; }
    }
    state.pts[i] = cand;
    const sc = spanningRatio(state.pts, buildTheta6(state.pts)).ratio;
    if (sc >= state.score || rand() < Math.exp((sc - state.score) / temp)) {
      state.score = sc;
      if (sc > state.bestScore) { state.bestScore = sc; state.best = state.pts.map((p) => ({ x: p.x, y: p.y })); }
    } else state.pts[i] = old;
    state.iter++;
    return state;
  }
  function newSearch(pts) { 
    const s = spanningRatio(pts, buildTheta6(pts)).ratio;
    return { pts: pts.map((p) => ({ x: p.x, y: p.y })), score: s, best: pts.map((p) => ({ x: p.x, y: p.y })), bestScore: s, iter: 0 };
  }
  const api = {
    searchStep, newSearch,
    SQRT3, BIS, BND, mod6, coneOf, hexNorm, tippedNorm, dist, proj,
    buildTheta6, buildTheta6ByTriangles, canonicalTriangle, strictlyInsideTriangle,
    adjacency, dijkstra, spanningRatio, shortestPath, greedyRoute, greedyRatio,
    lowerBound5, rayIntersect, segmentCrossesRay, rng, inGeneralPosition,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Theta6 = api;
})(typeof window !== 'undefined' ? window : globalThis);
