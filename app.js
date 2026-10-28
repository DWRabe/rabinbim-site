(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // «Скачать»: asks Yandex Disk for the direct link and starts the download; falls back to the Disk page.
  document.querySelectorAll('[data-yadisk-download]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      try {
        const api = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(link.href);
        const response = await fetch(api);
        if (!response.ok) throw new Error(String(response.status));
        const { href } = await response.json();
        if (!href) throw new Error('no href');
        window.location.href = href;
      } catch {
        window.open(link.href, '_blank', 'noopener');
      }
    });
  });

  // Mobile menu: full height panel, links arrive one after another (CSS --i, capped at 400ms).
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Scroll reveal: each element rises once (IntersectionObserver, never a scroll listener).
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach(el => reduce ? el.classList.add('in') : reveal.observe(el));

  // Stories run only while their card is on screen.
  const stories = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('live', entry.isIntersecting));
  }, { threshold: 0.2 });
  document.querySelectorAll('.story').forEach(el => stories.observe(el));

  // Tagline: every word goes from muted to full colour as it crosses the trigger line, in reading order.
  document.querySelectorAll('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((word, index) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      el.append(span);
      if (index < words.length - 1) el.append(' ');
      return span;
    });
    if (reduce) { spans.forEach(s => s.classList.add('on')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('on');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -35% 0px', threshold: 0.6 });
    spans.forEach(s => io.observe(s));
  });

  // Section indicator in the navigation.
  const links = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + entry.target.id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

  // Illustration QR: a fixed pseudo random pattern with finder squares in three corners.
  const qr = document.getElementById('qr');
  if (qr) {
    const n = 11;
    let seed = 7;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const block = (x, y) => (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4);
    const hole = (x, y) => (x === 1 && y === 1) || (x === n - 2 && y === 1) || (x === 1 && y === n - 2);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const cell = document.createElement('i');
      if (block(x, y)) { if (!hole(x, y)) cell.className = 'k'; }
      else if (rnd() > 0.5) cell.className = 'k';
      qr.append(cell);
    }
  }
})();
