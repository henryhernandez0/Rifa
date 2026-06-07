const STORAGE_KEY = "rifa_v3_state";

let state = {
  numbers: {},
  config: {
    prize: "Kit de Belleza",
    drawDate: null,
    lottery: "Sinuano Noche",
    price: "3.000",
    phone1: "",
    phone2: "",
    theme: "pink",
    productImage: ""
  }
};

let pendingSlot = null;
let pendingDeselect = null;
let pendingImagePromise = null;
let clearImageRequested = false;

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      state = {
        numbers: loaded.numbers || {},
        config: {
          ...state.config,
          ...(loaded.config || {})
        }
      };
    }
  } catch (e) {}
}

function getSlots() {
  const slots = [];
  for (let i = 0; i <= 49; i++) {
    const a = String(i).padStart(2, '0');
    const b = String(99 - i).padStart(2, '0');
    slots.push({ key: a, a, b });
  }
  return slots;
}

function renderGrid() {
  const grid = document.getElementById('numbersGrid');
  const slots = getSlots();
  grid.innerHTML = '';

  slots.forEach(slot => {
    const div = document.createElement('div');
    div.className = 'nc';

    const sel = !!state.numbers[slot.key];
    if (sel) div.classList.add('selected');

    const numsDiv = document.createElement('div');
    numsDiv.className = 'nc-nums';
    numsDiv.innerHTML = `<span class="na">${slot.a}</span><span class="ns">–</span><span class="nb">${slot.b}</span>`;
    div.appendChild(numsDiv);

    if (sel) {
      const nameDiv = document.createElement('div');
      nameDiv.className = 'nc-name';
      nameDiv.textContent = state.numbers[slot.key].name;
      div.appendChild(nameDiv);
    }

    div.onclick = () => handleClick(slot);
    grid.appendChild(div);
  });

  updateCounters();
  updateDrawUI();
}

function updateCounters() {
  const sold = Object.keys(state.numbers).length;
  const free = 50 - sold;
  const priceStr = (state.config.price || '3.000').replace(/\./g, '').replace(/,/g, '');
  const price = parseInt(priceStr) || 3000;
  const total = sold * price;

  document.getElementById('countSold').textContent = sold;
  document.getElementById('countFree').textContent = free;
  document.getElementById('countMoney').textContent = '$' + total.toLocaleString('es-CO');
}

