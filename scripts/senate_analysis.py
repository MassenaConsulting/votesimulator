#!/usr/bin/env python3
# Vote Simulator - Senators Theory analysis
# Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licensed under the MIT License (see LICENSE).
#
# Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
# responsible for errors, inaccuracies or any consequence of using it.
# Election data: public data from the Brazilian Superior Electoral Court (TSE).
"""Does the theory 'whoever votes for a PL senator does not vote for Lula; whoever votes for a PT senator does not vote
for Bolsonaro' fit the ballot-box bulletins? Computes, box by box, the bounds imposed by the theory and the
counterfactual scenarios.
Usage: python scripts/senate_analysis.py   (reads data/ballot_boxes_president_<year>_round1.js)"""
import json, re, zlib, base64
import numpy as np

def carrega(ano):
    s = open(f"data/ballot_boxes_president_{ano}_round1.js", encoding="utf-8").read()
    key = f"{ano}-1"
    meta = json.loads(re.search(r'\["%s"\]=(\{.*?\});window' % key, s, re.S).group(1))
    raw = zlib.decompress(base64.b64decode(re.search(r'\.b64="([^"]+)"', s).group(1)))
    n = meta["n"]; d = {}; off = n
    for c in meta["colunas"]:
        if meta.get("fmt", 1) == 2:     # byte planes: low bytes, then high bytes
            lo = np.frombuffer(raw[off:off + n], dtype=np.uint8).astype(np.float64)
            hi = np.frombuffer(raw[off + n:off + 2 * n], dtype=np.uint8).astype(np.float64)
            d[c] = lo + 256 * hi
        else:
            d[c] = np.frombuffer(raw[off:off + 2 * n], dtype="<u2").astype(np.float64)
        off += 2 * n
    d["uf"] = np.frombuffer(raw[:n], dtype=np.uint8)
    return meta, d

def pct(x, tot): return 100 * x / tot

