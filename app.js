(() => {
  const diskResources = 'https://cloud-api.yandex.net/v1/disk/public/resources';
  function startDownload(url) {
    // В <head> стоит <meta name="referrer" content="no-referrer">, поэтому
    // window.location.assign не отправляет Referer (Яндекс.Диск не отдаёт 403)
    // и не блокируется в Firefox после async fetch, в отличие от link.click().
    window.location.assign(url);
  }
  const installerButtons = [...document.querySelectorAll('[data-installer-download]')];
  const viewStatus = document.getElementById('s-view');
  function installerStatus(message) {
    viewStatus.dataset.downloadStatus = '';
    viewStatus.textContent = message;
  }
  installerButtons.forEach(button => {
    button.addEventListener('click', async () => {
      installerButtons.forEach(control => { control.disabled = true; });
      installerStatus('Получаем ссылку на установщик…');
      try {
        const api = diskResources + '/download?public_key=' + encodeURIComponent(button.dataset.installerDownload);
        const response = await fetch(api, { signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error(String(response.status));
        const { href } = await response.json();
        const download = new URL(href);
        if (download.protocol !== 'https:') throw new Error('Invalid download URL');
        startDownload(download.href);
        installerStatus('Скачивание установщика запрошено.');
      } catch {
        installerStatus('Ссылка недоступна. Попробуйте ещё раз.');
      } finally {
        installerButtons.forEach(control => { control.disabled = false; });
      }
    });
  });

  const latestZip = document.querySelector('[data-latest-zip]');
  if (latestZip) {
    const status = document.getElementById(latestZip.getAttribute('aria-describedby'));
    const oldestSignedVersion = latestZip.dataset.minVersion.split('.').map(Number);
    function compareVersions(left, right) {
      for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) return left[i] - right[i];
      }
      return 0;
    }

    latestZip.addEventListener('click', async () => {
      latestZip.disabled = true;
      status.textContent = 'Ищем последнюю версию…';
      try {
        const query = new URL(diskResources);
        query.searchParams.set('public_key', latestZip.dataset.latestZip);
        query.searchParams.set('limit', '100');
        const signal = AbortSignal.timeout(12000);
        let latest = null;
        let offset = 0;
        let total;
        do {
          query.searchParams.set('offset', String(offset));
          const response = await fetch(query, { signal });
          if (!response.ok) throw new Error('Yandex Disk HTTP ' + response.status);
          const { _embedded: page } = await response.json();
          if (!Array.isArray(page?.items) || !Number.isSafeInteger(page.total)) throw new Error('Invalid folder response');
          for (const item of page.items) {
            if (item.type !== 'file') continue;
            const match = /^RabinBIM-(\d+\.\d+\.\d+\.\d+)\.zip$/i.exec(item.name);
            if (!match) continue;
            const version = match[1].split('.').map(Number);
            if (!version.every(Number.isSafeInteger) || compareVersions(version, oldestSignedVersion) < 0) continue;
            if (!latest || compareVersions(version, latest.version) > 0) latest = { item, version };
          }
          total = page.total;
          offset += page.items.length;
          if (!page.items.length && offset < total) throw new Error('Incomplete folder response');
        } while (offset < total);
        if (!latest) {
          status.textContent = 'Подписанный ZIP пока недоступен.';
          return;
        }
        const download = new URL(latest.item.file);
        if (download.protocol !== 'https:') throw new Error('Invalid download URL');
        status.textContent = 'Скачивание: ' + latest.item.name;
        startDownload(download.href);
      } catch {
        status.textContent = 'Не удалось получить ссылку на архив. Попробуйте ещё раз.';
      } finally {
        latestZip.disabled = false;
      }
    });
  }

  // Views: opening one adds a tab, like views in Revit.
  const views = [...document.querySelectorAll('.view')];
  const tabsEl = document.getElementById('vtabs');
  const open = [];
  const byId = id => document.getElementById('v-' + id);
  const meta = id => byId(id).dataset;
  function render(active) {
    tabsEl.textContent = '';
    open.forEach(id => {
      const tab = document.createElement('div');
      tab.className = 'vtab'; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(id === active)); tab.tabIndex = 0;
      tab.innerHTML = '<span></span><span class="x" title="Закрыть" role="button" aria-label="Закрыть вид">×</span>';
      tab.firstChild.textContent = meta(id).title;
      tab.addEventListener('click', e => { if (e.target.classList.contains('x')) { close(id); } else show(id); });
      tab.addEventListener('keydown', e => { if (e.key === 'Enter') show(id); });
      tabsEl.append(tab);
    });
  }
  function close(id) {
    const i = open.indexOf(id); if (i < 0 || open.length === 1) return;
    open.splice(i, 1);
    const cur = views.find(v => !v.hidden); const curId = cur ? cur.id.slice(2) : null;
    show(curId === id ? open[Math.max(0, i - 1)] : curId);
  }
  function show(id) {
    if (!open.includes(id)) open.push(id);
    views.forEach(v => v.hidden = v.id !== 'v-' + id);
    document.querySelectorAll('[data-open]').forEach(b => { const on = b.dataset.open === id; b.classList.toggle('on', on); if (b.classList.contains('rbtn') || b.classList.contains('node')) b.setAttribute('aria-current', String(on)); });
    const m = meta(id);
    const title = m.title;
    document.getElementById('ttitle').textContent = 'Autodesk Revit 2024 — RabinBIM — [Вид: ' + title + ']';
    delete viewStatus.dataset.downloadStatus;
    viewStatus.textContent = title;
    document.getElementById('p-name').textContent = title;
    document.getElementById('p-tier').textContent = m.tier || '—';
    document.getElementById('p-desc').textContent = m.desc || '';
    const doc = document.getElementById('p-doc'); doc.hidden = !m.doc; if (m.doc) doc.href = m.doc;
    document.getElementById('views').scrollTop = 0;
    history.replaceState(null, '', '#' + id);
    render(id);
  }
  const companionGuides = {
    clash: ['clash-work', 'clash-reports', 'clash-settings'],
    open: ['open-start'],
  };
  views.filter(view => view.dataset.doc?.startsWith('#guide-')).forEach(view => {
    const id = view.id.slice(2);
    const topics = [view.dataset.doc.slice(7), ...(companionGuides[id] || [])];
    const guide = document.createElement('section');
    guide.className = 'guide-page inline-guide';
    guide.id = 'instructions-' + id;
    guide.setAttribute('aria-label', 'Инструкция по инструменту');
    for (const topic of topics) {
      const article = byId('guide-' + topic)?.querySelector('.guide-page');
      if (!article) continue;
      [...article.children].filter(element => !element.classList.contains('guide-back'))
        .forEach(element => guide.append(element.cloneNode(true)));
    }
    view.append(guide);
    view.dataset.doc = '#' + guide.id;
  });

  const sectionButtons = [...document.querySelectorAll('[data-ribbon-section]')];
  const panels = [...document.querySelectorAll('[data-ribbon-panel]')];
  const ribbon = document.querySelector('.ribbon');
  function setRibbonSection(section) {
    sectionButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.ribbonSection === section)));
    panels.forEach(panel => { panel.hidden = panel.dataset.ribbonPanel !== section; });
    ribbon.scrollLeft = 0;
  }
  sectionButtons.forEach(button => button.addEventListener('click', () => setRibbonSection(button.dataset.ribbonSection)));
  document.querySelectorAll('.rmenu-pop').forEach(menu => {
    menu.addEventListener('beforetoggle', event => {
      if (event.newState !== 'open') return;
      const trigger = menu.previousElementSibling.getBoundingClientRect();
      menu.style.left = Math.max(4, Math.min(trigger.left, document.documentElement.clientWidth - 244)) + 'px';
      menu.style.top = trigger.bottom + 'px';
    });
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-open]');
    const doc = event.target.closest('#p-doc');
    const inline = event.target.closest('[data-inline-guide]');
    if (inline || doc?.hash.startsWith('#instructions-')) {
      event.preventDefault();
      const guide = inline ? inline.closest('.view').querySelector('.inline-guide') : document.getElementById(doc.hash.slice(1));
      guide?.scrollIntoView({ block: 'start' });
      return;
    }
    if (!button) return;
    if (button.tagName === 'A') event.preventDefault();
    button.closest('.rmenu-pop')?.hidePopover();
    show(button.dataset.open);
  });
  const start = location.hash.slice(1);
  const initialPanel = panels.find(panel => [...panel.querySelectorAll('[data-open]')].some(button => button.dataset.open === start));
  if (initialPanel) setRibbonSection(initialPanel.dataset.ribbonPanel);
  show(start && byId(start) ? start : 'home');
  const qr = document.getElementById('qr');
  if (qr) {
    const n = 11; let seed = 7;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const block = (x, y) => (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4);
    const hole = (x, y) => (x === 1 && y === 1) || (x === n - 2 && y === 1) || (x === 1 && y === n - 2);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const cell = document.createElement('i');
      if (block(x, y)) { if (!hole(x, y)) cell.className = 'k'; } else if (rnd() > 0.5) cell.className = 'k';
      qr.append(cell);
    }
  }


})();
