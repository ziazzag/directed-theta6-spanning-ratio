(function () {
  'use strict';
  const rootEl = document.documentElement;
  const KEY = 'theta6-theme';
  try { const t = localStorage.getItem(KEY); if (t) rootEl.dataset.theme = t; } catch (e) { /* ignore */ }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    const current = () => rootEl.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const label = () => { btn.textContent = current() === 'dark' ? '☀' : '☾'; btn.title = current() === 'dark' ? 'Light theme' : 'Dark theme'; };
    btn.addEventListener('click', () => {
      rootEl.dataset.theme = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, rootEl.dataset.theme); } catch (e) { /* ignore */ }
       label(); window.Viz.themeChanged();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { label(); window.Viz.themeChanged(); });
    label();

    if (window.renderMathInElement) {
      renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, macros: { '\\hexn': '\\text{\\large ⬣}', '\\tipn': '\\text{\\large ⬡}' } });
    }

    // nav highlight
    const links = [...document.querySelectorAll('.nav a[href^="#"]')];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
          if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach((s) => obs.observe(s));

    const safe = (f) => { try { f && f(); } catch (e) { console.error(e); } };
    safe(window.initFigures); safe(window.initLab); safe(window.initWorst); safe(window.initChecks);
  });
})();
