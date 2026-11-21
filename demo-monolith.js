/* Демо окна «Расхождения монолита АР и КЖ» (MonolithCheckWindow.xaml + MonolithPresenter.cs).
   Устройство окна, тексты, фильтры, поиск с «!», группировка кусков и режимы показа повторяют плагин. */
(function () {
  'use strict';

  const { frame, select, esc, mount } = window.RabinDemoKit;

  const DIR_ALL = 'Все расхождения';
  const DIR_AR = 'Есть в АР, нет в КЖ';
  const DIR_KR = 'Есть в КЖ, нет в АР';
  const PART_STATUS = 'Часть объёма';
  const LINK_NAME = 'ЖК_Север_КЖ_К1_R21.rvt';

  // Исходные куски расхождений на учебном фрагменте Этажа 03 (8 мест).
  // Каждый кусок имеет координаты в условной системе модели (метры, 0..16 x 0..10 x 0..3.3)
  // для отрисовки в 3D-аксонометрии и на плане этажа.
  const RAW_PIECES = [
    // Место 1: монолитная стена в осях 2/А–Б смещена на 50 мм (обе стороны расхождения в одном месте)
    {
      id: 'p1-ar', place: 1, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Стены', elementId: 412890, linkId: 0,
      typeName: 'АР_Стена_ЖБ_200', elementName: 'Базовая стена: АР_Стена_ЖБ_200',
      volumeM3: 0.4320, thicknessMm: 50, sizeMm: '50 × 2 880 × 3 000',
      box: { x1: 5.10, y1: 1.60, z1: 0.22, x2: 5.26, y2: 4.90, z2: 3.10 },
      hostEl: 'ar-wall-2'
    },
    {
      id: 'p1-kr', place: 1, side: 'kr', status: PART_STATUS,
      level: 'Этаж 03', model: LINK_NAME, category: 'Стены', elementId: 805114, linkId: 1,
      typeName: 'КЖ_Стена_Монолит_200', elementName: 'Базовая стена: КЖ_Стена_Монолит_200',
      volumeM3: 0.4320, thicknessMm: 50, sizeMm: '50 × 2 880 × 3 000',
      box: { x1: 4.86, y1: 1.60, z1: 0.22, x2: 5.02, y2: 4.90, z2: 3.10 },
      hostEl: 'kr-wall-2'
    },

    // Места 2, 3, 4: плита перекрытия АР — три невырезанных отверстия (3 куска у одного элемента -> кнопка ▸)
    {
      id: 'p2-ar', place: 2, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Перекрытия', elementId: 412405, linkId: 0,
      typeName: 'АР_Перекрытие_ЖБ_220', elementName: 'Перекрытие: АР_Перекрытие_ЖБ_220',
      volumeM3: 0.1980, thicknessMm: 220, sizeMm: '1 000 × 900 × 220',
      box: { x1: 6.40, y1: 2.30, z1: 0.00, x2: 7.70, y2: 3.50, z2: 0.28 },
      hostEl: 'ar-slab-1'
    },
    {
      id: 'p3-ar', place: 3, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Перекрытия', elementId: 412405, linkId: 0,
      typeName: 'АР_Перекрытие_ЖБ_220', elementName: 'Перекрытие: АР_Перекрытие_ЖБ_220',
      volumeM3: 0.0792, thicknessMm: 220, sizeMm: '600 × 600 × 220',
      box: { x1: 8.30, y1: 2.50, z1: 0.00, x2: 9.15, y2: 3.35, z2: 0.28 },
      hostEl: 'ar-slab-1'
    },
    {
      id: 'p4-ar', place: 4, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Перекрытия', elementId: 412405, linkId: 0,
      typeName: 'АР_Перекрытие_ЖБ_220', elementName: 'Перекрытие: АР_Перекрытие_ЖБ_220',
      volumeM3: 0.0396, thicknessMm: 220, sizeMm: '450 × 400 × 220',
      box: { x1: 7.20, y1: 4.30, z1: 0.00, x2: 7.90, y2: 4.95, z2: 0.28 },
      hostEl: 'ar-slab-1'
    },

    // Место 5: колонна КЖ добавлена на оси 3/Б, в АР отсутствует целиком
    {
      id: 'p5-kr', place: 5, side: 'kr', status: 'Элемент отсутствует',
      level: 'Этаж 03', model: LINK_NAME, category: 'Несущие колонны', elementId: 806320, linkId: 1,
      typeName: 'КЖ_Колонна_400x400', elementName: 'КЖ_Колонна_Прямоуг: КЖ_Колонна_400x400',
      volumeM3: 0.4800, thicknessMm: 400, sizeMm: '400 × 400 × 3 000',
      box: { x1: 10.20, y1: 4.55, z1: 0.22, x2: 10.85, y2: 5.20, z2: 3.10 },
      hostEl: 'kr-col-5'
    },

    // Место 6: пилон у лестничной клетки (крупный выступ 120 мм + тонкий припуск 10 мм у проёма)
    {
      id: 'p6a-ar', place: 6, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Стены', elementId: 413012, linkId: 0,
      typeName: 'АР_Пилон_ЖБ_250', elementName: 'Базовая стена: АР_Пилон_ЖБ_250',
      volumeM3: 0.2160, thicknessMm: 120, sizeMm: '120 × 600 × 3 000',
      box: { x1: 12.10, y1: 1.55, z1: 0.22, x2: 12.50, y2: 2.55, z2: 3.10 },
      hostEl: 'ar-pylon-6'
    },
    {
      id: 'p6b-ar', place: 6, side: 'ar', status: PART_STATUS,
      level: 'Этаж 03', model: 'АР', category: 'Стены', elementId: 413012, linkId: 0,
      typeName: 'АР_Пилон_ЖБ_250', elementName: 'Базовая стена: АР_Пилон_ЖБ_250',
      volumeM3: 0.0042, thicknessMm: 10, sizeMm: '10 × 140 × 3 000',
      box: { x1: 11.95, y1: 2.55, z1: 0.22, x2: 12.10, y2: 2.85, z2: 3.10 },
      hostEl: 'ar-pylon-6'
    },

    // Место 7: мелкий припуск на плите лоджии (скрыт при пороге 15 мм / 200 см³, виден при снижении порога)
    {
      id: 'p7-kr', place: 7, side: 'kr', status: PART_STATUS,
      level: 'Этаж 03', model: LINK_NAME, category: 'Перекрытия', elementId: 807011, linkId: 1,
      typeName: 'КЖ_Плита_Лоджия_180', elementName: 'Перекрытие: КЖ_Плита_Лоджия_180',
      volumeM3: 0.00014, thicknessMm: 12, sizeMm: '12 × 650 × 180',
      box: { x1: 2.10, y1: 7.40, z1: 0.04, x2: 3.30, y2: 7.75, z2: 0.26 },
      hostEl: 'kr-loggia-7'
    },

    // Место 8: участок с отказом булевой операции (оранжевый контур — проверить вручную)
    {
      id: 'p8-fail', place: 8, side: 'ar', failed: true,
      status: 'Не удалось вычислить (1 уч., разница объёмов ≈ 18 см³) — проверить вручную',
      level: 'Этаж 03', model: 'АР', category: 'Стены', elementId: 413504, linkId: 0,
      typeName: 'АР_Парапет_ЖБ_200', elementName: 'Базовая стена: АР_Парапет_ЖБ_200',
      volumeM3: 0.0000, thicknessMm: 0, sizeMm: '200 × 950 × 1 100',
      box: { x1: 12.80, y1: 6.10, z1: 0.22, x2: 14.10, y2: 6.60, z2: 1.45 },
      hostEl: 'ar-parapet-8'
    }
  ];

  // Геометрия базовой модели фрагмента Этажа 03 (АР + КЖ) для учебного вида
  const MODEL_ELEMENTS = [
    // Плита перекрытия АР
    { id: 'ar-slab-1', side: 'ar', key: '0:412405', label: 'Перекрытие АР (ID 412405)', box: { x1: 1.0, y1: 1.0, z1: 0.0, x2: 14.5, y2: 7.2, z2: 0.22 } },
    // Наружная стена АР слева (без расхождений — контекст)
    { id: 'ar-wall-left', side: 'ar', key: '0:412100', label: 'Стена АР ось 1 (без расхождений)', box: { x1: 1.1, y1: 1.2, z1: 0.22, x2: 1.45, y2: 7.0, z2: 3.10 } },
    // Смещённая стена АР ось 2
    { id: 'ar-wall-2', side: 'ar', key: '0:412890', label: 'Стена АР ось 2 (ID 412890)', box: { x1: 5.02, y1: 1.60, z1: 0.22, x2: 5.26, y2: 4.90, z2: 3.10 } },
    // Пилон АР у лестницы
    { id: 'ar-pylon-6', side: 'ar', key: '0:413012', label: 'Пилон АР (ID 413012)', box: { x1: 11.40, y1: 1.55, z1: 0.22, x2: 12.50, y2: 2.55, z2: 3.10 } },
    // Парапет АР
    { id: 'ar-parapet-8', side: 'ar', key: '0:413504', label: 'Парапет АР (ID 413504)', box: { x1: 11.80, y1: 6.10, z1: 0.22, x2: 14.20, y2: 6.60, z2: 1.45 } },
    // Плита лоджии АР
    { id: 'ar-loggia', side: 'ar', key: '0:412990', label: 'Плита лоджии АР (без расхождений)', box: { x1: 1.5, y1: 7.2, z1: 0.04, x2: 5.4, y2: 8.6, z2: 0.24 } },

    // Стена КЖ ось 2 (смещена относительно АР)
    { id: 'kr-wall-2', side: 'kr', key: '1:805114', label: 'Стена КЖ ось 2 (ID 805114)', box: { x1: 4.86, y1: 1.60, z1: 0.22, x2: 5.10, y2: 4.90, z2: 3.10 } },
    // Колонна КЖ ось 3/Б (нет в АР)
    { id: 'kr-col-5', side: 'kr', key: '1:806320', label: 'Колонна КЖ 400×400 (ID 806320)', box: { x1: 10.20, y1: 4.55, z1: 0.22, x2: 10.85, y2: 5.20, z2: 3.10 } },
    // Пилон КЖ у лестницы (уже, чем в АР)
    { id: 'kr-pylon-6', side: 'kr', key: '1:806101', label: 'Пилон КЖ (контекст)', box: { x1: 11.40, y1: 1.55, z1: 0.22, x2: 12.10, y2: 2.55, z2: 3.10 } },
    // Плита лоджии КЖ
    { id: 'kr-loggia-7', side: 'kr', key: '1:807011', label: 'Плита лоджии КЖ (ID 807011)', box: { x1: 1.5, y1: 7.2, z1: 0.04, x2: 5.4, y2: 8.6, z2: 0.24 } },
    // Задняя стена КЖ (контекст связи)
    { id: 'kr-wall-back', side: 'kr', key: '1:805010', label: 'Стена КЖ ось А (контекст связи)', box: { x1: 1.45, y1: 1.10, z1: 0.22, x2: 14.3, y2: 1.42, z2: 3.10 } }
  ];

  const fmtVol = v => Number(v).toFixed(4).replace('.', ',');
  const fmtThick = v => (v > 0 ? String(Math.round(v)) : '0');
  const dirLabel = side => (side === 'ar' ? DIR_AR : DIR_KR);

  // Проекция 3D-аксонометрии (левосторонний изометрический вид Revit)
  function iso(x, y, z) {
    const ox = 290;
    const oy = 96;
    const sx = (x - y) * 21.5 + ox;
    const sy = (x + y) * 9.8 - z * 22.0 + oy;
    return [sx, sy];
  }

  function isoBoxPaths(b) {
    const p000 = iso(b.x1, b.y1, b.z1);
    const p100 = iso(b.x2, b.y1, b.z1);
    const p110 = iso(b.x2, b.y2, b.z1);
    const p010 = iso(b.x1, b.y2, b.z1);
    const p001 = iso(b.x1, b.y1, b.z2);
    const p101 = iso(b.x2, b.y1, b.z2);
    const p111 = iso(b.x2, b.y2, b.z2);
    const p011 = iso(b.x1, b.y2, b.z2);
    const poly = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    return {
      top: poly([p001, p101, p111, p011]),
      left: poly([p010, p110, p111, p011]),
      right: poly([p100, p110, p111, p101]),
      center: iso((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, b.z2 + 0.35)
    };
  }

  // Проекция 2D-плана
  function planRect(b) {
    const ox = 84;
    const oy = 32;
    const k = 38;
    return {
      x: ox + b.x1 * k,
      y: oy + b.y1 * k,
      w: Math.max(5, (b.x2 - b.x1) * k),
      h: Math.max(5, (b.y2 - b.y1) * k),
      cx: ox + ((b.x1 + b.x2) / 2) * k,
      cy: oy + ((b.y1 + b.y2) / 2) * k
    };
  }

  // Группировка кусков по (side, key) — как MonolithGroup.Build в C#
  function buildGroups(pieces) {
    const map = new Map();
    for (const p of pieces) {
      const gk = p.side + '|' + p.linkId + ':' + p.elementId;
      if (!map.has(gk)) map.set(gk, []);
      map.get(gk).push(p);
    }
    const groups = [];
    for (const [gk, list] of map.entries()) {
      list.sort((a, b) => a.place - b.place || b.volumeM3 - a.volumeM3);
      const first = list[0];
      const places = [...new Set(list.map(x => x.place))];
      const listed = places.slice(0, 6).join(', ') + (places.length > 6 ? ' … (+' + (places.length - 6) + ')' : '');
      const statuses = [...new Set(list.map(x => x.status))].join('; ');
      const vol = Math.round(list.reduce((s, x) => s + x.volumeM3, 0) * 10000) / 10000;
      const thick = Math.max(...list.map(x => x.thicknessMm));
      let sizeMm = first.sizeMm;
      if (list.length > 1) {
        const minX = Math.min(...list.map(x => x.box.x1));
        const maxX = Math.max(...list.map(x => x.box.x2));
        const minY = Math.min(...list.map(x => x.box.y1));
        const maxY = Math.max(...list.map(x => x.box.y2));
        const minZ = Math.min(...list.map(x => x.box.z1));
        const maxZ = Math.max(...list.map(x => x.box.z2));
        sizeMm = Math.round((maxX - minX) * 1000) + ' × ' + Math.round((maxY - minY) * 1000) + ' × ' + Math.round((maxZ - minZ) * 1000);
      }
      groups.push({
        gid: gk,
        key: first.linkId + ':' + first.elementId,
        side: first.side,
        failed: list.some(x => x.failed),
        direction: dirLabel(first.side),
        status: statuses,
        pieceCount: list.length,
        hasPieces: list.length > 1,
        places: listed,
        placeList: places,
        firstPlace: places[0],
        level: first.level,
        model: first.model,
        category: first.category,
        elementId: first.elementId,
        typeName: first.typeName,
        elementName: first.elementName,
        volumeM3: vol,
        thicknessMm: thick,
        sizeMm,
        pieces: list
      });
    }
    return groups;
  }

  mount('monolith', host => {
    const wrap = document.createElement('div');
    wrap.className = 'ml-wrap';
    const winHost = document.createElement('div');
    const vpHost = document.createElement('div');
    wrap.append(winHost, vpHost);
    host.append(wrap);

    const win = frame(winHost, 'RabinBIM — сверка АР и КЖ', 1200, `
      <div class="rw-frame">
        <h4>Расхождения монолита АР и КЖ</h4>
        <p class="rw-sub">КЖ: ${esc(LINK_NAME)} · Область: Этаж 03 (план и 3D-вид)</p>
        <div class="rw-card dyn">
          <p class="ml-summary" id="ml-summary"></p>
          <div class="ml-legend" aria-label="Легенда цветов">
            <span class="ml-leg-item"><i class="ml-sw ar"></i>Есть в АР, нет в КЖ</span>
            <span class="ml-leg-item"><i class="ml-sw kr"></i>Есть в КЖ, нет в АР</span>
            <span class="ml-leg-item"><i class="ml-sw fail"></i>Не удалось вычислить — проверить вручную</span>
            <span class="ml-leg-item"><i class="ml-sw ctx"></i>Элементы КЖ рядом с расхождением (режим «с элементами»)</span>
          </div>

          <div class="ml-bar">
            <button type="button" id="ml-dir"></button>
            <span class="ml-lbl" title="Тонкие куски 5–30 мм — в основном припуски у проёмов. Порог можно менять сразу, без пересчёта.">Скрывать тоньше, мм</span>
            <input class="rw-in ml-num" id="ml-thin" type="text" value="15" aria-label="Скрывать тоньше, мм" title="Enter — применить" autocomplete="off" />
            <span class="ml-lbl">меньше, см³</span>
            <input class="rw-in ml-num small" id="ml-small" type="text" value="200" aria-label="Скрывать меньше, см³" title="Enter — применить" autocomplete="off" />
            <button type="button" class="rw-btn h32 ml-apply" id="ml-apply">Применить</button>
            <span class="ml-lbl">Поиск</span>
            <input class="rw-in ml-search" id="ml-search" type="search" placeholder="Например: Стена !Пилон или номер места" aria-label="Поиск" title="Поиск по местам, ID, типу, категории, уровню и статусу. Слово после «!» отсеивает строки с ним: «ЖБ !Кровля»" autocomplete="off" />
          </div>

          <div class="ml-grid-wrap">
            <table class="ml-grid" id="ml-grid">
              <thead>
                <tr>
                  <th aria-label="Куски"></th>
                  <th data-sort="direction">Расхождение</th>
                  <th data-sort="status">Статус</th>
                  <th data-sort="pieceCount" class="ml-n">Кусков</th>
                  <th data-sort="firstPlace">Места</th>
                  <th data-sort="level">Уровень</th>
                  <th data-sort="model">Модель</th>
                  <th data-sort="category">Категория</th>
                  <th data-sort="elementId" class="ml-n">ID</th>
                  <th data-sort="elementName">Тип</th>
                  <th data-sort="volumeM3" class="ml-n">Объём, м³</th>
                  <th data-sort="thicknessMm" class="ml-n">Толщина ≈, мм</th>
                  <th data-sort="sizeMm">Габарит X×Y×Z, мм</th>
                </tr>
              </thead>
              <tbody id="ml-tbody"></tbody>
            </table>
          </div>

          <div class="ml-foot">
            <div class="ml-groups">
              <div class="ml-grp">
                <span class="ml-cap">На виде</span>
                <div class="ml-btns">
                  <button type="button" class="rw-btn primary" id="ml-show-diff" title="Обрезать 3D-вид по местам выбранных элементов и временно скрыть всё, кроме объёмов разницы.">Показать разницу</button>
                  <button type="button" class="rw-btn" id="ml-show-el" title="Оставить только участвующие элементы: АР — как есть, КЖ — серым, связь скрыта.">С элементами (без связи)</button>
                  <button type="button" class="rw-btn" id="ml-show-link" title="Как «с элементами», но связь КЖ остаётся видимой целиком.">С элементами и связью</button>
                  <button type="button" class="rw-btn" id="ml-clear" title="Убрать подсветку объёмов с вида">Убрать разницу</button>
                  <label class="rw-chk" title="Рядом с подсветкой рисуется номер места."><input type="checkbox" id="ml-labels" checked /><span>Номера мест</span></label>
                </div>
              </div>
              <div class="ml-grp">
                <span class="ml-cap">Найти в списке</span>
                <div class="ml-btns">
                  <button type="button" class="rw-btn" id="ml-find-ar" title="Указать элемент АР на виде — его строка выделится в списке.">Элемент АР…</button>
                  <button type="button" class="rw-btn" id="ml-find-kr" title="Указать элемент связи КЖ на виде — его строка выделится в списке.">Элемент КЖ…</button>
                </div>
              </div>
              <div class="ml-grp">
                <span class="ml-cap">Сверка</span>
                <div class="ml-btns">
                  <button type="button" class="rw-btn" id="ml-ex-el" title="Убрать выбранные элементы из сверки до закрытия окна.">Исключить элементы</button>
                  <button type="button" class="rw-btn" id="ml-ex-type" title="Убрать из сверки все элементы типов выбранных строк.">Исключить тип</button>
                  <button type="button" class="rw-btn" id="ml-restore" hidden title="Вернуть исключённые элементы и типы в сверку.">Вернуть исключённое</button>
                  <button type="button" class="rw-btn" id="ml-refresh" title="Полный пересчёт сверки с теми же настройками.">Обновить</button>
                </div>
              </div>
            </div>
            <div class="ml-right">
              <button type="button" class="rw-btn" id="ml-export">Экспорт CSV…</button>
              <button type="button" class="rw-btn" id="ml-close">Закрыть</button>
            </div>
          </div>
        </div>
        <div class="ml-toast" id="ml-toast" role="status" aria-live="polite"></div>
      </div>
    `);

    vpHost.innerHTML = `
      <div class="ml-vp">
        <div class="ml-vp-head">
          <span class="ml-vp-title">Учебный вид Revit — Этаж 03 (фрагмент монолита АР + связь КЖ)</span>
          <span class="ml-vp-mode" id="ml-vp-mode">Режим: С элементами (без связи)</span>
          <span class="ml-vp-spacer"></span>
          <div class="ml-vp-tabs" role="tablist" aria-label="Тип вида">
            <button type="button" class="ml-vp-tab on" data-vp="3d" aria-selected="true">3D-вид</button>
            <button type="button" class="ml-vp-tab" data-vp="plan" aria-selected="false">План этажа 03</button>
          </div>
        </div>
        <div class="ml-vp-pick" id="ml-vp-pick" hidden>
          <span id="ml-vp-pick-msg"></span>
          <button type="button" id="ml-vp-pick-cancel">Отмена</button>
        </div>
        <div class="ml-vp-stage">
          <svg class="ml-vp-svg" id="ml-vp-svg" viewBox="0 0 760 325" role="img" aria-label="Схема расхождений монолита АР и КЖ"></svg>
        </div>
        <div class="ml-vp-foot">
          <span id="ml-vp-info">Нажмите на строку в таблице или на объём на виде, чтобы сфокусировать расхождение. Двойной щелчок по строке — показать место с элементами.</span>
          <span>Подсказка: попробуйте поиск <b>Стена !Пилон</b> или порог <b>0 мм</b></span>
        </div>
      </div>
    `;

    const $ = id => win.querySelector('#' + id);
    const $v = id => vpHost.querySelector('#' + id);

    // Состояние
    let hideThinMm = 15;
    let hideSmallCm3 = 200;
    let dirFilter = 0; // 0: все, 1: АР, 2: КЖ
    let searchQuery = '';
    let sortKey = 'volumeM3';
    let sortAsc = false;
    let selectedGids = new Set();
    let expandedGids = new Set();
    let excludedKeys = new Set();
    let excludedTypes = new Set();
    let showMode = 'participants'; // 'diff' | 'participants' | 'link' | 'clear'
    let showLabels = true;
    let focusedPlaces = null; // null = все видимые места, Set<number> = конкретные
    let vpType = '3d'; // '3d' | 'plan'
    let pickMode = null; // null | 'ar' | 'kr'
    let toastTimer = null;

    function toast(msg) {
      const el = $('ml-toast');
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
    }

    const dirOptions = [DIR_ALL, DIR_AR, DIR_KR];
    const dirSel = select(win, $('ml-dir'), dirOptions, 0, i => {
      dirFilter = i;
      renderAll();
    });

    // Фильтрация исходных кусков по исключениям и порогам шума
    function activeData() {
      let hiddenPieces = 0;
      const rows = [];
      for (const p of RAW_PIECES) {
        const key = p.linkId + ':' + p.elementId;
        if (excludedKeys.has(key) || excludedTypes.has(p.typeName)) continue;
        // Фильтр шума скрывает только обычные куски «Часть объёма» (как в C#)
        if (p.status === PART_STATUS && !p.failed) {
          const volCm3 = p.volumeM3 * 1e6;
          if ((hideThinMm > 0 && p.thicknessMm < hideThinMm) || (hideSmallCm3 > 0 && volCm3 < hideSmallCm3)) {
            hiddenPieces++;
            continue;
          }
        }
        rows.push(p);
      }
      const allGroups = buildGroups(rows);
      return { rows, allGroups, hiddenPieces };
    }

    function matchesSearch(g) {
      if (dirFilter === 1 && g.side !== 'ar') return false;
      if (dirFilter === 2 && g.side !== 'kr') return false;
      const parts = searchQuery.split('!');
      const query = parts[0].trim().toLowerCase();
      const fields = [g.places, String(g.elementId), g.model, g.elementName, g.category, g.level, g.status];
      for (let i = 1; i < parts.length; i++) {
        const ex = parts[i].trim().toLowerCase();
        if (ex && fields.some(f => f.toLowerCase().includes(ex))) return false;
      }
      if (!query) return true;
      return fields.some(f => f.toLowerCase().includes(query)) || g.pieces.some(p => String(p.place) === query);
    }

    function sortGroups(list) {
      return [...list].sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (typeof av === 'string') {
          const c = av.localeCompare(bv, 'ru');
          return sortAsc ? c : -c;
        }
        return sortAsc ? av - bv : bv - av;
      });
    }

    function renderSummary(data) {
      const places = new Set(data.rows.map(r => r.place)).size;
      const failed = data.rows.filter(r => r.failed).length;
      let text =
        'Элементов АР (монолит): 142 · Элементов КЖ: 138 · ' +
        'Элементов с расхождениями: ' + data.allGroups.length + ' · ' +
        'Кусков: ' + data.rows.length + ' · Мест: ' + places + ' · ' +
        'Не удалось вычислить: ' + failed + ' · Время: 4,2 с · Кубиков отверстий вычтено из КЖ: 18';
      if (data.hiddenPieces > 0) text += ' · Скрыто мелких кусков: ' + data.hiddenPieces;
      if (excludedKeys.size + excludedTypes.size > 0) {
        text += ' · Исключено: элементов ' + excludedKeys.size + ', типов ' + excludedTypes.size;
      }
      $('ml-summary').textContent = text;
      $('ml-restore').hidden = (excludedKeys.size + excludedTypes.size) === 0;
    }

    function renderTable(visibleGroups) {
      const tbody = $('ml-tbody');
      tbody.textContent = '';

      // Обновить индикаторы сортировки
      win.querySelectorAll('#ml-grid thead th[data-sort]').forEach(th => {
        const old = th.querySelector('.ml-sort');
        if (old) old.remove();
        if (th.dataset.sort === sortKey) {
          const sp = document.createElement('span');
          sp.className = 'ml-sort';
          sp.textContent = sortAsc ? '▲' : '▼';
          th.append(sp);
        }
      });

      if (!visibleGroups.length) {
        tbody.innerHTML = '<tr><td colspan="13" class="ml-empty">По текущим фильтрам расхождений нет. Попробуйте очистить поиск или уменьшить пороги шума.</td></tr>';
        return;
      }

      for (const g of visibleGroups) {
        const tr = document.createElement('tr');
        tr.className = 'ml-row' + (selectedGids.has(g.gid) ? ' sel' : '');
        tr.dataset.gid = g.gid;
        const dotCls = g.failed ? 'fail' : g.side;
        const isOpen = expandedGids.has(g.gid);

        tr.innerHTML =
          '<td>' + (g.hasPieces
            ? '<button type="button" class="ml-exp" data-exp="' + esc(g.gid) + '" title="Показать куски расхождения">' + (isOpen ? '▾' : '▸') + '</button>'
            : '') + '</td>' +
          '<td><span class="ml-dir"><i class="ml-dot ' + dotCls + '"></i>' + esc(g.direction) + '</span></td>' +
          '<td class="ml-status" title="' + esc(g.status) + '">' + esc(g.status) + '</td>' +
          '<td class="ml-n">' + g.pieceCount + '</td>' +
          '<td>' + esc(g.places) + '</td>' +
          '<td>' + esc(g.level) + '</td>' +
          '<td>' + esc(g.model) + '</td>' +
          '<td>' + esc(g.category) + '</td>' +
          '<td class="ml-n">' + g.elementId + '</td>' +
          '<td class="ml-type" title="' + esc(g.elementName) + '">' + esc(g.elementName) + '</td>' +
          '<td class="ml-n">' + fmtVol(g.volumeM3) + '</td>' +
          '<td class="ml-n">' + fmtThick(g.thicknessMm) + '</td>' +
          '<td>' + esc(g.sizeMm) + '</td>';

        tr.addEventListener('click', e => {
          if (e.target.closest('.ml-exp')) return;
          if (e.ctrlKey || e.metaKey) {
            if (selectedGids.has(g.gid)) selectedGids.delete(g.gid);
            else selectedGids.add(g.gid);
          } else {
            selectedGids = new Set([g.gid]);
          }
          renderAll();
        });

        tr.addEventListener('dblclick', e => {
          if (e.target.closest('.ml-exp')) return;
          selectedGids = new Set([g.gid]);
          showSelected('participants');
        });

        tbody.append(tr);

        if (g.hasPieces && isOpen) {
          const subTr = document.createElement('tr');
          subTr.className = 'ml-subrow';
          const td = document.createElement('td');
          td.colSpan = 13;
          const subTbl = document.createElement('table');
          subTbl.className = 'ml-subgrid';
          subTbl.title = 'Двойной щелчок — показать место этого куска';
          subTbl.innerHTML =
            '<thead><tr><th class="ml-n">Место</th><th>Статус</th><th class="ml-n">Объём, м³</th><th class="ml-n">Толщина ≈, мм</th><th>Габарит X×Y×Z, мм</th></tr></thead><tbody></tbody>';
          const subBody = subTbl.querySelector('tbody');
          for (const pc of g.pieces) {
            const ptr = document.createElement('tr');
            if (focusedPlaces && focusedPlaces.has(pc.place)) ptr.className = 'sel';
            ptr.innerHTML =
              '<td class="ml-n">' + pc.place + '</td>' +
              '<td>' + esc(pc.status) + '</td>' +
              '<td class="ml-n">' + fmtVol(pc.volumeM3) + '</td>' +
              '<td class="ml-n">' + fmtThick(pc.thicknessMm) + '</td>' +
              '<td>' + esc(pc.sizeMm) + '</td>';
            ptr.addEventListener('click', () => {
              focusedPlaces = new Set([pc.place]);
              if (showMode === 'clear') showMode = 'participants';
              renderAll();
              toast('Показано место №' + pc.place + ' (' + pc.sizeMm + ' мм)');
            });
            ptr.addEventListener('dblclick', () => {
              focusedPlaces = new Set([pc.place]);
              showMode = 'participants';
              renderAll();
              toast('3D-вид обрезан по месту №' + pc.place);
            });
            subBody.append(ptr);
          }
          td.append(subTbl);
          subTr.append(td);
          tbody.append(subTr);
        }
      }

      tbody.querySelectorAll('.ml-exp').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const gid = btn.dataset.exp;
          if (expandedGids.has(gid)) expandedGids.delete(gid);
          else expandedGids.add(gid);
          renderAll();
        });
      });
    }

    function renderViewport(data, visibleGroups) {
      const svg = $v('ml-vp-svg');
      const NS = 'http://www.w3.org/2000/svg';
      const el = (tag, attrs, text) => {
        const node = document.createElementNS(NS, tag);
        if (attrs) Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
        if (text !== undefined) node.textContent = text;
        return node;
      };
      svg.textContent = '';

      // Какие места сейчас показываем/фокусируем
      const visiblePieces = visibleGroups.flatMap(g => g.pieces);
      const visiblePlaceSet = new Set(visiblePieces.map(p => p.place));
      const activePlaces = focusedPlaces
        ? new Set([...focusedPlaces].filter(pl => visiblePlaceSet.has(pl)))
        : visiblePlaceSet;

      // Какие элементы модели участвуют в показанных местах
      const participantHosts = new Set();
      const shownPieces = data.rows.filter(p => activePlaces.has(p.place));
      for (const p of shownPieces) {
        participantHosts.add(p.hostEl);
        if (p.place === 1) { participantHosts.add('ar-wall-2'); participantHosts.add('kr-wall-2'); }
        if (p.place === 6) { participantHosts.add('ar-pylon-6'); participantHosts.add('kr-pylon-6'); }
        if (p.place === 7) { participantHosts.add('ar-loggia'); participantHosts.add('kr-loggia-7'); }
      }

      // Бейдж режима
      const modeEl = $v('ml-vp-mode');
      const modeNames = {
        diff: 'Режим: Только разницы (объёмы)',
        participants: 'Режим: С элементами (без связи)',
        link: 'Режим: С элементами и связью КЖ',
        clear: 'Подсветка снята'
      };
      modeEl.textContent = modeNames[showMode];
      modeEl.classList.toggle('clear', showMode === 'clear');

      // Баннер режима выбора элемента
      const pickBar = $v('ml-vp-pick');
      if (pickMode) {
        pickBar.hidden = false;
        $v('ml-vp-pick-msg').textContent = pickMode === 'ar'
          ? 'Укажите элемент АР на виде — его строка выделится в списке'
          : 'Укажите элемент связи КЖ на виде — его строка выделится в списке';
      } else {
        pickBar.hidden = true;
      }

      // 1. Оси
      const axesX = [{ v: 1.3, lbl: '1' }, { v: 5.05, lbl: '2' }, { v: 10.5, lbl: '3' }, { v: 14.2, lbl: '4' }];
      const axesY = [{ v: 1.3, lbl: 'А' }, { v: 4.85, lbl: 'Б' }, { v: 7.2, lbl: 'В' }];

      if (vpType === '3d') {
        axesX.forEach(a => {
          const p1 = iso(a.v, 0.3, 0), p2 = iso(a.v, 9.2, 0);
          svg.append(el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: 'axis' }));
          svg.append(el('circle', { cx: p2[0], cy: p2[1] + 9, r: 8, class: 'axis-bub' }));
          svg.append(el('text', { x: p2[0], y: p2[1] + 9, class: 'axis-txt' }, a.lbl));
        });
        axesY.forEach(a => {
          const p1 = iso(0.3, a.v, 0), p2 = iso(15.2, a.v, 0);
          svg.append(el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: 'axis' }));
          svg.append(el('circle', { cx: p1[0] - 9, cy: p1[1], r: 8, class: 'axis-bub' }));
          svg.append(el('text', { x: p1[0] - 9, y: p1[1], class: 'axis-txt' }, a.lbl));
        });
      } else {
        axesX.forEach(a => {
          const x = 84 + a.v * 38;
          svg.append(el('line', { x1: x, y1: 18, x2: x, y2: 268, class: 'axis' }));
          svg.append(el('circle', { cx: x, cy: 13, r: 8, class: 'axis-bub' }));
          svg.append(el('text', { x: x, y: 13, class: 'axis-txt' }, a.lbl));
        });
        axesY.forEach(a => {
          const y = 32 + a.v * 38;
          svg.append(el('line', { x1: 60, y1: y, x2: 670, y2: y, class: 'axis' }));
          svg.append(el('circle', { cx: 48, cy: y, r: 8, class: 'axis-bub' }));
          svg.append(el('text', { x: 48, y: y, class: 'axis-txt' }, a.lbl));
        });
      }

      // 2. Элементы модели (АР и КЖ)
      const selectedKeys = new Set(
        data.allGroups.filter(g => selectedGids.has(g.gid)).map(g => g.key)
      );

      for (const m of MODEL_ELEMENTS) {
        const isPart = participantHosts.has(m.id);
        let cls = m.side === 'ar' ? 'el-ar' : 'el-kr';
        if (m.side === 'ar' && selectedKeys.has(m.key) && showMode !== 'diff') cls += ' sel-ar';
        if (m.side === 'kr' && showMode === 'link') cls += ' link-mode';

        if (showMode === 'diff') {
          cls += ' el-dim';
        } else if (showMode === 'participants') {
          if (!isPart) cls += ' el-dim';
        } else if (showMode === 'link') {
          if (m.side === 'ar' && !isPart) cls += ' el-dim';
        }

        const isPickTarget = (pickMode === 'ar' && m.side === 'ar') || (pickMode === 'kr' && m.side === 'kr');
        if (isPickTarget) cls = cls.replace(' el-dim', '') + ' pickable';

        const gNode = el('g', { class: cls });
        const title = el('title', null, m.label);
        gNode.append(title);

        if (vpType === '3d') {
          const p = isoBoxPaths(m.box);
          gNode.append(el('polygon', { points: p.left, class: cls }));
          gNode.append(el('polygon', { points: p.right, class: cls, opacity: '0.86' }));
          gNode.append(el('polygon', { points: p.top, class: cls }));
        } else {
          const r = planRect(m.box);
          gNode.append(el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 1, class: cls }));
        }

        if (isPickTarget) {
          gNode.addEventListener('click', () => selectByKey(m.key, m.label));
        }
        svg.append(gNode);
      }

      // 3. Секущий бокс при фокусе на конкретных местах в 3D
      if (showMode !== 'clear' && focusedPlaces && shownPieces.length > 0) {
        const pad = 0.55;
        const sb = {
          x1: Math.min(...shownPieces.map(p => p.box.x1)) - pad,
          y1: Math.min(...shownPieces.map(p => p.box.y1)) - pad,
          z1: 0,
          x2: Math.max(...shownPieces.map(p => p.box.x2)) + pad,
          y2: Math.max(...shownPieces.map(p => p.box.y2)) + pad,
          z2: Math.max(...shownPieces.map(p => p.box.z2)) + 0.35
        };
        if (vpType === '3d') {
          const sp = isoBoxPaths(sb);
          svg.append(el('polygon', { points: sp.top, class: 'secbox', 'pointer-events': 'none' }));
        } else {
          const sr = planRect(sb);
          svg.append(el('rect', { x: sr.x, y: sr.y, width: sr.w, height: sr.h, rx: 3, class: 'secbox', 'pointer-events': 'none' }));
        }
      }

      // 4. Объёмы расхождений (подсветка)
      if (showMode !== 'clear') {
        const pinCoords = new Map();
        for (const p of data.rows) {
          const isVisible = visiblePlaceSet.has(p.place);
          if (!isVisible) continue;
          const isFocused = !focusedPlaces || activePlaces.has(p.place);
          const vCls = 'diff-vol ' + (p.failed ? 'diff-fail' : p.side === 'ar' ? 'diff-ar' : 'diff-kr') +
            (focusedPlaces && isFocused ? ' focused' : '') +
            (focusedPlaces && !isFocused ? ' muted' : '');

          const gVol = el('g', { class: vCls });
          gVol.append(el('title', null, 'Место ' + p.place + ': ' + dirLabel(p.side) + ' · ' + p.elementName + ' (' + fmtVol(p.volumeM3) + ' м³)'));

          let pinPt;
          if (vpType === '3d') {
            const bp = isoBoxPaths(p.box);
            gVol.append(el('polygon', { points: bp.left }));
            gVol.append(el('polygon', { points: bp.right }));
            gVol.append(el('polygon', { points: bp.top }));
            pinPt = bp.center;
          } else {
            const br = planRect(p.box);
            gVol.append(el('rect', { x: br.x, y: br.y, width: Math.max(7, br.w), height: Math.max(7, br.h), rx: 1.5 }));
            pinPt = [br.cx, br.cy];
          }

          gVol.addEventListener('click', () => {
            if (pickMode) return;
            const gk = p.side + '|' + p.linkId + ':' + p.elementId;
            selectedGids = new Set([gk]);
            focusedPlaces = new Set([p.place]);
            renderAll();
            toast('Выбрано место №' + p.place + ' — ' + p.elementName);
          });
          svg.append(gVol);

          if (!pinCoords.has(p.place)) {
            pinCoords.set(p.place, { pt: pinPt, kind: p.failed ? 'fail' : p.side, focused: isFocused });
          }
        }

        // 5. Номера мест (флажок «Номера мест»)
        if (showLabels) {
          for (const [placeNum, info] of pinCoords.entries()) {
            const pin = el('g', {
              class: 'pin ' + info.kind + (focusedPlaces && info.focused ? ' focused' : ''),
              opacity: focusedPlaces && !info.focused ? '0.3' : '1'
            });
            pin.append(el('circle', { cx: info.pt[0], cy: info.pt[1], r: 9 }));
            pin.append(el('text', { x: info.pt[0], y: info.pt[1] }, String(placeNum)));
            pin.addEventListener('click', () => {
              if (pickMode) return;
              const match = data.allGroups.filter(g => g.placeList.includes(placeNum));
              selectedGids = new Set(match.map(g => g.gid));
              focusedPlaces = new Set([placeNum]);
              renderAll();
              toast('Место №' + placeNum + ': выделено строк — ' + match.length);
            });
            svg.append(pin);
          }
        }
      }

      // Инфо-строка под видом
      const infoEl = $v('ml-vp-info');
      if (showMode === 'clear') {
        infoEl.textContent = 'Подсветка расхождений снята. Нажмите «Показать разницу» или выберите режим отображения.';
      } else if (focusedPlaces && activePlaces.size > 0) {
        infoEl.textContent = 'Показаны места: ' + [...activePlaces].sort((a, b) => a - b).join(', ') +
          (vpType === '3d' ? ' (3D-вид обрезан секущим боксом).' : ' (в границах плана этажа).');
      } else {
        infoEl.textContent = 'Показаны все видимые расхождения (' + activePlaces.size + ' мест). Выберите строки и нажмите кнопку режима или щёлкните дважды.';
      }
    }

    function renderAll() {
      const data = activeData();
      // Убрать из выделения исчезнувшие строки
      const validGids = new Set(data.allGroups.map(g => g.gid));
      selectedGids = new Set([...selectedGids].filter(id => validGids.has(id)));
      const visibleGroups = sortGroups(data.allGroups.filter(matchesSearch));
      renderSummary(data);
      renderTable(visibleGroups);
      renderViewport(data, visibleGroups);
    }

    function showSelected(mode) {
      const data = activeData();
      const visibleGroups = data.allGroups.filter(matchesSearch);
      const picked = visibleGroups.filter(g => selectedGids.has(g.gid));
      const target = picked.length > 0 ? picked : visibleGroups;
      if (!target.length) {
        toast('Нет строк для показа на виде.');
        return;
      }
      showMode = mode;
      focusedPlaces = picked.length > 0 ? new Set(target.flatMap(g => g.placeList)) : null;
      pickMode = null;
      renderAll();
      const label = picked.length > 0
        ? 'Места ' + [...focusedPlaces].sort((a, b) => a - b).join(', ')
        : 'все отфильтрованные места (' + new Set(target.flatMap(g => g.placeList)).size + ')';
      toast('Показано на виде: ' + label);
    }

    function selectByKey(key, label) {
      pickMode = null;
      const data = activeData();
      const found = data.allGroups.filter(g => g.key === key);
      if (!found.length) {
        renderAll();
        toast('У элемента «' + label + '» нет расхождений в списке (или они скрыты фильтром шума).');
        return;
      }
      // Сбрасываем поиск и направление, чтобы строка гарантированно была видна (как в C# SelectByKey)
      searchQuery = '';
      $('ml-search').value = '';
      dirFilter = 0;
      dirSel.set(0);
      selectedGids = new Set(found.map(g => g.gid));
      focusedPlaces = new Set(found.flatMap(g => g.placeList));
      if (showMode === 'clear') showMode = 'participants';
      renderAll();
      const rowEl = $('ml-tbody').querySelector('tr.sel');
      if (rowEl) rowEl.scrollIntoView({ block: 'nearest' });
      toast('Найден элемент в списке: ' + found[0].elementName);
    }

    function applyThresholds() {
      const tVal = parseFloat($('ml-thin').value.trim().replace(',', '.'));
      const sVal = parseFloat($('ml-small').value.trim().replace(',', '.'));
      if (!Number.isFinite(tVal) || tVal < 0 || !Number.isFinite(sVal) || sVal < 0) {
        toast('Пороги должны быть неотрицательными числами.');
        return;
      }
      hideThinMm = tVal;
      hideSmallCm3 = sVal;
      renderAll();
      toast('Фильтр шума применён: тоньше ' + hideThinMm + ' мм, меньше ' + hideSmallCm3 + ' см³');
    }

    function excludeSelected(wholeTypes) {
      const data = activeData();
      const picked = data.allGroups.filter(g => selectedGids.has(g.gid));
      if (!picked.length) {
        toast('Выберите в списке строки, которые нужно исключить.');
        return;
      }
      if (wholeTypes) {
        picked.forEach(g => excludedTypes.add(g.typeName));
        toast('Исключены типы: ' + [...new Set(picked.map(g => g.typeName))].join(', '));
      } else {
        picked.forEach(g => excludedKeys.add(g.key));
        toast('Исключено элементов: ' + picked.length);
      }
      selectedGids.clear();
      focusedPlaces = null;
      renderAll();
    }

    function exportCsv() {
      const data = activeData();
      const visibleGroups = sortGroups(data.allGroups.filter(matchesSearch));
      const rows = visibleGroups.flatMap(g => g.pieces);
      if (!rows.length) {
        toast('Нет строк для экспорта.');
        return;
      }
      const csvCell = v => {
        const s = String(v ?? '');
        return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const lines = ['Место;Расхождение;Статус;Уровень;Модель;Категория;ID;Тип;Объём, м3;Толщина, мм;Габарит, мм'];
      for (const r of rows) {
        lines.push([
          r.place, dirLabel(r.side), r.status, r.level, r.model, r.category,
          r.elementId, r.elementName, fmtVol(r.volumeM3), fmtThick(r.thicknessMm), r.sizeMm
        ].map(csvCell).join(';'));
      }
      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Сверка АР-КЖ.csv';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Отчёт «Сверка АР-КЖ.csv» сохранён (' + rows.length + ' кусков).');
    }

    // Привязка обработчиков
    $('ml-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      renderAll();
    });
    $('ml-apply').addEventListener('click', applyThresholds);
    [$('ml-thin'), $('ml-small')].forEach(inp => {
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') applyThresholds(); });
    });

    win.querySelectorAll('#ml-grid thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (sortKey === k) sortAsc = !sortAsc;
        else { sortKey = k; sortAsc = k !== 'volumeM3' && k !== 'pieceCount' && k !== 'thicknessMm'; }
        renderAll();
      });
    });

    $('ml-show-diff').addEventListener('click', () => showSelected('diff'));
    $('ml-show-el').addEventListener('click', () => showSelected('participants'));
    $('ml-show-link').addEventListener('click', () => showSelected('link'));
    $('ml-clear').addEventListener('click', () => {
      showMode = 'clear';
      focusedPlaces = null;
      pickMode = null;
      renderAll();
      toast('Подсветка расхождений убрана с вида.');
    });
    $('ml-labels').addEventListener('change', e => {
      showLabels = e.target.checked;
      renderAll();
    });

    $('ml-find-ar').addEventListener('click', () => {
      pickMode = 'ar';
      if (showMode === 'diff') showMode = 'participants';
      renderAll();
      $v('ml-vp-pick').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    $('ml-find-kr').addEventListener('click', () => {
      pickMode = 'kr';
      showMode = 'link';
      renderAll();
      $v('ml-vp-pick').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    $v('ml-vp-pick-cancel').addEventListener('click', () => {
      pickMode = null;
      renderAll();
    });

    $('ml-ex-el').addEventListener('click', () => excludeSelected(false));
    $('ml-ex-type').addEventListener('click', () => excludeSelected(true));
    $('ml-restore').addEventListener('click', () => {
      excludedKeys.clear();
      excludedTypes.clear();
      focusedPlaces = null;
      renderAll();
      toast('Исключённые элементы и типы возвращены в сверку.');
    });
    $('ml-refresh').addEventListener('click', () => {
      focusedPlaces = null;
      pickMode = null;
      if (showMode === 'clear') showMode = 'participants';
      renderAll();
      toast('Сверка обновлена (142 эл. АР, 138 эл. КЖ).');
    });
    $('ml-export').addEventListener('click', exportCsv);
    $('ml-close').addEventListener('click', () => {
      showMode = 'clear';
      focusedPlaces = null;
      pickMode = null;
      renderAll();
      toast('В Revit при закрытии окна временная подсветка автоматически снимается.');
    });

    vpHost.querySelectorAll('.ml-vp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        vpType = tab.dataset.vp;
        vpHost.querySelectorAll('.ml-vp-tab').forEach(t => {
          const on = t.dataset.vp === vpType;
          t.classList.toggle('on', on);
          t.setAttribute('aria-selected', String(on));
        });
        renderAll();
      });
    });

    renderAll();
  });
})();
