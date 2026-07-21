/* ============================================================
   ТЕПЛОБЛОК — интерактив. Чистый ванильный JS, без зависимостей.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- ПРЕЛОАДЕР ---------- */
  window.addEventListener('load', () => {
    const p = $('#preloader');
    setTimeout(() => p && p.classList.add('hide'), 700);
    const hero = $('#hero');
    if (hero) requestAnimationFrame(() => hero.classList.add('in'));
  });

  /* ---------- ШАПКА: фон при скролле + прогресс ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle('scrolled', y > 40);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    // лёгкий параллакс героя
    const hImg = $('.hero__img');
    if (hImg && y < window.innerHeight) hImg.style.transform = `scale(1.1) translateY(${y * 0.18}px)`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- МОБИЛЬНОЕ МЕНЮ ---------- */
  const burger = $('#burger'), nav = $('#nav');
  const closeNav = () => { burger?.classList.remove('active'); nav?.classList.remove('open'); document.body.classList.remove('no-scroll'); };
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.classList.toggle('active', open);
    document.body.classList.toggle('no-scroll', open);
  });
  $$('.nav__link').forEach(a => a.addEventListener('click', closeNav));

  /* ---------- REVEAL ПРИ СКРОЛЛЕ ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4 * 0.07) + 's';
    io.observe(el);
  });

  /* ---------- СЧЁТЧИКИ ---------- */
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const prefix = el.dataset.prefix || '';
    const dur = 1400; let start = null;
    const step = (t) => {
      if (!start) start = t;
      const prog = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      el.textContent = prefix + Math.round(eased * target);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- TILT (лёгкий 3D на карточках) ---------- */
  if (!matchMedia('(hover:none)').matches && !reduce) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- БЕГУЩАЯ СТРОКА (год) ---------- */
  const yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- МОДАЛКА ---------- */
  const modal = $('#modal');
  const openModal = (event) => {
    modal.classList.add('open'); modal.classList.remove('success'); document.body.classList.add('no-scroll');
    const source = event?.currentTarget?.textContent?.trim() || 'unknown';
    window.vbLeadSource = source.slice(0, 80);
    window.vbReachGoal?.('open_calc_modal', { source });
  };
  const closeModal = () => { modal.classList.remove('open'); document.body.classList.remove('no-scroll'); };
  $$('.js-open-modal').forEach(b => b.addEventListener('click', openModal));
  $$('.js-close-modal').forEach(b => b.addEventListener('click', closeModal));

  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- ОТПРАВКА ФОРМ ----------
     Заявка уходит НА ПОЧТУ через FormSubmit (доставка в mail.ru проверена).
     Если отправка не удалась — подсказываем прямые способы связи. */
  const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/89530857007@mail.ru';

  async function sendLead(data) {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        'Имя': data.name || '—',
        'Телефон': data.phone || '—',
        'Что строят / объём': data.comment || '—',
        _subject: 'Новая заявка с сайта vulkanblok.ru',
        _template: 'table',
        _captcha: 'false',
        'Источник формы': window.vbLeadSource || 'форма на странице',
        'Страница': location.href,
        'UTM / yclid': window.vbAttributionString?.() || '—',
        'Metrika ClientID': window.vbMetrikaClientId || '—',
        _url: 'https://vulkanblok.ru/'   // обязательно: иначе FormSubmit не опознаёт форму при JS-отправке
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!(res.ok && json && (json.success === true || json.success === 'true'))) throw new Error('not success');
  }

  $$('.js-lead').forEach(form => {
    let formStarted = false;
    form.addEventListener('input', () => {
      if (formStarted) return;
      formStarted = true;
      window.vbReachGoal?.('form_start', { source: window.vbLeadSource || form.closest('section')?.id || 'page' });
    }, { passive: true });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = form.querySelector('[name=phone]');
      const consent = form.querySelector('[name=consent]');
      if (phone && phone.value.replace(/\D/g, '').length < 10) { phone.focus(); shake(phone); return; }
      if (consent && !consent.checked) { shake(consent.closest('.consent')); return; }
      const btn = form.querySelector('button[type=submit]');
      const orig = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        await sendLead(data);
        window.vbReachGoal?.('form_submit_success', { source: window.vbLeadSource || form.closest('section')?.id || 'page' });
        form.reset();
        if (form.classList.contains('lead--modal')) modal.classList.add('success');
        else toast('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
      } catch (err) {
        window.vbReachGoal?.('form_error', { source: window.vbLeadSource || form.closest('section')?.id || 'page' });
        // не теряем клиента — подсказываем прямые способы связи (кнопки справа внизу)
        toast('Не получилось отправить. Позвоните +7 953 085-70-07 или напишите в WhatsApp / Telegram (кнопки справа внизу).');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      }
    });
  });
  function shake(el) {
    if (!el) return;
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
      { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 320 });
  }

  /* ---------- ТОСТ ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4200);
  }

  /* ---------- ЛАЙТБОКС ГАЛЕРЕИ ---------- */
  const gItems = $$('.gitem, .cert__item');
  if (gItems.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox__close" aria-label="Закрыть">×</button>' +
      '<button class="lightbox__nav lightbox__prev" aria-label="Назад">‹</button>' +
      '<img alt=""><button class="lightbox__nav lightbox__next" aria-label="Вперёд">›</button>';
    document.body.appendChild(lb);
    const img = $('img', lb);
    let idx = 0;
    const srcs = gItems.map(a => a.getAttribute('href'));
    const show = i => { idx = (i + srcs.length) % srcs.length; img.src = srcs[idx]; };
    gItems.forEach((a, i) => a.addEventListener('click', e => {
      e.preventDefault(); show(i); lb.classList.add('open'); document.body.classList.add('no-scroll');
    }));
    const close = () => { lb.classList.remove('open'); document.body.classList.remove('no-scroll'); };
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lightbox__next', lb).addEventListener('click', () => show(idx + 1));
    $('.lightbox__prev', lb).addEventListener('click', () => show(idx - 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* ---------- COOKIE-БАННЕР ---------- */
  const cookie = $('#cookie');
  if (cookie && !localStorage.getItem('cookieOk')) {
    setTimeout(() => { cookie.classList.add('show'); document.body.classList.add('cookie-on'); }, 1600);
    $('#cookieOk')?.addEventListener('click', () => {
      localStorage.setItem('cookieOk', '1');
      cookie.classList.remove('show');
      document.body.classList.remove('cookie-on');   // кнопки связи опускаются обратно
    });
  }

  /* ---------- ПЛАВНЫЙ ЯКОРНЫЙ СКРОЛЛ С УЧЁТОМ ШАПКИ ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
