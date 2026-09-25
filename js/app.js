// ===== PUBLIC CONFIG =====
const CONFIG = window.APP_CONFIG || {};
const SUPABASE_URL = String(CONFIG.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = String(CONFIG.SUPABASE_PUBLISHABLE_KEY || '');
const DONATION_URL = String(CONFIG.DONATION_URL || '').trim();

function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL) &&
    SUPABASE_KEY &&
    !SUPABASE_KEY.includes('PASTE_') &&
    !SUPABASE_KEY.includes('YOUR_KEY')
  );
}

function publicHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra
  };
}

async function supabaseFetch(path, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: publicHeaders(options.headers || {})
  });
  if (!response.ok) {
    let details = '';
    try {
      const body = await response.json();
      details = body.message || body.error_description || body.hint || JSON.stringify(body);
    } catch {
      details = await response.text().catch(() => '');
    }
    const error = new Error(details || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const HALL_CONFIG = {
  // СЦЕНА — левая часть (ряды 1-10)
  stage_left: {
    rows: [
      { row: 1, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
      { row: 2, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
      { row: 3, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
      { row: 4, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
      { row: 5, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
      { row: 6, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
      { row: 7, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
      { row: 8, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
      { row: 9, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
      { row: 10, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
    ]
  },
  // СЦЕНА — правая часть (ряды 1-10)
  stage_right: {
    rows: [
      { row: 1, seats: [15,16,17,18,19,20,21,22,23,24,25,26,27,28] },
      { row: 2, seats: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
      { row: 3, seats: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
      { row: 4, seats: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32] },
      { row: 5, seats: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32] },
      { row: 6, seats: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32] },
      { row: 7, seats: [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
      { row: 8, seats: [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
      { row: 9, seats: [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
      { row: 10, seats: [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
    ]
  },
  // ПУЛЬТ
  pult: {
    row: 1,
    seats: [18,19,20,21,22,23,24,25,26,27,28,29]
  },
  // Ряды 11-19 левая часть
  mid_left: {
    rows: Array.from({length: 9}, (_, i) => ({
      row: 11 + i,
      seats: Array.from({length: 36}, (_, j) => j + 1)
    }))
  },
  // Ряды 11-19 правая часть
  mid_right: {
    rows: Array.from({length: 9}, (_, i) => ({
      row: 11 + i,
      seats: Array.from({length: 36}, (_, j) => j + 1)
    }))
  },
  // БАЛКОН
  balcony: {
    sections: [
      // Левый верхний балкон
      { label: 'Балкон Л-1', rows: [
        { row: 1, seats: [1,2,3,4,5,6,7,8,9] },
        { row: 2, seats: [1,2,3,4,5,6,7,8,9] },
        { row: 3, seats: [1,2,3,4,5,6,7,8,9,10] },
        { row: 4, seats: [1,2,3,4,5,6,7] },
      ]},
      // Правый верхний балкон
      { label: 'Балкон П-1', rows: [
        { row: 1, seats: [35,36,37,38,39,40,41,42,43] },
        { row: 2, seats: [35,36,37,38,40,41,42,43] },
        { row: 3, seats: [36,37,38,40,41,42,43,44,45] },
        { row: 4, seats: [8,9,10,11,12,13,14] },
      ]},
      // Центральный балкон
      { label: 'Балкон Центр', rows: [
        { row: 1, seats: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 2, seats: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 3, seats: [11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35] },
      ]},
      // Нижний балкон левый
      { label: 'Балкон Л-2', rows: [
        { row: 5, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 6, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 7, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 8, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 9, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 10, seats: [1,2,3,4,5,6,7,8,9,10,11,12] },
        { row: 11, seats: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
      ]},
      // Нижний балкон правый
      { label: 'Балкон П-2', rows: [
        { row: 5, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33] },
        { row: 6, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 7, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 8, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 9, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 10, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34] },
        { row: 11, seats: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31] },
      ]},
    ]
  }
};

// ===== STATE =====
let selectedSeats = [];
let bookedSeats = new Set();
let seatRefreshTimer = null;
const MAX_SEATS_PER_BOOKING = 6;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setupHeroImage();
  renderHall();
  setupEventListeners();
  updateSelectedPanel();

  // База не должна ломать интерфейс. Даже без ключа зал и кнопки работают.
  if (isSupabaseConfigured()) {
    loadBookedSeats();
    seatRefreshTimer = setInterval(loadBookedSeats, 12000);
  } else {
    console.warn('Supabase Publishable key ещё не добавлен. Интерфейс работает, но онлайн-бронирование пока отключено.');
  }
});

window.addEventListener('beforeunload', () => {
  if (seatRefreshTimer) clearInterval(seatRefreshTimer);
});

// ===== HERO IMAGE =====
function setupHeroImage() {
  const img = document.getElementById('heroImage');
  const hero = document.querySelector('.hero');
  if (!img || !hero) return;

  const candidates = [
    'images/hero.jpg',
    'images/hero.jpeg',
    'images/hero.png',
    'images/hero.webp'
  ];
  let index = 0;

  img.addEventListener('load', () => hero.classList.remove('image-missing'));
  img.addEventListener('error', () => {
    index += 1;
    if (index < candidates.length) {
      img.src = `${candidates[index]}?v=3`;
    } else {
      hero.classList.add('image-missing');
    }
  });

  // Query-string помогает GitHub Pages не показывать старый закэшированный hero.
  img.src = `${candidates[0]}?v=3`;
}

// ===== RENDER HALL =====
function renderHall() {
  const floor = document.getElementById('hallFloor');
  const balcony = document.getElementById('hallBalcony');
  if (!floor || !balcony) return;

  floor.innerHTML = '';
  balcony.innerHTML = '';

  // Сцена — левая + правая части, ряды 1–10.
  for (let r = 1; r <= 10; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'hall-row';
    rowDiv.appendChild(createRowNumber(r));

    const leftConfig = HALL_CONFIG.stage_left.rows.find(row => row.row === r);
    (leftConfig?.seats || []).forEach(seat => rowDiv.appendChild(createSeat('Сцена', r, seat)));

    const aisle = document.createElement('div');
    aisle.className = 'seat seat-aisle';
    aisle.setAttribute('aria-hidden', 'true');
    rowDiv.appendChild(aisle);

    const rightConfig = HALL_CONFIG.stage_right.rows.find(row => row.row === r);
    (rightConfig?.seats || []).forEach(seat => rowDiv.appendChild(createSeat('Сцена', r, seat)));

    rowDiv.appendChild(createRowNumber(r));
    floor.appendChild(rowDiv);
  }

  // Пульт.
  const pultRow = document.createElement('div');
  pultRow.className = 'hall-row';
  pultRow.appendChild(createRowNumber('П'));
  HALL_CONFIG.pult.seats.forEach(seat => pultRow.appendChild(createSeat('Пульт', 1, seat)));
  pultRow.appendChild(createRowNumber('П'));
  floor.appendChild(pultRow);

  // Основной зал, ряды 11–19.
  for (let r = 11; r <= 19; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'hall-row';
    rowDiv.appendChild(createRowNumber(r));

    for (let s = 1; s <= 18; s++) rowDiv.appendChild(createSeat('Зал', r, s));

    const aisle = document.createElement('div');
    aisle.className = 'seat seat-aisle';
    aisle.setAttribute('aria-hidden', 'true');
    rowDiv.appendChild(aisle);

    for (let s = 19; s <= 36; s++) rowDiv.appendChild(createSeat('Зал', r, s));

    rowDiv.appendChild(createRowNumber(r));
    floor.appendChild(rowDiv);
  }

  // Балкон. Каждая секция получает собственный sector, чтобы места не конфликтовали.
  HALL_CONFIG.balcony.sections.forEach(section => {
    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'balcony-section-label';
    sectionLabel.textContent = section.label;
    balcony.appendChild(sectionLabel);

    section.rows.forEach(rowConfig => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'hall-row';
      rowDiv.appendChild(createRowNumber(rowConfig.row));

      rowConfig.seats.forEach(seat => {
        rowDiv.appendChild(createSeat(section.label, rowConfig.row, seat));
      });

      rowDiv.appendChild(createRowNumber(rowConfig.row));
      balcony.appendChild(rowDiv);
    });
  });
}

function createRowNumber(value) {
  const el = document.createElement('div');
  el.className = 'row-number';
  el.textContent = value;
  return el;
}

function createSeat(sector, row, seat) {
  const seatEl = document.createElement('button');
  seatEl.type = 'button';
  seatEl.className = 'seat seat-available';
  seatEl.textContent = seat;
  seatEl.dataset.sector = sector;
  seatEl.dataset.row = String(row);
  seatEl.dataset.seat = String(seat);
  seatEl.setAttribute('aria-label', `${sector}, ряд ${row}, место ${seat}`);

  seatEl.addEventListener('click', () => toggleSeat(seatEl));
  seatEl.addEventListener('mouseenter', e => showTooltip(e, sector, row, seat));
  seatEl.addEventListener('mousemove', moveTooltip);
  seatEl.addEventListener('mouseleave', hideTooltip);
  return seatEl;
}

// ===== TOOLTIP =====
function showTooltip(e, sector, row, seat) {
  let tooltip = document.getElementById('seatTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'seatTooltip';
    tooltip.className = 'seat-tooltip';
    document.body.appendChild(tooltip);
  }
  const key = seatKey(sector, row, seat);
  tooltip.textContent = bookedSeats.has(key)
    ? `${sector}, ряд ${row}, место ${seat} — занято`
    : `${sector}, ряд ${row}, место ${seat}`;
  tooltip.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  const tooltip = document.getElementById('seatTooltip');
  if (!tooltip) return;
  tooltip.style.left = `${e.clientX + 12}px`;
  tooltip.style.top = `${e.clientY - 42}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById('seatTooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function seatKey(sector, row, seat) {
  return `${sector}::${row}::${seat}`;
}

// ===== SEAT SELECTION =====
function toggleSeat(el) {
  const sector = el.dataset.sector;
  const row = Number(el.dataset.row);
  const seat = Number(el.dataset.seat);
  const key = seatKey(sector, row, seat);
  if (bookedSeats.has(key) || el.classList.contains('seat-booked')) return;

  const index = selectedSeats.findIndex(s => seatKey(s.sector, s.row, s.seat) === key);
  if (index >= 0) {
    selectedSeats.splice(index, 1);
    el.classList.remove('seat-selected');
    el.classList.add('seat-available');
    el.setAttribute('aria-pressed', 'false');
  } else {
    if (selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      alert(`За одно бронирование можно выбрать максимум ${MAX_SEATS_PER_BOOKING} мест.`);
      return;
    }
    selectedSeats.push({ sector, row, seat });
    el.classList.remove('seat-available');
    el.classList.add('seat-selected');
    el.setAttribute('aria-pressed', 'true');
  }
  updateSelectedPanel();
}

function updateSelectedPanel() {
  const list = document.getElementById('selectedSeatsList');
  const btnBook = document.getElementById('btnBook');
  if (!list || !btnBook) return;

  list.innerHTML = '';
  if (!selectedSeats.length) {
    list.innerHTML = '<span style="color:#8a8a82;font-size:.9rem">Нажмите на место на схеме</span>';
  }

  selectedSeats.forEach((s, i) => {
    const tag = document.createElement('span');
    tag.className = 'selected-seat-tag';
    tag.append(document.createTextNode(`${s.sector}, ряд ${s.row}, место ${s.seat} `));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-seat';
    remove.dataset.index = String(i);
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Убрать место');
    remove.addEventListener('click', () => removeSelectedSeat(i));
    tag.appendChild(remove);
    list.appendChild(tag);
  });

  btnBook.disabled = selectedSeats.length === 0;
}

function removeSelectedSeat(index) {
  const s = selectedSeats[index];
  if (!s) return;
  document.querySelectorAll(seatSelector(s)).forEach(seatEl => {
    seatEl.classList.remove('seat-selected');
    seatEl.classList.add('seat-available');
    seatEl.setAttribute('aria-pressed', 'false');
  });
  selectedSeats.splice(index, 1);
  updateSelectedPanel();
}

function seatSelector(s) {
  return `.seat[data-sector="${cssEscape(s.sector)}"][data-row="${s.row}"][data-seat="${s.seat}"]`;
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/(["\\])/g, '\\$1');
}

// ===== LOAD BOOKED SEATS =====
async function loadBookedSeats() {
  if (!isSupabaseConfigured()) return;
  try {
    const data = await supabaseFetch('/rest/v1/reserved_seats?select=sector,row_num,seat_num');
    const next = new Set();
    (data || []).forEach(b => next.add(seatKey(b.sector, b.row_num, b.seat_num)));
    bookedSeats = next;
    paintBookedSeats();
  } catch (error) {
    console.error('Не удалось загрузить занятые места:', error);
  }
}

function paintBookedSeats() {
  document.querySelectorAll('.seat[data-sector]').forEach(el => {
    const key = seatKey(el.dataset.sector, Number(el.dataset.row), Number(el.dataset.seat));
    const isBooked = bookedSeats.has(key);
    const selectedIndex = selectedSeats.findIndex(s => seatKey(s.sector, s.row, s.seat) === key);

    el.classList.toggle('seat-booked', isBooked);
    el.disabled = isBooked;
    el.setAttribute('aria-disabled', String(isBooked));

    if (isBooked) {
      el.classList.remove('seat-available', 'seat-selected');
      if (selectedIndex >= 0) selectedSeats.splice(selectedIndex, 1);
    } else if (!el.classList.contains('seat-selected')) {
      el.classList.add('seat-available');
    }
  });
  updateSelectedPanel();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  const byId = id => document.getElementById(id);

  byId('btnDonateHero')?.addEventListener('click', () => openModal('modalDonation'));
  byId('btnBook')?.addEventListener('click', () => {
    if (!selectedSeats.length) return;
    updateFormSeatsInfo();
    openModal('modalRegister');
  });
  byId('bookingForm')?.addEventListener('submit', handleBooking);

  byId('closeRegister')?.addEventListener('click', () => closeModal('modalRegister'));
  byId('closeDonation')?.addEventListener('click', () => closeModal('modalDonation'));
  byId('closeSuccess')?.addEventListener('click', () => closeModal('modalSuccess'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.querySelectorAll('.donation-amount').forEach(btn => {
    btn.type = 'button';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.donation-amount').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const custom = byId('customAmount');
      if (custom) custom.value = '';
    });
  });

  byId('customAmount')?.addEventListener('input', () => {
    document.querySelectorAll('.donation-amount').forEach(b => b.classList.remove('active'));
  });
  byId('btnDonateSubmit')?.addEventListener('click', handleDonation);
  byId('btnDonateAfter')?.addEventListener('click', () => {
    closeModal('modalSuccess');
    setTimeout(() => openModal('modalDonation'), 150);
  });
  byId('btnSkipDonation')?.addEventListener('click', () => closeModal('modalSuccess'));

  byId('btnZoom')?.addEventListener('click', toggleHallZoom);

  byId('burger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('nav-open');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.querySelector('.nav-links')?.classList.remove('nav-open'));
  });

  byId('phone')?.addEventListener('input', formatPhone);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => closeModal(modal.id));
    }
  });
}

function toggleHallZoom() {
  const container = document.getElementById('hallContainer');
  if (!container) return;
  const zoomed = container.dataset.zoomed === '1';
  container.dataset.zoomed = zoomed ? '0' : '1';
  container.style.transform = zoomed ? 'scale(1)' : 'scale(1.35)';
  container.style.transformOrigin = 'top center';
  container.style.transition = 'transform .25s ease';
}

function updateFormSeatsInfo() {
  const info = document.getElementById('formSeatsInfo');
  if (!info) return;
  info.innerHTML = '<strong>Выбранные места:</strong><br>' + selectedSeats
    .map(s => `${escapeHtml(s.sector)}, ряд ${s.row}, место ${s.seat}`)
    .join('<br>');
}

// ===== BOOKING =====
async function handleBooking(e) {
  e.preventDefault();
  if (!selectedSeats.length) return;

  if (!isSupabaseConfigured()) {
    alert('Схема и кнопки уже работают. Для отправки брони осталось вставить Publishable key Supabase в js/config.js.');
    return;
  }

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!fullName || !phone || !email) {
    alert('Заполните ФИО, телефон и email.');
    return;
  }

  const btn = e.currentTarget.querySelector('.btn-submit');
  const originalText = btn.textContent;
  btn.textContent = 'Бронируем…';
  btn.disabled = true;

  const seatsSnapshot = selectedSeats.map(s => ({ ...s }));
  try {
    await supabaseFetch('/rest/v1/rpc/create_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_full_name: fullName,
        p_phone: phone,
        p_email: email,
        p_seats: seatsSnapshot
      })
    });

    seatsSnapshot.forEach(s => bookedSeats.add(seatKey(s.sector, s.row, s.seat)));
    selectedSeats = [];
    paintBookedSeats();

    const seatText = seatsSnapshot.map(s => `${s.sector}, ряд ${s.row}, место ${s.seat}`).join(', ');
    document.getElementById('successMessage').textContent = `Забронировано: ${seatText}\nКонтакт: ${email}`;
    closeModal('modalRegister');
    openModal('modalSuccess');
    e.currentTarget.reset();
    await loadBookedSeats();
  } catch (error) {
    console.error('Booking error:', error);
    if (/SEAT_ALREADY_BOOKED|duplicate key|23505/i.test(error.message)) {
      await loadBookedSeats();
      alert('Одно из выбранных мест уже забронировали. Схема обновлена — выберите другое.');
    } else {
      alert(`Бронирование не отправлено: ${error.message || 'ошибка подключения к Supabase'}`);
    }
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ===== DONATION =====
async function handleDonation() {
  const activeBtn = document.querySelector('.donation-amount.active');
  const customAmount = document.getElementById('customAmount')?.value;
  const amount = customAmount ? Number(customAmount) : Number(activeBtn?.dataset.amount || 1000);
  const donorName = document.getElementById('donorName')?.value.trim() || 'Аноним';
  const message = document.getElementById('donorMessage')?.value.trim() || '';

  if (!Number.isFinite(amount) || amount < 50) {
    alert('Минимальная сумма — 50 ₽. Пожертвование добровольное.');
    return;
  }

  const btn = document.getElementById('btnDonateSubmit');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Подготавливаем…';

  try {
    // Лог намерения — только если Supabase уже настроен. На бронь это не влияет.
    if (isSupabaseConfigured()) {
      try {
        await supabaseFetch('/rest/v1/rpc/log_donation_intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_donor_name: donorName, p_amount: amount, p_message: message })
        });
      } catch (error) {
        console.warn('Не удалось записать намерение пожертвования:', error);
      }
    }

    if (!DONATION_URL) {
      alert('Пожертвование добровольное. Организатор ещё не добавил ссылку для перевода. Бронирование от этого не зависит.');
      return;
    }

    window.open(DONATION_URL, '_blank', 'noopener,noreferrer');
    closeModal('modalDonation');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ===== MODALS =====
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  if (!document.querySelector('.modal-overlay.active')) document.body.style.overflow = '';
}

// ===== PHONE =====
function formatPhone(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.startsWith('7') || value.startsWith('8')) value = value.slice(1);
  value = value.slice(0, 10);
  let formatted = '+7';
  if (value.length) formatted += ` (${value.slice(0, 3)}`;
  if (value.length >= 3) formatted += `) ${value.slice(3, 6)}`;
  if (value.length >= 6) formatted += `-${value.slice(6, 8)}`;
  if (value.length >= 8) formatted += `-${value.slice(8, 10)}`;
  e.target.value = formatted;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
