# The directed Θ6-graph has spanning ratio 5: an interactive companion

INFO-F420 Computational Geometry (ULB), project by Zachary Iazzag, November 2026.

Main article: P. Bose, J.-L. De Carufel, J. Stuart and D. Hill, *The Spanning Ratio of the Directed Θ6-Graph Is 5*, SoCG 2026 (LIPIcs 367, 20:1–20:18). Full version: [arXiv:2603.09048](https://arxiv.org/abs/2603.09048).

The webpage is the report. It contains the definitions, an interactive lab, the 5 − ε construction of the paper rebuilt and checked numerically, a 5-point example close to 4, an example where greedy routing spirals, a game, a map of the upper bound proof (with the 20 linear programs of the paper solved in the page), checks that run in the browser, related work and the bibliography.

Online version: https://ziazzag.github.io/directed-theta6-spanning-ratio/
Code: https://github.com/ziazzag/directed-theta6-spanning-ratio

## How to run

Nothing to install and no build step. Open `index.html` in a browser (Chrome, Firefox or Edge; it also works from `file://`). An internet connection is only needed for the fonts and for KaTeX, which draws the formulas.

The tests and experiments need Node.js (version 18 or newer):

```sh
node tests/run-tests.js              # all numerical checks (a few seconds)
node experiments/search.js 8 6000    # annealing search for bad point sets, writes experiments/search-results.json (a few minutes)
node experiments/spiral.js           # the greedy spiral of §2 for several values of rho
```

Optional cross-check of the linear programs with an independent solver (Python 3 with scipy):

```sh
python experiments/lp_crosscheck.py  # should print 16 infeasible and the 4 cases named in the paper
```

`tests/run-tests.js` checks that the two definitions of the edges give the same graph, the bounds 2 (undirected) and 5 (directed, Theorem 1), the order of the norms, Lemmas 2, 3 and 9, the Lemma 1 construction for several δ, the typo in the formula of the qⁱ (printed as INFO), the 20 linear programs (16 infeasible with a certificate, 4 feasible as in the paper), the 5-point example and the spiral. It prints PASS/FAIL for each check and "all checks passed" at the end.

## Files

| File | Content |
|---|---|
| `index.html`, `css/style.css` | the page |
| `js/theta6.js` | core library: cones, hexagonal norms, Θ6 with both definitions, Dijkstra, spanning ratio, greedy routing, Lemma 1 construction, spiral, annealing step. Works in the browser and in Node |
| `js/lp.js` | the linear programs of Section 4 of the paper: simplex method (two phases), the 20 systems, certificates checked with exact fractions. Works in the browser and in Node |
| `js/view.js` | small canvas toolkit (coordinates, pan/zoom, drawing helpers, theme colours) |
| `js/lab.js` | §2 interactive lab |
| `js/figures.js` | hero animation, §1 definition figure, §5 proof figure (Lemmas 2 and 4) |
| `js/more.js` | §2 spiral figure, §3 5-point example, §5 Lemma 9 figure, the two candidate paths and the linear programs |
| `js/worst.js` | §3 lower bound viewer and ratio-vs-δ chart, §4 game |
| `js/checks.js` | §6 checks that run in the browser |
| `js/main.js` | theme switch, formulas, starts everything |
| `tests/run-tests.js` | full test suite (Node) |
| `experiments/search.js`, `experiments/search-results.json` | annealing search for bad point sets and its last results |
| `experiments/spiral.js` | greedy spiral experiment |
| `experiments/lp_crosscheck.py` | the 20 linear programs solved again with scipy, to compare with `js/lp.js` |
| `media/video.mp4` | short animated video (the page only shows the video block if this file exists) |
| `AI_JOURNAL.md` | AI journal |
| `ai-journal.html` | the same journal as a web page, linked from the menu (rebuilt with `node make-journal-html.js` in the parent folder) |

## Conventions

Cones as in the paper: the lines of slope −√3, 0 and √3 through p give six cones C_p^0..C_p^5, numbered counter-clockwise starting with C_p^0 directly below p (C^i covers the angles [240° + 60°i, 300° + 60°i]). u → v is an edge if v has the smallest projection on the bisector of its cone among the points of that cone (equivalently, the canonical triangle ∇_u^v is empty). Points are assumed to be in general position (no two points on a line of slope 0 or ±√3); points placed by hand get a tiny random shift.

In the code `hexNorm` is ‖·‖ with the filled hexagon in the paper (unit ball with corners (±1, 0)) and `tippedNorm` is the one with the outlined, tipped hexagon (corners (0, ±2/√3)).