for ano in (2026, 2022):
    meta, d = carrega(ano); n = meta["n"]; sv = meta["senVotos"]
    nums = [c["numero"] for c in meta["candidatos"]]
    iF, iL = nums.index("22"), nums.index("13")             # PL / PT (Bolsonaro / Lula)
    C, F, L = d["comp"], d[f"c{iF}"], d[f"c{iL}"]
    z = C > 0; d = {k: v[z] for k, v in d.items()}; n = int(z.sum()); C, F, L = d["comp"], d[f"c{iF}"], d[f"c{iL}"]
    K = len(nums) + (1 if "c%d" % len(nums) in d else 0)
    pres = np.stack([d[f"c{k}"] for k in range(K)] + [d["bra"], d["nul"]], axis=1)   # all options
    hasS = (d["s_pl"] + d["s_pt"] + d["s_out"] + d["s_bn"]) > 0
    gPL = np.where(hasS, d["s_pl"] / (sv * C), 0); gPT = np.where(hasS, d["s_pt"] / (sv * C), 0)
    gPL = np.minimum(gPL, 1); gPT = np.minimum(gPT, 1 - gPL)
    nome = "BOLSONARO (PL) / LULA (PT)"
    valid = pres[:, :K].sum(1)
    print(f"\n=== {ano} 1st round | {n:,} ballot boxes | {nome} | senator: {sv} vote(s) per voter ===")
    print(f"Senator (% of senator votes): PL {pct(d['s_pl'].sum(), (d['s_pl']+d['s_pt']+d['s_out']+d['s_bn']).sum()):.1f}% | "
          f"PT {pct(d['s_pt'].sum(), (d['s_pl']+d['s_pt']+d['s_out']+d['s_bn']).sum()):.1f}% | others {pct(d['s_out'].sum(), (d['s_pl']+d['s_pt']+d['s_out']+d['s_bn']).sum()):.1f}%")
    print(f"Real president (% of turnout): PL {pct(F.sum(), C.sum()):.1f}% | PT {pct(L.sum(), C.sum()):.1f}%")
    # 1) Does the theory fit the data? Lula <= C - nPL ; PL-president <= C - nPT
    nPL, nPT = gPL * C, gPT * C
    vL = np.maximum(0, L + nPL - C); vF = np.maximum(0, F + nPT - C)
    print("[1] Minimum contradiction with the theory (votes that would NOT fit):")
    print(f"    Lula among PL-senator voters: >= {vL.sum():,.0f} votes ({pct(vL.sum(), L.sum()):.2f}% of Lula's total); affected boxes: {(vL>0).sum():,} ({pct((vL>0).sum(), n):.1f}%)")
    print(f"    PL president among PT-senator voters: >= {vF.sum():,.0f} votes ({pct(vF.sum(), F.sum()):.2f}%); boxes: {(vF>0).sum():,} ({pct((vF>0).sum(), n):.1f}%)")
    # 2) correlation between boxes
    ok = hasS & (C > 0)
    r1 = np.corrcoef((d['s_pl'] / (sv * C))[ok], (L / C)[ok])[0, 1]; r2 = np.corrcoef((d['s_pt'] / (sv * C))[ok], (F / C)[ok])[0, 1]
    r3 = np.corrcoef((d['s_pl'] / (sv * C))[ok], (F / C)[ok])[0, 1]; r4 = np.corrcoef((d['s_pt'] / (sv * C))[ok], (L / C)[ok])[0, 1]
    print(f"[2] Correlation between boxes: PL senator x Lula {r1:+.2f} | PT senator x PL president {r2:+.2f} | PL senator x PL president {r3:+.2f} | PT senator x Lula {r4:+.2f}")
    # 2b) Goodman regression (ecological inference): L/C = bPL*gPL + bPT*gPT + bO*gO, weights = turnout
    #     the coefficients estimate the Lula vote rate inside each group of senator voters (they may fall outside [0,1])
    w = np.sqrt(C[ok]); A = np.stack([gPL[ok], gPT[ok], 1 - gPL[ok] - gPT[ok]], axis=1) * w[:, None]
    est = {}
    for nm, y in (("Lula", L), ("PL-pres", F)):
        est[nm] = np.linalg.lstsq(A, (y / C)[ok] * w, rcond=None)[0]
    print("[2b] Goodman: % that voted for each candidate, by senator group (estimate; not an individual fact)")
    for nm in est: print(f"    {nm:<8} among PL-senator voters {100*est[nm][0]:6.1f}% | PT {100*est[nm][1]:6.1f}% | others {100*est[nm][2]:6.1f}%")
    # 3) scenarios
    X = pres / C[:, None]                       # real distribution of the options (sums to 1 per box)
    def sem(i):                                 # distribution without candidate i, renormalized
        Y = X.copy(); Y[:, i] = 0; den = Y.sum(1, keepdims=True); return np.where(den > 1e-9, Y / np.maximum(den, 1e-9), X)
    gO = 1 - gPL - gPT
    excl = gPL[:, None] * sem(iL) + gPT[:, None] * sem(iF) + gO[:, None] * X
    fid = np.zeros_like(X)                      # PL->PL president, PT->Lula, other nominal->others, senator blank/null -> blank/null
    sbn = np.where(hasS, d["s_bn"] / (sv * C), 0); sout = np.where(hasS, d["s_out"] / (sv * C), 0)
    fid[:, iF] = gPL; fid[:, iL] = gPT
    fid[:, K - 1 if K > len(nums) else 2] += sout          # 'others'
    fid[:, K] = sbn / 2; fid[:, K + 1] = sbn / 2           # blank/null (equal split)
    sem_s = ~hasS; fid[sem_s] = X[sem_s]; excl[sem_s] = X[sem_s]
    def res(M, nomes):
        v = (M * C[:, None])[:, :K].sum(0); t = v.sum()
        return {nomes[k]: round(100 * v[k] / t, 2) for k in range(K)}
    nomes = [{"22": "Bolsonaro", "13": "Lula"}.get(c["numero"], c["nome"].split()[0].title()) for c in meta["candidatos"]] + (["Others"] if K > len(nums) else [])
    print("[3] Result (% of valid votes):")
    for rot, M in [("Real", X), ("Exclusion only", excl), ("Full loyalty", fid)]:
        r = res(M, nomes); top = sorted(r.items(), key=lambda a: -a[1])[:4]
        print(f"    {rot:<17}", " | ".join(f"{k} {v:.1f}%" for k, v in top))
