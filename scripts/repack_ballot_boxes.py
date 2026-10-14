#!/usr/bin/env python3
# Vote Simulator - repacks ballot-box data files from format 1 to format 2
# Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
#
# Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
# responsible for errors, inaccuracies or any consequence of using it.
# Election data: public data from the Brazilian Superior Electoral Court (TSE).
"""Converts data/ballot_boxes_president_*.js from format 1 (interleaved uint16 columns) to format 2
(per column: low-byte plane, then high-byte plane), which compresses about 17% better.
The values do not change. Files already in format 2 are skipped.
Usage: python scripts/repack_ballot_boxes.py"""
import glob, json, re, zlib, base64
import numpy as np

for path in sorted(glob.glob("data/ballot_boxes_president_*.js")):
    s = open(path, encoding="utf-8").read()
    m = re.search(r'(window\.TSE_DS=window\.TSE_DS\|\|\{\};window\.TSE_DS\["([^"]+)"\]=)(\{.*?\});(window\.TSE_DS\["[^"]+"\]\.b64=")([^"]+)(";)', s, re.S)
    meta = json.loads(m.group(3))
    if meta.get("fmt", 1) == 2:
        print("skip", path, "(already format 2)"); continue
    raw = zlib.decompress(base64.b64decode(m.group(5))); n = meta["n"]
    out = [raw[:n]]
    for j in range(len(meta["colunas"])):
        a = np.frombuffer(raw[n + j * 2 * n: n + (j + 1) * 2 * n], dtype="<u2")
        out += [(a & 255).astype(np.uint8).tobytes(), (a >> 8).astype(np.uint8).tobytes()]
    z = zlib.compress(b"".join(out), 9)
    meta = {"fmt": 2, **meta}
    new = s[:m.start()] + m.group(1) + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";" + m.group(4) + base64.b64encode(z).decode() + m.group(6) + s[m.end():]
    open(path, "w", encoding="utf-8").write(new)
    print("ok", path, len(m.group(5)), "->", len(base64.b64encode(z)), "base64 chars")
