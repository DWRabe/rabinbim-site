/* Демо окон RabinBIM: «Менеджер коллизий», «Почему не видно?», «Размеры по линии».
   Устройство окон, тексты и поведение повторяют плагин (XAML и код команд). Данные вымышленные. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const LOGO = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 3l11 3-6 2-2 5z" fill="#1677FF"/></svg>';

  // ---------- окно и масштабирование ----------
  function frame(host, title, native, inner) {
    host.innerHTML = '<div class="rw-stage"><div class="rw-fit"><div class="rw" style="width:' + native + 'px">' +
      '<div class="rw-bar">' + LOGO + '<span>' + esc(title) + '</span><i class="rw-ctl" aria-hidden="true"><b></b><b></b><b></b></i></div>' +
      '<div class="rw-body">' + inner + '</div></div></div></div>';
    const stage = host.firstChild, box = stage.firstChild, win = box.firstChild;
    const apply = () => {
      const k = Math.max(0.55, Math.min(1, stage.clientWidth / native));
      win.style.transform = 'scale(' + k + ')'; win.dataset.k = k;
      box.style.width = native * k + 'px'; box.style.height = win.offsetHeight * k + 'px';
    };
    if (window.ResizeObserver) { const ro = new ResizeObserver(apply); ro.observe(stage); ro.observe(win); }
    apply();
    return win;
  }

  // ---------- выпадающий список как ComboBox темы ----------
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.btn.setAttribute('aria-expanded', 'false'); openMenu.ul.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', e => { if (openMenu && !openMenu.ul.contains(e.target) && e.target !== openMenu.btn) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  function popup(win, btn, items, onPick, cls) {
    closeMenu();
    const k = Number(win.dataset.k) || 1, w = win.getBoundingClientRect(), r = btn.getBoundingClientRect();
    const ul = document.createElement('ul');
    ul.className = 'rw-menu' + (cls ? ' ' + cls : ''); ul.setAttribute('role', 'listbox');
    ul.style.left = (r.left - w.left) / k + 'px'; ul.style.top = (r.bottom - w.top) / k + 4 + 'px'; ul.style.minWidth = r.width / k + 'px';
    items.forEach(it => {
      const li = document.createElement('li'); li.setAttribute('role', 'option'); li.tabIndex = -1;
      li.setAttribute('aria-selected', it.selected ? 'true' : 'false'); li.innerHTML = it.html;
      li.addEventListener('click', () => { closeMenu(); onPick(it.value); btn.focus(); });
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } else if (e.key === 'ArrowDown') { e.preventDefault(); (li.nextElementSibling || li).focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); (li.previousElementSibling || li).focus(); } });
      ul.append(li);
    });
    win.append(ul); btn.setAttribute('aria-expanded', 'true'); openMenu = { ul, btn };
    (ul.querySelector('[aria-selected="true"]') || ul.firstChild).focus();
  }
  function select(win, btn, options, value, onChange) {
    let cur = value;
    const show = () => { btn.textContent = options[cur]; };
    btn.classList.add('rw-sel'); btn.type = 'button'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); show();
    btn.addEventListener('click', () => {
      if (openMenu && openMenu.btn === btn) { closeMenu(); return; }
      popup(win, btn, options.map((o, i) => ({ value: i, html: esc(o), selected: i === cur })), i => { cur = i; show(); onChange && onChange(i); });
    });
    return { set(i) { cur = i; show(); }, get: () => cur };
  }
  const plural = (n, a, b, c) => { const m = n % 100, d = n % 10; return n + ' ' + (m > 10 && m < 15 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c); };

  // =====================================================================
  // 2. Почему не видно? (VisibilityDiagnosticsWindow, VisibilityDiagnosticsCommand)
  // =====================================================================
  const OK = 0, BAD = 1;
  const CHECKS = [
    [OK, 'Принадлежность виду', 'Элемент не ограничен другим владельцем-вида.'],
    [OK, 'Скрытие элемента', 'Индивидуальное постоянное скрытие не обнаружено.'],
    [OK, 'Категория', 'Категория элемента включена.'],
    [OK, 'Временное скрытие/изоляция', 'Временное скрытие/изоляция не активно.'],
    [OK, 'Доступность элемента для вида', 'Revit возвращает элемент в составе этого вида.'],
    [OK, 'Рабочий набор открыт', 'Рабочий набор «АР_Стены» открыт.'],
    [OK, 'Видимость рабочего набора', 'Рабочий набор не скрыт непосредственно настройками вида.'],
    [BAD, 'Фильтры вида', 'Элемент проходит скрывающие фильтры: Скрыть_Перегородки.'],
    [OK, 'Граница обрезки', 'Элемент пересекает область обрезки вида.'],
    [OK, 'Секущий диапазон', 'Секущая плоскость пересекает элемент.']
  ];

  function mountVisibility(host) {
    const inner = '<div class="rw-frame"><h4>Почему не видно?</h4><p class="rw-sub">Выделите элемент (можно на другом виде или в спецификации) или введите ID, откройте проверяемый вид и запустите диагностику.</p>' +
      '<div class="rw-card dyn"><div class="pv-ctl"><button type="button" id="pv-mode" style="width:185px"></button><button type="button" class="rw-btn" id="pv-cont" style="min-width:105px" hidden>Продолжить</button>' +
      '<span class="id">ID</span><input class="rw-in" id="pv-id" type="text" style="width:110px" placeholder="2145" aria-label="ID элемента" title="Необязательно. ID элемента, если его не выделить на этом виде. Пусто — выделенный элемент или элемент прошлой проверки" autocomplete="off">' +
      '<button type="button" class="rw-btn" id="pv-run" style="min-width:110px">Запустить</button></div>' +
      '<div class="pv-el" id="pv-el"></div><div class="pv-view" id="pv-view"></div><div class="pv-sum" id="pv-sum" aria-live="polite"></div>' +
      '<div class="pv-grid"><table><colgroup><col style="width:90px"><col style="width:190px"><col></colgroup><thead><tr><th>Результат</th><th>Проверка</th><th>Результат проверки</th></tr></thead><tbody id="pv-body"></tbody></table></div></div></div>';
    const win = frame(host, 'RabinBIM — Почему не видно?', 700, inner);
    const $ = id => win.querySelector('#' + id);
    const mode = select(win, $('pv-mode'), ['Полная проверка', 'До первой причины'], 0);
    let shown = 0, busy = false, problems = 0;
    const row = c => { const tr = document.createElement('tr'); tr.className = 'new'; tr.innerHTML = '<td class="st ' + (c[0] === BAD ? 'st-bad' : 'st-ok') + '">' + (c[0] === BAD ? 'Причина' : 'Проверено') + '</td><td>' + esc(c[1]) + '</td><td>' + esc(c[2]) + '</td>'; return tr; };
    async function feed(untilProblem) {
      busy = true; $('pv-run').disabled = true; $('pv-cont').hidden = true;
      const body = $('pv-body');
      while (shown < CHECKS.length) {
        const c = CHECKS[shown++]; body.append(row(c)); if (c[0] === BAD) problems++;
        await wait(150);
        if (untilProblem && c[0] === BAD) break;
      }
      const more = shown < CHECKS.length;
      $('pv-sum').textContent = problems ? 'Обнаружено вероятных причин: ' + problems + '.' : 'Явная автоматически проверяемая причина не обнаружена. Просмотрите пункты ниже.';
      $('pv-cont').hidden = !more; busy = false; $('pv-run').disabled = false;
      win.querySelector('.pv-grid').scrollTop = 1e6;
    }
    $('pv-run').addEventListener('click', () => {
      if (busy) return;
      shown = 0; problems = 0; $('pv-body').textContent = '';
      $('pv-el').textContent = 'Стена: Наружная кирпичная 380 · ID ' + ($('pv-id').value.trim() || '2145');
      $('pv-view').textContent = 'Вид: План этажа — Этаж 1 (3D-вид и спецификации проверяются так же)';
      $('pv-sum').textContent = 'Проверяем…';
      feed(mode.get() === 1);
    });
    $('pv-cont').addEventListener('click', () => { if (!busy) feed(false); });
  }

  // =====================================================================
  // 3. Размеры по линии (LineDimensionSettingsWindow)
  // =====================================================================
  const CATS = [['Двери', 0, true], ['Колонны', 0], ['Каркас несущий', 0], ['Лестницы', 0], ['Мебель', 0], ['Окна', 0, true], ['Осветительные приборы', 0], ['Перекрытия', 0], ['Сантехнические приборы', 0], ['Стены', 0]];
  function mountDims(host) {
    const catRows = CATS.map((c, i) => '<div class="ld-it" data-n="' + esc(c[0]) + '"><label class="rw-chk"><input type="checkbox" data-c="' + i + '"' + (c[2] ? ' checked' : '') + '><span>' + esc(c[0]) + '</span></label><button type="button" data-m="' + i + '" class="h34" style="min-height:34px" title="Способ привязки для этой категории"></button></div>').join('');
    const inner = '<div class="rw-frame"><h4>Размеры по линии</h4><p class="rw-sub">Категории и способ привязки размерной цепочки</p><button type="button" class="rw-btn rw-help help" aria-label="Показать обучение" tabindex="-1">?</button>' +
      '<div class="rw-card dyn" style="padding:18px 8px 18px 18px"><div class="ld-list">' +
      '<label class="rw-chk" style="display:flex"><input type="checkbox" id="ld-walls" checked><span>Образмеривать стены</span></label>' +
      '<label class="rw-chk" style="display:flex"><input type="checkbox" id="ld-grids"><span>Образмеривать оси</span></label>' +
      '<label class="rw-chk" style="display:flex;margin-bottom:6px"><input type="checkbox" id="ld-thin"><span>Игнорировать стены толщиной до</span></label>' +
      '<div class="ld-sub" id="ld-thinrow"><span>Предельная толщина, мм</span><input class="rw-in" id="ld-thick" type="text" value="150" inputmode="numeric" title="Отдельные стены и объединённые пакеты не толще этого значения не попадут в размеры" autocomplete="off"></div>' +
      '<div id="ld-open"><label class="rw-chk" style="display:flex;margin-bottom:6px"><input type="checkbox" id="ld-openings" checked><span>Образмеривать выбранные категории рядом с линией</span></label>' +
      '<div class="ld-sub" style="margin-top:0"><span>Допуск до линии, мм</span><input class="rw-in" id="ld-tol" type="text" value="500" inputmode="numeric" title="Максимальное расстояние от центра экземпляра семейства до размерной линии" autocomplete="off"></div>' +
      '<div class="ld-cat" id="ld-catwrap"><b>Категории элементов</b><div class="ld-srch"><input class="rw-in" id="ld-srch" type="text" aria-label="Поиск категории" title="Поиск категории" autocomplete="off"><label class="rw-chk"><input type="checkbox" id="ld-hide"><span>Скрыть невыбранное</span></label></div>' +
      '<div class="ld-box" id="ld-box">' + catRows + '</div><div style="margin-bottom:4px">С какой стороны линии</div><button type="button" id="ld-side" style="width:100%;margin-bottom:12px"></button></div></div>' +
      '<label class="rw-chk" style="display:flex;margin-bottom:14px" title="Создавать отдельный размер для каждой соседней пары привязок"><input type="checkbox" id="ld-sep"><span>Раздельные размеры</span></label>' +
      '<div id="ld-modes"><div class="ld-h">Привязка к стенам</div>' +
      '<label class="rw-rad ld-rad" title="Обе грани стены участвуют в цепочке; значение толщины выносится от стены."><input type="radio" name="ld-mode" value="thick" checked><span>По граням с размером толщины</span></label>' +
      '<label class="rw-rad ld-rad" title="Для каждой стены используется только её осевая линия."><input type="radio" name="ld-mode" value="center"><span>По центру стены</span></label>' +
      '<label class="rw-rad ld-rad" title="Обе грани сохраняются как привязки, но текст толщины стены скрывается."><input type="radio" name="ld-mode" value="faces"><span>По граням без значения толщины</span></label></div>' +
      '</div><div class="ld-foot"><button type="button" class="rw-btn primary" id="ld-save" style="min-width:110px;margin-right:10px">Сохранить</button></div></div></div>';
    host.innerHTML = '<div class="dims-wrap"><div id="ld-win"></div><div class="rw-card ld-plan" style="background:#fff"><h5>Что получится на плане</h5><p>Иллюстрация: так цепочка выглядит в Revit. Менять настройки можно слева.</p><svg id="ld-svg" viewBox="0 0 420 190" role="img" aria-label="План: три стены на линии, оси, дверь и размерная цепочка под ними"></svg><p id="ld-note" style="margin:8px 0 0" aria-live="polite"></p></div></div>';
    const win = frame(host.querySelector('#ld-win'), 'RabinBIM — размеры по линии', 650, inner);
    const $ = id => win.querySelector('#' + id);
    const modes = CATS.map(() => 0);
    win.querySelectorAll('[data-m]').forEach(b => {
      const i = +b.dataset.m, opts = CATS[i][0] === 'Стены' ? ['По краям', 'Ближайший край'] : ['По краям', 'По центру'];
      const sel = select(win, b, opts, 0, v => { modes[i] = v; draw(); }); sel.set(0);
    });
    const side = select(win, $('ld-side'), ['С одной стороны по направлению линии', 'С обеих сторон линии'], 0, draw);
    const state = () => {
      const ign = $('ld-thin').checked;
      $('ld-thinrow').classList.toggle('ld-off', !ign); $('ld-thick').disabled = !ign;
      $('ld-modes').classList.toggle('ld-off', !$('ld-walls').checked);
      $('ld-catwrap').classList.toggle('ld-off', !$('ld-openings').checked); $('ld-tol').disabled = !$('ld-openings').checked;
      const f = $('ld-srch').value.trim().toLowerCase(), hide = $('ld-hide').checked;
      win.querySelectorAll('.ld-it').forEach(r => { const on = r.querySelector('[data-c]').checked; r.hidden = (f && !r.dataset.n.toLowerCase().includes(f)) || (hide && !on); });
    };
    // геометрия плана, мм
    const WALLS = [{ f: 0, t: 200 }, { f: 3300, t: 100 }, { f: 6000, t: 200 }], GRID = [100, 6100], DOOR = { f: 1000, w: 900 };
    const X = mm => 40 + mm * 0.058, NS = 'http://www.w3.org/2000/svg';
    const el = (n, a, t) => { const e = document.createElementNS(NS, n); Object.keys(a).forEach(k => e.setAttribute(k, a[k])); if (t !== undefined) e.textContent = t; return e; };
    const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    function draw() {
      state();
      const s = host.querySelector('#ld-svg'); s.textContent = '';
      const walls = $('ld-walls').checked, grids = $('ld-grids').checked, open = $('ld-openings').checked, sep = $('ld-sep').checked;
      const thin = $('ld-thin').checked ? (parseFloat($('ld-thick').value.replace(',', '.')) || 0) : -1;
      const mode = win.querySelector('input[name="ld-mode"]:checked').value;
      const doorOn = open && win.querySelector('[data-c="0"]').checked, doorMode = modes[0];
      s.append(el('line', { x1: 10, y1: 60, x2: 410, y2: 60, class: 'base' }));
      s.append(el('text', { x: 10, y: 14, class: 'cap' }, 'Линия построения размеров'));
      WALLS.forEach(w => s.append(el('rect', { x: X(w.f), y: 36, width: Math.max(2.5, w.t * 0.058), height: 48, class: 'wall' + (thin >= 0 && w.t <= thin ? ' dim' : '') })));
      if (grids) GRID.forEach((g, i) => { s.append(el('line', { x1: X(g), y1: 24, x2: X(g), y2: 100, class: 'grid' })); s.append(el('circle', { cx: X(g), cy: 17, r: 8, class: 'bub' })); s.append(el('text', { x: X(g), y: 20.5, class: 'bt' }, String(i + 1))); });
      // дверь рядом с линией: проём в линии стены
      s.append(el('path', { d: 'M' + X(DOOR.f) + ' 36 v48 M' + X(DOOR.f + DOOR.w) + ' 36 v48', class: 'door', 'stroke-opacity': doorOn || !open ? 1 : .5 }));
      s.append(el('path', { d: 'M' + X(DOOR.f) + ' 84 a' + DOOR.w * 0.058 + ' ' + DOOR.w * 0.058 + ' 0 0 1 ' + DOOR.w * 0.058 + ' -' + DOOR.w * 0.058, class: 'door', fill: 'none', 'stroke-dasharray': '3 2', 'stroke-opacity': .6 }));
      const pts = [];
      const add = (mm, kind) => pts.push({ mm, kind });
      if (walls) WALLS.filter(w => !(thin >= 0 && w.t <= thin)).forEach(w => { if (mode === 'center') add(w.f + w.t / 2, 'c'); else { add(w.f, 'f'); add(w.f + w.t, 'f'); } });
      if (grids) GRID.forEach(g => add(g, 'g'));
      if (doorOn) { if (doorMode === 1) add(DOOR.f + DOOR.w / 2, 'o'); else { add(DOOR.f, 'o'); add(DOOR.f + DOOR.w, 'o'); } }
      const note = host.querySelector('#ld-note');
      if (!pts.length) { note.textContent = 'Ничего не выбрано: размеры не будут созданы.'; return; }
      pts.sort((a, b) => a.mm - b.mm);
      const u = []; pts.forEach(p => { if (!u.length || p.mm - u[u.length - 1].mm > 1) u.push(p); });
      const wallThick = (a, b) => walls && mode === 'thick' && WALLS.some(w => Math.abs(w.f - a.mm) < 2 && Math.abs(w.f + w.t - b.mm) < 2);
      const wallFacePair = (a, b) => walls && mode === 'faces' && WALLS.some(w => Math.abs(w.f - a.mm) < 2 && Math.abs(w.f + w.t - b.mm) < 2);
      const segs = []; for (let i = 0; i < u.length - 1; i++) if (!wallFacePair(u[i], u[i + 1])) segs.push([u[i], u[i + 1], wallThick(u[i], u[i + 1])]);
      const y = 128;
      u.forEach(p => { s.append(el('line', { x1: X(p.mm), y1: 88, x2: X(p.mm), y2: y + 6, class: 'ext' })); });
      if (!sep) s.append(el('line', { x1: X(u[0].mm), y1: y, x2: X(u[u.length - 1].mm), y2: y, class: 'dml' }));
      else segs.forEach(g => s.append(el('line', { x1: X(g[0].mm) + 1, y1: y, x2: X(g[1].mm) - 1, y2: y, class: 'dml' })));
      u.forEach(p => s.append(el('line', { x1: X(p.mm) - 4, y1: y + 4, x2: X(p.mm) + 4, y2: y - 4, class: 'tick' })));
      segs.forEach((g, i) => {
        const mid = X((g[0].mm + g[1].mm) / 2), w = (g[1].mm - g[0].mm) * 0.058;
        if (g[2]) s.append(el('text', { x: mid, y: y - 22 - 2, class: 'lbl' }, fmt(g[1].mm - g[0].mm)));
        else s.append(el('text', { x: mid, y: w < 26 ? y + 16 + (i % 2) * 11 : y - 6, class: 'lbl' }, fmt(g[1].mm - g[0].mm)));
      });
      note.textContent = 'Размеров в цепочке: ' + segs.length + (sep ? ' (каждый — отдельный размер).' : '.');
    }
    win.addEventListener('change', draw); win.addEventListener('input', e => { if (e.target.id === 'ld-srch' || e.target.id === 'ld-thick') draw(); });
    $('ld-save').addEventListener('click', () => { const b = $('ld-save'); b.textContent = 'Сохранено ✓'; setTimeout(() => { b.textContent = 'Сохранить'; }, 1600); });
    draw();
  }

  const MOUNT = { visibility: mountVisibility, dims: mountDims };
window.RabinDemoKit = { frame, select, popup, closeMenu, esc, plural, wait, reduce, mount: (name, fn) => { MOUNT[name] = fn; document.querySelectorAll('[data-demo="' + name + '"]').forEach(h => { if (!h.dataset.mounted) { h.dataset.mounted = '1'; fn(h); } }); } };
  document.querySelectorAll('[data-demo]').forEach(h => { const f = MOUNT[h.dataset.demo]; if (f && !h.dataset.mounted) { h.dataset.mounted = '1'; f(h); } });
})();
