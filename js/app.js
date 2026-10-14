/*
 * Vote Simulator - user interface and simulation loop
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licensed under the MIT License (see LICENSE).
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Election data: public data from the Brazilian Superior Electoral Court (TSE).
 */
/* User interface and simulation loop. Texts come from window.I18n (js/i18n.js). */
(function () {
  'use strict';
  const E = window.VoteEngine, C = window.VoteCharts, I = window.I18n;
  const $ = function (id) { return document.getElementById(id); };
  const tr = function (k, p) { return I.t(k, p); };
  const fmt = { format: function (v) { return I.num(v); } };
  const pct = function (v) { return I.pct(v, 1); };
  const cacheD = {};
  let D = null, semente = 20261004, tok = 0, teoriaAtual = 'nenhuma';
  const BASE_MS = 2000, MAX_VEL = 10;

  let urnas = null, cursor = 0, cum = null, brancos = 0, nulos = 0, compCont = 0;
  let hover = -1, hist, timer = null, rodando = false, vel = 1, lider = -1, viradas = 0, finais = null;
  let velAntesAcelerar = 1;
  let avisoAtual = null;                 // { key, params } of the notice on screen, so it can be re-translated

  /* ---------- language ---------- */
  I.apply();

  /* ---------- welcome / about dialog (shown every time the page opens) ---------- */
  const modal = $('modal');
  let gatilho = null;                                      // button that opened the dialog (focus goes back to it)
  function travaScroll(on) { document.documentElement.classList.toggle('modal-open', on); }   // blocks the page scroll behind the dialog
  function abreModal(origem) {
    gatilho = origem || null;
    if (typeof modal.showModal === 'function') { if (!modal.open) modal.showModal(); }
    else modal.setAttribute('open', '');                     // very old browsers: shown as a plain block
    travaScroll(true);
    modal.querySelector('.modal-body').scrollTop = 0;
  }
  function fechaModal() {
    if (typeof modal.close === 'function') { if (modal.open) modal.close(); } else modal.removeAttribute('open');
    travaScroll(false);
    if (gatilho) gatilho.focus();
  }
  $('modalOk').addEventListener('click', fechaModal);
  ['sobre', 'sobreRodape'].forEach(function (id) { $(id).addEventListener('click', function () { abreModal($(id)); }); });
  modal.addEventListener('click', function (e) { if (e.target === modal) fechaModal(); });   // click on the backdrop
  modal.addEventListener('close', function () { travaScroll(false); });                      // Esc key also unlocks the scroll
  abreModal();

  /* ---------- scenarios ---------- */
  function preencheCenarios() {
    const sel = $('cenario'), atual = sel.value;
    sel.innerHTML = '';
    E.ORDEM_CENARIOS.forEach(function (k) {
      const o = document.createElement('option');
      o.value = k; o.textContent = tr('scn.' + k + '.name'); sel.appendChild(o);
    });
    if (atual) sel.value = atual;
  }
  preencheCenarios();

  function aviso(key, params) {
    avisoAtual = key ? { key: key, params: params } : null;
    $('aviso').hidden = !key;
    $('aviso').textContent = key ? tr(key, params) : '';
  }

  /* downloads and decodes the dataset of the scenario (once; cached) */
  function carrega(chave) {
    const key = E.SCENARIOS[chave].dataset;
    if (!key) return Promise.resolve(null);
    if (!cacheD[key]) {
      aviso('notice.loading');
      cacheD[key] = E.carregarUrnas(key).catch(function (e) { delete cacheD[key]; throw e; });
    }
    return cacheD[key];
  }

  /* (re)writes the labels of the arrival-order list, keeping the selection */
  function rotulaOrdens() {
    Array.prototype.forEach.call($('ordem').options, function (o) { o.textContent = tr('order.' + o.value); });
  }

  async function preencheOrdens() {
    const sc = E.SCENARIOS[$('cenario').value];
    $('descCenario').textContent = tr('scn.' + $('cenario').value + '.desc');
    $('ordem').innerHTML = '';
    sc.ordens.forEach(function (k) {
      const o = document.createElement('option');
      o.value = k; $('ordem').appendChild(o);
    });
    rotulaOrdens();
    $('ordem').value = sc.ordemPadrao;
    $('usarTSE').hidden = !sc.real;
    if (!sc.real) { $('boxTeoria').hidden = true; $('cardTeoria').hidden = true; $('teoria').value = 'nenhuma'; }
    if (sc.real) {
      try { D = await carrega($('cenario').value); aviso(null); usarTotaisTSE(false); }
      catch (e) { console.error(e); aviso('notice.fail', { msg: e.message }); }
      $('boxTeoria').hidden = !(D && D.s_pl);
      if ($('boxTeoria').hidden) { $('teoria').value = 'nenhuma'; $('cardTeoria').hidden = true; }
      else {
        // "1st or 2nd senator loyal" needs 2 senator votes per voter (2026); 2022 has a single vote
        const op = $('teoria').querySelector('option[value="senadores"]'), sem = D.senVotos !== 2;
        op.hidden = op.disabled = sem;
        if (sem && $('teoria').value === 'senadores') $('teoria').value = 'nenhuma';
      }
    }
  }

  function usarTotaisTSE(reinicia) {
    const r = E.resumoReal(D);
    $('eleitores').value = r.aptos;
    $('urnas').value = r.urnas;
    $('comparecimento').value = (r.comparecimento * 100).toFixed(8);
    if (reinicia) reiniciar();
  }

  /* ---------- settings ---------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function leConfig() {
    const sc = E.SCENARIOS[$('cenario').value];
    let eleitores = clamp(Math.round(+$('eleitores').value) || 100000, 1000, 1e9);
    let n = clamp(Math.round(+$('urnas').value) || 500, 10, 500000);
    const comp = clamp((+$('comparecimento').value || 79) / 100, 0.1, 1);
    if (eleitores * comp / n < 10) n = Math.max(10, Math.floor(eleitores * comp / 10));
    $('eleitores').value = eleitores; $('urnas').value = n;
    return { chave: $('cenario').value, sc: sc, eleitores: eleitores, urnas: n, comparecimento: comp,
             ordem: $('ordem').value, seed: semente,
             teoria: $('boxTeoria').hidden ? 'nenhuma' : $('teoria').value };
  }

  /* ---------- cycle ---------- */
  async function reiniciar() {
    parar();
    const cfg = leConfig(), t = ++tok;
    try { D = await carrega(cfg.chave); aviso(null); }
    catch (e) { console.error(e); aviso('notice.fail', { msg: e.message }); return; }
    if (t !== tok) return;           // another settings change arrived first
    urnas = E.gerar(cfg.chave, cfg, D);
    cursor = 0; cum = new Float64Array(urnas.K); brancos = nulos = compCont = 0;
    hist = { x: [], y: [], v: [], n: [], N: urnas.N }; hover = -1;
    lider = -1; viradas = 0;
    // final result (for the dashed lines)
    const tot = new Float64Array(urnas.K); let soma = 0;
    for (let i = 0; i < urnas.N; i++) for (let k = 0; k < urnas.K; k++) { tot[k] += urnas.votos[i * urnas.K + k]; }
    tot.forEach(function (v) { soma += v; });
    finais = Array.from(tot, function (v) { return soma ? v / soma * 100 : 0; });
    teoriaAtual = cfg.teoria;
    montaLegenda(cfg.teoria);
    atualizaTeoria(cfg.teoria);
    $('lote').placeholder = tr('cfg.batchPh') + ' (' + loteAuto() + ')';
    desenha();
  }

  /* one update: adds the next batch of ballot boxes; semDesenho = do not redraw (used by "count without animation") */
  function passo(semDesenho) {
    const ate = Math.min(urnas.N, cursor + lote()), K = urnas.K;
    for (let i = cursor; i < ate; i++) {
      for (let k = 0; k < K; k++) cum[k] += urnas.votos[i * K + k];
      brancos += urnas.brancos[i]; nulos += urnas.nulos[i]; compCont += urnas.comp[i];
    }
    cursor = ate;
    let soma = 0; for (let k = 0; k < K; k++) soma += cum[k];
    const ys = Array.from(cum, function (v) { return soma ? v / soma * 100 : 0; });
    hist.x.push(cursor / urnas.N * 100); hist.y.push(ys); hist.v.push(Float64Array.from(cum)); hist.n.push(cursor);
    const topo = ys.indexOf(Math.max.apply(null, ys));
    if (lider !== -1 && topo !== lider && Math.abs(ys[topo] - ys[lider]) > 1e-9) viradas++;
    if (lider === -1 || Math.abs(ys[topo] - ys[lider]) > 1e-9) lider = topo;
    if (!semDesenho) desenha();
    if (cursor >= urnas.N && !semDesenho) parar();
    if (cursor >= urnas.N && window.Track) window.Track.event('simulation_complete', { scenario: $('cenario').value, order: $('ordem').value, theory: $('teoria').value, speed: vel, lead_changes: viradas });
  }

  /* plots everything at once: continues from where it stopped (or restarts if it already finished) and draws only at the end */
  async function totalizar() {
    parar();
    if (!urnas || cursor >= urnas.N) await reiniciar();
    if (!urnas) return;
    while (cursor < urnas.N) passo(true);
    desenha(); parar();
  }

  function agenda() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      passo();
      if (rodando) agenda();
    }, BASE_MS / vel);
  }
  function rotuloIniciar() {
    $('iniciar').textContent = rodando ? tr('btn.pause') : tr((urnas && cursor > 0 && cursor < urnas.N) ? 'btn.resume' : 'btn.start');
  }
  async function iniciar() {
    if (cursor >= urnas.N) await reiniciar();
    rodando = true; rotuloIniciar(); agenda();
  }
  function parar() {
    rodando = false; clearTimeout(timer); rotuloIniciar();
  }

  /* ---------- Senators Theory: comparison panel ---------- */
  const KEY_LEGENDA = { exclusao: 'legend.exclusion', fidelidade: 'legend.fidelity', senadores: 'legend.senators' };
  const KEY_DESC = { nenhuma: 'theory.descOff', exclusao: 'theory.descExclusion', fidelidade: 'theory.descFidelity', senadores: 'theory.descSenators' };
  const LINHAS_TEORIA = [['nenhuma', 'theory.rowReal'], ['exclusao', 'theory.rowExclusion'], ['fidelidade', 'theory.rowFidelity'], ['senadores', 'theory.rowSenators']];

  function atualizaTeoria(modo) {
    $('descTeoria').textContent = tr(KEY_DESC[modo] || 'theory.descOff');
    $('boxTeoria').classList.toggle('on', modo && modo !== 'nenhuma');
    if (!D || !D.s_pl) { $('cardTeoria').hidden = true; return; }
    $('cardTeoria').hidden = false;
    if (!D._teoria) D._teoria = E.resumoTeoria(D);
    const r = D._teoria, n = r.nomes, f1 = function (v) { return I.pct(v, 1); };
    const PL = 'Bolsonaro', PT = 'Lula';           // PL = Bolsonaro, PT = Lula (surname only)
    $('thPL').textContent = PL + ' (PL)'; $('thPT').textContent = PT + ' (PT)';
    $('tabTeoria').innerHTML = LINHAS_TEORIA.filter(function (l) { return r[l[0]]; }).map(function (l) {
      const x = r[l[0]], venc = x.pl > x.pt ? PL : PT;
      return '<tr' + (l[0] === modo ? ' style="font-weight:700"' : '') + '><td>' + tr(l[1]) + '</td><td>' + f1(x.pl) + '</td><td>' + f1(x.pt) + '</td><td>' + (x.ind ? f1(x.ind) : '–') + '</td><td>' + f1(x.outros) + '</td><td>' + venc + '</td></tr>';
    }).join('');
    const t = r.teste, fm = function (v) { return fmt.format(Math.round(v)); };
    $('teoriaTeste').textContent = tr('theory.test', {
      vL: fm(t.vL), pL: I.dec(t.vL / t.totL * 100, 2), nL: fmt.format(t.nL),
      vF: fm(t.vF), pF: I.dec(t.vF / t.totF * 100, 2)
    });
    $('teoriaNota').textContent = tr(D.senVotos === 2 ? 'theory.note2026' : 'theory.note2022') + tr('theory.noteParties') +
      (D.senVotos === 2 ? tr('theory.noteSenators') : '');
  }

  function loteAuto() { return Math.max(1, Math.ceil(urnas.N / (+$('gran').value || 100))); }
  function lote() { const v = Math.round(+$('lote').value); return v > 0 ? v : loteAuto(); }

  /* ---------- drawing ---------- */
  function montaLegenda(modo) {
    const k = KEY_LEGENDA[modo];
    $('notaLegenda').textContent = k ? tr(k) : '';
    $('notaLegenda').hidden = !k;
    $('legenda').innerHTML = urnas.series.map(function (s) {
      return '<span><i style="background:' + s.cor + '"></i>' + s.nome + '</span>';
    }).join('');
  }
  function desenha() {
    C.linhas($('cLinhas'), hist, urnas.series, $('mostrarFinal').checked ? finais : null, hover);
    C.espelho($('cEspelho'), hist, urnas.series, hover);
    let soma = 0; for (let k = 0; k < urnas.K; k++) soma += cum[k];
    const p = cursor / urnas.N * 100;
    $('sUrnas').textContent = fmt.format(cursor) + ' / ' + fmt.format(urnas.N);
    $('sVotos').textContent = fmt.format(Math.round(soma + brancos + nulos));
    $('sLider').textContent = cursor && soma ? urnas.series[lider].nome.split(' (')[0] : '–';
    // leader box: name, % of valid votes of the leader, and (mouse over / focus) the latest valid-vote details
    $('sLiderLbl').textContent = cursor && soma ? tr('stat.leader') + ': ' + I.pct(cum[lider] / soma * 100, 2) : tr('stat.leader');
    $('sLiderTip').innerHTML = cursor && soma
      ? '<strong>' + tr(cursor >= urnas.N ? 'stat.tipFinal' : 'stat.tipNow') + '</strong><small>' + fmt.format(cursor) + ' / ' + fmt.format(urnas.N) + ' ' + tr('stat.boxes') + '</small>' +
        urnas.series.map(function (s, k) {
          return '<div class="tip-row' + (k === lider ? ' lead' : '') + '"><i style="background:' + s.cor + '"></i><span>' + s.nome + '</span><b>' + I.pct(cum[k] / soma * 100, 2) + '</b><em>' + fmt.format(Math.round(cum[k])) + '</em></div>';
        }).join('') +
        '<small>' + tr('stat.tipValid') + ': ' + fmt.format(Math.round(soma)) + '</small>'
      : '<small>' + tr('stat.tipEmpty') + '</small>';
    $('sViradas').textContent = viradas;
    $('progBar').style.width = p + '%'; $('prog').setAttribute('aria-valuenow', p.toFixed(0));
    $('tabela').innerHTML = urnas.series.map(function (s, k) {
      const v = cum[k], pc = soma ? v / soma * 100 : 0;
      return '<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + s.cor + ';margin-right:6px"></i>' + s.nome +
        '</td><td>' + fmt.format(Math.round(v)) + '</td><td>' + pct(pc) + '</td><td class="bar"><div class="barra" style="width:' + pc + '%;background:' + s.cor + '"></div></td></tr>';
    }).join('') +
      '<tr><td>' + tr('row.blank') + '</td><td>' + fmt.format(Math.round(brancos)) + '</td><td colspan="2"></td></tr>' +
      '<tr><td>' + tr('row.null') + '</td><td>' + fmt.format(Math.round(nulos)) + '</td><td colspan="2"></td></tr>';
  }

  /* ---------- events ---------- */
  function mostraVel() {
    $('velTxt').textContent = vel + 'x';
    $('intTxt').textContent = I.dec(BASE_MS / vel / 1000, 1);
    $('velocidade').value = vel;
    $('acelerar').textContent = tr(vel === MAX_VEL ? 'btn.normal' : 'btn.accel');
  }
  $('velocidade').addEventListener('input', function () {
    vel = +this.value; mostraVel(); if (rodando) agenda();
  });
  $('acelerar').addEventListener('click', function () {
    if (vel === MAX_VEL) { vel = velAntesAcelerar; } else { velAntesAcelerar = vel; vel = MAX_VEL; }
    mostraVel(); if (rodando) agenda();
  });
  $('iniciar').addEventListener('click', function () { rodando ? parar() : iniciar(); });
  $('reiniciar').addEventListener('click', reiniciar);
  $('totalizar').addEventListener('click', totalizar);
  $('usarTSE').addEventListener('click', function () { usarTotaisTSE(true); });
  $('cenario').addEventListener('change', async function () { await preencheOrdens(); reiniciar(); });
  $('sorteio').addEventListener('click', function () { semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0; reiniciar(); });
  ['ordem', 'teoria', 'eleitores', 'urnas', 'comparecimento', 'lote', 'gran'].forEach(function (id) {
    $(id).addEventListener('change', reiniciar);
  });
  $('mostrarFinal').addEventListener('change', desenha);
  // mouse over / touch: shows the cumulative votes at the point, in both charts at once
  ['cLinhas', 'cEspelho'].forEach(function (id) {
    const c = $(id);
    c.addEventListener('pointermove', function (e) {
      if (!urnas) return;
      const i = C.indiceEm(c, hist, e.clientX - c.getBoundingClientRect().left);
      if (i !== hover) { hover = i; desenha(); }
    });
    c.addEventListener('pointerleave', function () { if (hover !== -1) { hover = -1; desenha(); } });
  });
  $('tema').addEventListener('click', function () {
    const root = document.documentElement;
    const escuro = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = escuro ? 'light' : 'dark'; desenha();
  });
  window.addEventListener('resize', function () { if (urnas) desenha(); });

  /* language switch: re-translates everything on screen without restarting the simulation */
  document.querySelectorAll('[data-lang]').forEach(function (b) {      // flag buttons (page header + dialog header)
    b.addEventListener('click', function () { I.setLang(b.getAttribute('data-lang')); });
  });
  I.onChange(function () {
    preencheCenarios();
    $('descCenario').textContent = tr('scn.' + $('cenario').value + '.desc');
    rotulaOrdens();
    mostraVel(); rotuloIniciar();
    if (avisoAtual) aviso(avisoAtual.key, avisoAtual.params);
    if (urnas) {
      urnas.series.forEach(function (s) { if (s.key) s.nome = tr(s.key); });
      $('lote').placeholder = tr('cfg.batchPh') + ' (' + loteAuto() + ')';
      montaLegenda(teoriaAtual);
      atualizaTeoria(teoriaAtual);
      desenha();
    }
  });

  mostraVel();
  const pronto = preencheOrdens().then(reiniciar);
  window.__vote = { pronto: pronto, reiniciar: reiniciar, passo: passo, get state() { return { cursor: cursor, viradas: viradas, hist: hist, cum: cum, N: urnas && urnas.N, K: urnas && urnas.K }; } };
})();