function updateDrawUI() {
  const cfg = state.config;
  const dateDisp = document.getElementById('drawDateDisplay');
  const daysEl = document.getElementById('drawDaysLeft');
  const drawBtnWrap = document.getElementById('drawBtnWrap');

  if (!cfg.drawDate) {
    dateDisp.textContent = 'No configurada';
    daysEl.textContent = 'Configura la fecha en ⚙️';
    daysEl.className = 'draw-days';
    drawBtnWrap.style.display = 'none';
    return;
  }

  const drawDate = new Date(cfg.drawDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((drawDate - today) / 86400000);
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisp.textContent = drawDate.toLocaleDateString('es-CO', opts);

  if (diff > 0) {
    daysEl.textContent = `⏳ Faltan ${diff} día${diff > 1 ? 's' : ''} para el sorteo`;
    daysEl.className = 'draw-days';
    drawBtnWrap.style.display = 'none';
  } else if (diff === 0) {
    daysEl.textContent = '🎉 ¡HOY es el día del sorteo!';
    daysEl.className = 'draw-days today';
    drawBtnWrap.style.display = 'block';
  } else {
    daysEl.textContent = `📌 El sorteo fue hace ${Math.abs(diff)} día${Math.abs(diff) > 1 ? 's' : ''}`;
    daysEl.className = 'draw-days';
    drawBtnWrap.style.display = 'block';
  }
}

function updateWhatsappDisplay() {
  const c = state.config;
  const phone1Wrap = document.getElementById('phone1Wrap');
  const phone2Wrap = document.getElementById('phone2Wrap');
  const phone1Disp = document.getElementById('phone1Disp');
  const phone2Disp = document.getElementById('phone2Disp');
  const whatsappSep = document.getElementById('whatsappSep');
  const whatsappBox = document.getElementById('whatsappBox');

  const p1 = (c.phone1 || '').trim();
  const p2 = (c.phone2 || '').trim();

  phone1Disp.textContent = p1;
  phone2Disp.textContent = p2;

  phone1Wrap.classList.toggle('show', !!p1);
  phone2Wrap.classList.toggle('show', !!p2);
  whatsappSep.style.display = (p1 && p2) ? 'inline-block' : 'none';
  whatsappBox.classList.toggle('show', !!(p1 || p2));
}

function updateProductDisplay() {
  const box = document.getElementById('prodBox');
  const src = (state.config.productImage || '').trim();

  box.innerHTML = '';

  if (!src) {
    box.classList.remove('show');
    return;
  }

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Producto';
  box.appendChild(img);
  box.classList.add('show');
}

function updateConfigDisplay() {
  const c = state.config;
  document.getElementById('prizeName').textContent = c.prize || 'Kit de Belleza';
  document.getElementById('prizeDesc').textContent = (c.prize || 'Kit de Belleza') + ' completo';
  document.getElementById('lotteryName').innerHTML = (c.lottery || 'Sinuano Noche') + '<br>Últimos 2 dígitos';
  document.getElementById('priceDisplay').textContent = '$' + (c.price || '3.000');
  updateWhatsappDisplay();
  updateProductDisplay();
  applyTheme();
}

function applyTheme() {
  document.body.setAttribute('data-theme', state.config.theme || 'pink');
  const pinkBtn = document.querySelector('.theme-pink');
  const blueBtn = document.querySelector('.theme-blue');
  if (pinkBtn && blueBtn) {
    pinkBtn.classList.toggle('active', (state.config.theme || 'pink') === 'pink');
    blueBtn.classList.toggle('active', (state.config.theme || 'pink') === 'blue');
  }
}

function setTheme(theme) {
  state.config.theme = theme;
  saveState();
  applyTheme();
  showToast(theme === 'blue' ? '💙 Tema azul activado' : '💗 Tema rosa activado');
}

function openThemePicker() {
  const picker = document.getElementById('themePicker');
  picker.style.display = (picker.style.display === 'flex') ? 'none' : 'flex';
  applyTheme();
}

function handleClick(slot) {
  if (state.numbers[slot.key]) {
    pendingDeselect = slot;
    document.getElementById('deselectName').textContent = state.numbers[slot.key].name;
    document.getElementById('deselectNums').textContent = `Números: ${slot.a} – ${slot.b}`;
    openOverlay('deselectOverlay');
  } else {
    pendingSlot = slot;
    document.getElementById('nameModalSub').textContent = `Números ${slot.a} – ${slot.b}`;
    document.getElementById('nameInput').value = '';
    document.getElementById('nameInput').classList.remove('error');
    openOverlay('nameOverlay');
    setTimeout(() => document.getElementById('nameInput').focus(), 120);
  }
}

function confirmName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('nameInput').classList.add('error');
    document.getElementById('nameInput').focus();
    return;
  }

  if (pendingSlot) {
    state.numbers[pendingSlot.key] = { name };
    saveState();
    renderGrid();
    showToast(`✅ ${name} — número ${pendingSlot.a} reservado`);
  }
  closeOverlay('nameOverlay');
}

function confirmDeselect() {
  if (pendingDeselect) {
    delete state.numbers[pendingDeselect.key];
    saveState();
    renderGrid();
    showToast(`🔓 Número ${pendingDeselect.a} liberado`);
  }
  closeOverlay('deselectOverlay');
}

function openSettings() {
  const c = state.config;
  document.getElementById('cfg-prize').value = c.prize || '';
  document.getElementById('cfg-date').value = c.drawDate || '';
  document.getElementById('cfg-lottery').value = c.lottery || '';
  document.getElementById('cfg-price').value = c.price || '';
  document.getElementById('cfg-phone1').value = c.phone1 || '';
  document.getElementById('cfg-phone2').value = c.phone2 || '';

  const imageUrlInput = document.getElementById('cfg-imageUrl');
  imageUrlInput.value = (c.productImage && !String(c.productImage).startsWith('data:')) ? c.productImage : '';
  imageUrlInput.dataset.current = c.productImage || '';

  document.getElementById('cfg-imageFile').value = '';
  pendingImagePromise = null;
  clearImageRequested = false;

  openOverlay('settingsOverlay');
}

function handleImageFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    pendingImagePromise = null;
    return;
  }

  pendingImagePromise = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

  showToast('🖼️ Imagen lista para guardar');
}

function clearProductImage() {
  clearImageRequested = true;
  pendingImagePromise = null;
  document.getElementById('cfg-imageUrl').value = '';
  document.getElementById('cfg-imageFile').value = '';
  showToast('🖼️ Imagen marcada para quitar');
}

async function saveSettings() {
  state.config.prize = document.getElementById('cfg-prize').value.trim() || 'Kit de Belleza';
  state.config.drawDate = document.getElementById('cfg-date').value || null;
  state.config.lottery = document.getElementById('cfg-lottery').value.trim() || 'Sinuano Noche';
  state.config.price = document.getElementById('cfg-price').value.trim() || '3.000';
  state.config.phone1 = document.getElementById('cfg-phone1').value.trim() || '';
  state.config.phone2 = document.getElementById('cfg-phone2').value.trim() || '';

  let finalImage = state.config.productImage || '';
  const urlValue = document.getElementById('cfg-imageUrl').value.trim();
  const currentValue = document.getElementById('cfg-imageUrl').dataset.current || '';

  if (clearImageRequested) {
    finalImage = '';
  } else if (pendingImagePromise) {
    try {
      finalImage = await pendingImagePromise;
    } catch (e) {
      finalImage = currentValue || urlValue || '';
    }
  } else if (urlValue) {
    finalImage = urlValue;
  } else if (!currentValue) {
    finalImage = '';
  }

  state.config.productImage = finalImage;

  saveState();
  updateConfigDisplay();
  renderGrid();
  closeOverlay('settingsOverlay');
  showToast('✅ Configuración guardada');
}

function openWinnerSelect() {
  const list = document.getElementById('partsList');
  const slots = getSlots();
  const participants = slots
    .filter(s => state.numbers[s.key])
    .map(s => ({ ...s, name: state.numbers[s.key].name }));

  if (participants.length === 0) {
    list.innerHTML = '<div class="parts-empty">😕 No hay participantes registrados</div>';
  } else {
    list.innerHTML = participants.map(p => `
      <div class="part-row" onclick="selectWinner('${p.key}')">
        <span class="part-num">${p.a}</span>
        <span class="part-name">${p.name}</span>
        <span class="part-num2">& ${p.b}</span>
      </div>
    `).join('');
  }
  openOverlay('winnerSelectOverlay');
}

function drawRandom() {
  const keys = Object.keys(state.numbers);
  if (keys.length === 0) {
    showToast('⚠️ No hay participantes');
    return;
  }
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  selectWinner(randomKey);
}

function selectWinner(key) {
  const slots = getSlots();
  const slot = slots.find(s => s.key === key);
  const data = state.numbers[key];
  closeOverlay('winnerSelectOverlay');

  document.getElementById('winnerName').textContent = data.name;
  document.getElementById('winnerNums').textContent = `Números ganadores: ${slot.a} – ${slot.b}`;
  document.getElementById('winnerPrize').textContent = '🏆 ' + (state.config.prize || 'Kit de Belleza');
  openOverlay('winnerOverlay');

  const cells = document.querySelectorAll('.nc');
  slots.forEach((s, i) => {
    if (s.key === key) cells[i].classList.add('winner-cell');
  });
}

function confirmReset() {
  openOverlay('resetOverlay');
}

function executeReset() {
  state.numbers = {};
  saveState();
  renderGrid();
  closeOverlay('resetOverlay');
  showToast('🔄 Rifa reiniciada. ¡A vender números!');
}

function resetAfterWinner() {
  closeOverlay('winnerOverlay');
  setTimeout(() => openOverlay('resetOverlay'), 300);
}

function openOverlay(id)  { document.getElementById(id).classList.add('active'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('active'); }

document.querySelectorAll('.overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) closeOverlay(el.id); });
});

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmName();
  if (e.key === 'Escape') closeOverlay('nameOverlay');
});

document.getElementById('cfg-imageFile').addEventListener('change', handleImageFileChange);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.active').forEach(el => el.classList.remove('active'));
    document.getElementById('themePicker').style.display = 'none';
  }
});

function init() {
  loadState();
  updateConfigDisplay();
  renderGrid();
  setInterval(updateDrawUI, 60000);
}

init();
