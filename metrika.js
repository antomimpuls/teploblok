/* Яндекс.Метрика и единый слой целей vulkanblok.ru. */
(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  m[i].l = 1 * new Date();
  for (var j = 0; j < document.scripts.length; j += 1) {
    if (document.scripts[j].src === r) return;
  }
  k = e.createElement(t); a = e.getElementsByTagName(t)[0];
  k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

(function () {
  'use strict';
  const COUNTER_ID = 110921838;
  const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];
  const current = new URLSearchParams(location.search);
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem('vb_attribution') || '{}');
  } catch (_error) {
    sessionStorage.removeItem('vb_attribution');
  }

  ATTR_KEYS.forEach(key => {
    const value = current.get(key);
    if (value) saved[key] = value.slice(0, 300);
  });
  sessionStorage.setItem('vb_attribution', JSON.stringify(saved));

  window.vbAttributionString = () => ATTR_KEYS
    .filter(key => saved[key])
    .map(key => `${key}=${saved[key]}`)
    .join('; ');
  window.vbReachGoal = (name, params) => {
    if (typeof window.ym === 'function') window.ym(COUNTER_ID, 'reachGoal', name, params || {});
  };

  window.ym(COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    params: { attribution: saved }
  });
  window.ym(COUNTER_ID, 'getClientID', clientId => { window.vbMetrikaClientId = clientId; });

  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.startsWith('tel:')) window.vbReachGoal('phone_click', { href });
      else if (href.includes('wa.me/')) window.vbReachGoal('wa_click', { href });
      else if (href.includes('t.me/')) window.vbReachGoal('tg_click', { href });
    });

    const sectionGoals = new Map([
      ['catalog', 'catalog_view'],
      ['delivery', 'delivery_view'],
      ['certs', 'certs_view']
    ]);
    const seen = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target.id)) return;
        seen.add(entry.target.id);
        window.vbReachGoal(sectionGoals.get(entry.target.id));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    sectionGoals.forEach((_goal, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    let scrollSent = false;
    addEventListener('scroll', () => {
      if (scrollSent) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && scrollY / max >= 0.75) {
        scrollSent = true;
        window.vbReachGoal('scroll_75');
      }
    }, { passive: true });

    setTimeout(() => {
      if (document.visibilityState === 'visible') window.vbReachGoal('engaged_90s');
    }, 90000);
  });
})();
