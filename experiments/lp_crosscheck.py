# Cross-check of js/lp.js with another solver (scipy / HiGHS).
#   python experiments/lp_crosscheck.py      (needs scipy)
# Same 20 systems as in the page (arXiv 2603.09048, pp. 14, 19, 20). For each case we maximise
# a margin e <= 1 on the strict inequalities (2), (6), (7); the case is feasible iff max e > 0.
# Expected: 16 infeasible, and the 4 feasible ones are the cases the paper names on p. 20.
import itertools
from scipy.optimize import linprog

names = ['y0', 'y1', 'y2', 'y3', 'y4', 'y5', 'a1', 'a2', 'a3', 'a4', 'a5', 'Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5',
         'x0', 'x2', 'x3', 'x4', 'x5', 'b0', 'b2', 'b3', 'b4', 'b5', 'X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'vy', 'vx', 'e']
ix = {n: i for i, n in enumerate(names)}


def system(ycase, xcase, jcase):
    A, b = [], []

    def le(coef, rhs=0.0, strict=False):  # sum coef*var <= rhs   (strict: + e)
        r = [0.0] * len(names)
        for k, v in coef.items():
            r[ix[k]] += v
        if strict:
            r[ix['e']] = 1
        A.append(r)
        b.append(rhs)

    le({'y0': 2.5, 'y1': 3.5}, 1, True)                       # (2)
    le({'y0': 1, 'Y1': 1}, 1)                                 # (4)
    for i in range(1, 6):
        le({'Y%d' % ((i + 1) % 6): 1, 'a%d' % i: -1})
        le({'y%d' % i: 1, 'a%d' % i: 1, 'Y%d' % i: -1})
    le({'X0': 1}, 1)                                          # (5)
    for i in [5, 4, 3, 2, 1]:
        j = (i + 1) % 6
        le({'X%d' % i: 1, 'b%d' % j: -1})
        le({'x%d' % j: 1, 'b%d' % j: 1, 'X%d' % j: -1})
    c6 = {'y0': -2.5, 'y1': 1, 'vy': -5}                      # (6)
    c6.update({'Y%d' % i: -1 for i in range(6)})
    le(c6, -4, True)
    c7 = {'y0': -1.5, 'x0': 1, 'vx': -5}                      # (7)
    c7.update({'X%d' % i: -1 for i in range(6)})
    le(c7, -4, True)
    if ycase == 'Y0':                                         # (10), (11)
        le({'vy': 1, 'y1': -1})
        for k in (2, 3, 4):
            le({'vy': 1, 'y%d' % k: -0.5})
    else:                                                     # (12), (13)
        le({'vy': 1, 'x0': -1})
        le({'vy': 1, 'Y0': -0.5})
    if xcase == 'X0':                                         # (14), (15)
        le({'vx': 1, 'y1': -1})
        le({'vx': 1, 'X1': -0.5})
    else:                                                     # (16), (17)
        le({'vx': 1, 'x0': -1})
        for k in (5, 4, 3):
            le({'vx': 1, 'x%d' % k: -0.5})
    j = 1 if jcase == '(18)' else int(jcase[1])               # (18) / (19)
    for i in range(j + 1, 6):
        le({'a%d' % i: 1, 'x%d' % i: -1})
    for k in range(2, j + 1):
        le({'X%d' % (k - 1): 1, 'y%d' % k: -1})
    return A, b


feasible = []
for yc, xc, jc in itertools.product(['Y0', 'Y1'], ['X0', 'X1'], ['(18)', 'J2', 'J3', 'J4', 'J5']):
    A, b = system(yc, xc, jc)
    c = [0.0] * len(names)
    c[ix['e']] = -1
    bounds = [(0, None)] * len(names)
    bounds[ix['e']] = (None, 1)
    r = linprog(c, A_ub=A, b_ub=b, bounds=bounds, method='highs')
    if r.status == 0 and -r.fun > 1e-9:
        feasible.append('%s, %s, %s (margin %.6f)' % (xc, yc, jc, -r.fun))
print('infeasible:', 20 - len(feasible))
print('feasible:', *feasible, sep='\n  ')
