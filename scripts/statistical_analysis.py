#!/usr/bin/env python3
# Vote Simulator - statistical tests on the arrival order
# Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
#
# Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
# responsible for errors, inaccuracies or any consequence of using it.
# Election data: public data from the Brazilian Superior Electoral Court (TSE).
"""Statistical test: is the 'one goes up, the other goes down' trajectory compatible with a random arrival order?
Uses data/aggregated_president_2026_round1.js (state x minute blocks).
Usage: python scripts/statistical_analysis.py [n_perm_blocks] [n_perm_boxes]"""
import json, sys, re, math
import numpy as np
D = json.loads(re.search(r"=(\{.*\});?\s*$", open("data/aggregated_president_2026_round1.js", encoding="utf-8").read(), re.S).group(1))
L = np.array(D["linhas"], dtype=float)
uf, mn, u = L[:, 0].astype(int), L[:, 1], L[:, 2]
cand = L[:, 7:]; valid = cand.sum(1); A, B = cand[:, 0], cand[:, 1]
T = u.sum(); R = len(u)
grid = np.arange(0.005, 1.0001, 0.005)

def curvas(ordem, uA=None):
    uo, Ao, Bo, Vo = u[ordem], A[ordem], B[ordem], valid[ordem]
    cu = np.concatenate([[0], np.cumsum(uo)])
    out = []
    for w in (Ao, Bo, Vo):
        c = np.concatenate([[0], np.cumsum(w)])
        x = grid * T
        i = np.clip(np.searchsorted(cu, x, side="right") - 1, 0, R - 1)
        fr = (x - cu[i]) / uo[i]
        out.append(c[i] + (c[i + 1] - c[i]) * fr)
    return out[0] / out[2] * 100, out[1] / out[2] * 100

ordem_real = np.arange(R)  # already sorted by arrival minute
a_run, b_run = curvas(ordem_real)
a_fin, b_fin = A.sum() / valid.sum() * 100, B.sum() / valid.sum() * 100
jan = (grid >= 0.02) & (grid <= 0.50)
S_real = np.abs(a_run - a_fin)[jan].max()
print(f"Final: A={a_fin:.2f}%  B={b_fin:.2f}%   Ballot boxes={int(T):,}  Blocks={R}")
print(f"Real: A at 10% of the boxes={a_run[19]:.2f}%  B={b_run[19]:.2f}%  | max|A_run-A_final| (2-50%)={S_real:.2f} p.p.")

# 1) the mirror is almost arithmetic: A+B ~ constant
soma = a_run + b_run
print(f"\n[1] A+B (% valid) during the count: min={soma.min():.2f} max={soma.max():.2f} std={soma.std():.3f}")
print(f"    correlation(A_run, B_run) = {np.corrcoef(a_run, b_run)[0,1]:.3f}")

# 2) permutation: random order of the blocks
n = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
rng = np.random.default_rng(2026)
S = np.empty(n); z10 = np.empty(n); corr = np.empty(n)
for k in range(n):
    a, b = curvas(rng.permutation(R))
    S[k] = np.abs(a - a_fin)[jan].max(); z10[k] = a[19]; corr[k] = np.corrcoef(a, b)[0, 1]
p = (np.sum(S >= S_real) + 1) / (n + 1)
sd10 = z10.std(); z = (a_run[19] - a_fin) / sd10
print(f"\n[2] Permutation ({n} random orders of state x minute blocks)")
print(f"    max deviation under random order: mean={S.mean():.3f} p99.9={np.quantile(S,0.999):.3f} max={S.max():.3f} p.p.")
print(f"    p-value (deviation >= real) = {p:.2e}  (lower bound; none of the {n} orders came close)")
print(f"    at 10% of the boxes: real A_run={a_run[19]:.2f}% | null={z10.mean():.2f}% +- {sd10:.3f} | z={z:.1f}")
print(f"    approx. p (normal, two-sided) = {math.erfc(abs(z)/math.sqrt(2)):.1e}")

