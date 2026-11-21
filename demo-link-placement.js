/* Демо окна LinkPlacementWindow.xaml. Данные связей вымышлены. */
(function () {
  'use strict';

  const kit = window.RabinDemoKit;
  const format = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const scale = 0.06; // Единицы SVG на миллиметр, одинаково для обеих моделей.
  const origin = { x: 310, y: 156 };
  const axes = [
    ...['1', '2', '3', '4'].map((name, i) => ({ name, vertical: true, position: 94 + 144 * i })),
    ...['А', 'Б', 'В'].map((name, i) => ({ name, vertical: false, position: 60 + 96 * i }))
  ];
  const links = [
    { code: 'КЖ', x: 0, y: 0, angle: 0, pinned: true, color: '#18804c', status: 'Ровно', note: 'Оси совпадают' },
    { code: 'ОВ', x: 120, y: 45, angle: 0, color: '#1760bb', status: 'Смещена: координаты и оси', note: 'Сдвиг • X 120 мм / Y 45 мм' },
    { code: 'ВК', x: 0, y: 0, angle: 1.8, color: '#a54b09', status: 'Смещена: координаты и оси', note: 'Поворот • 1,8°' },
    { code: 'ЭОМ', unloaded: true, pinned: true, status: 'Не загружена' }
  ].map(link => ({ ...link, name: 'ЖК_Север_' + link.code + '_К1_R21.rvt' }));

  function axisOffset(axis, link) {
    const center = axis.vertical ? origin.x : origin.y;
    const movement = axis.vertical ? link.x : -link.y;
    const rotation = (axis.position - center) * (Math.cos(link.angle * Math.PI / 180) - 1);
    return Math.abs(movement + rotation / scale);
  }

  function table(label, columns, kind) {
    return '<div class="lp-scroll" role="region" tabindex="0" aria-label="' + label + '">' +
      '<table class="lp-table lp-' + kind + '" aria-label="' + label + '"><thead><tr>' +
      columns.map(column => '<th scope="col">' + column + '</th>').join('') +
      '</tr></thead><tbody></tbody></table></div>';
  }

  function row(cells, action, problem) {
    return '<tr' + (problem ? ' class="lp-problem"' : '') + '>' + cells.map((cell, index) => {
      const content = kit.esc(cell);
      return '<td>' + (index === 0 ? '<button type="button" class="lp-pick" ' + action +
        ' aria-pressed="false">' + content + '</button>' : content) + '</td>';
    }).join('') + '</tr>';
  }

  function axisLine(axis, cssClass) {
    const p = axis.position;
    const points = axis.vertical ? [p, 36, p, 277] : [54, p, 565, p];
    return '<line class="' + cssClass + '" x1="' + points[0] + '" y1="' + points[1] +
      '" x2="' + points[2] + '" y2="' + points[3] + '"/>';
  }

  kit.mount('link-placement', host => {
    host.innerHTML = '<div class="lp-wrap"><div class="lp-window"></div>' +
      '<button type="button" class="rw-btn lp-reopen" hidden>Открыть окно проверки</button>' +
      '<section class="lp-plan" tabindex="-1" aria-label="План осей модели и выбранной связи">' +
      '<h5>План осей модели и выбранной связи</h5><p class="lp-legend">' +
      '<span class="lp-model-key">Текущая модель АР</span><span class="lp-link-key"></span></p>' +
      '<svg viewBox="0 0 620 326" role="img"></svg><p class="lp-caption" aria-live="polite"></p></section>' +
      '<div class="lp-toast" role="status"></div></div>';

    const windowHost = host.querySelector('.lp-window');
    const win = kit.frame(windowHost, 'RabinBIM — положение связей', 980,
      '<div class="rw-frame"><h4>Положение Revit-связей</h4>' +
      '<p class="rw-sub">Связь стоит ровно, если её положение в точности совпадает с её общими координатами, а одноимённые оси связи и модели — друг с другом.</p>' +
      '<div class="rw-card dyn"><p class="lp-summary">Требуют внимания: 3 из 4.</p>' +
      table('Связи', ['Связь', 'Итог', 'Общие координаты', 'Оси', 'Закреплена'], 'links') +
      '<h5>Оси выбранной связи</h5>' +
      table('Оси выбранной связи', ['Ось', 'Статус', 'Смещение, мм', 'Поворот, °'], 'axes') +
      '<div class="lp-actions"><button type="button" class="rw-btn lp-refresh">Проверить заново</button>' +
      '<button type="button" class="rw-btn primary lp-show" title="Выделить выбранную связь и показать её на активном виде">Показать связь</button>' +
      '<button type="button" class="rw-btn lp-close">Закрыть</button></div></div></div>');

    const upper = win.querySelector('.lp-links tbody');
    const lower = win.querySelector('.lp-axes tbody');
    const plan = host.querySelector('.lp-plan');
    const svg = plan.querySelector('svg');
    const show = win.querySelector('.lp-show');
    const reopen = host.querySelector('.lp-reopen');
    const toast = host.querySelector('.lp-toast');
    let selected = 0;
    let axisIndex = -1;
    let focused = false;
    let toastTimer;

    upper.innerHTML = links.map((link, i) => {
      const aligned = link.status === 'Ровно';
      const coordinates = aligned ? 'Совпадают' : 'ΔX ' + format.format(link.x) + ', ΔY ' +
        format.format(link.y) + ', ΔZ 0,00 мм, поворот ' + format.format(link.angle) + '°';
      const grids = aligned ? 'Совпадают 7 из 7' : 'Расходятся 7 из 7, до ' +
        format.format(Math.max(...axes.map(axis => axisOffset(axis, link)))) + ' мм';
      return row([link.name, link.status, link.unloaded ? '—' : coordinates,
        link.unloaded ? '—' : grids, link.pinned ? 'Да' : 'Нет'], 'data-lp-link="' + i + '"', !aligned);
    }).join('');

    function renderPlan() {
      const link = links[selected];
      const visible = !windowHost.hidden && !link.unloaded;
      const note = windowHost.hidden ? 'Окно проверки закрыто' : link.unloaded ? 'Связь не загружена' : link.note;
      const active = axes[axisIndex];
      const caption = visible && active ? note + ' · ось ' + active.name + ' · ' +
        format.format(axisOffset(active, link)) + ' мм' : note;
      const key = plan.querySelector('.lp-link-key');
      key.hidden = !visible;
      key.textContent = 'Связь ' + link.code;
      plan.style.setProperty('--lp-link-color', link.color || 'transparent');
      plan.querySelector('.lp-caption').textContent = caption;
      plan.classList.toggle('lp-focused', focused);
      svg.setAttribute('aria-label', 'Модель АР. ' + caption);

      const overlay = visible ? '<g transform="translate(' + link.x * scale + ' ' + -link.y * scale +
        ') rotate(' + -link.angle + ' ' + origin.x + ' ' + origin.y + ')">' +
        '<rect class="lp-outline" x="94" y="60" width="432" height="192"/>' +
        axes.map(axis => axisLine(axis, 'lp-link-axis')).join('') +
        (active ? axisLine(active, 'lp-link-axis lp-active-axis') : '') + '</g>' : '';
      const labels = axes.map(axis => {
        const x = axis.vertical ? axis.position : 34;
        const y = axis.vertical ? 22 : axis.position;
        return '<g class="lp-axis-label"><circle cx="' + x + '" cy="' + y + '" r="12"/>' +
          '<text x="' + x + '" y="' + y + '">' + axis.name + '</text></g>';
      }).join('');
      const angle = -link.angle * Math.PI / 180;
      const cornerX = origin.x + 216 * Math.cos(angle) - 96 * Math.sin(angle) + link.x * scale;
      const cornerY = origin.y + 216 * Math.sin(angle) + 96 * Math.cos(angle) - link.y * scale;
      const callout = visible && (link.x || link.angle) ?
        '<path class="lp-leader" d="M' + cornerX + ' ' + cornerY + ' L551 290 H580"/><text class="lp-callout" x="568" y="311">' +
        kit.esc(link.note) + '</text>' : '';
      svg.innerHTML = overlay + axes.map(axis => axisLine(axis, 'lp-model-axis')).join('') +
        (visible && active ? axisLine(active, 'lp-model-axis lp-active-axis') : '') +
        labels + callout;
    }

    function markSelection(body, index) {
      Array.from(body.rows).forEach((item, i) => {
        item.classList.toggle('lp-selected', index === i);
        item.querySelector('button').setAttribute('aria-pressed', String(index === i));
      });
    }

    function renderTables() {
      const link = links[selected];
      const aligned = link.status === 'Ровно';
      markSelection(upper, selected);
      lower.innerHTML = link.unloaded ? '<tr><td colspan="4">Связь не загружена</td></tr>' :
        axes.map((axis, i) => row([axis.name, aligned ? 'Совпадает' : 'Расходится',
          format.format(axisOffset(axis, link)), format.format(link.angle)], 'data-lp-axis="' + i + '"', !aligned)).join('');
      show.disabled = Boolean(link.unloaded);
    }

    upper.addEventListener('click', event => {
      const item = event.target.closest('tr');
      if (!item) return;
      selected = Number(item.querySelector('button').dataset.lpLink);
      axisIndex = -1;
      focused = false;
      renderTables();
      renderPlan();
    });

    lower.addEventListener('click', event => {
      const button = event.target.closest('tr')?.querySelector('button');
      if (!button) return;
      axisIndex = Number(button.dataset.lpAxis);
      markSelection(lower, axisIndex);
      renderPlan();
    });

    win.querySelector('.lp-refresh').addEventListener('click', () => {
      axisIndex = -1;
      focused = false;
      renderTables();
      renderPlan();
      toast.textContent = 'Проверка завершена. Требуют внимания: 3 из 4.';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.textContent = ''; }, 3500);
    });

    show.addEventListener('click', () => {
      focused = true;
      renderPlan();
      plan.focus({ preventScroll: true });
      plan.scrollIntoView({ behavior: kit.reduce ? 'auto' : 'smooth', block: 'nearest' });
    });

    win.querySelector('.lp-close').addEventListener('click', () => {
      windowHost.hidden = true;
      reopen.hidden = false;
      focused = false;
      axisIndex = -1;
      renderPlan();
      reopen.focus();
    });

    reopen.addEventListener('click', () => {
      windowHost.hidden = false;
      reopen.hidden = true;
      renderTables();
      renderPlan();
      upper.rows[selected].querySelector('button').focus();
    });

    renderTables();
    renderPlan();
  });
})();
