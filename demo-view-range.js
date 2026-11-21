(function () {
  'use strict';

  const kit = window.RabinDemoKit;
  const planControls = [
    ['Верх', -5000, 5000, 2300, '#1464bb', 'Верх'],
    ['Секущая плоскость', -5000, 5000, 1200, '#b12c55', 'Секущая'],
    ['Низ', -5000, 5000, 0, '#08785c', 'Низ'],
    ['Глубина проецирования', -5000, 5000, -300, '#7550a5', 'Глубина']
  ];
  const sectionControls = [
    ['Смещение разреза', -2500, 2500, 0],
    ['Дальность видимости', 300, 6000, 3000]
  ];
  const elevation = mm => 150 - mm * 0.026;
  const levels = [
    ['Дверь', 0, 2100, 49, 44, '#ceac88'],
    ['Окно', 900, 2100, 112, 59, '#9fcfe5'],
    ['Перегородка', 0, 2600, 195, 18, '#aeb8c5'],
    ['Воздуховод', 2550, 2850, 92, 89, '#99afbc'],
    ['Труба', -450, -200, 135, 82, '#c4a0cd']
  ];
  // Границы объектов в координатах плана относительно центра комнаты.
  const objects = [
    ['Стол', -76, 20, 54, 30, '#ceac88'],
    ['Колонна', 49, -35, 20, 20, '#aeb8c5'],
    ['Окно', -55, -96, 70, 9, '#9fcfe5'],
    ['Дверь', 38, 88, 45, 8, '#ceac88'],
    ['Шахта', -83, -75, 33, 32, '#c4a0cd']
  ];
  const badge = (name, status, tone) =>
    `<li><span>${name}</span><span class="vr-badge vr-${tone}">${status}</span></li>`;
  const rect = (x, y, w, h, fill, extra = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;

  function planMarkup() {
    return `<svg viewBox="0 0 360 300" role="img" aria-label="Вертикальный разрез этажа 03">
      <g fill="#edf1f5" stroke="#9aa8b8">
        <path d="M34 72H252v6H40v72h212v6H34z"/>
        <path d="M246 78h6v72h-6z"/>
      </g>
      <text x="35" y="62">Потолок +3000</text><text x="35" y="173">Пол 0</text>
      ${levels.map(([name, low, high, x, width, fill], i) => {
        const y = elevation(high);
        const height = elevation(low) - y;
        return `<g data-vr-object="${i}"><title>${name} · ${low}…${high} мм</title>
          ${rect(x, y, width, height, fill, 'stroke="#63768b"')}
          ${i === 0 ? '<circle cx="84" cy="130" r="2" fill="#63768b"/>' : ''}
          ${i === 1 ? '<path d="M142 95.4v31.2M112 111h59" stroke="#63768b"/>' : ''}
        </g>`;
      }).join('')}
      <rect class="vr-zone" x="26" width="232" fill="#1677ff" opacity=".12"/>
      <rect class="vr-zone" x="26" width="232" fill="#7550a5" opacity=".17"/>
      ${planControls.map(([, , , , color]) => `
        <g class="vr-plane" fill="${color}">
          <path d="M26 0H258" stroke="${color}" stroke-width="1.5"/>
        </g>
        <g class="vr-mark" fill="${color}">
          <text x="264" y="4"></text>
        </g>`).join('')}
    </svg>`;
  }

  function sectionMarkup(clipId) {
    return `<svg viewBox="0 0 360 300" role="img" aria-label="План комнаты с линией разреза">
      <defs><clipPath id="${clipId}"><rect x="-96" y="-96" width="192" height="192"/></clipPath></defs>
      <g transform="translate(180 150)">
        <rect x="-96" y="-96" width="192" height="192" fill="#f8fafc" stroke="#a1adba" stroke-width="5"/>
        <path d="M38 96v-43a43 43 0 0 1 43 43" fill="none" stroke="#a1adba"/>
        ${objects.map(([name, x, y, w, h, fill], i) =>
          `<g data-vr-object="${i}"><title>${name}</title>${rect(x, y, w, h, fill, 'stroke="#63768b"')}</g>`).join('')}
        <g clip-path="url(#${clipId})"><g class="vr-rotation">
          <g class="vr-shift"><rect class="vr-far" x="-140" y="0" width="280" fill="#1677ff" opacity=".17"/></g>
        </g></g>
        <g class="vr-rotation"><g class="vr-shift" stroke="#1464bb" stroke-width="2">
          <path d="M-106 0H106" stroke-dasharray="8 4"/>
          <path d="M-101 0v18m-5-5 5 5 5-5M101 0v18m-5-5 5 5 5-5" fill="none"/>
        </g></g>
      </g>
    </svg>`;
  }

  let previewCount = 0;
  window.RabinDemoKit.mount('view-range', host => {
    const clipId = 'vr-room-' + ++previewCount;
    const controls = [planControls, sectionControls];
    const values = controls.map(group => group.map(control => control[3]));
    let mode = 0;
    let angle = 0;
    host.innerHTML = '<div class="vr-wrap"><div class="vr-window"></div><div class="vr-preview"></div></div>';
    const win = kit.frame(host.querySelector('.vr-window'), 'RabinBIM — границы вида', 460, `
      <div class="vr-tabs" role="group" aria-label="Активный вид Revit">
        <button type="button" class="rw-btn" data-vr-mode="0">План этажа 03</button>
        <button type="button" class="rw-btn" data-vr-mode="1">Разрез 1–1</button>
      </div>
      <p class="vr-sub">Изменения применяются сразу · значения в миллиметрах</p>
      <div class="vr-controls"></div>
      <div class="vr-footer"><button type="button" class="rw-btn" data-vr-reset>По умолчанию</button></div>`);
    const tabs = [...win.querySelectorAll('[data-vr-mode]')];
    const panel = win.querySelector('.vr-controls');
    const preview = host.querySelector('.vr-preview');
    let sliders, editors, summary, svg, heading;

    function drawPlan() {
      const [top, cut, bottom, depth] = values[0];
      const positions = values[0].map(elevation);
      svg.querySelectorAll('.vr-zone').forEach((zone, i) => {
        const [start, end] = i === 0 ? [0, 2] : [2, 3];
        zone.style.y = positions[start] + 'px';
        zone.style.height = positions[end] - positions[start] + 'px';
      });
      svg.querySelectorAll('.vr-plane').forEach((plane, i) => {
        plane.style.transform = `translateY(${positions[i]}px)`;
      });
      // Разводим подписи, когда несколько плоскостей сходятся на одной отметке.
      let labelY = 0;
      svg.querySelectorAll('.vr-mark').forEach((mark, i) => {
        labelY = Math.max(labelY + 15, Math.min(positions[i], 287 - (3 - i) * 15));
        mark.style.transform = `translateY(${labelY}px)`;
        mark.firstElementChild.textContent = `${planControls[i][5]} ${values[0][i]} мм`;
      });
      summary.innerHTML = levels.map(([name, low, high], i) => {
        let status = ['Скрыт', 'hidden'];
        if (low <= cut && high >= cut) status = ['В разрезе', 'cut'];
        else if (low <= top && high >= bottom) status = ['В проекции', 'projection'];
        else if (high >= depth && low < bottom) status = ['В глубине', 'depth'];
        svg.querySelector(`[data-vr-object="${i}"]`).style.opacity = status[1] === 'hidden' ? '.3' : '1';
        return badge(name, ...status);
      }).join('');
    }

    function drawSection() {
      const [shift, far] = values[1];
      const offset = shift * 0.034;
      const reach = far * 0.034;
      svg.querySelectorAll('.vr-rotation').forEach(group => {
        group.style.transform = `rotate(${angle}deg)`;
      });
      svg.querySelectorAll('.vr-shift').forEach(group => {
        group.style.transform = `translateY(${offset}px)`;
      });
      svg.querySelector('.vr-far').style.height = reach + 'px';
      heading.textContent = `Разрез 1–1 · ${(angle % 360 + 360) % 360}°`;
      const quadrant = (angle / 90 % 4 + 4) % 4;
      summary.innerHTML = objects.map(([name, x, y, w, h], i) => {
        const [low, high] = [[y, y + h], [-x - w, -x], [-y - h, -y], [x, x + w]][quadrant];
        const cut = low <= offset && high >= offset;
        const visible = high >= offset && low <= offset + reach;
        svg.querySelector(`[data-vr-object="${i}"]`).style.opacity = visible ? '1' : '.3';
        return cut ? badge(name, 'В разрезе', 'cut')
          : visible ? badge(name, 'В проекции', 'projection') : badge(name, 'Скрыт', 'hidden');
      }).join('');
    }

    function refresh(activeEditor) {
      controls[mode].forEach(([, min, max], i) => {
        const value = values[mode][i];
        sliders[i].value = value;
        sliders[i].style.setProperty('--vr-fill', (value - min) / (max - min) * 100 + '%');
        if (editors[i] !== activeEditor) {
          editors[i].value = value;
          editors[i].removeAttribute('aria-invalid');
        }
      });
      if (mode === 0) drawPlan();
      else drawSection();
    }

    function limit(i, value) {
      const [, min, max] = controls[mode][i];
      const current = values[mode];
      const lower = mode === 0 ? current[i + 1] ?? min : min;
      const upper = mode === 0 ? current[i - 1] ?? max : max;
      return Math.min(upper, Math.max(lower, value));
    }

    function render() {
      tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', i === mode));
      panel.innerHTML = controls[mode].map(([label, min, max]) => `
        <div class="vr-row">
          <label class="vr-label"><span>${label}</span><span class="vr-value">
            <input class="vr-editor" type="text" inputmode="decimal" aria-label="${label}, мм"> мм</span>
          </label>
          <input class="vr-slider" type="range" min="${min}" max="${max}" step="1" aria-label="${label}, мм">
        </div>`).join('') + (mode ? `
        <div class="vr-actions">
          <button class="rw-btn" type="button" data-vr-angle="180">Развернуть разрез</button>
          <button class="rw-btn" type="button" data-vr-angle="90">Повернуть на 90°</button>
        </div>` : '');
      preview.innerHTML = `<h3>${mode ? 'Разрез 1–1' : 'Этаж 03 · вертикальный разрез'}</h3>
        ${mode ? sectionMarkup(clipId) : planMarkup()}
        ${mode ? '<p class="vr-legend">Синяя зона · дальность видимости</p>' : ''}
        <h4>${mode ? 'Что видно на разрезе' : 'Что видно на плане'}</h4>
        <ul class="vr-summary" aria-live="polite"></ul>`;
      svg = preview.querySelector('svg');
      summary = preview.querySelector('.vr-summary');
      heading = preview.querySelector('h3');
      sliders = [...panel.querySelectorAll('.vr-slider')];
      editors = [...panel.querySelectorAll('.vr-editor')];
      sliders.forEach((slider, i) => slider.addEventListener('input', () => {
        values[mode][i] = limit(i, Number(slider.value));
        refresh();
      }));
      editors.forEach((editor, i) => {
        editor.addEventListener('input', () => {
          const raw = editor.value.trim().replace(',', '.');
          const value = Number(raw);
          const valid = raw !== '' && Number.isFinite(value) && limit(i, value) === value;
          editor.setAttribute('aria-invalid', String(!valid));
          if (valid) {
            values[mode][i] = Math.round(value);
            refresh(editor);
          }
        });
        editor.addEventListener('blur', () => refresh());
        editor.addEventListener('keydown', event => {
          if (event.key === 'Enter') editor.blur();
        });
      });
      panel.querySelectorAll('[data-vr-angle]').forEach(button => button.addEventListener('click', () => {
        angle += Number(button.dataset.vrAngle);
        drawSection();
      }));
      refresh();
    }

    tabs.forEach((tab, i) => tab.addEventListener('click', () => {
      if (mode === i) return;
      mode = i;
      render();
    }));
    win.querySelector('[data-vr-reset]').addEventListener('click', () => {
      values[mode] = controls[mode].map(control => control[3]);
      if (mode) angle = 0;
      refresh();
    });
    render();
  });
})();
