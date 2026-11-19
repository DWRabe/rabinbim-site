/* Демо «Менеджер коллизий»: все шесть вкладок окна (Главная, Коллизии, Отчёты, Сравнение, Аналитика, Настройки).
   Состав и поведение повторяют Rabin.Tools/Commands/Collisions (MainWindow и страницы). Данные вымышленные. */
(function () {
  'use strict';
  const K = window.RabinDemoKit; if (!K) return;
  const { frame, select, popup, esc, plural } = K;

  // ---------- палитра статусов и серий (ClashPalette) ----------
  const STATUS = [
    { n: 'Активно', bg: '#FDECEC', fg: '#C62828', ac: '#E5484D' },
    { n: 'Проанализировано', bg: '#EEF6FF', fg: '#1559A6', ac: '#2E90FA' },
    { n: 'Подтверждено', bg: '#FFF7E6', fg: '#AD6800', ac: '#F5A524' },
    { n: 'Исправлено', bg: '#E5F6EE', fg: '#237804', ac: '#17B26A' }
  ];
  const SERIES = ['#2E90FA', '#129E5E', '#D9820B', '#7A5AF8', '#E5484D', '#0891B2', '#DD2E9C', '#5D6B82', '#4C9A16'];
  const DEPTS = ['ОВ', 'ВК', 'ЭОМ', 'АР', 'КЖ'];
  const TODAY = '16.11.2026';
  const VERS = ['2026.10.05', '2026.10.12', '2026.10.19', '2026.10.26', '2026.11.02', '2026.11.09', '2026.11.16'];
  const PRIOR = [[21, 8, 5, 10], [20, 7, 6, 9], [18, 7, 7, 8], [16, 8, 6, 8], [15, 7, 6, 7], [13, 6, 6, 8]]; // активно, проанализировано, подтверждено, исправлено

  // ---------- вымышленный отчёт ----------
  const P = {
    duct: ['Воздуховоды', 'Воздуховод прямоугольный', ['400 × 200', '600 × 300', '500 × 250']],
    round: ['Воздуховоды', 'Воздуховод круглый', ['Ø250', 'Ø315']],
    pipe: ['Трубы', 'Труба стальная', ['Ø50', 'Ø32', 'Ø76']],
    tray: ['Кабельные лотки', 'Лоток перфорированный', ['200 × 50', '300 × 80']],
    beam: ['Несущий каркас', 'Балка железобетонная', ['300 × 500', '300 × 600']],
    slab: ['Перекрытия', 'Плита перекрытия', ['Монолитная 200', 'Монолитная 220']],
    col: ['Несущие колонны', 'Колонна железобетонная', ['400 × 400', '500 × 500']],
    part: ['Стены', 'Перегородка кирпичная', ['120 мм', '90 мм']],
    wall: ['Стены', 'Стена наружная', ['Кирпич 380', 'Газобетон 300']]
  };
  const TESTS = [
    { t: 'ОВ — КЖ', a: 'ОВ', b: 'КЖ', gs: [['Воздуховод × Балка', P.duct, P.beam, 5], ['Воздуховод × Плита', P.round, P.slab, 4], ['Воздуховод × Колонна', P.duct, P.col, 3]] },
    { t: 'ВК — АР', a: 'ВК', b: 'АР', gs: [['Труба × Перегородка', P.pipe, P.part, 5], ['Труба × Стена наружная', P.pipe, P.wall, 3]] },
    { t: 'ЭОМ — ОВ', a: 'ЭОМ', b: 'ОВ', gs: [['Лоток × Воздуховод', P.tray, P.duct, 4]] },
    { t: 'ЭОМ — КЖ', a: 'ЭОМ', b: 'КЖ', gs: [['Лоток × Балка', P.tray, P.beam, 3], ['Лоток × Плита', P.tray, P.slab, 2]] }
  ];
  let seed = 11; const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const AX = ['А', 'Б', 'В', 'Г', 'Д'];
  const dayStr = back => { const d = new Date(2026, 10, 16 - back); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.2026'; };
  const CLASHES = []; let num = 11;
  TESTS.forEach(T => T.gs.forEach(g => {
    for (let i = 0; i < g[3]; i++) {
      const r = rnd(), s = r < 0.36 ? 0 : r < 0.54 ? 1 : r < 0.68 ? 2 : 3, age = s === 3 ? 0 : Math.floor(rnd() * 46), lvl = 1 + Math.floor(rnd() * 4);
      const e1 = { id: String(1000000 + Math.floor(rnd() * 900000)), model: T.a + '_Корпус А', cat: g[1][0], fam: g[1][1], type: pick(g[1][2]) };
      const e2 = { id: String(300000 + Math.floor(rnd() * 600000)), model: T.b + '_Корпус А', cat: g[2][0], fam: g[2][1], type: pick(g[2][2]) };
      CLASHES.push({ id: CLASHES.length, test: T.t, group: g[0], name: 'Столкновение ' + (num++), level: 'Этаж ' + lvl, loc: 'Этаж ' + lvl + ' · ось ' + pick(AX) + '–' + pick(AX) + ' / ' + (1 + Math.floor(rnd() * 6)) + ' · ' + e1.model.split('_')[0] + '_' + e1.cat + ' / ' + e2.model.split('_')[0] + '_' + e2.cat,
        dept: rnd() < 0.14 ? '' : (rnd() < 0.5 ? T.a : T.b), s, age: age, isNew: s !== 3 && age <= 3, mine: rnd() < 0.35, today: false, e1, e2, found: dayStr(s === 3 ? 20 + Math.floor(rnd() * 20) : age),
        log: [{ t: dayStr(age) + ' 09:12', who: 'Navisworks', txt: 'Коллизия найдена' }] });
    }
  }));
  const FEED = [];
  const feed = (c, who, kind, txt, time) => FEED.unshift({ t: time || (TODAY.slice(0, 5) + ' ' + new Date().toTimeString().slice(0, 5)), who, id: c.id, name: c.name, kind, txt });
  [['Иванов А.', 'status', 'Статус: Активно → Проанализировано', '16.11 08:40', 1], ['Петрова М.', 'comment', 'Согласовано с АР, переносим трассу выше', '15.11 17:05', 3], ['Смирнов Д.', 'status', 'Статус: Проанализировано → Подтверждено', '15.11 14:22', 6], ['Иванов А.', 'comment', 'Нужна гильза в перекрытии', '15.11 11:10', 9], ['Петрова М.', 'status', 'Статус: Подтверждено → Исправлено', '14.11 16:48', 12], ['Смирнов Д.', 'status', 'Назначено: КЖ', '14.11 10:03', 15], ['Иванов А.', 'comment', 'Проверить после обновления модели КЖ', '13.11 15:31', 18]]
    .forEach(f => feed(CLASHES[f[4]], f[0], f[1], f[2], f[3]));

  const sections = c => (c.test.split(' — '));
  const counts = c => { const a = [0, 0, 0, 0]; c.forEach(x => a[x.s]++); return a; };
  const fmtD = n => n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0';
  const dcol = n => n > 0 ? STATUS[0].fg : n < 0 ? STATUS[3].fg : 'inherit';

  function mount(host) {
    const st = { tab: 1, sel: 0, q: '', status: 0, mine: false, today: false, isNew: false, old: false, tile: null, age: 30, zoom: 2, crop: 3, cropByInt: true, zoomOn: true, mode: 0, scope: 1, anMode: 0, repMode: 0, repMetric: 0, cmpA: 5, cmpB: 6, cmp: null, ver: 6, feedN: [1, 10, 1, 10], keys: ['Left', 'Right', '1', '2', '3', '4', 'I', 'C', 'G'], loaded: 4 };
    const LOG = ['[' + TODAY.slice(0, 5) + ' 08:31:14] INFO  Менеджер коллизий открыт', '[' + TODAY.slice(0, 5) + ' 08:31:15] INFO  Проект «Корпус А», версия ' + VERS[6], '[' + TODAY.slice(0, 5) + ' 08:31:17] INFO  Загружено отчётов: 4, коллизий: ' + CLASHES.length];
    const TABS = ['Главная', 'Коллизии', 'Отчёты', 'Сравнение', 'Аналитика', 'Настройки'];
    const inner =
      '<div class="mc-head"><div class="tt"><b>Менеджер коллизий</b><span>Отчёты Navisworks: статусы, назначения, комментарии и переход к элементам в Revit</span></div>' +
      '<label><span class="rw-cap">Проект</span><span class="rw-sel h32" style="width:190px;pointer-events:none">Корпус А</span></label>' +
      '<label><span class="rw-cap">Отчёт</span><span class="rw-sel h32" style="width:250px;pointer-events:none">Версия 16.11 · все отчёты</span></label></div>' +
      '<button type="button" class="rw-btn rw-help mc-help" aria-label="Показать обучение" tabindex="-1">?</button>' +
      '<div class="mc-tabs" role="tablist">' + TABS.map((t, i) => '<button type="button" role="tab" data-tab="' + i + '">' + t + '</button>').join('') + '</div>' +
      '<div class="mc-view" id="mc-view"></div><div class="mc-toast win-toast" id="mc-wtoast" role="status"></div>';
    const win = frame(host, 'RabinBIM — менеджер коллизий', 1100, inner);
    const $ = id => win.querySelector('#' + id), view = $('mc-view');
    let tt = 0; const say = text => { const t = $('mc-wtoast'); t.textContent = text; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); };
    const logLine = (lvl, txt) => LOG.push('[' + TODAY.slice(0, 5) + ' ' + new Date().toTimeString().slice(0, 8) + '] ' + lvl + ' ' + txt);
    const ageClass = c => c.age >= st.age ? 'old' : c.age >= st.age / 2 ? 'mid' : '';
    const cur = () => CLASHES[st.sel];
    const live = list => counts(list || CLASHES);
    const logC = (c, who, txt, kind) => { c.today = true; c.log.push({ t: 'сегодня ' + new Date().toTimeString().slice(0, 5), who, txt }); feed(c, who, kind || 'status', txt); };

    // ---------- вкладки ----------
    const tabBtns = [...win.querySelectorAll('[data-tab]')];
    function go(i) {
      st.tab = i; window.RabinDemoKit.closeMenu();
      tabBtns.forEach((b, k) => { b.classList.toggle('cur', k === i); b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
      view.innerHTML = ''; [pDash, pClash, pReports, pCompare, pAnalytics, pSettings][i]();
    }
    tabBtns.forEach((b, i) => { b.addEventListener('click', () => go(i)); b.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(Math.min(5, i + 1)), tabBtns[Math.min(5, i + 1)].focus(); if (e.key === 'ArrowLeft') go(Math.max(0, i - 1)), tabBtns[Math.max(0, i - 1)].focus(); }); });

    const tile = (dot, label, val, col, extra) => '<div class="rw-card mc-metric"><div class="ml"><i style="background:' + dot + '"></i>' + label + '</div><div class="mv"' + (col ? ' style="color:' + col + '"' : '') + '>' + val + '</div>' + (extra || '') + '</div>';
    const table = (cols, rows, cls) => '<table class="mc-tb ' + (cls || '') + '"><thead><tr>' + cols.map(c => '<th' + (c[2] ? ' style="width:' + c[2] + 'px"' : '') + (c[1] ? ' class="' + c[1] + '"' : '') + '>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table>';

    // =================== Главная ===================
    function pDash() {
      const c = live(), tot = CLASHES.length, assigned = CLASHES.filter(x => x.dept).length, old = CLASHES.filter(x => x.s !== 3 && x.age >= st.age).length;
      const pct = Math.round(c[3] / tot * 100);
      const rows = (kind, from, to) => { const list = FEED.filter(f => f.kind === kind).slice(from - 1, to); return list.length ? list.map(f => '<tr data-open="' + f.id + '" title="Двойной щелчок — открыть коллизию"><td>' + esc(f.t) + '</td><td>' + esc(f.who) + '</td><td>' + esc(f.name) + '</td><td>' + esc(f.txt) + '</td></tr>').join('') : '<tr><td colspan="4" class="mc-none2">Записей нет</td></tr>'; };
      const hist = (title, kind, k, last) => '<div class="rw-card mc-pad"><div class="mc-ct"><b>' + title + '</b><span class="rng"><span class="rw-cap">записи с</span><input class="rw-in rng-b" data-r="' + k + '" value="' + st.feedN[k] + '" aria-label="С"><span class="rw-cap">по</span><input class="rw-in rng-b" data-r="' + (k + 1) + '" value="' + st.feedN[k + 1] + '" aria-label="По">' + (kind === 'status' ? '<button type="button" class="rw-btn h28" id="mc-refresh">Обновить</button>' : '') + '</span></div><div class="mc-scroll">' + table([['Время', '', 96], ['Автор', '', 100], ['Коллизия', '', 112], [last]], rows(kind, st.feedN[k], st.feedN[k + 1])) + '</div></div>';
      view.innerHTML = '<div class="mc-dash">' +
        '<div class="rw-card mc-pad"><div class="mc-ct"><b>Загрузка отчётов</b></div><div class="mc-load"><label><span class="rw-cap">Проект</span><span class="rw-sel h32" style="width:230px;pointer-events:none">Корпус А</span></label><label><span class="rw-cap">Версия</span><button type="button" id="mc-ver" class="h32" style="width:150px"></button></label><button type="button" class="rw-btn primary h32" id="mc-loadv" style="align-self:flex-end">Загрузить</button><button type="button" class="rw-btn h32" id="mc-reload" style="align-self:flex-end">Обновить список</button><span class="rw-cap" style="align-self:flex-end;margin:0 0 9px 8px">или вручную:</span><button type="button" class="rw-btn h32" style="align-self:flex-end" data-say="В демо файлы не открываются.">Файл отчёта…</button><button type="button" class="rw-btn h32" style="align-self:flex-end" data-say="В демо папки не открываются.">Папка…</button></div>' +
        '<div class="rw-cap" style="font-size:12px;margin-top:6px" id="mc-sum">Загружено отчётов: ' + st.loaded + ' · коллизий: ' + tot + ' · версия ' + VERS[st.ver] + '</div></div>' +
        '<div class="mc-tiles5">' + tile('#1677FF', 'Всего', tot) + tile(STATUS[0].ac, 'Активные', c[0], STATUS[0].fg) + tile(STATUS[1].ac, 'Проанализированные', c[1], STATUS[1].fg) + tile(STATUS[2].ac, 'Подтверждённые', c[2], STATUS[2].fg) + tile(STATUS[3].ac, 'Исправленные', c[3], STATUS[3].fg) + '</div>' +
        '<div class="rw-card mc-pad mc-prog"><div class="pgl"><div class="pgh"><b>Прогресс исправления</b><b style="color:' + STATUS[3].fg + '">' + pct + '%</b></div><div class="pbar"><i style="width:' + pct + '%"></i></div></div>' +
        '<div class="soft"><span class="rw-cap">Назначено</span><b>' + assigned + '</b></div><div class="soft"><span class="rw-cap">Без назначения</span><b style="color:' + STATUS[0].fg + '">' + (tot - assigned) + '</b></div>' +
        '<button type="button" class="soft old" id="mc-old" title="Неисправленные коллизии старше порога из «Настроек». Щелчок — показать их"><span class="rw-cap" style="color:' + STATUS[0].fg + '">Старше ' + st.age + ' дн.</span><b style="color:' + STATUS[0].fg + '">' + old + '</b></button></div>' +
        '<div class="mc-two">' + hist('Последние изменения', 'status', 0, 'Изменение') + hist('Последние комментарии', 'comment', 2, 'Комментарий') + '</div></div>';
      const v = select(win, $('mc-ver'), VERS, st.ver, i => { st.ver = i; });
      $('mc-loadv').addEventListener('click', () => { st.loaded = 4; $('mc-sum').textContent = 'Загружено отчётов: 4 · коллизий: ' + tot + ' · версия ' + VERS[st.ver]; logLine('INFO ', 'Загружена версия ' + VERS[st.ver]); say('Отчёты версии ' + VERS[st.ver] + ' загружены.'); });
      $('mc-reload').addEventListener('click', () => say('Список версий обновлён.'));
      view.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => say(b.dataset.say)));
      $('mc-old').addEventListener('click', () => { st.old = true; st.q = ''; st.tile = null; go(1); });
      view.querySelectorAll('.rng-b').forEach(i => i.addEventListener('change', () => { st.feedN[+i.dataset.r] = Math.max(1, parseInt(i.value, 10) || 1); pDash(); }));
      if ($('mc-refresh')) $('mc-refresh').addEventListener('click', pDash);
      view.addEventListener('dblclick', e => { const r = e.target.closest('[data-open]'); if (r) { st.sel = +r.dataset.open; st.status = 0; st.q = ''; st.tile = null; st.mine = st.today = st.isNew = st.old = false; go(1); } });
    }

    // =================== Коллизии ===================
    function pass(c) {
      if (st.status && c.s !== st.status - 1) return false;
      if (st.mine && !c.mine) return false; if (st.today && !c.today) return false;
      if (st.isNew && !c.isNew) return false; if (st.old && !(c.s !== 3 && c.age >= st.age)) return false;
      if (st.tile && !st.tile.f(c)) return false;
      if (st.q && !st.tile) {
        const hay = [c.name, c.loc, c.group, c.dept, c.test, c.e1.fam, c.e2.fam, c.e1.cat, c.e2.cat, c.e1.id, c.e2.id, STATUS[c.s].n].join(' ').toLowerCase();
        const parts = st.q.toLowerCase().split('|'), inc = parts[0].trim(), exc = (parts[1] || '').split(',').map(x => x.trim()).filter(Boolean);
        if (exc.some(x => hay.includes(x))) return false;
        if (inc) { const words = inc.includes('&') ? inc.split('&').map(x => x.trim()).filter(Boolean) : [inc]; if (!words.every(w => hay.includes(w))) return false; }
      }
      return true;
    }
    function clashSvg(c) {
      const fixed = c.s === 3, dy = fixed ? -34 : 0;
      return '<svg viewBox="0 0 360 190" role="img" aria-label="Схема пересечения двух элементов"><defs><pattern id="mch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#EEF2F7"/><path d="M0 0v7" stroke="#C9D2DE" stroke-width="1.4"/></pattern></defs>' +
        '<rect x="12" y="12" width="336" height="166" rx="6" fill="#fff" stroke="#DDE2E8"/><rect x="150" y="12" width="46" height="166" fill="url(#mch)" stroke="#8E9AAE"/>' +
        '<rect x="40" y="' + (78 + dy) + '" width="280" height="38" rx="2" fill="#7EB1F5" fill-opacity=".85" stroke="#1677FF"/>' + (fixed ? '' : '<rect x="150" y="78" width="46" height="38" fill="#E5484D" fill-opacity=".8"/><circle cx="173" cy="97" r="22" fill="none" stroke="#E5484D" stroke-width="1.5" stroke-dasharray="4 3"/>') +
        '<text x="22" y="30" font-size="10" fill="#667085" font-family="Segoe UI,system-ui,sans-serif">' + esc(c.e1.fam) + ' × ' + esc(c.e2.fam) + '</text></svg>';
    }
    function pClash() {
      view.innerHTML = '<div class="mc-page">' +
        '<div class="rw-card mc-left"><div class="mc-lh"><div class="mc-row1"><input class="rw-in h32" id="mc-q" type="text" aria-label="Поиск коллизий" title="Поиск: стена&#10;Все слова сразу: стена &amp; ОВ&#10;Исключения после |: стена | ОВ, ВК&#10;Enter — найти" autocomplete="off">' +
        '<button type="button" class="rw-btn primary h32" id="mc-find" style="margin-left:8px">Найти</button><button type="button" class="rw-btn h32" id="mc-reset" style="margin-left:6px">Сброс</button><button type="button" id="mc-status" class="h32" style="width:160px;margin-left:10px" title="Показывать только этот статус"></button></div>' +
        '<div class="mc-row2"><label class="rw-chk"><input type="checkbox" id="mc-mine"><span>Мои</span></label><label class="rw-chk"><input type="checkbox" id="mc-today"><span>Сегодня</span></label><label class="rw-chk"><input type="checkbox" id="mc-new"><span>Новые</span></label><label class="rw-chk"><input type="checkbox" id="mc-old2"><span>Старые</span></label><span class="gap"></span>' +
        '<button type="button" class="rw-btn h26" id="mc-export" style="margin-right:12px">Выгрузить…</button><span class="mc-count" id="mc-count" aria-live="polite"></span></div></div><div class="mc-list" id="mc-list" role="listbox" aria-label="Коллизии"></div></div>' +
        '<div class="mc-right"><div class="rw-card mc-c1"><div class="t"><b id="mc-name"></b><span class="pill sm" id="mc-pill"><i></i><span></span></span></div><p id="mc-rep"></p><span class="rw-cap" id="mc-meta"></span></div>' +
        '<div class="rw-card mc-c2"><div class="mc-img" id="mc-img"></div><div class="mc-acts"><button type="button" class="rw-btn primary h32" data-act="i" title="Найти элементы в модели и связях, изолировать и приблизить">Изолировать</button><button type="button" class="rw-btn h32" data-act="c" title="Личный 3D-вид, обрезанный по месту коллизии">3D-обрезка</button><button type="button" class="rw-btn h32" data-act="g" title="3D-вид по всем элементам текущей группы">3D группы</button><button type="button" class="rw-btn h32" data-act="k" title="Скопировать карточку коллизии">Копировать</button></div></div>' +
        '<div class="rw-card mc-c3"><div class="mc-el" id="mc-e1"></div><hr><div class="mc-el" id="mc-e2"></div></div>' +
        '<div class="rw-card mc-c4"><div class="top"><b>Комментарии и история</b><button type="button" class="rw-btn h28" style="margin:0 6px 0 8px" data-say="В демо пользователи проекта не загружаются." title="Найти пользователей, работавших в активном проекте Revit">Пользователи</button><button type="button" id="mc-dept" class="h28" style="width:112px" title="Назначить раздел или исполнителя"></button></div><div class="mc-act" id="mc-act" aria-live="polite"></div><div class="mc-cm"><input class="rw-in h32" id="mc-cm" type="text" aria-label="Комментарий" title="Комментарий к выбранным коллизиям. Enter — добавить" autocomplete="off"><button type="button" class="rw-btn h32" id="mc-add">Добавить</button></div></div></div></div>';
      const q = $('mc-q'), list = $('mc-list'); q.value = st.tile ? st.tile.label : st.q;
      ['mine', 'today', 'isNew'].forEach((k, i) => { $(['mc-mine', 'mc-today', 'mc-new'][i]).checked = st[k]; }); $('mc-old2').checked = st.old;
      const statusSel = select(win, $('mc-status'), ['Все статусы'].concat(STATUS.map(s => s.n)), st.status, i => { st.status = i; render(); });
      const deptSel = select(win, $('mc-dept'), ['Не назначено'].concat(DEPTS), 0, i => { const c = cur(); if (!c) return; const d = i ? DEPTS[i - 1] : ''; if (c.dept === d) return; c.dept = d; logC(c, 'Вы', d ? 'Назначено: ' + d : 'Назначение снято'); render(); });
      const ageHtml = c => c.s === 3 || !c.age || c.isNew ? '' : '<span class="badge ' + ageClass(c) + '">' + c.age + ' дн.</span>';
      function render(keepScroll) {
        const sc = list.scrollTop, shown = CLASHES.filter(pass);
        if (shown.length && !shown.some(c => c.id === st.sel)) st.sel = shown[0].id;
        const byT = {}; shown.forEach(c => (byT[c.test] = byT[c.test] || []).push(c)); let html = '';
        Object.keys(byT).forEach(t => {
          html += '<div class="mc-g1"><i></i><b>' + esc(t) + '</b><em>' + byT[t].length + '</em></div>';
          const byG = {}; byT[t].forEach(c => (byG[c.group] = byG[c.group] || []).push(c));
          Object.keys(byG).forEach(g => {
            html += '<button type="button" class="mc-g2" data-g="' + esc(g) + '" title="Показать изображение группы"><span class="ar">▸</span><b>' + esc(g) + '</b><span>(' + byG[g].length + ')</span></button>';
            byG[g].forEach(c => { const s = STATUS[c.s];
              html += '<div class="mc-it' + (c.id === st.sel ? ' cur' : '') + '" role="option" tabindex="0" aria-selected="' + (c.id === st.sel) + '" data-id="' + c.id + '"><i class="sp" style="background:' + s.ac + '"></i><div class="nm"><div><b>' + esc(c.name) + '</b>' + (c.isNew && c.s !== 3 ? '<span class="badge new">Новая</span>' : '') + ageHtml(c) + '</div><p title="' + esc(c.loc) + '">' + esc(c.loc) + '</p></div>' +
                '<div class="gr"><span>' + esc(c.group) + '</span><span>' + (c.dept ? esc(c.dept) : 'Не назначено') + '</span></div><button type="button" class="pill" data-pill="' + c.id + '" style="background:' + s.bg + ';color:' + s.fg + '" title="Изменить статус"><i style="background:' + s.ac + '"></i><span>' + s.n + '</span></button></div>'; });
          });
        });
        list.innerHTML = html || '<div class="mc-none">Ничего не найдено</div>'; list.scrollTop = keepScroll === false ? 0 : sc;
        $('mc-count').textContent = plural(shown.length, 'коллизия', 'коллизии', 'коллизий'); card();
      }
      function fields(id, label, e) { $(id).innerHTML = '<h5>' + label + '</h5><span class="rw-cap">ID</span><span class="id">' + esc(e.id) + '</span><span class="rw-cap">Модель</span><span>' + esc(e.model) + '</span><span class="rw-cap">Категория</span><span>' + esc(e.cat) + '</span><span class="rw-cap">Семейство</span><span title="' + esc(e.fam) + '">' + esc(e.fam) + '</span><span class="rw-cap">Тип</span><span>' + esc(e.type) + '</span>'; }
      function card() {
        const c = cur(), none = !CLASHES.filter(pass).length;
        if (none) { $('mc-name').textContent = 'Выберите коллизию в списке'; $('mc-pill').style.visibility = 'hidden'; $('mc-rep').textContent = ''; $('mc-meta').textContent = ''; $('mc-img').innerHTML = ''; $('mc-e1').innerHTML = ''; $('mc-e2').innerHTML = ''; $('mc-act').innerHTML = ''; return; }
        const s = STATUS[c.s], pill = $('mc-pill'); pill.style.visibility = ''; pill.style.background = s.bg; pill.style.color = s.fg; pill.firstChild.style.background = s.ac; pill.lastChild.textContent = s.n;
        $('mc-name').textContent = c.name; $('mc-rep').textContent = c.test + ' · версия 16.11'; $('mc-meta').textContent = 'Найдено ' + c.found + ' · назначено: ' + (c.dept || '—') + ' · ' + c.group;
        $('mc-img').innerHTML = clashSvg(c) + '<div class="mc-toast" id="mc-itoast"></div>'; fields('mc-e1', 'ЭЛЕМЕНТ 1', c.e1); fields('mc-e2', 'ЭЛЕМЕНТ 2', c.e2);
        deptSel.set(c.dept ? DEPTS.indexOf(c.dept) + 1 : 0); $('mc-act').innerHTML = c.log.map(l => '<p><small>' + esc(l.t) + ' · ' + esc(l.who) + '</small> ' + esc(l.txt) + '</p>').join(''); $('mc-act').scrollTop = 1e6;
      }
      const setStatus = (c, i) => { if (i === c.s) return; logC(c, 'Вы', 'Статус: ' + STATUS[c.s].n + ' → ' + STATUS[i].n); c.s = i; render(); };
      list.addEventListener('click', e => {
        const pill = e.target.closest('[data-pill]');
        if (pill) { const c = CLASHES[+pill.dataset.pill]; st.sel = c.id; list.querySelectorAll('.mc-it').forEach(r => r.classList.toggle('cur', +r.dataset.id === c.id)); card();
          popup(win, pill, STATUS.map((s, i) => ({ value: i, selected: i === c.s, html: '<span class="ck">' + (i === c.s ? '✓' : '') + '</span><span class="dot" style="background:' + s.ac + '"></span><span>' + s.n + '</span>' })), i => setStatus(c, i), 'ctx'); return; }
        const g = e.target.closest('.mc-g2'); if (g) { imgSay('Общий вид группы «' + g.dataset.g + '» (в плагине — изображение из отчёта).'); return; }
        const row = e.target.closest('.mc-it'); if (row) { st.sel = +row.dataset.id; list.querySelectorAll('.mc-it').forEach(r => { const on = r === row; r.classList.toggle('cur', on); r.setAttribute('aria-selected', on); }); card(); }
      });
      list.addEventListener('keydown', e => { const row = e.target.closest('.mc-it'); if (row && e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); } });
      const imgSay = text => { const t = $('mc-itoast'); if (!t) return say(text); t.textContent = text; t.classList.add('show'); clearTimeout(imgSay.t); imgSay.t = setTimeout(() => t.classList.remove('show'), 2200); };
      const find = () => { if (st.tile && q.value !== st.tile.label) st.tile = null; st.q = q.value.trim(); render(false); };
      $('mc-find').addEventListener('click', find); q.addEventListener('keydown', e => { if (e.key === 'Enter') find(); });
      $('mc-reset').addEventListener('click', () => { q.value = ''; st.q = ''; st.tile = null; st.old = false; $('mc-old2').checked = false; render(false); });
      [['mc-mine', 'mine'], ['mc-today', 'today'], ['mc-new', 'isNew'], ['mc-old2', 'old']].forEach(p => $(p[0]).addEventListener('change', e => { st[p[1]] = e.target.checked; render(false); }));
      const ACTS = { i: 'Элементы найдены в модели и связях: изолированы, вид приближен.', c: 'Создан личный 3D-вид, обрезанный по месту коллизии (' + st.crop + '×).', g: 'Создан 3D-вид по всем элементам текущей группы.', k: 'Карточка коллизии скопирована в буфер обмена.' };
      view.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => imgSay(ACTS[b.dataset.act])));
      view.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => say(b.dataset.say)));
      $('mc-export').addEventListener('click', () => popup(win, $('mc-export'), [{ value: 'h', html: 'Страница HTML' }, { value: 'x', html: 'Таблица Excel' }], v => say(v === 'h' ? 'Выгрузка в HTML готова: сводка и карточки показанных коллизий.' : 'Выгрузка в Excel готова: картинки, фильтры, листы сводки и комментариев.'), 'ctx'));
      const add = () => { const t = $('mc-cm').value.trim(), c = cur(); if (!t || !c) return; logC(c, 'Вы', t, 'comment'); $('mc-cm').value = ''; card(); };
      $('mc-add').addEventListener('click', add); $('mc-cm').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
      pClash.api = { setStatus, cur, render, move: dir => { const groups = []; CLASHES.filter(pass).forEach(c => { const g = c.test + '|' + c.group; if (!groups.length || groups[groups.length - 1].g !== g) groups.push({ g, first: c.id }); }); const c = cur(), gi = groups.findIndex(x => x.g === c.test + '|' + c.group), n = groups[Math.max(0, Math.min(groups.length - 1, gi + dir))]; if (n) { st.sel = n.first; render(); list.querySelector('.cur') && list.querySelector('.cur').scrollIntoView({ block: 'nearest' }); } }, imgSay };
      render(false);
    }

    // =================== Отчёты ===================
    const scopeList = () => st.repMode === 0 ? CLASHES : st.repMode === 1 ? CLASHES.filter(c => c.test === TESTS[st.repMetric].t) : CLASHES.filter(c => c.dept === DEPTS[st.repMetric]);
    function series() {
      const base = CLASHES.length || 1, now = live(scopeList()), share = scopeList().length / base;
      const rows = PRIOR.map((p, i) => { const a = p.map(v => Math.round(v * (st.repMode === 0 ? 1 : share))); return { d: VERS[i], v: a }; });
      rows.push({ d: VERS[6], v: now }); return rows;
    }
    function pReports() {
      const modeNames = ['Общая динамика', 'По проверке', 'По разделу'];
      view.innerHTML = '<div class="mc-scrollpage"><div class="rw-card mc-pad2"><div class="mc-bar"><div class="l"><span class="rw-cap">Проект</span><span class="rw-sel h32" style="width:220px;pointer-events:none">Корпус А</span><span class="rw-cap">Разрез</span><button type="button" id="mc-rmode" class="h32" style="width:170px"></button><button type="button" id="mc-rmetric" class="h32" style="width:280px" hidden></button></div><div class="r"><button type="button" class="rw-btn h32" id="mc-rrefresh">Обновить</button><button type="button" class="rw-btn h32" id="mc-rxl">Выгрузить в Excel</button></div></div></div><div id="mc-rbody"></div></div>';
      const metricOpts = () => st.repMode === 1 ? TESTS.map(t => t.t) : DEPTS;
      select(win, $('mc-rmode'), modeNames, st.repMode, i => { st.repMode = i; st.repMetric = 0; syncMetric(); body(); });
      function syncMetric() { const old = $('mc-rmetric'), nb = document.createElement('button'); nb.id = 'mc-rmetric'; nb.className = 'h32'; nb.style.width = '280px'; old.replaceWith(nb); nb.hidden = st.repMode === 0; if (st.repMode) select(win, nb, metricOpts(), 0, i => { st.repMetric = i; body(); }); }
      function body() {
        const S = series(), last = S[S.length - 1], prev = S[S.length - 2], tot = r => r.v[0] + r.v[1] + r.v[2] + r.v[3];
        const dl = (a, b, good) => { const d = (good ? -1 : 1) * (a - b); return '<div class="dtx" style="color:' + (d > 0 ? STATUS[0].fg : d < 0 ? STATUS[3].fg : 'var(--muted)') + '">' + (d === 0 ? 'без изменений' : fmtD(d) + ' к ' + prev.d) + '</div>'; };
        const pr = r => { const t = tot(r); return t ? Math.round(r.v[3] / t * 100) : 0; };
        const max = Math.max(1, ...S.map(tot)), step = Math.ceil(max / 4 / 5) * 5, axMax = step * 4;
        const bars = S.map(r => { const h = v => v / axMax * 100 + '%'; return '<div class="col" title="' + esc(r.d + ' · всего ' + tot(r) + ' · активно ' + r.v[0] + ' · проанализировано ' + r.v[1] + ' · подтверждено ' + r.v[2] + ' · исправлено ' + r.v[3]) + '"><div class="stack">' + [3, 2, 1, 0].map(k => '<i style="height:' + h(r.v[k]) + ';background:' + STATUS[k].ac + '"></i>').join('') + '</div><span class="rw-cap">' + r.d.slice(5).replace('.', '.') + '</span></div>'; }).join('');
        const rowsT = S.slice().reverse().map((r, i, a) => { const p = a[i + 1], d = p ? tot(r) - tot(p) : 0; return '<tr><td>' + r.d + '</td><td>' + tot(r) + '</td><td>' + r.v[0] + '</td><td>' + r.v[1] + '</td><td>' + r.v[2] + '</td><td>' + r.v[3] + '</td><td style="color:' + dcol(d) + '">' + (p ? fmtD(d) : '—') + '</td><td>' + (st.repMode ? 1 : 4) + '</td></tr>'; }).join('');
        $('mc-rbody').innerHTML = '<div class="mc-tiles4">' +
          tile('#1677FF', 'Всего коллизий', tot(last), '', dl(tot(last), tot(prev))) + tile(STATUS[0].ac, 'Активные', last.v[0], STATUS[0].fg, dl(last.v[0], prev.v[0])) + tile(STATUS[3].ac, 'Исправленные', last.v[3], STATUS[3].fg, dl(last.v[3], prev.v[3], true)) + tile('', 'Прогресс исправления', pr(last) + '%', '#1677FF', dl(pr(last), pr(prev), true).replace('к ' + prev.d, 'п.п.')) +
          tile(STATUS[1].ac, 'Проанализированные', last.v[1], STATUS[1].fg) + tile(STATUS[2].ac, 'Подтверждённые', last.v[2], STATUS[2].fg) + tile('', 'Дат в истории', S.length) + tile('', 'Отчётов в последней версии', st.repMode ? 1 : 4) + '</div>' +
          '<div class="rw-card mc-pad mc-trend"><div class="mc-ct"><span><b>' + (st.repMode === 0 ? 'Тренд коллизий' : st.repMode === 1 ? 'Тренд проверки «' + esc(TESTS[st.repMetric].t) + '»' : 'Тренд раздела ' + DEPTS[st.repMetric]) + '</b><span class="rw-cap" style="margin-left:10px">' + last.d + '</span></span><span class="legend">' + STATUS.map(s => '<i style="background:' + s.ac + '"></i>' + (s.n === 'Активно' ? 'Активные' : s.n === 'Проанализировано' ? 'Проанализированные' : s.n === 'Подтверждено' ? 'Подтверждённые' : 'Исправленные')).join('') + '</span></div>' +
          '<div class="chart"><div class="axis">' + [4, 3, 2, 1, 0].map(k => '<span>' + step * k + '</span>').join('') + '</div><div class="plot"><div class="grid">' + '<b></b><b></b><b></b><b></b><b></b>' + '</div><div class="cols">' + bars + '</div></div></div></div>' +
          '<div class="rw-card mc-pad" style="margin-top:10px"><div class="mc-ct"><b>Данные по датам</b></div>' + table([['Дата', '', 130], ['Всего', '', 100], ['Активные', '', 110], ['Проанализированы', '', 145], ['Подтверждены', '', 120], ['Исправлены', '', 110], ['Изменение', '', 110], ['Файлов']], rowsT) + '</div>';
      }
      $('mc-rrefresh').addEventListener('click', () => { body(); say('Данные обновлены.'); }); $('mc-rxl').addEventListener('click', () => say('Выгрузка в Excel готова: тренд и данные по датам.'));
      syncMetric(); body();
    }

    // =================== Сравнение ===================
    function perTest(vi) { const base = CLASHES.length; return TESTS.map(T => { const now = CLASHES.filter(c => c.test === T.t).length; if (vi === 6) return now; const tot = PRIOR[vi].reduce((a, b) => a + b, 0); return Math.max(0, Math.round(tot * now / base)); }); }
    function pCompare() {
      view.innerHTML = '<div class="mc-cmp"><div class="rw-card mc-pad2"><div class="mc-bar"><div class="l"><span class="rw-cap">Проект</span><span class="rw-sel h32" style="width:220px;pointer-events:none">Корпус А</span><span class="rw-cap">Было</span><button type="button" id="mc-ca" class="h32" style="width:135px" title="Первая (более ранняя) версия"></button><span style="color:var(--muted)">→</span><span class="rw-cap">Стало</span><button type="button" id="mc-cb" class="h32" style="width:135px" title="Вторая (более поздняя) версия"></button><button type="button" class="rw-btn primary h32" id="mc-cgo">Сравнить</button></div></div></div>' +
        '<div class="rw-card mc-pad mc-sumrow" style="margin-top:10px"><div style="flex:1"><div class="sct" id="mc-ccap">Выберите две версии и нажмите «Сравнить»</div><div class="rw-cap" id="mc-cdet" style="margin-top:4px"></div></div><div class="soft"><span class="rw-cap">Было</span><b id="mc-c1" class="big">0</b></div><div class="soft"><span class="rw-cap">Стало</span><b id="mc-c2" class="big">0</b></div><div class="soft"><span class="rw-cap">Изменение</span><b id="mc-c3" class="big">0</b></div></div>' +
        '<div class="rw-card mc-pad" style="margin-top:10px;padding:8px"><div class="mc-scroll big2" id="mc-ctab"></div></div></div>';
      select(win, $('mc-ca'), VERS, st.cmpA, i => { st.cmpA = i; }); select(win, $('mc-cb'), VERS, st.cmpB, i => { st.cmpB = i; });
      const run = () => {
        let a = st.cmpA, b = st.cmpB; if (a > b) { const t = a; a = b; b = t; st.cmpA = a; st.cmpB = b; }
        if (a === b) { say('Выберите две разные версии.'); return; }
        const A = perTest(a), B = perTest(b), ta = A.reduce((x, y) => x + y, 0), tb = B.reduce((x, y) => x + y, 0), d = tb - ta;
        $('mc-ccap').textContent = d === 0 ? 'Число коллизий не изменилось' : (d < 0 ? 'Коллизий стало меньше на ' : 'Коллизий стало больше на ') + Math.abs(d);
        $('mc-cdet').textContent = VERS[a] + ' → ' + VERS[b] + ' · проверок: ' + TESTS.length + ' · выросло: ' + TESTS.filter((_, i) => B[i] > A[i]).length + ' · снизилось: ' + TESTS.filter((_, i) => B[i] < A[i]).length;
        $('mc-c1').textContent = ta; $('mc-c2').textContent = tb; const c3 = $('mc-c3'); c3.textContent = fmtD(d); c3.style.color = dcol(d);
        $('mc-ctab').innerHTML = table([['Проверка'], ['Было', 'c', 140], ['Стало', 'c', 140], ['Разница', 'c', 110]], TESTS.map((T, i) => '<tr><td>' + esc(T.t) + '</td><td class="c">' + A[i] + '</td><td class="c">' + B[i] + '</td><td class="c" style="font-weight:600;color:' + dcol(B[i] - A[i]) + '">' + fmtD(B[i] - A[i]) + '</td></tr>').join(''));
      };
      $('mc-cgo').addEventListener('click', run); run();
    }

    // =================== Аналитика ===================
    const MODES = ['Разделы', 'Уровни', 'Категории', 'Пересечения категорий', 'Семейства / имя элемента', 'Пересечения разделов', 'Сводка'];
    const TITLES = ['Распределение по разделам', 'Распределение по уровням', 'Распределение по категориям', 'Пересечения категорий', 'Семейства / имя элемента', 'Пересечения разделов'];
    function agg(mode) {
      const m = new Map(), add = (k, c, f) => { const e = m.get(k) || { name: k, n: 0, f }; e.n++; m.set(k, e); };
      CLASHES.forEach(c => {
        if (mode === 0) sections(c).forEach(s => add(s, c, x => sections(x).includes(s)));
        else if (mode === 1) add(c.level, c, x => x.level === c.level);
        else if (mode === 2) [c.e1.cat, c.e2.cat].forEach(k => add(k, c, x => x.e1.cat === k || x.e2.cat === k));
        else if (mode === 3) { const k = c.e1.cat + ' × ' + c.e2.cat; add(k, c, x => x.e1.cat + ' × ' + x.e2.cat === k); }
        else if (mode === 4) [c.e1.fam, c.e2.fam].forEach(k => add(k, c, x => x.e1.fam === k || x.e2.fam === k));
        else if (mode === 5) add(c.test, c, x => x.test === c.test);
      });
      return [...m.values()].sort((a, b) => b.n - a.n);
    }
    function squarify(items, W, H) {
      const total = items.reduce((s, i) => s + i.n, 0), scale = W * H / total, out = []; let rest = items.slice(), x = 0, y = 0, w = W, h = H;
      const worst = (row, side) => { const s = row.reduce((a, i) => a + i.n * scale, 0), mx = Math.max.apply(null, row.map(i => i.n * scale)), mn = Math.min.apply(null, row.map(i => i.n * scale)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
      while (rest.length) {
        const side = Math.min(w, h); let row = [rest[0]], i = 1; while (i < rest.length && worst(row.concat(rest[i]), side) <= worst(row, side)) { row.push(rest[i]); i++; }
        rest = rest.slice(row.length); const s = row.reduce((a, it) => a + it.n * scale, 0);
        if (w >= h) { const cw = s / h; let cy = y; row.forEach(it => { const ch = it.n * scale / cw; out.push({ it, x, y: cy, w: cw, h: ch }); cy += ch; }); x += cw; w -= cw; }
        else { const ch = s / w; let cx = x; row.forEach(it => { const cw = it.n * scale / ch; out.push({ it, x: cx, y, w: cw, h: ch }); cx += cw; }); y += ch; h -= ch; }
      }
      return out;
    }
    function pAnalytics() {
      const sum = st.anMode === 6, list = sum ? [] : agg(st.anMode), total = CLASHES.length, elems = new Set(); CLASHES.forEach(c => { elems.add(c.e1.id); elems.add(c.e2.id); });
      view.innerHTML = '<div class="mc-an"><div class="rw-card mc-pad2"><div class="mc-bar"><div class="l"><span class="rw-cap">Область</span><button type="button" id="mc-scope" class="h32" style="width:185px"></button><button type="button" class="rw-btn h32" id="mc-selrep" style="min-width:125px">Отчёты: 4 из 4</button><span class="rw-cap" style="font-size:12px">Корпус А · версия ' + VERS[6] + '</span></div><div class="r"><button type="button" class="rw-btn h32" id="mc-anxl">Выгрузить в Excel</button></div></div></div>' +
        '<div class="mc-an2"><div class="seg" role="group">' + MODES.map((m, i) => '<button type="button" data-m="' + i + '" class="' + (i === st.anMode ? 'cur' : '') + '">' + m + '</button>').join('') + '</div><div class="rw-card mc-tot"><span class="rw-cap">Коллизий </span><b>' + total + '</b><span class="rw-cap">Элементов </span><b>' + elems.size + '</b><span class="rw-cap">' + (st.anMode === 0 ? 'Разделов' : 'Групп') + ' </span><b>' + (sum ? DEPTS.length : list.length) + '</b></div></div><div class="mc-anbody" id="mc-anbody"></div></div>';
      select(win, $('mc-scope'), ['Текущий отчёт', 'Все отчёты папки'], st.scope, i => { st.scope = i; });
      $('mc-selrep').addEventListener('click', () => say('Выбор отчётов: в демо участвуют все четыре.')); $('mc-anxl').addEventListener('click', () => say('Выгрузка в Excel готова: график и таблица.'));
      view.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { st.anMode = +b.dataset.m; pAnalytics(); }));
      const body = $('mc-anbody');
      if (sum) {
        const asg = DEPTS.map(d => { const a = CLASHES.filter(c => c.dept === d), k = counts(a); return '<tr><td>' + d + '</td><td class="c">' + k[0] + '</td><td class="c">' + k[1] + '</td><td class="c">' + k[2] + '</td><td class="c">' + k[3] + '</td><td class="c">' + a.length + '</td></tr>'; }).join('');
        const una = counts(CLASHES.filter(c => !c.dept)); const unaT = una.reduce((a, b) => a + b, 0);
        body.innerHTML = '<div class="mc-two"><div class="rw-card mc-pad"><div class="mc-ct"><b>По назначениям</b></div><div class="mc-scroll">' + table([['Назначение'], ['Активные', 'c', 85], ['Проанализированы', 'c', 135], ['Подтв.', 'c', 75], ['Испр.', 'c', 65], ['Всего', 'c', 65]], asg + '<tr><td class="mu">Не назначено</td><td class="c">' + una[0] + '</td><td class="c">' + una[1] + '</td><td class="c">' + una[2] + '</td><td class="c">' + una[3] + '</td><td class="c">' + unaT + '</td></tr>') + '</div></div>' +
          '<div class="rw-card mc-pad"><div class="mc-ct"><b>По тестам Navisworks</b></div><div class="mc-scroll">' + table([['Тест'], ['Коллизий', 'c', 100]], TESTS.map(T => '<tr><td>' + esc(T.t) + '</td><td class="c">' + CLASHES.filter(c => c.test === T.t).length + '</td></tr>').join('')) + '</div></div></div>'; return;
      }
      const tiles = squarify(list, 100, 100);
      body.innerHTML = '<div class="rw-card mc-pad mc-tm"><div class="mc-ct"><b>' + TITLES[st.anMode] + '</b><span class="rw-cap">Щелчок по плитке — показать эти коллизии</span></div><div class="tmap">' +
        tiles.map((t, i) => '<button type="button" class="tl" data-t="' + i + '" style="left:' + t.x + '%;top:' + t.y + '%;width:' + t.w + '%;height:' + t.h + '%;--c:' + SERIES[i % SERIES.length] + '" title="' + esc(t.it.name + ': ' + t.it.n + ' (' + Math.round(t.it.n / list.reduce((a, b) => a + b.n, 0) * 100) + '%)') + '"><b class="bg"></b><span class="tn"' + (t.w < 7 || t.h < 11 ? ' style="opacity:0"' : '') + '>' + esc(t.it.name) + '<small>' + t.it.n + '</small></span></button>').join('') + '</div></div>' +
        '<div class="rw-card mc-pad mc-tbl"><div class="mc-scroll">' + table([[['Раздел', 'Уровень', 'Категория', 'Пересечение категорий', 'Семейство / имя элемента', 'Пересечение разделов'][st.anMode]], ['Количество', '', 120], ['Доля', '', 100]], list.map(it => '<tr><td>' + esc(it.name) + '</td><td>' + it.n + '</td><td>' + Math.round(it.n / list.reduce((a, b) => a + b.n, 0) * 1000) / 10 + ' %</td></tr>').join('')) + '</div></div>';
      body.querySelectorAll('.tl').forEach(b => b.addEventListener('click', () => { const it = tiles[+b.dataset.t].it; st.tile = { label: it.name, f: it.f }; st.q = ''; st.status = 0; st.mine = st.today = st.isNew = st.old = false; go(1); }));
    }

    // =================== Настройки ===================
    const SRC = [['Корпус А', 'D:\\BIM\\Отчёты\\Корпус А', 'https://disk.yandex.ru/d/aBcD…', '2026.11.16'], ['Корпус Б', 'D:\\BIM\\Отчёты\\Корпус Б', '', '2026.11.09']];
    const KEYS = ['Left', 'Right', 'Up', 'Down', '1', '2', '3', '4', 'I', 'C', 'G', 'F', 'Escape'];
    const KEYNAMES = ['Предыдущая группа', 'Следующая группа', 'Статус «Активно»', 'Статус «Проанализировано»', 'Статус «Подтверждено»', 'Статус «Исправлено»', 'Изолировать', '3D-обрезка', '3D-обрезка группы'];
    const KEYORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    function pSettings() {
      const slider = (id, label, min, max, step, val, fmt) => '<div class="srow"><span class="rw-cap" style="font-size:12px">' + label + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><b id="' + id + 'v">' + fmt(val) + '</b></div>';
      const diag = [['Пустые ID', 0, 'Коллизии без ID элементов'], ['Нет изображения', 0, 'В отчёте нет картинки коллизии'], ['Неизвестная модель', 0, 'Имя модели не определено'], ['Некорректная дата', 0, 'Дата «Найдено» не распознана']];
      view.innerHTML = '<div class="mc-scrollpage"><div class="rw-card mc-pad" style="padding:16px"><div class="sct">Источники отчётов HTML/XML</div><div class="rw-cap" style="margin:4px 0 10px">Одна строка — один проект. В корневой папке ожидаются папки версий с именами вида 2026.07.21; ссылка нужна только для скачивания архивов с Яндекс Диска.</div>' +
        table([['Проект', '', 150], ['Корневая папка'], ['Публичная ссылка на архивы'], ['Последняя версия', 'c', 125]], SRC.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td class="c">' + r[3] + '</td></tr>').join('')) +
        '<div class="mc-wrap" style="margin-top:12px">' + ['Добавить', 'Выбрать папку…', 'Удалить', '|', 'Проверить обновления', 'Скачать архивы', '|', 'Импорт…', 'Экспорт…', 'Импорт изменений…', '|'].map(b => b === '|' ? '<i class="gap1"></i>' : '<button type="button" class="rw-btn" data-say="В демо источники не меняются.">' + b + '</button>').join('') + '<button type="button" class="rw-btn primary" data-say="Пути сохранены.">Сохранить пути</button></div></div>' +
        '<div class="mc-two" style="margin-top:10px"><div class="rw-card mc-pad" style="padding:16px"><div class="sct">Изображение коллизии</div><label class="rw-chk" style="margin:12px 0 10px"><input type="checkbox" id="mc-zoomon"' + (st.zoomOn ? ' checked' : '') + '><span>Увеличивать изображение при наведении</span></label>' + slider('mc-zoom', 'Коэффициент увеличения', 1, 4, 0.25, st.zoom, v => v + '×') + '<div class="rw-cap" style="margin-top:8px">Размер предпросмотра ограничивается размерами экрана, даже если выбран большой коэффициент.</div><hr class="hr">' +
        '<div class="sct">3D-обрезка</div><label class="rw-chk" style="margin:12px 0 10px"><input type="checkbox" id="mc-cropint"' + (st.cropByInt ? ' checked' : '') + '><span>Строить область по геометрии пересечения</span></label>' + slider('mc-crop', 'Увеличение области', 1, 10, 0.5, st.crop, v => v + '×') + '<div class="rw-cap" style="margin-top:8px">Если геометрическое пересечение вычислить невозможно, RabinBIM автоматически использует безопасную обрезку по границам элементов.</div><hr class="hr">' +
        '<div class="sct">Возраст коллизий</div><div style="margin-top:12px">' + slider('mc-age', 'Старая через', 7, 90, 1, st.age, v => v + ' дн.') + '</div><div class="rw-cap" style="margin-top:8px">Возраст считается от даты «Найдено» в отчёте Navisworks и показывается только у неисправленных коллизий. С половины срока метка жёлтая, после — красная; фильтр «Старые» показывает красные.</div></div>' +
        '<div class="rw-card mc-pad" style="padding:16px"><div class="mc-ct" style="margin-bottom:12px"><span><div class="sct">Горячие клавиши</div><div class="rw-cap" style="margin-top:3px">Работают на вкладке «Коллизии»</div></span><button type="button" class="rw-btn h28" id="mc-keys0">Стандартные клавиши</button></div><div class="keys">' + KEYORDER.map(i => '<div><span class="rw-cap">' + KEYNAMES[i] + '</span><button type="button" data-k="' + i + '" class="h30"></button></div>').join('') + '</div></div></div>' +
        '<div class="rw-card mc-pad" style="margin-top:10px;padding:9px 14px"><div class="mc-ct" style="margin:0"><span class="rw-cap" style="font-size:12px">Изображение, 3D-обрезка и горячие клавиши сохраняются этой кнопкой</span><button type="button" class="rw-btn primary" id="mc-save">Сохранить настройки</button></div></div>' +
        '<div class="mc-two" style="margin-top:10px"><div class="rw-card mc-pad" style="padding:16px"><div class="mc-ct"><span><div class="sct">Журнал</div><div class="rw-cap" style="margin-top:3px">Сообщения и ошибки за сегодня</div></span><span><button type="button" class="rw-btn h28" id="mc-lclear" style="margin-right:6px">Очистить</button><button type="button" class="rw-btn h28" id="mc-lref">Обновить</button></span></div><pre class="logbox" id="mc-log"></pre></div>' +
        '<div class="rw-card mc-pad" style="padding:16px"><div class="mc-ct"><span><div class="sct">Диагностика отчёта</div><div class="rw-cap" style="margin-top:3px">Проверка загруженных коллизий</div></span><button type="button" class="rw-btn h28" id="mc-dchk">Проверить</button></div>' + table([['Проверка', '', 140], ['Найдено', 'c', 72], ['Описание'], ['', '', 118]], diag.map(d => '<tr><td>' + d[0] + '</td><td class="c">' + d[1] + '</td><td>' + d[2] + '</td><td><button type="button" class="rw-btn h24" data-say="Проблем не найдено: «' + d[0] + '».">Показать</button></td></tr>').join('')) + '</div></div></div>';
      view.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => say(b.dataset.say)));
      const val = (id, f) => { const r = $(id); r.addEventListener('input', () => { $(id + 'v').textContent = f(+r.value); }); return r; };
      val('mc-zoom', v => v + '×').addEventListener('input', e => { st.zoom = +e.target.value; }); val('mc-crop', v => v + '×').addEventListener('input', e => { st.crop = +e.target.value; });
      val('mc-age', v => v + ' дн.').addEventListener('input', e => { st.age = +e.target.value; });
      $('mc-zoomon').addEventListener('change', e => { st.zoomOn = e.target.checked; }); $('mc-cropint').addEventListener('change', e => { st.cropByInt = e.target.checked; });
      view.querySelectorAll('[data-k]').forEach(b => { const i = +b.dataset.k; select(win, b, KEYS, Math.max(0, KEYS.indexOf(st.keys[i])), v => { st.keys[i] = KEYS[v]; }); });
      $('mc-keys0').addEventListener('click', () => { st.keys = ['Left', 'Right', '1', '2', '3', '4', 'I', 'C', 'G']; pSettings(); say('Стандартные клавиши восстановлены.'); });
      $('mc-save').addEventListener('click', () => { logLine('INFO ', 'Настройки сохранены'); drawLog(); say('Настройки сохранены.'); });
      const drawLog = () => { $('mc-log').textContent = LOG.join('\n'); }; drawLog();
      $('mc-lclear').addEventListener('click', () => { LOG.length = 0; drawLog(); }); $('mc-lref').addEventListener('click', drawLog);
      $('mc-dchk').addEventListener('click', () => { logLine('INFO ', 'Диагностика отчёта: проблем не найдено'); drawLog(); say('Диагностика: проблем не найдено.'); });
    }

    // горячие клавиши вкладки «Коллизии»
    let inside = false; win.addEventListener('pointerenter', () => { inside = true; }); win.addEventListener('pointerleave', () => { inside = false; });
    document.addEventListener('keydown', e => {
      if (st.tab !== 1 || !pClash.api || !win.isConnected || (!inside && !win.contains(document.activeElement))) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.ctrlKey || e.altKey || e.metaKey) return;
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key, i = st.keys.indexOf(k); if (i < 0) return;
      const a = pClash.api; e.preventDefault();
      if (i === 0) a.move(-1); else if (i === 1) a.move(1); else if (i >= 2 && i <= 5) a.setStatus(a.cur(), i - 2);
      else if (i === 6) a.imgSay('Элементы найдены в модели и связях: изолированы, вид приближен.'); else if (i === 7) a.imgSay('Создан личный 3D-вид, обрезанный по месту коллизии (' + st.crop + '×).'); else if (i === 8) a.imgSay('Создан 3D-вид по всем элементам текущей группы.');
    });
    go(1);
  }
  K.mount('clashes', mount);
})();
