#!/usr/bin/env python3
# Vote Simulator - aggregated data builder (state x minute)
# Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licensed under the MIT License (see LICENSE).
#
# Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
# responsible for errors, inaccuracies or any consequence of using it.
# Election data: public data from the Brazilian Superior Electoral Court (TSE).
"""Downloads TSE ballot-box bulletins (2026, 1st round) and aggregates President by state x arrival minute.
Usage: python scripts/build_aggregated_data.py <temp_dir> <output.js> [UF ...]
Output: data/aggregated_president_2026_round1.js (window.TSE_DATA)."""
import csv, io, json, os, sys, zipfile, urllib.request, datetime
BASE = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/buweb/"
UFS = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO ZZ".split()
TMP = sys.argv[1]; OUT = sys.argv[2]
os.makedirs(TMP, exist_ok=True)
HEADER = """/*
 * Vote Simulator - state x minute aggregate, President 2026, 1st round
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licensed under the MIT License (see LICENSE).
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Source: public data from the Brazilian Superior Electoral Court (TSE), Ballot Box Bulletin (BU).
 * Generated file (see scripts/); do not edit by hand.
 */
"""
cands = {}          # number -> (name, party)
rows = []           # aggregated rows
t0 = None
def fetch(uf):
    name = f"bweb_1t_{uf}_051020261403.zip"
    p = os.path.join(TMP, name)
    if not os.path.exists(p):
        urllib.request.urlretrieve(BASE + name, p + '.part')
        os.replace(p + '.part', p)
    return p
per_uf = {}
SEL = sys.argv[3:] or UFS          # states to process in this call (cached in TMP/UF.json)
CACHE = lambda uf: os.path.join(TMP, uf + ".json")
for uf in UFS:
    if os.path.exists(CACHE(uf)):
        d = json.load(open(CACHE(uf))); per_uf[uf] = d["agg"]; cands.update({k: tuple(v) for k, v in d["cands"].items()}); continue
    if uf not in SEL: continue
    p = fetch(uf); print("proc", uf, os.path.getsize(p), flush=True)
    pre = os.path.join(TMP, uf + "_pres.csv")   # optional: already filtered CSV (grep) for huge states
    if os.path.exists(pre):
        src = open(pre, encoding="latin-1", newline="")
    else:
        z = zipfile.ZipFile(p); csvn = [n for n in z.namelist() if n.endswith(".csv")][0]
        src = io.TextIOWrapper(z.open(csvn), encoding="latin-1", newline="")
    r = csv.DictReader(src, delimiter=";")
    secs = {}
    for row in r:
        if row["DS_CARGO_PERGUNTA"] != "Presidente": continue
        k = (row["NM_MUNICIPIO"], row["NR_ZONA"], row["NR_SECAO"])
        s = secs.get(k)
        if s is None:
            s = secs[k] = {"t": row["DT_BU_RECEBIDO"][:16], "ap": int(row["QT_APTOS"]), "co": int(row["QT_COMPARECIMENTO"]), "v": {}}
        n = row["NR_VOTAVEL"]; tv = row["DS_TIPO_VOTAVEL"]
        if tv == "Nominal": cands[n] = (row["NM_VOTAVEL"], row["SG_PARTIDO"])
        key = "B" if tv == "Branco" else "N" if tv == "Nulo" else n
        s["v"][key] = s["v"].get(key, 0) + int(row["QT_VOTOS"])
    agg = {}
    for s in secs.values():
        a = agg.setdefault(s["t"], {"u": 0, "ap": 0, "co": 0, "v": {}})
        a["u"] += 1; a["ap"] += s["ap"]; a["co"] += s["co"]
        for k, x in s["v"].items(): a["v"][k] = a["v"].get(k, 0) + x
    per_uf[uf] = agg
    json.dump({"agg": agg, "cands": {n: cands[n] for n in cands}}, open(CACHE(uf), "w"))
    os.remove(p)
if len(per_uf) < len(UFS):
    print("missing:", [u for u in UFS if u not in per_uf], flush=True); sys.exit(0)
# sort candidates by total
tot = {}
for agg in per_uf.values():
    for a in agg.values():
        for k, x in a["v"].items(): tot[k] = tot.get(k, 0) + x
order = sorted(cands, key=lambda n: -tot.get(n, 0))
allt = sorted({t for agg in per_uf.values() for t in agg})
t0 = datetime.datetime.strptime(allt[0], "%Y-%m-%d %H:%M")
for i, uf in enumerate(UFS):
    for t, a in per_uf[uf].items():
        m = int((datetime.datetime.strptime(t, "%Y-%m-%d %H:%M") - t0).total_seconds() // 60)
        rows.append([i, m, a["u"], a["ap"], a["co"], a["v"].get("B", 0), a["v"].get("N", 0)] + [a["v"].get(n, 0) for n in order])
rows.sort(key=lambda x: x[1])
data = {"fonte": "TSE - Ballot Box Bulletin (Web), round 1 2026 (President)", "t0": t0.isoformat(),
        "ufs": UFS, "candidatos": [{"numero": n, "nome": cands[n][0], "partido": cands[n][1]} for n in order],
        "colunas": ["uf", "min", "urnas", "aptos", "comparecimento", "brancos", "nulos"] + ["c" + n for n in order],
        "linhas": rows}
with open(OUT, "w", encoding="utf-8") as f:
    f.write(HEADER + "window.TSE_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";")
print("ok", len(rows), "rows", sum(r[2] for r in rows), "ballot boxes", flush=True)
