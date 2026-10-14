/*
 * Vote Simulator - simulation engine
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Election data: public data from the Brazilian Superior Electoral Court (TSE).
 */
/* Simulation engine: builds the ballot boxes of each scenario (synthetic or real TSE data).
   No dependencies. Exposed as window.VoteEngine. Texts come from window.I18n (js/i18n.js). */
(function (g) {
  'use strict';

  const tr = function (k, p) { return g.I18n.t(k, p); };

  /* ---------- utilities ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  const PALETA = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#64748b'];

  /* arrival-order options; the label of each one is the i18n key 'order.<id>' */
  const ORDENS = ['aleatoria', 'regiao', 'favA', 'favB', 'chegada', 'aleat_urna', 'aleat_mun', 'aleat_uf', 'aleat_regiao', 'mun_grandes', 'mun_pequenos'];

  /* ---------- synthetic scenarios ----------
     tipos: groups of ballot boxes (weight + valid-vote probabilities [A, B, Others]).
     Names and descriptions are i18n keys: 'scn.<id>.name' and 'scn.<id>.desc'. */
  const ORDENS_REAIS = ['chegada', 'aleat_urna', 'aleat_mun', 'aleat_uf', 'aleat_regiao', 'mun_grandes', 'mun_pequenos'];
  const SCENARIOS = {
    espelhado: {
      espelho: true, ruido: 0,
      series: ['series.partyA', 'series.partyB', 'series.others'],
      tipos: [
        { w: 1, p: [0.42, 0.42, 0.16] }, { w: 1, p: [0.44, 0.44, 0.12] },
        { w: 1, p: [0.46, 0.46, 0.08] }, { w: 1, p: [0.47, 0.47, 0.06] },
        { w: 1, p: [0.48, 0.48, 0.04] }
      ],
      ordens: ['aleatoria', 'regiao'], ordemPadrao: 'aleatoria'
    },
    virada: {
      espelho: false, ruido: 1,
      series: ['series.partyA', 'series.partyB', 'series.others'],
      tipos: [
        { w: 0.45, p: [0.58, 0.38, 0.04] },
        { w: 0.55, p: [0.36, 0.60, 0.04] }
      ],
      ordens: ['favA', 'aleatoria', 'favB'], ordemPadrao: 'favA'
    },
    empate: {
      espelho: false, ruido: 1,
      series: ['series.partyA', 'series.partyB', 'series.others'],
      tipos: [
        { w: 1, p: [0.545, 0.425, 0.030] }, { w: 1, p: [0.505, 0.465, 0.030] },
        { w: 1, p: [0.488, 0.482, 0.030] }, { w: 1, p: [0.460, 0.510, 0.030] },
        { w: 1, p: [0.437, 0.528, 0.035] }
      ],
      ordens: ['aleatoria', 'regiao', 'favA', 'favB'], ordemPadrao: 'aleatoria'
    },
    real: {
      dataset: '2026-1',
      real: true, ordens: ORDENS_REAIS, ordemPadrao: 'chegada'
    },
    real22b: {
      dataset: '2022-2',
      real: true, ordens: ORDENS_REAIS, ordemPadrao: 'chegada'
    },
    real22a: {
      dataset: '2022-1',
      real: true, ordens: ORDENS_REAIS, ordemPadrao: 'chegada'
    }
  };

  /* ---------- common result structure ----------
     { K, N, series:[{nome, cor, key?}], votos:Float64Array(N*K), brancos, nulos, aptos, comp: Float64Array(N), meta }
     (votos = valid votes per ballot box and series; series[i].key is an i18n key re-translated on language change) */
  function alocar(K, N) {
    return { K: K, N: N, votos: new Float64Array(N * K), brancos: new Float64Array(N),
             nulos: new Float64Array(N), aptos: new Float64Array(N), comp: new Float64Array(N) };
  }

  /* ---------- synthetic scenario ---------- */
  function gerarSintetico(sc, o) {
    const r = rng(o.seed), K = sc.series.length, N = o.urnas;
    const totalComp = Math.round(o.eleitores * o.comparecimento);
    const base = totalComp / N;

    // allocate box types in a stratified way (exact weights)
    const somaW = sc.tipos.reduce(function (a, t) { return a + t.w; }, 0);
    const tipoDe = new Int32Array(N);
    let acc = 0, idx = 0;
    for (let t = 0; t < sc.tipos.length; t++) {
      acc += sc.tipos[t].w / somaW * N;
      const fim = t === sc.tipos.length - 1 ? N : Math.round(acc);
      while (idx < fim) tipoDe[idx++] = t;
    }

    // arrival order
    let ids = Array.from({ length: N }, function (_, i) { return i; });
    shuffle(ids, r);
    const prob = function (i) { return sc.tipos[tipoDe[i]].p; };
    if (o.ordem === 'regiao') {
      ids.sort(function (a, b) { return tipoDe[a] - tipoDe[b]; });
    } else if (o.ordem === 'favA') {
      ids.sort(function (a, b) { return (prob(b)[0] - prob(b)[1]) - (prob(a)[0] - prob(a)[1]); });
    } else if (o.ordem === 'favB') {
      ids.sort(function (a, b) { return (prob(a)[0] - prob(a)[1]) - (prob(b)[0] - prob(b)[1]); });
    }

    const out = alocar(K, N);
    for (let pos = 0; pos < N; pos++) {
      const p = sc.tipos[tipoDe[ids[pos]]].p;
      const tam = sc.espelho ? Math.round(base) : Math.max(10, Math.round(base * (0.85 + 0.3 * r())));
      const bra = Math.round(tam * 0.025), nul = Math.round(tam * 0.03);
      const val = tam - bra - nul;
      const v = new Array(K).fill(0);
      if (sc.espelho) {
        const ab = Math.round(val * p[0]);
        v[0] = ab; v[1] = ab; v[2] = Math.max(0, val - 2 * ab);
      } else {
        let soma = 0;
        for (let k = 0; k < K; k++) {
          const sd = Math.sqrt(val * p[k] * (1 - p[k])) * sc.ruido;
          v[k] = Math.max(0, val * p[k] + sd * gauss(r));
          soma += v[k];
        }
        // largest remainders: hand out the leftover votes without biasing any series
        let tot = 0;
        const fr = [];
        for (let k = 0; k < K; k++) {
          const x = v[k] / soma * val;
          v[k] = Math.floor(x); tot += v[k]; fr.push([x - v[k], k]);
        }
        fr.sort(function (a, b) { return b[0] - a[0]; });
        for (let q = 0; q < val - tot; q++) v[fr[q][1]]++;
      }
      for (let k = 0; k < K; k++) out.votos[pos * K + k] = v[k];
      out.brancos[pos] = bra; out.nulos[pos] = nul; out.comp[pos] = tam;
      out.aptos[pos] = Math.round(tam / o.comparecimento);
    }
    out.series = sc.series.map(function (k, i) { return { key: k, nome: tr(k), cor: PALETA[i] }; });
    out.meta = { fonte: 'Synthetic simulation' };
    return out;
  }

  /* ---------- real TSE data scenario (per ballot box) ---------- */
  const REGIAO = { AC: 0, AM: 0, AP: 0, PA: 0, RO: 0, RR: 0, TO: 0, AL: 1, BA: 1, CE: 1, MA: 1, PB: 1, PE: 1, PI: 1, RN: 1, SE: 1,
                   DF: 2, GO: 2, MT: 2, MS: 2, ES: 3, MG: 3, RJ: 3, SP: 3, PR: 4, RS: 4, SC: 4, ZZ: 5 };
  const ARQUIVOS = { '2026-1': 'data/ballot_boxes_president_2026_round1.js', '2022-1': 'data/ballot_boxes_president_2022_round1.js', '2022-2': 'data/ballot_boxes_president_2022_round2.js' };

  function carregaScript(src) {
    return new Promise(function (ok, erro) {
      const t = document.createElement('script');
      t.src = src; t.onload = ok; t.onerror = function () { erro(new Error(tr('err.noFile', { src: src }))); };
      document.head.appendChild(t);
    });
  }

  /* downloads (if needed) and decodes the binary block (base64 + zlib) produced by scripts/build_ballot_boxes.py */
  async function carregarUrnas(chave) {
    if (!(g.TSE_DS && g.TSE_DS[chave])) await carregaScript(ARQUIVOS[chave]);
    const M = g.TSE_DS[chave];
    if (typeof DecompressionStream === 'undefined') throw new Error(tr('err.noDecomp'));
    const bin = atob(M.b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
    const n = M.n, U = { n: n, fonte: M.fonte, ufs: M.ufs, municipios: M.municipios, candidatos: M.candidatos };
    U.uf = new Uint8Array(buf, 0, n);
    M.colunas.forEach(function (c, j) { U[c] = new Uint16Array(buf.slice(n + j * 2 * n, n + (j + 1) * 2 * n)); });
    U.K = M.colunas.filter(function (c) { return /^c\d+$/.test(c); }).length;
    U.senVotos = M.senVotos || 0;
    return U;
  }

  function resumoReal(U) {
    let aptos = 0, comp = 0;
    for (let i = 0; i < U.n; i++) { aptos += U.aptos[i]; comp += U.comp[i]; }
    return { urnas: U.n, aptos: aptos, comparecimento: comp / aptos };
  }

  /* arrival order: key = group position + random draw (breaks ties and shuffles inside the group) */
  function ordenar(U, ordem, r) {
    const T = U.n, chave = new Float64Array(T);
    if (ordem === 'chegada') {
      for (let i = 0; i < T; i++) chave[i] = U.min[i] + r();
    } else if (ordem === 'aleat_urna') {
      for (let i = 0; i < T; i++) chave[i] = r();
    } else {
      let grp, ng;
      if (ordem === 'aleat_uf') { grp = U.uf; ng = U.ufs.length; }
      else if (ordem === 'aleat_regiao') {
        const reg = U.ufs.map(function (u) { return REGIAO[u]; });
        grp = Uint8Array.from(U.uf, function (u) { return reg[u]; }); ng = 6;
      } else { grp = U.mun; ng = U.municipios.length; }
      const ids = Array.from({ length: ng }, function (_, i) { return i; });
      if (ordem === 'mun_grandes' || ordem === 'mun_pequenos') {
        const cont = new Int32Array(ng);
        for (let i = 0; i < T; i++) cont[grp[i]]++;
        const sinal = ordem === 'mun_grandes' ? -1 : 1;
        shuffle(ids, r);
        ids.sort(function (a, b) { return sinal * (cont[a] - cont[b]); });
      } else shuffle(ids, r);
      const pos = new Int32Array(ng);
      ids.forEach(function (gid, i) { pos[gid] = i; });
      for (let i = 0; i < T; i++) chave[i] = pos[grp[i]] + r();
    }
    const idx = new Int32Array(T);
    for (let i = 0; i < T; i++) idx[i] = i;
    idx.sort(function (a, b) { return chave[a] - chave[b]; });
    return idx;
  }

  /* ---------- Senators Theory ----------
     Groups per ballot box (1st senator vote): PL -> 'candidate 22', PT -> 'candidate 13', others.
     In 2026 each voter casts 2 senator votes and the bulletin sums them: the 1st vote is approximated by half of the party's votes.
       exclusao   : PL-senator voters do not vote for Lula; PT-senator voters do not vote for 22; the rest vote like the box.
                    (the vote that would go to the vetoed candidate moves to the other options, in the proportion of the box)
       fidelidade : PL senator = vote for 22, PT senator = vote for 13, any other = others; senator blank/null = blank/null.
       senadores  : "1st or 2nd senator loyal" (2026 only, 2 votes per voter). Each voter has 2 senator votes:
                    any PL (without PT) = 22; any PT (without PL) = 13; one PL and one PT = undecided (own series); neither = other.
                    The bulletin sums the 2 votes per box: p_pl = s_pl/(2C), p_pt = s_pt/(2C) and the 2 votes are treated as independent:
                    P(PL only) = 1-(1-pl)^2-2*pl*pt, P(PT only) = 1-(1-pt)^2-2*pl*pt, P(PL and PT) = 2*pl*pt, P(neither) = (1-pl-pt)^2. */
  function ctxTeoria(U) {
    const K = U.K, cs = U.candidatos;
    return { K: K, iF: cs.findIndex(function (c) { return c.numero === '22'; }), iL: cs.findIndex(function (c) { return c.numero === '13'; }),
             sv: U.senVotos || 1, demais: K > cs.length ? K - 1 : -1, x: new Float64Array(K + 2),
             outro: K > cs.length ? K - 1 : cs.findIndex(function (c) { return c.numero !== '22' && c.numero !== '13'; }) };
  }
  /* fills out[0..K-1] (candidates) + out[K] blank + out[K+1] null + out[K+2] undecided with the votes of box i under the mode */
  function urnaTeoria(U, modo, i, X, out) {
    const K = X.K, C = U.comp[i], x = X.x;
    for (let k = 0; k < K; k++) x[k] = C ? U['c' + k][i] / C : 0;
    x[K] = C ? U.bra[i] / C : 0; x[K + 1] = C ? U.nul[i] / C : 0;
    out[K + 2] = 0;
    const tem = (U.s_pl[i] + U.s_pt[i] + U.s_out[i] + U.s_bn[i]) > 0;
    if (!C || !tem || modo === 'nenhuma') { for (let k = 0; k < K + 2; k++) out[k] = x[k] * C; return; }
    const d = X.sv * C;
    if (modo === 'senadores') {
      const pl = Math.min(1, U.s_pl[i] / d), pt = Math.min(1 - pl, U.s_pt[i] / d), ambos = 2 * pl * pt;
      const soPL = 1 - (1 - pl) * (1 - pl) - ambos, soPT = 1 - (1 - pt) * (1 - pt) - ambos;
      out.fill(0);
      out[X.iF] = soPL * C; out[X.iL] = soPT * C; out[K + 2] = ambos * C;
      out[X.outro] = Math.max(0, 1 - soPL - soPT - ambos) * C;
      return;
    }
    const gPL = Math.min(1, U.s_pl[i] / d), gPT = Math.min(1 - gPL, U.s_pt[i] / d), gO = 1 - gPL - gPT;
    if (modo === 'fidelidade') {
      out.fill(0);
      out[X.iF] = gPL * C; out[X.iL] = gPT * C;
      if (X.demais >= 0) out[X.demais] = U.s_out[i] / d * C;
      out[K] = out[K + 1] = U.s_bn[i] / d * C / 2;
      return;
    }
    const dL = 1 - x[X.iL], dF = 1 - x[X.iF];
    for (let k = 0; k < K + 2; k++) {
      const semL = k === X.iL ? 0 : (dL > 1e-9 ? x[k] / dL : x[k]);
      const semF = k === X.iF ? 0 : (dF > 1e-9 ? x[k] / dF : x[k]);
      out[k] = (gO * x[k] + gPL * semL + gPT * semF) * C;
    }
  }
  function colunasTeoria(U, modo) {
    const T = U.n, X = ctxTeoria(U), K = X.K, out = new Float64Array(K + 3);
    const cols = Array.from({ length: K + 3 }, function () { return new Float64Array(T); });
    for (let i = 0; i < T; i++) {
      urnaTeoria(U, modo, i, X, out);
      for (let k = 0; k < K + 3; k++) cols[k][i] = out[k];
    }
    return { c: cols.slice(0, K), bra: cols[K], nul: cols[K + 1], ind: cols[K + 2] };
  }

  /* national summary: real result and result under each mode + compatibility test (bounds) */
  function resumoTeoria(U) {
    if (!U.s_pl) return null;
    const X = ctxTeoria(U), K = X.K, out = new Float64Array(K + 3), T = U.n;
    const res = {};
    ['nenhuma', 'exclusao', 'fidelidade'].concat(X.sv === 2 ? ['senadores'] : []).forEach(function (m) {
      const tot = new Float64Array(K + 3);
      for (let i = 0; i < T; i++) { urnaTeoria(U, m, i, X, out); for (let k = 0; k < K + 3; k++) tot[k] += out[k]; }
      let val = tot[K + 2]; for (let k = 0; k < K; k++) val += tot[k];
      const pl = tot[X.iF] / val * 100, pt = tot[X.iL] / val * 100, ind = tot[K + 2] / val * 100;
      res[m] = { pl: pl, pt: pt, ind: ind, outros: 100 - pl - pt - ind, votosPL: tot[X.iF], votosPT: tot[X.iL] };
    });
    // minimum contradiction: Lula <= turnout - voters(PL senator) and 22 <= turnout - voters(PT senator)
    let vL = 0, vF = 0, nL = 0, nF = 0, totL = 0, totF = 0, nPL = 0, nPT = 0;
    for (let i = 0; i < T; i++) {
      const C = U.comp[i]; if (!C) continue;
      const d = X.sv * C, gPL = Math.min(1, U.s_pl[i] / d), gPT = Math.min(1 - gPL, U.s_pt[i] / d);
      const L = U['c' + X.iL][i], F = U['c' + X.iF][i];
      const a = Math.max(0, L + gPL * C - C), b = Math.max(0, F + gPT * C - C);
      vL += a; vF += b; if (a > 0) nL++; if (b > 0) nF++; totL += L; totF += F; nPL += gPL * C; nPT += gPT * C;
    }
    res.teste = { vL: vL, vF: vF, nL: nL, nF: nF, totL: totL, totF: totF, urnas: T, eleitoresPL: nPL, eleitoresPT: nPT };
    res.nomes = { pl: U.candidatos[X.iF].nome, pt: U.candidatos[X.iL].nome };
    return res;
  }

  function gerarReal(U, o) {
    const r = rng(o.seed), K = U.K, N = o.urnas, T = U.n;
    const idx = ordenar(U, o.ordem, r);
    const nomes = ['aptos', 'comp', 'bra', 'nul'];
    for (let k = 0; k < K; k++) nomes.push('c' + k);
    const ind = o.teoria === 'senadores' && !!U.s_pl && U.senVotos === 2, Kx = K + (ind ? 1 : 0);
    if (ind) nomes.push('ind');
    const src = nomes.map(function (c) { return U[c]; });
    if (o.teoria && o.teoria !== 'nenhuma' && U.s_pl) {
      const m = colunasTeoria(U, ind ? 'senadores' : o.teoria);
      src[2] = m.bra; src[3] = m.nul;
      for (let k = 0; k < K; k++) src[4 + k] = m.c[k];
      if (ind) src[4 + K] = m.ind;
    }
    const cum = nomes.map(function (c, ci) {
      const a = new Float64Array(T + 1), col = src[ci];
      for (let i = 0; i < T; i++) a[i + 1] = a[i] + col[idx[i]];
      return a;
    });
    const fV = o.eleitores * o.comparecimento / cum[1][T], fA = o.eleitores / cum[0][T];
    const out = alocar(Kx, N);
    let ini = 0;
    for (let j = 0; j < N; j++) {
      const fim = Math.round(T * (j + 1) / N);
      out.aptos[j] = (cum[0][fim] - cum[0][ini]) * fA;
      out.comp[j] = (cum[1][fim] - cum[1][ini]) * fV;
      out.brancos[j] = (cum[2][fim] - cum[2][ini]) * fV;
      out.nulos[j] = (cum[3][fim] - cum[3][ini]) * fV;
      for (let k = 0; k < Kx; k++) out.votos[j * Kx + k] = (cum[4 + k][fim] - cum[4 + k][ini]) * fV;
      ini = fim;
    }
    // fixed color per candidate (22 blue, 13 red); the others use the rest of the palette
    // 22 (PL) is shown as 'Bolsonaro' and 13 (PT) as 'Lula' (surname only, whoever the PL candidate is)
    const FIXA = { '22': PALETA[0], '13': PALETA[1] }, livres = PALETA.slice(2, 6);
    const CURTO = { '22': 'Bolsonaro', '13': 'Lula' };
    out.series = U.candidatos.map(function (c) {
      return { nome: (CURTO[c.numero] || c.nome) + ' (' + c.partido + ')', cor: FIXA[c.numero] || livres.shift() };
    });
    if (K > U.candidatos.length) {
      const k = ind ? 'series.otherNoPLPT' : 'series.otherCands';
      out.series.push({ key: k, nome: tr(k), cor: PALETA[6] });
    }
    if (ind) out.series.push({ key: 'series.undecided', nome: tr('series.undecided'), cor: '#db2777' });
    out.meta = { fonte: U.fonte, urnasReais: T };
    return out;
  }

  function gerar(chave, o, D) {
    const sc = SCENARIOS[chave];
    if (sc.real) {
      if (!D) throw new Error(tr('err.noData'));
      return gerarReal(D, o);
    }
    return gerarSintetico(sc, o);
  }

  g.VoteEngine = { ORDEM_CENARIOS: ['real', 'real22b', 'real22a', 'espelhado', 'virada', 'empate'], SCENARIOS: SCENARIOS, ORDENS: ORDENS, gerar: gerar, resumoReal: resumoReal, carregarUrnas: carregarUrnas, resumoTeoria: resumoTeoria, PALETA: PALETA };
})(window);