# 2b) permutation at BALLOT-BOX level (each bulletin arrives independently)
#     each box inherits the average composition of its state x minute block (variation inside the block is ignored)
n2 = int(sys.argv[2]) if len(sys.argv) > 2 else 1500
Tn = int(T); rep = u.astype(int)
Au = np.repeat(A / u, rep); Bu = np.repeat(B / u, rep); Vu = np.repeat(valid / u, rep)
idx = np.clip(np.round(grid * Tn).astype(int) - 1, 0, Tn - 1)
S2 = np.empty(n2); a10 = np.empty(n2)
for k in range(n2):
    pm = rng.permutation(Tn)
    a = np.cumsum(Au[pm])[idx] / np.cumsum(Vu[pm])[idx] * 100
    S2[k] = np.abs(a - a_fin)[jan].max(); a10[k] = a[19]
z2 = (a_run[19] - a_fin) / a10.std()
print(f"\n[2b] Permutation at ballot-box level ({n2} random orders of {Tn:,} boxes)")
print(f"    max deviation under random order: mean={S2.mean():.3f} max={S2.max():.3f} p.p. (real={S_real:.2f})")
print(f"    p-value (deviation >= real) < {1/(n2+1):.1e}")
print(f"    at 10% of the boxes: null={a10.mean():.2f}% +- {a10.std():.3f} | real={a_run[19]:.2f}% | z={z2:.0f}")

# 3) how much of the trajectory is explained only by the mix of states that already arrived?
nuf = len(D["ufs"])
shareA_uf = np.array([A[uf == i].sum() / valid[uf == i].sum() for i in range(nuf)])
Apred = valid * shareA_uf[uf]            # each block with the final share of its own state
cu = np.concatenate([[0], np.cumsum(u)])
def run_pred(w):
    c = np.concatenate([[0], np.cumsum(w)]); x = grid * T
    i = np.clip(np.searchsorted(cu, x, side="right") - 1, 0, R - 1); fr = (x - cu[i]) / u[i]
    return c[i] + (c[i + 1] - c[i]) * fr
vcum = np.concatenate([[0], np.cumsum(valid)]); xg = grid * T
ii = np.clip(np.searchsorted(cu, xg, side="right") - 1, 0, R - 1); fr_ = (xg - cu[ii]) / u[ii]
vrun = vcum[ii] + (vcum[ii + 1] - vcum[ii]) * fr_
a_pred = run_pred(Apred) / vrun * 100
dev_real = a_run - a_fin; dev_pred = a_pred - a_fin
r2 = 1 - np.sum((dev_real - dev_pred) ** 2) / np.sum(dev_real ** 2)
print(f"\n[3] Only by the composition by state (each state with its final result):")
print(f"    deviation at 10%: real={dev_real[19]:+.2f} p.p. | explained by state={dev_pred[19]:+.2f} p.p.")
print(f"    fraction of the variation explained (R2) = {r2:.2f}")

# 4) when each state arrives and how much it votes for A
w = u
print("\n[4] State: median arrival minute, % A, % B (valid)")
rows = []
for i, nome in enumerate(D["ufs"]):
    m = uf == i; o = np.argsort(mn[m]); c = np.cumsum(u[m][o]); med = mn[m][o][np.searchsorted(c, c[-1] / 2)]
    rows.append((med, nome, A[m].sum() / valid[m].sum() * 100, B[m].sum() / valid[m].sum() * 100, int(u[m].sum())))
for med, nome, a, b, nu in sorted(rows):
    print(f"    {nome:>2}  min={int(med):>3}  A={a:5.1f}%  B={b:5.1f}%  boxes={nu:>6,}")
meds = np.array([r[0] for r in rows]); ash = np.array([r[2] for r in rows]); wts = np.array([r[4] for r in rows], float)
def wcorr(x, y, w):
    mx, my = np.average(x, weights=w), np.average(y, weights=w)
    return np.sum(w * (x - mx) * (y - my)) / math.sqrt(np.sum(w * (x - mx) ** 2) * np.sum(w * (y - my) ** 2))
print(f"    weighted correlation (median minute x %A by state) = {wcorr(meds, ash, wts):+.2f}")
