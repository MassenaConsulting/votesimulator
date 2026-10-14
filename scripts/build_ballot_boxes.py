#!/usr/bin/env python3
# Vote Simulator - ballot-box data builder (per ballot box, President)
# Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
#
# Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
# responsible for errors, inaccuracies or any consequence of using it.
# Election data: public data from the Brazilian Superior Electoral Court (TSE).
"""Per-BALLOT-BOX (section) data for President -> data/ballot_boxes_president_<year>_round<n>.js
  python scripts/build_ballot_boxes.py <election> uf    <temp_dir> <UF>   # downloads and processes one state (.npz cache)
  python scripts/build_ballot_boxes.py <election> merge <temp_dir> <output.js>
<election>: 2026-1 | 2022-1 | 2022-2   (year-round)
Columns per box: municipality, registered voters, turnout, blank, null, arrival minute and candidate votes
(top 5 candidates + 'others'; with 5 candidates or fewer, all of them).
Senate columns (when available): s_pl, s_pt, s_out, s_bn = votes for PL, PT, other parties, blank+null."""
import sys, os, csv, io, json, subprocess, datetime, zlib, base64
import numpy as np
CFG = {
    "2026-1": dict(ano=2026, turno=1, ts="051020261403", senado=True, senvotos=2),
    "2022-1": dict(ano=2022, turno=1, ts="051020221321", senado=True, senvotos=1),
    "2022-2": dict(ano=2022, turno=2, ts="311020221535", senado=False),
}
UFS = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO ZZ".split()
key, mode, tmp = sys.argv[1:4]
C = CFG[key]; EPOCH = datetime.datetime(2000, 1, 1)
os.makedirs(tmp, exist_ok=True)
HEADER = """/*
 * Vote Simulator - ballot-box data, President %d, round %d
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Source: public data from the Brazilian Superior Electoral Court (TSE), Ballot Box Bulletin (BU).
 * Generated file (see scripts/); do not edit by hand.
 */
""" % (C["ano"], C["turno"])

