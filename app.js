const featureData = { collisions:['Коллизии','Проверьте модель, разберите пересечения по группам и передайте команде только актуальные задачи.'], dimensions:['Размеры по линии','Проведите линию через стены, оси, окна и двери — RabinBIM поставит цепочку размеров по выбранным правилам.'], filters:['Расширенный фильтр','Находите нужные элементы по параметрам и сохраняйте готовые наборы выборки для повторного использования.'], views:['Работа с видами','Создавайте 3D-вид из плана и план из 3D, обрезайте вид по уровням, настраивайте границы вида и находите элемент на всех видах.'], parameters:['Параметры','Смотрите параметры, формулы и связи внутри семейства и передавайте параметры помещений в стены отделки.'], lessons:['Уроки в Revit','Откройте урок — RabinBIM затемнит лишнее, подсветит нужную кнопку и засчитает шаг по вашему действию.'], qr:['QR-коды','Сохраняйте вид кодом или скриншотом с QR-кодом, чтобы вы или коллега открыли его в том же месте.'], sync:['Синхронизация','Переносите данные между открытыми проектами, назначайте группам рабочие наборы и смотрите состав любого набора.'] };
document.querySelectorAll('[data-feature]').forEach(card => card.addEventListener('click', event => { event.preventDefault(); const [title,text] = featureData[card.dataset.feature]; document.getElementById('guideTitle').textContent = title; document.getElementById('guideText').textContent = text; document.querySelectorAll('[data-feature]').forEach(item => item.classList.remove('selected')); card.classList.add('selected'); document.getElementById('guide').scrollIntoView({behavior:'smooth',block:'start'}); }));
const snapBlocks = [...document.querySelectorAll('.snap-block')];
let wheelLocked = false;
window.addEventListener('wheel', event => {
  if (window.innerWidth <= 700 || Math.abs(event.deltaY) < 12 || wheelLocked) return;
  const current = snapBlocks.reduce((closest, block, index) => Math.abs(block.getBoundingClientRect().top) < Math.abs(snapBlocks[closest].getBoundingClientRect().top) ? index : closest, 0);
  const next = event.deltaY > 0 ? Math.min(current + 1, snapBlocks.length - 1) : Math.max(current - 1, 0);
  if (next === current) return;
  event.preventDefault();
  wheelLocked = true;
  snapBlocks[next].scrollIntoView({behavior:'smooth', block:'start'});
  window.setTimeout(() => { wheelLocked = false; }, 700);
}, {passive:false});
