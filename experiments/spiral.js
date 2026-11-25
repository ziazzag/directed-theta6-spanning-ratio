// Greedy routing that spirals around t (example used in §2 of the page).
//   node experiments/spiral.js
// The points a_0 = s, a_1, ... are on a "hexagonal spiral": a_{k+1} is a_k turned by 60 deg
// around t and scaled by rho (T.spiralPoints). For each rho we look at the greedy route from s to t.
// First I tried angles slightly below 60 deg, it never gave more than ~0.35 turns. With exactly 60 deg
// the angle between a_k -> t and the cone boundary stays the same at every step, so it repeats.
const T = require('../js/theta6.js');

const alpha = 45; // start angle offset (a_0 is at 240 + alpha degrees from t)
console.log(' rho   turns  visited  greedy/|st|  shortest/|st|  in-degree of t  first steps');
for (let rho = 0.5; rho <= 0.801; rho += 0.02) {
  const p = T.spiralPoints(25, rho, alpha);
  const out = T.buildTheta6(p);
  const g = T.greedyRoute(p, out, 1, 0, 500);
  const sp = T.shortestPath(p, out, 1, 0);
  const st = T.dist(p[0], p[1]);
  let indeg = 0; out.forEach((row) => row.forEach((v) => { if (v === 0) indeg++; }));
  const steps = g.path.slice(0, 6).map((i) => (i ? 'a' + (i - 1) : 't')).join(' ');
  console.log(`${rho.toFixed(2)}  ${T.windingAround(p, g.path).toFixed(2).padStart(5)}  ${String(g.path.length).padStart(7)}  ${(g.length / st).toFixed(3).padStart(11)}  ${(sp.length / st).toFixed(3).padStart(13)}  ${String(indeg).padStart(14)}  ${steps}`);
}
// for rho >= 0.74 greedy goes a0 -> a6 -> a12 ...: one full turn inwards at each step