def minuto(s):  # '2026-10-04 18:25:49' or '02/10/2022 17:11:15' (minutes since EPOCH)
    dt = datetime.datetime.strptime(s[:16], "%d/%m/%Y %H:%M" if "/" in s else "%Y-%m-%d %H:%M")
    return int((dt - EPOCH).total_seconds() // 60)

if mode == "uf":
    uf = sys.argv[4]; out = os.path.join(tmp, uf + ".npz")
    if os.path.exists(out): sys.exit(0)
    name = f"bweb_{C['turno']}t_{uf}_{C['ts']}.zip"; z = os.path.join(tmp, name)
    if not os.path.exists(z):
        url = f"https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes{C['ano']}/buweb/{name}"
        subprocess.check_call(["curl", "-sS", "-f", "-o", z + ".part", url]); os.replace(z + ".part", z)
    cmd = f"unzip -p '{z}' '*.csv' | grep -a -e '^\"DT_GERACAO\"' -e ';\"Presidente\";' -e ';\"Senador\";'"
    p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
    r = csv.reader(io.TextIOWrapper(p.stdout, encoding="latin-1", newline=""), delimiter=";")
    h = next(r); ix = {k: i for i, k in enumerate(h)}
    iM, iMN, iZ, iS = ix["CD_MUNICIPIO"], ix["NM_MUNICIPIO"], ix["NR_ZONA"], ix["NR_SECAO"]
    iAp, iCo, iT, iN, iV, iDT, iCg = ix["QT_APTOS"], ix["QT_COMPARECIMENTO"], ix["DS_TIPO_VOTAVEL"], ix["NR_VOTAVEL"], ix["QT_VOTOS"], ix["DT_BU_RECEBIDO"], ix["DS_CARGO_PERGUNTA"]
    iNm, iPt = ix["NM_VOTAVEL"], ix["SG_PARTIDO"]
    urnas = {}; munis = {}; cands = {}; sen = {}
    for row in r:
        if row[iCg] == "Senador":      # [PL, PT, other candidates, blank+null]
            a = sen.setdefault((row[iM], row[iZ], row[iS]), [0, 0, 0, 0]); q = int(row[iV])
            if row[iT] in ("Branco", "Nulo"): a[3] += q   # blank / null
            elif row[iPt] == "PL": a[0] += q
            elif row[iPt] == "PT": a[1] += q
            else: a[2] += q
            continue
        if row[iCg] != "Presidente": continue
        k = (row[iM], row[iZ], row[iS]); s = urnas.get(k)
        if s is None:
            s = urnas[k] = [row[iM], int(row[iAp]), int(row[iCo]), 0, 0, minuto(row[iDT]), {}]
            munis[row[iM]] = row[iMN]
        t, n, q = row[iT], row[iN], int(row[iV])
        if t == "Branco": s[3] += q
        elif t == "Nulo": s[4] += q
        else:
            cands[n] = (row[iNm], row[iPt]); s[6][n] = s[6].get(n, 0) + q
    p.wait()
    nums = sorted(cands)
    arr = np.array([u[:6] for u in urnas.values()], dtype=np.int64)
    V = np.array([[u[6].get(n, 0) for n in nums] for u in urnas.values()], dtype=np.int64)
    S = np.array([sen.get(k, [0, 0, 0, 0]) for k in urnas.keys()], dtype=np.int64)
    np.savez(out, arr=arr, V=V, S=S, meta=json.dumps({"mun": munis, "cands": {n: cands[n] for n in nums}, "nums": nums}))
    os.remove(z); print("ok", uf, len(arr), flush=True)

elif mode == "merge":
    out = sys.argv[4 - 1 + 1] if len(sys.argv) > 4 else None
    base = []; Vs = []; mlist = []; mid = {}; ufcol = []; allc = {}
    for i, uf in enumerate(UFS):
        d = np.load(os.path.join(tmp, uf + ".npz")); m = json.loads(str(d["meta"]))
        for cd, nm in m["mun"].items(): mid[(uf, cd)] = len(mlist); mlist.append([i, nm])
        for n, v in m["cands"].items(): allc[n] = v
        a = d["arr"].copy(); a[:, 0] = [mid[(uf, str(c))] for c in a[:, 0]]
        base.append(a); ufcol.append(np.full(len(a), i))
        Vs.append((m["nums"], d["V"]))
    nums = sorted(allc)
    tot = {n: 0 for n in nums}
    for ns, V in Vs:
        for j, n in enumerate(ns): tot[n] += int(V[:, j].sum())
    rank = sorted(nums, key=lambda n: -tot[n])
    top = rank if len(rank) <= 5 else rank[:5]
    demais = len(rank) > 5
    cols = []
    for ns, V in Vs:
        col = {n: V[:, j] for j, n in enumerate(ns)}
        z = np.zeros(len(V), dtype=np.int64)
        cs = [col.get(n, z) for n in top]
        if demais: cs.append(sum(col.get(n, z) for n in rank[5:]))
        cols.append(np.stack(cs, axis=1))
    a = np.concatenate(base); V = np.concatenate(cols); uf = np.concatenate(ufcol)
    if C["senado"]:
        V = np.concatenate([V, np.concatenate([np.load(os.path.join(tmp, u + ".npz"))["S"] for u in UFS])], axis=1)
    t0 = int(a[:, 5].min()); a[:, 5] -= t0
    M = np.concatenate([a, V], axis=1)
    assert M.max() < 65536 and M.min() >= 0, (M.min(), M.max())
    K = V.shape[1] - (4 if C["senado"] else 0)
    names = ["mun", "aptos", "comp", "bra", "nul", "min"] + [f"c{k}" for k in range(K)] + (["s_pl", "s_pt", "s_out", "s_bn"] if C["senado"] else [])
    # format 2: per column, all low bytes first and then all high bytes ("byte planes"); compresses ~17% better than interleaved uint16
    blob = uf.astype(np.uint8).tobytes() + b"".join((M[:, j] & 255).astype(np.uint8).tobytes() + (M[:, j] >> 8).astype(np.uint8).tobytes() for j in range(M.shape[1]))
    z = zlib.compress(blob, 9)
    meta = {"fonte": f"TSE - Ballot Box Bulletin (Web), round {C['turno']} {C['ano']} (President), per ballot box",
            "fmt": 2, "ano": C["ano"], "turno": C["turno"], "senVotos": C.get("senvotos", 0), "t0": (EPOCH + datetime.timedelta(minutes=t0)).isoformat(),
            "n": int(len(a)), "ufs": UFS, "municipios": mlist, "colunas": names,
            "candidatos": [{"numero": n, "nome": allc[n][0], "partido": allc[n][1]} for n in top]}
    js = HEADER + ('window.TSE_DS=window.TSE_DS||{};window.TSE_DS["%s"]=' % key) + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + \
         (';window.TSE_DS["%s"].b64="' % key) + base64.b64encode(z).decode() + '";'
    open(out, "w", encoding="utf-8").write(js)
    print("ok", len(a), "ballot boxes", len(mlist), "municipalities", K, "vote columns", len(z), "compressed bytes")
