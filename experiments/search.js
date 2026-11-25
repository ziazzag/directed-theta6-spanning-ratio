// Random search for bad point sets (simulated annealing).
//   node experiments/search.js [restarts] [iters]
// half of the restarts start from random points, the other half from the 5 points
// s, a, b, c, t of Lemma 1 (delta = 0.03) plus n - 5 random points near the segment ct,
// where the zig-zag of the paper lives. The first version only had random starts.
const T = require('../js/theta6.js');
const restarts = +process.argv[2] || 8, iters = +process.argv[3] || 6000;
const S3 = Math.sqrt(3);

function structuredStart(n, rand) {
  const d = 0.03;
  const pts = [{ x: -1 + d, y: -d }, { x: 0, y: 0 }, { x: -0.5 + d, y: S3 / 2 - 2 * d }, { x: 0.5 - 2 * d, y: S3 / 2 - 3 * d }, { x: 1 - 6 * d, y: d }];
  while (pts.length < n) { const f = 0.1 + 0.8 * rand(); pts.push({ x: f * (1 - 6 * d), y: f * d + (rand() - 0.5) * 0.15 }); }
  // the search works in the unit square, so map [-1.1, 1.1] x [-0.2, 1] into it
  return pts.map((p) => ({ x: (p.x + 1.1) / 2.2, y: (p.y + 0.2) / 2.2 }));
}

const results = {};
for (const n of [4, 5, 6, 7, 8, 10, 12, 16]) {
  let best = { score: 0 };
  for (let r = 0; r < restarts; r++) {
    const rand = T.rng(1000 * n + r);
    const structured = n >= 5 && r % 2 === 1;
    const pts = structured ? structuredStart(n, rand) : Array.from({ length: n }, () => ({ x: rand(), y: rand() }));
    const st = T.newSearch(pts);
    for (let k = 0; k < iters; k++) T.searchStep(st, rand, { iters });
    if (st.bestScore > best.score) best = { score: st.bestScore, pts: st.best, seed: 1000 * n + r, start: structured ? 'Lemma 1 points' : 'random' };
  }
  results[n] = best;
  console.log(`n=${String(n).padStart(2)}  best directed ratio ${best.score.toFixed(4)}  (seed ${best.seed}, start: ${best.start})`);
}
require('fs').writeFileSync(__dirname + '/search-results.json', JSON.stringify({ restarts, iters, results }, null, 1));
// sanity: re-check the best sets with the empty-triangle definition and general position
for (const n in results) {
  const P = results[n].pts;
  const a = JSON.stringify(T.buildTheta6(P)), b = JSON.stringify(T.buildTheta6ByTriangles(P));
  console.log(`n=${n}: definitions agree ${a === b}, general position (tol 1e-6) ${T.inGeneralPosition(P, 1e-6)}`);
}
