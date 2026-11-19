(function () {
  'use strict';

  const { frame, esc, mount } = window.RabinDemoKit;
  const elements = [
    [101, 'Стены', 'Бетон 200', 'Уровень 1', 'С-01', 200, true],
    [102, 'Стены', 'Кирпич 120', 'Уровень 1', 'С-02', 120, true, 'Группа'],
    [103, 'Стены', 'Бетон 300', 'Уровень 1', '', 300, true],
    [104, 'Стены', 'Бетон 200', 'Уровень 2', 'С-04', 200, false],
    [201, 'Двери', 'Однопольная', 'Уровень 1', 'Д-01', 900, true],
    [202, 'Двери', 'Двупольная', 'Уровень 2', 'Д-02', 1500, false],
    [301, 'Окна', 'Двустворчатое', 'Уровень 1', 'О-01', 1400, true],
    [302, 'Окна', 'Одностворчатое', 'Уровень 1', '', 750, true, 'Сборка'],
  ];
  const parameters = ['Тип', 'Уровень', 'Марка', 'Ширина, мм'];
  const operators = [
    ['equals', 'Равно'], ['differs', 'Не равно'],
    ['contains', 'Содержит'], ['excludes', 'Не содержит'],
    ['gt', 'Больше'], ['gte', 'Больше или равно'],
    ['lt', 'Меньше'], ['lte', 'Меньше или равно'],
    ['filled', 'Заполнено'], ['empty', 'Не заполнено'],
  ];
  const option = (value, label = value) => '<option value="' + esc(value) + '">' + esc(label) + '</option>';
  const normalize = value => String(value).trim().toLocaleLowerCase('ru');
  const numeric = value => normalize(value) === '' ? NaN : Number(String(value).replace(',', '.'));
  function equals(actual, wanted) {
    const left = numeric(actual);
    const right = numeric(wanted);
    return Number.isFinite(left) && Number.isFinite(right) ? Math.abs(left - right) < 1e-9 : actual === wanted;
  }

  const matches = {
    equals,
    differs: (actual, wanted) => !equals(actual, wanted),
    contains: (actual, wanted) => actual.includes(wanted),
    excludes: (actual, wanted) => !actual.includes(wanted),
    gt: (actual, wanted) => numeric(actual) > numeric(wanted),
    gte: (actual, wanted) => numeric(actual) >= numeric(wanted),
    lt: (actual, wanted) => numeric(actual) < numeric(wanted),
    lte: (actual, wanted) => numeric(actual) <= numeric(wanted),
    filled: actual => actual !== '',
    empty: actual => actual === '',
  };

  mount('filter', host => {
    const win = frame(host, 'RabinBIM — Расширенный фильтр', 1000, `
      <div class="filter-layout">
        <aside class="filter-scope">
          <select name="scope" form="filter-form" size="3" aria-label="Область поиска">
            <option value="selection" selected>Выбранные элементы</option>
            <option value="view">Активный вид</option>
            <option value="document">Весь документ</option>
          </select>
          <h3>Сохранённые фильтры</h3>
          <select class="filter-presets" size="5" aria-label="Сохранённые фильтры"></select>
          <div class="filter-actions">
            <button type="button" class="rw-btn h28" data-preset="save" aria-label="Сохранить текущий фильтр" title="Сохранить текущий фильтр">＋</button>
            <button type="button" class="rw-btn h28" data-preset="run" aria-label="Выполнить сохранённый фильтр" title="Выполнить сохранённый фильтр">▶</button>
            <button type="button" class="rw-btn h28" data-preset="delete" aria-label="Удалить сохранённый фильтр" title="Удалить сохранённый фильтр">×</button>
          </div>
        </aside>
        <form class="filter-form" id="filter-form">
          <input name="categorySearch" type="search" placeholder="Поиск категории" aria-label="Поиск категории">
          <input name="parameterSearch" type="search" placeholder="Фильтр параметров" aria-label="Фильтр параметров">
          <select name="operator" aria-label="Условие">${operators.map(([key, label]) => option(key, label)).join('')}</select>
          <input name="value" list="filter-values" autocomplete="off" placeholder="Значение" aria-label="Значение"><datalist id="filter-values"></datalist>
          <div class="filter-tree" aria-label="Категории, параметры и значения"></div>
          <div class="filter-actions filter-search-actions">
            <button class="rw-btn h28 primary" type="submit">Найти и выделить</button>
            <button class="rw-btn h28" type="button" data-search="refresh">Обновить список</button>
            <button class="rw-btn h28" type="button" data-search="ungroup">Убрать группы и сборки</button>
          </div>
        </form>
        <section class="filter-sets">
          <h3>Выделения текущего сеанса</h3>
          <select class="filter-set-list" multiple size="10" aria-label="Выделения текущего сеанса" title="Перетащите сюда категорию, параметр или значение из дерева"></select>
          <div class="filter-actions">
            <button type="button" class="rw-btn h28" data-action="save" aria-label="Сохранить текущее выделение" title="Сохранить текущее выделение">＋</button>
            <button type="button" class="rw-btn h28" data-action="rename" aria-label="Переименовать выбранный набор" title="Переименовать выбранный набор">✎</button>
            <button type="button" class="rw-btn h28" data-action="select" aria-label="Выделить сохранённые наборы" title="Выделить сохранённые наборы">✓</button>
            <button type="button" class="rw-btn h28" data-action="combine" aria-label="Объединить выбранные наборы" title="Объединить выбранные наборы">∪</button>
            <button type="button" class="rw-btn h28" data-action="subtract" aria-label="Вычесть остальные наборы из первого" title="Вычесть остальные наборы из первого">−</button>
            <button type="button" class="rw-btn h28" data-action="delete" aria-label="Удалить выбранные наборы" title="Удалить выбранные наборы">×</button>
            <button type="button" class="rw-btn h28" data-action="revit" aria-label="Сохранить набор выбора в Revit" title="Сохранить набор выбора в Revit">R</button>
            <button type="button" class="rw-btn h28" data-action="export" aria-label="Экспортировать наборы в TXT" title="Экспортировать наборы в TXT">⇧</button>
            <button type="button" class="rw-btn h28" data-action="import" aria-label="Импортировать наборы из TXT" title="Импортировать наборы из TXT">⇩</button>
          </div>
        </section>
      </div>
      <input class="filter-import" type="file" accept=".txt,text/plain" hidden>
      <p class="filter-status" role="status"></p>
      <details class="filter-preview">
        <summary>Выделение в учебной модели</summary>
        <div class="filter-table"><table>
          <thead><tr><th scope="col">ID</th><th scope="col">Категория</th><th scope="col">Тип</th><th scope="col">Уровень</th><th scope="col">Марка</th><th scope="col">Ширина, мм</th></tr></thead>
          <tbody></tbody>
        </table></div>
      </details>`);
    const form = win.querySelector('form');
    const { scope, categorySearch, parameterSearch, operator, value } = form.elements;
    const tree = win.querySelector('.filter-tree');
    const presetsList = win.querySelector('.filter-presets');
    const presets = new Map();
    const storageKey = 'rabinbim.demo.filter-presets.v1';
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      for (const [id, preset] of stored) presets.set(id, preset);
    } catch {
      presets.clear();
    }
    let presetSequence = Math.max(0, ...[...presets.keys()].map(Number));
    let category = '';
    let parameter = 0;
    const status = win.querySelector('.filter-status');
    const table = win.querySelector('tbody');
    const list = win.querySelector('.filter-set-list');
    let selected = [101, 201, 301];
    let sets = [];
    let sequence = 0;
    let draggedNode = null;
    const documentName = 'Учебная модель RabinBIM';

    function inScope() {
      if (scope.value === 'selection') return elements.filter(row => selected.includes(row[0]));
      return scope.value === 'view' ? elements.filter(row => row[6]) : elements;
    }

    function updateFields() {
      const rows = inScope().filter(row => (category === 'Все' || row[1] === category));
      const values = parameter ? rows.map(row => row[parameter]).filter(item => item !== '') : [];
      win.querySelector('datalist').innerHTML = [...new Set(values)].map(item => option(item)).join('');
      operator.disabled = !parameter;
      value.disabled = !parameter || ['filled', 'empty'].includes(operator.value);
      win.querySelector('[data-preset="save"]').disabled = !category || !parameter;
    }

    function treeAttributes(name, index = 0) {
      return ' draggable="true" data-category="' + esc(name) + '" data-parameter="' + index + '"';
    }

    function renderTree() {
      const rows = inScope();
      const categories = rows.length ? ['Все', ...new Set(rows.map(row => row[1]))] : [];
      if (!categories.includes(category)) {
        category = '';
        parameter = 0;
      }
      tree.innerHTML = categories.filter(name => normalize(name).includes(normalize(categorySearch.value)))
        .map(name => {
          const group = rows.filter(row => name === 'Все' || row[1] === name);
          const branches = parameters.map((label, index) => [label, index + 2])
            .filter(([label]) => normalize(label).includes(normalize(parameterSearch.value)))
            .map(([label, index]) => {
              const active = category === name && parameter === index;
              const values = [...new Set(group.map(row => row[index]))].map(item => {
                const count = group.filter(row => row[index] === item).length;
                return '<button type="button" class="filter-leaf"' + treeAttributes(name, index) +
                  ' data-value="' + esc(item) + '">' +
                  esc(item === '' ? '(Пусто)' : item) + ' (' + count + ')</button>';
              }).join('');
              return '<details' + (active ? ' open' : '') + '><summary' +
                treeAttributes(name, index) + '>' + esc(label) + ' (' + group.length + ')' +
                '</summary>' + values + '</details>';
            }).join('');
          return '<details' + (category === name ? ' open' : '') + '><summary' + treeAttributes(name) +
            '>' + esc(name) + ' (' + group.length + ')' + '</summary>' + branches + '</details>';
        }).join('') || '<p>Нет категорий в области поиска.</p>';
      markTreeSelection();
      updateFields();
    }

    function markTreeSelection(activeLeaf) {
      tree.querySelector('.filter-current')?.classList.remove('filter-current');
      const active = activeLeaf || [...tree.querySelectorAll('summary')].find(node =>
        node.dataset.category === category && Number(node.dataset.parameter) === parameter);
      active?.classList.add('filter-current');
    }

    function updateActions() {
      const count = list.selectedOptions.length;
      win.querySelector('[data-action="rename"]').disabled = count !== 1;
      win.querySelector('[data-action="revit"]').disabled = true;
      win.querySelector('[data-action="revit"]').title = 'Доступно в установленном Revit';
      win.querySelector('[data-action="save"]').disabled = !selected.length;
      for (const action of ['select', 'delete', 'combine', 'subtract']) {
        win.querySelector('[data-action="' + action + '"]').disabled =
          count < (action === 'combine' || action === 'subtract' ? 2 : 1);
      }
    }

    function render(message) {
      table.innerHTML = elements.map(row => {
        const active = selected.includes(row[0]);
        return '<tr class="' + (active ? 'filter-selected' : '') + '"><td>' +
          (active ? '<span aria-label="Выделен">✓</span> ' : '') + row[0] + '</td>' +
          row.slice(1, 6).map(cell => '<td>' + esc(cell === '' ? '—' : cell) + '</td>').join('') + '</tr>';
      }).join('');
      status.textContent = message + ' Выделено элементов: ' + selected.length + '.';
      renderTree();
      updateActions();
    }

    function renderSets() {
      list.innerHTML = sets.map(set => option(set.id, set.name + ' (' + set.ids.length + ')')).join('');
      updateActions();
    }

    function addSet(ids, name) {
      const id = ++sequence;
      sets.push({ id, name: name || 'Набор ' + id, ids });
      renderSets();
    }

    tree.addEventListener('dragstart', event => {
      const node = event.target.closest('[data-category]');
      if (!node) return;
      draggedNode = node.dataset;
      event.dataTransfer.setData('text/plain', draggedNode.category);
      event.dataTransfer.effectAllowed = 'copy';
    });
    tree.addEventListener('dragend', () => { draggedNode = null; });
    list.addEventListener('dragover', event => {
      if (!draggedNode) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });
    list.addEventListener('drop', event => {
      if (!draggedNode) return;
      event.preventDefault();
      const { category: name, parameter: index, value: item } = draggedNode;
      const rows = inScope().filter(row => (name === 'Все' || row[1] === name) &&
        (item === undefined || String(row[Number(index)]) === item));
      if (rows.length) addSet(rows.map(row => row[0]), [name, parameters[Number(index) - 2], item].filter(Boolean).join(' · '));
      status.textContent = rows.length ? 'Создан набор: ' + rows.length + ' элементов.' : 'Подходящих элементов нет.';
      draggedNode = null;
    });
    form.querySelector('[data-search="refresh"]').addEventListener('click', () => {
      renderTree();
      status.textContent = 'Список обновлён.';
    });
    form.querySelector('[data-search="ungroup"]').addEventListener('click', () => {
      selected = elements.filter(row => selected.includes(row[0]) && !row[7]).map(row => row[0]);
      render('Группы и сборки исключены.');
    });
    scope.addEventListener('change', renderTree);
    categorySearch.addEventListener('input', renderTree);
    parameterSearch.addEventListener('input', renderTree);
    operator.addEventListener('change', updateFields);
    tree.addEventListener('click', event => {
      const node = event.target.closest('[data-category]');
      if (!node) return;
      category = node.dataset.category;
      parameter = Number(node.dataset.parameter);
      if ('value' in node.dataset) {
        value.value = node.dataset.value;
        operator.value = 'equals';
      }
      markTreeSelection(node);
      updateFields();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const wanted = normalize(value.value);
      selected = inScope().filter(row => (!category || (category === 'Все' || row[1] === category)) &&
        (!parameter || matches[operator.value](normalize(row[parameter]), wanted))).map(row => row[0]);
      render(selected.length ? 'Поиск завершён.' : 'Совпадений нет.');
    });
    function renderPresets(activeId = '') {
      presetsList.innerHTML = [...presets].map(([id, preset]) => option(id, preset.name)).join('');
      presetsList.value = activeId;
    }

    function persistPresets() {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...presets]));
        return true;
      } catch {
        return false;
      }
    }

    function restorePreset(run) {
      const preset = presets.get(presetsList.value);
      if (!preset) { status.textContent = 'Выберите сохранённый фильтр.'; return; }
      scope.value = preset.scope;
      category = preset.category;
      parameter = preset.parameter;
      operator.value = preset.operator;
      value.value = preset.value;
      categorySearch.value = preset.categorySearch;
      parameterSearch.value = preset.parameterSearch;
      renderTree();
      if (!category) { status.textContent = 'Категория сохранённого фильтра не найдена.'; return; }
      if (run) form.requestSubmit();
      else status.textContent = 'Фильтр восстановлен.';
    }

    presetsList.addEventListener('dblclick', () => restorePreset(false));
    win.querySelector('.filter-scope').addEventListener('click', event => {
      const action = event.target.closest('[data-preset]')?.dataset.preset;
      if (action === 'save') {
        const id = String(++presetSequence);
        const base = category + ' · ' + parameters[parameter - 2];
        const names = new Set([...presets.values()].map(preset => preset.name));
        let name = base;
        for (let suffix = 2; names.has(name); suffix++) name = base + ' ' + suffix;
        presets.set(id, { name, scope: scope.value, category, parameter, operator: operator.value, value: value.value,
          categorySearch: categorySearch.value, parameterSearch: parameterSearch.value });
        renderPresets(id);
        status.textContent = persistPresets() ? 'Фильтр сохранён.' : 'Фильтр сохранён до закрытия страницы.';
      }
      if (action === 'run') restorePreset(true);
      if (action === 'delete' && presets.delete(presetsList.value)) {
        renderPresets();
        status.textContent = persistPresets() ? 'Фильтр удалён.' : 'Фильтр удалён из текущего сеанса.';
      }
    });
    list.addEventListener('change', updateActions);
    const importInput = win.querySelector('.filter-import');
    importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      if (!file) return;
      try {
        const [document, ...lines] = (await file.text()).trim().split(/\r?\n/);
        const ids = [...new Set(lines.join(';').split(';').map(Number))];
        const valid = document === documentName ? elements.filter(row => ids.includes(row[0])).map(row => row[0]) : [];
        if (valid.length) addSet(valid, 'Импорт ' + (sequence + 1));
        status.textContent = valid.length ? 'Файл выбора импортирован.' : 'В файле нет элементов учебной модели.';
      } catch {
        status.textContent = 'Не удалось прочитать файл выбора.';
      } finally {
        importInput.value = '';
      }
    });
    win.querySelector('.filter-actions').addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      const checked = [...list.selectedOptions].map(item => Number(item.value));
      const chosen = sets.filter(set => checked.includes(set.id));
      if (action === 'import') { importInput.click(); return; }
      if (action === 'export') {
        const ids = [...new Set((chosen.length ? chosen : sets).flatMap(set => set.ids))];
        if (!ids.length) { status.textContent = 'Нет элементов для экспорта.'; return; }
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([documentName + '\r\n' + ids.join(';')], { type: 'text/plain' }));
        link.download = 'RabinBIM-selection.txt';
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        status.textContent = 'Файл выбора сохранён: ' + ids.length + ' элементов.';
        return;
      }
      if (action === 'rename') {
        const name = window.prompt('Название набора', chosen[0].name)?.trim();
        if (name) { chosen[0].name = name; renderSets(); }
        return;
      }
      if (action === 'save') { addSet([...selected]); status.textContent = 'Выделение сохранено в сеансе.'; return; }
      if (action === 'delete') sets = sets.filter(set => !checked.includes(set.id));
      if (action === 'select' || action === 'combine') {
        const ids = [...new Set(chosen.flatMap(set => set.ids))];
        if (action === 'select') {
          selected = ids;
          render('Наборы выделены.');
          return;
        }
        addSet(ids);
        return;
      }
      if (action === 'subtract') {
        const excluded = new Set(chosen.slice(1).flatMap(set => set.ids));
        addSet(chosen[0].ids.filter(id => !excluded.has(id)));
        return;
      }
      renderSets();
    });

    renderPresets();
    renderSets();
    render('Учебная модель из восьми элементов.');
  });
}());
