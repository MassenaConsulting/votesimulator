/*
 * Vote Simulator - canvas charts
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Election data: public data from the Brazilian Superior Electoral Court (TSE).
 */
/* Canvas charts, no dependencies. Exposed as window.VoteCharts. Texts and number formats come from window.I18n. */
(function (g) {
  'use strict';

  function css(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  }

  function prepara(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  const M = { l: 44, r: 16, t: 12, b: 38 };
  const I = function () { return window.I18n; };
  const nf = { format: function (v) { return I().num(v); } };
  const pc = function (v) { return I().pct(v, 1); };

  /* index of the history point closest to the mouse x position (px) */
  function indiceEm(canvas, hist, px) {
    if (!hist.x.length) return -1;
    const p = (px - M.l) / (canvas.clientWidth - M.l - M.r) * 100;
    let lo = 0, hi = hist.x.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (hist.x[mid] < p) lo = mid + 1; else hi = mid; }
    if (lo > 0 && Math.abs(hist.x[lo - 1] - p) <= Math.abs(hist.x[lo] - p)) lo--;
    return lo;
  }

  /* vertical line + box with the ballot boxes counted and the cumulative votes of each series */
  function dica(ctx, w, h, hist, series, idx, X, Yk, ks) {
    if (idx == null || idx < 0 || idx >= hist.x.length) return;
    const x = X(hist.x[idx]);
    ctx.save();
    ctx.strokeStyle = css('--muted'); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, h - M.b); ctx.stroke(); ctx.setLineDash([]);
    ks.forEach(function (k) {
      ctx.fillStyle = series[k].cor; ctx.strokeStyle = css('--card'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, Yk(k, idx), 4, 0, 6.2832); ctx.fill(); ctx.stroke();
    });
    const v = hist.v[idx];
    const linhas = [{ t: I().t('chart.boxes', { n: nf.format(hist.n[idx]), N: nf.format(hist.N), p: pc(hist.x[idx]) }), b: true }];
    ks.forEach(function (k) {
      linhas.push({ cor: series[k].cor, t: I().t('chart.votes', { name: series[k].nome.split(' (')[0], v: nf.format(Math.round(v[k])), p: pc(hist.y[idx][k]) }) });
    });
    if (ks.length > 1) {
      const d = Math.round(v[ks[0]] - v[ks[1]]);
      linhas.push({ t: I().t('chart.diff', { d: (d > 0 ? '+' : '') + nf.format(d) }), b: true });
    }
    ctx.font = '12px system-ui, sans-serif';
    let tw = 0;
    linhas.forEach(function (l) { tw = Math.max(tw, ctx.measureText(l.t).width + (l.cor ? 14 : 0)); });
    const bw = tw + 16, bh = linhas.length * 17 + 10;
    let bx = x + 12; if (bx + bw > w - 4) bx = x - 12 - bw;
    const by = M.t + 4;
    ctx.fillStyle = css('--card'); ctx.strokeStyle = css('--border'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    linhas.forEach(function (l, i) {
      const y = by + 14 + i * 17;
      ctx.font = (l.b ? 'bold ' : '') + '12px system-ui, sans-serif';
      ctx.fillStyle = css('--text');
      if (l.cor) { ctx.fillStyle = l.cor; ctx.fillRect(bx + 8, y - 5, 9, 9); ctx.fillStyle = css('--text'); }
      ctx.fillText(l.t, bx + 8 + (l.cor ? 14 : 0), y);
    });
    ctx.restore();
  }

  function escalaY(max) {
    const passo = max > 60 ? 20 : max > 30 ? 10 : 5;
    return Math.max(passo, Math.ceil((max + 1) / passo) * passo);
  }

  function eixos(ctx, m, w, h, ymin, ymax, passo, fmtY) {
    const grade = css('--grid'), txt = css('--muted');
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = txt; ctx.strokeStyle = grade; ctx.lineWidth = 1;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = ymin; v <= ymax + 1e-9; v += passo) {
      const y = m.t + (ymax - v) / (ymax - ymin) * (h - m.t - m.b);
      ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(w - m.r, y); ctx.stroke();
      ctx.fillText(fmtY(v), m.l - 6, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let p = 0; p <= 100; p += 20) {
      const x = m.l + p / 100 * (w - m.l - m.r);
      ctx.fillText(p + '%', x, h - m.b + 6);
    }
    ctx.fillText(I().t('stat.boxes'), m.l + (w - m.l - m.r) / 2, h - 16);
  }

  /* lines: % of valid votes of each series during the count */
  function linhas(canvas, hist, series, finais, hover) {
    const c = prepara(canvas), ctx = c.ctx, w = c.w, h = c.h;
    const m = { l: 44, r: 16, t: 12, b: 38 };
    let max = 0;
    hist.y.forEach(function (ys) { ys.forEach(function (v) { if (v > max) max = v; }); });
    if (finais) finais.forEach(function (v) { if (v > max) max = v; });
    const ymax = escalaY(max), passo = ymax > 60 ? 20 : ymax > 30 ? 10 : 5;
    eixos(ctx, m, w, h, 0, ymax, passo, function (v) { return v + '%'; });
    const X = function (p) { return m.l + p / 100 * (w - m.l - m.r); };
    const Y = function (v) { return m.t + (ymax - v) / ymax * (h - m.t - m.b); };

    if (finais) {
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
      finais.forEach(function (v, k) {
        ctx.strokeStyle = series[k].cor; ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(w - m.r, Y(v)); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    ctx.lineJoin = 'round';
    // the first series is thicker and drawn first: an overlap (A = B) stays visible
    for (let k = 0; k < series.length; k++) {
      const s = series[k];
      ctx.lineWidth = k === 0 ? 5 : 2.5; ctx.strokeStyle = s.cor; ctx.beginPath();
      hist.x.forEach(function (p, i) {
        const px = X(p), py = Y(hist.y[i][k]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    dica(ctx, w, h, hist, series, hover, X, function (k, i) { return Y(hist.y[i][k]); },
      series.map(function (_, k) { return k; }));
  }

  /* mirror: series A above the axis, series B below it */
  function espelho(canvas, hist, series, hover) {
    const c = prepara(canvas), ctx = c.ctx, w = c.w, h = c.h;
    const m = { l: 44, r: 16, t: 12, b: 38 };
    let max = 0;
    hist.y.forEach(function (ys) { max = Math.max(max, ys[0], ys[1]); });
    const ymax = escalaY(max), passo = ymax > 60 ? 20 : ymax > 30 ? 10 : 5;
    eixos(ctx, m, w, h, -ymax, ymax, passo, function (v) { return Math.abs(v) + '%'; });
    if (!hist.x.length) return;
    const X = function (p) { return m.l + p / 100 * (w - m.l - m.r); };
    const Y = function (v) { return m.t + (ymax - v) / (2 * ymax) * (h - m.t - m.b); };

    [0, 1].forEach(function (k) {
      const sinal = k === 0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(X(hist.x[0]), Y(0));
      hist.x.forEach(function (p, i) { ctx.lineTo(X(p), Y(sinal * hist.y[i][k])); });
      ctx.lineTo(X(hist.x[hist.x.length - 1]), Y(0)); ctx.closePath();
      ctx.globalAlpha = 0.28; ctx.fillStyle = series[k].cor; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = series[k].cor; ctx.lineWidth = 2.5; ctx.beginPath();
      hist.x.forEach(function (p, i) {
        const px = X(p), py = Y(sinal * hist.y[i][k]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
    ctx.strokeStyle = css('--text'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(m.l, Y(0)); ctx.lineTo(w - m.r, Y(0)); ctx.stroke();
    ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom'; ctx.fillStyle = css('--text');
    ctx.fillText('▲ ' + series[0].nome, m.l + 8, Y(0) - 4);
    ctx.textBaseline = 'top';
    ctx.fillText('▼ ' + series[1].nome, m.l + 8, Y(0) + 4);
    dica(ctx, w, h, hist, series, hover, X, function (k, i) { return Y((k === 0 ? 1 : -1) * hist.y[i][k]); }, [0, 1]);
  }

  g.VoteCharts = { linhas: linhas, espelho: espelho, indiceEm: indiceEm };
})(window);
