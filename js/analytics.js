/*
 * Vote Simulator - usage analytics (Google Analytics 4 events)
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 *
 * Sends anonymous usage events (clicks, setting changes, scroll depth, time on page) through the gtag()
 * function defined in index.html. Only element ids and option values are sent; no typed free text.
 * Everything is wrapped in try/catch: if analytics is blocked, the simulator keeps working.
 */
(function () {
  'use strict';
  function send(name, params) {
    try {
      params = params || {};
      params.language = (window.I18n && window.I18n.lang) || document.documentElement.lang || '';
      if (typeof window.gtag === 'function') window.gtag('event', name, params);
    } catch (e) { /* analytics must never break the app */ }
  }
  window.Track = { event: send };

  const $ = function (id) { return document.getElementById(id); };
  function idOf(el) { return el.id || el.getAttribute('data-lang') || el.getAttribute('data-i18n') || el.tagName.toLowerCase(); }

  /* every click on a button, link or flag */
  document.addEventListener('click', function (e) {
    const el = e.target.closest && e.target.closest('button, a, summary');
    if (!el) return;
    if (el.hasAttribute('data-lang')) {
      send('language_select', { language_chosen: el.getAttribute('data-lang'), where: el.closest('dialog') ? 'dialog' : 'header' });
      return;
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      send('link_click', { link_url: href.slice(0, 200), external: /^https?:/i.test(href) });
      return;
    }
    send('button_click', { button_id: idOf(el), in_dialog: !!el.closest('dialog') });
  }, true);

  /* every change of a setting (scenario, order, theory, voters, ballot boxes, speed, ...) */
  document.addEventListener('change', function (e) {
    const el = e.target;
    if (!el || !el.id) return;
    const v = el.type === 'checkbox' ? String(el.checked) : String(el.value).slice(0, 60);
    send('setting_change', { setting: el.id, value: v });
  }, true);

  /* speed slider: sent once the user stops moving it */
  let velTimer = null;
  const vel = $('velocidade');
  if (vel) vel.addEventListener('input', function () {
    clearTimeout(velTimer);
    velTimer = setTimeout(function () { send('speed_set', { speed: +vel.value }); }, 600);
  });

  /* welcome / about dialog */
  const modal = $('modal');
  if (modal) {
    let openedAt = Date.now();
    new MutationObserver(function () { if (modal.open) openedAt = Date.now(); }).observe(modal, { attributes: true, attributeFilter: ['open'] });
    modal.addEventListener('close', function () { send('dialog_close', { seconds_open: Math.round((Date.now() - openedAt) / 1000) }); });
    send('dialog_open', { trigger: 'page_load' });
  }

  /* chart hover (at most once every 10 s per chart) */
  ['cLinhas', 'cEspelho'].forEach(function (id) {
    const c = $(id); if (!c) return;
    let last = 0;
    c.addEventListener('pointerenter', function () {
      const now = Date.now(); if (now - last < 10000) return; last = now;
      send('chart_hover', { chart: id });
    });
  });

  /* scroll depth: 25 / 50 / 75 / 100 % */
  const seen = {};
  window.addEventListener('scroll', function () {
    const h = document.documentElement.scrollHeight - window.innerHeight; if (h <= 0) return;
    const pct = window.scrollY / h * 100;
    [25, 50, 75, 100].forEach(function (m) { if (pct >= m - 1 && !seen[m]) { seen[m] = 1; send('scroll_depth', { percent: m }); } });
  }, { passive: true });

  /* time on page (visible time), sent when the page is hidden or closed */
  let visibleMs = 0, since = document.visibilityState === 'visible' ? Date.now() : 0;
  function flush() {
    if (since) { visibleMs += Date.now() - since; since = 0; }
    if (visibleMs > 0) {
      try { window.gtag('event', 'engagement_time', { seconds: Math.round(visibleMs / 1000), language: (window.I18n && window.I18n.lang) || '', transport_type: 'beacon' }); } catch (e) { /* ignore */ }
      visibleMs = 0;
    }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush(); else since = Date.now();
  });
  window.addEventListener('pagehide', flush);

  /* script errors (message only) */
  window.addEventListener('error', function (e) { send('js_error', { message: String(e.message || '').slice(0, 100), file: String(e.filename || '').split('/').pop() }); });
})();
