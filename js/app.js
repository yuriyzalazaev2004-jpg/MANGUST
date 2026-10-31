// ===== PUBLIC CONFIG =====
const CONFIG = window.APP_CONFIG || {};
const SUPABASE_URL = String(CONFIG.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = String(CONFIG.SUPABASE_PUBLISHABLE_KEY || '');

function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL && /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL) &&
    SUPABASE_KEY && !SUPABASE_KEY.includes('PASTE_') && !SUPABASE_KEY.includes('YOUR_KEY')
  );
}

function publicHeaders(extra = {}) {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...extra };
}

async function supabaseFetch(path, options = {}) {
  if (!isSupabaseConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
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

// Геометрия рассадки по новой схеме пользователя.
const HALL_SECTIONS = [
  { id: 'ПАРТЕР', title: 'ПАРТЕР', color: 'purple', rows: [
    { row: -1, left: 16, right: 16 }, { row: -2, left: 17, right: 17 },
    { row: -3, left: 19, right: 18 }, { row: -4, left: 19, right: 18 },
    { row: -5, left: 20, right: 19 }, { row: -6, left: 20, right: 19 }
  ]},
  { id: 'АМФИТЕАТР', title: 'АМФИТЕАТР', color: 'purple', rows: [
    { row: -1, left: 18, right: 17 }, { row: -2, left: 19, right: 18 },
    { row: -3, left: 13, right: 13 }, { row: -4, left: 13, right: 12 },
    { row: -5, left: 12, right: 11 }, { row: -6, left: 10, right: 10 },
    { row: -7, left: 8, right: 8 }
  ]},
];

function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

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
  if (isSupabaseConfigured()) {
    loadBookedSeats();
    seatRefreshTimer = setInterval(loadBookedSeats, 12000);
  }
});

window.addEventListener('beforeunload', () => {
  if (seatRefreshTimer) clearInterval(seatRefreshTimer);
});

function setupHeroImage() {
  const img = document.getElementById('heroImage');
  const hero = document.querySelector('.hero');
  if (!img || !hero) return;
  const candidates = ['images/hero.jpg', 'images/hero.jpeg', 'images/hero.png', 'images/hero.webp', 'images/hero-example.jpg'];
  let index = 0;
  img.addEventListener('load', () => hero.classList.remove('image-missing'));
  img.addEventListener('error', () => {
    index += 1;
    if (index < candidates.length) img.src = `${candidates[index]}?v=8`;
    else hero.classList.add('image-missing');
  });
  img.src = `${candidates[0]}?v=8`;
}

// ===== HALL =====
function renderHall() {
  const floor = document.getElementById('hallFloor');
  const balcony = document.getElementById('hallBalcony');
  if (!floor) return;
  floor.innerHTML = '';

  const parterre = document.createElement('section');
  parterre.className = 'seat-section parterre-section';
  parterre.innerHTML = '<h3>ПАРТЕР</h3>';
  HALL_SECTIONS[0].rows.forEach(cfg => parterre.appendChild(createSplitSeatRow('ПАРТЕР', cfg, 'purple')));
  floor.appendChild(parterre);

  const amphitheater = document.createElement('section');
  amphitheater.className = 'seat-section amphitheater-section';
  amphitheater.innerHTML = '<h3>АМФИТЕАТР</h3>';
  HALL_SECTIONS[1].rows.forEach(cfg => amphitheater.appendChild(createSplitSeatRow('АМФИТЕАТР', cfg, 'purple')));
  floor.appendChild(amphitheater);

  // Боковые блоки амфитеатра удалены по запросу организаторов.
}

function createSplitSeatRow(sector, cfg, color) {
  const row = document.createElement('div');
  row.className = `diagram-row ${color}`;
  const left = document.createElement('div'); left.className = 'diagram-bank left-bank';
  const right = document.createElement('div'); right.className = 'diagram-bank right-bank';
  const center = document.createElement('span'); center.className = 'diagram-row-number'; center.textContent = cfg.row;
  if (cfg.seats) {
    cfg.seats.forEach(n => left.appendChild(createDiagramSeat(sector, cfg.row, n, color)));
  } else {
    for (let n = cfg.left + cfg.right; n > cfg.right; n--) left.appendChild(createDiagramSeat(sector, cfg.row, n, color));
    for (let n = cfg.right; n >= 1; n--) right.appendChild(createDiagramSeat(sector, cfg.row, n, color));
  }
  row.append(left, center, right);
  return row;
}

function createDiagramSeat(sector, row, seat, color) {
  const el = createSeat(sector, row, seat);
  el.classList.add(`seat-${color}`);
  return el;
}

function renderAmphiSideWings(root) {
  // Side blocks follow the curved outline of the supplied seating plan.
  const wings = document.createElement('div');
  wings.className = 'amphi-side-wings';
  const left = [
    [40,39,38,37],[36,35,34,33,32],[40,39,38],[37,36,35,34,33,32,31],[30,29,28,27,26,25,24,23,22,21]
  ];
  const right = [
    [4,3,2,1],[5,4,3,2,1],[6,5,4,3,2,1],[8,7,6,5,4],[9,8,7,6,5,4,3,2,1]
  ];
  [left,right].forEach((side, sideIndex) => {
    const col = document.createElement('div');
    col.className = sideIndex ? 'wing wing-right' : 'wing wing-left';
    side.forEach((nums, idx) => {
      const line = document.createElement('div');
      line.className = 'wing-line';
      line.style.setProperty('--wing-step', String(idx));
      nums.forEach(n => line.appendChild(createDiagramSeat('АМФИТЕАТР-БОКОВЫЕ', -(idx + 1), n, 'green')));
      col.appendChild(line);
    });
    wings.appendChild(col);
  });
  root.appendChild(wings);
}

function baseRow(className, row, rightNumber = true) {
  const rowEl = document.createElement('div');
  rowEl.className = `hall-row ${className}`;
  rowEl.appendChild(createRowNumber(row));
  const spacer1 = document.createElement('div');
  spacer1.className = 'row-spacer';
  const content = document.createElement('div');
  content.className = 'row-content';
  const spacer2 = document.createElement('div');
  spacer2.className = 'row-spacer';
  rowEl.append(spacer1, content, spacer2);
  rowEl.appendChild(rightNumber ? createRowNumber(row) : createGhostRowNumber());
  return rowEl;
}

function bank(className) {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

function createRowNumber(value) {
  const el = document.createElement('div');
  el.className = 'row-number';
  el.textContent = value;
  return el;
}

function createGhostRowNumber() {
  const el = createRowNumber('');
  el.classList.add('ghost');
  return el;
}

function createSeat(sector, row, seat) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'seat seat-available';
  el.textContent = seat;
  el.dataset.sector = sector;
  el.dataset.row = String(row);
  el.dataset.seat = String(seat);
  el.setAttribute('aria-label', `${sector}, ряд ${row}, место ${seat}`);
  el.setAttribute('aria-pressed', 'false');
  el.addEventListener('click', () => toggleSeat(el));
  el.addEventListener('mouseenter', e => showTooltip(e, sector, row, seat));
  el.addEventListener('mousemove', moveTooltip);
  el.addEventListener('mouseleave', hideTooltip);
  return el;
}

function seatKey(sector, row, seat) { return `${sector}::${row}::${seat}`; }

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
  const t = document.getElementById('seatTooltip');
  if (!t) return;
  t.style.left = `${e.clientX + 12}px`;
  t.style.top = `${e.clientY - 40}px`;
}
function hideTooltip() {
  const t = document.getElementById('seatTooltip');
  if (t) t.style.display = 'none';
}

// ===== SELECTION =====
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
  const btn = document.getElementById('btnBook');
  if (!list || !btn) return;
  list.innerHTML = '';
  if (!selectedSeats.length) {
    list.innerHTML = '<span style="color:#8a8a82;font-size:.86rem">Нажмите на место на схеме</span>';
  }
  selectedSeats.forEach((s, i) => {
    const tag = document.createElement('span');
    tag.className = 'selected-seat-tag';
    tag.append(document.createTextNode(`${s.sector}, ряд ${s.row}, место ${s.seat}`));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-seat';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Убрать место');
    remove.addEventListener('click', () => removeSelectedSeat(i));
    tag.appendChild(remove);
    list.appendChild(tag);
  });
  btn.disabled = selectedSeats.length === 0;
  document.getElementById('selectedPanel')?.classList.toggle('has-seats', selectedSeats.length > 0);
  const heading = document.querySelector('.selected-list h3');
  if (heading) heading.textContent = selectedSeats.length ? `Выбранные места (${selectedSeats.length})` : 'Выбранные места';
}

function removeSelectedSeat(index) {
  const s = selectedSeats[index];
  if (!s) return;
  document.querySelectorAll(seatSelector(s)).forEach(el => {
    el.classList.remove('seat-selected');
    el.classList.add('seat-available');
    el.setAttribute('aria-pressed', 'false');
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

// ===== SUPABASE BOOKED SEATS =====
async function loadBookedSeats() {
  if (!isSupabaseConfigured()) return;
  try {
    const data = await supabaseFetch('/rest/v1/reserved_seats?select=sector,row_num,seat_num');
    bookedSeats = new Set((data || []).map(b => seatKey(b.sector, b.row_num, b.seat_num)));
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

// ===== EVENTS =====
function setupEventListeners() {
  const byId = id => document.getElementById(id);
  byId('btnBook')?.addEventListener('click', () => {
    if (!selectedSeats.length) return;
    updateFormSeatsInfo();
    openModal('modalRegister');
  });
  byId('bookingForm')?.addEventListener('submit', handleBooking);
  byId('openContact')?.addEventListener('click',()=>openModal('modalContact'));
  byId('closeContact')?.addEventListener('click',()=>closeModal('modalContact'));
  byId('contactForm')?.addEventListener('submit',sendContactMessage);
  byId('closeRegister')?.addEventListener('click', () => closeModal('modalRegister'));
  byId('closeSuccess')?.addEventListener('click', () => closeModal('modalSuccess'));
  byId('btnSkipDonation')?.addEventListener('click', () => closeModal('modalSuccess'));
  byId('btnZoom')?.addEventListener('click', toggleHallZoom);
  byId('burger')?.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    const isOpen = links?.classList.toggle('nav-open');
    byId('burger')?.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.remove('nav-open');
    byId('burger')?.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  }));
  byId('phone')?.addEventListener('input', formatPhone);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
  });
}

function toggleHallZoom() {
  const container = document.getElementById('hallContainer');
  const btn = document.getElementById('btnZoom');
  if (!container) return;
  const zoomed = container.dataset.zoomed === '1';
  container.dataset.zoomed = zoomed ? '0' : '1';
  container.style.transform = zoomed ? 'scale(1)' : 'scale(1.24)';
  container.style.transformOrigin = 'top center';
  container.style.transition = 'transform .22s ease';
  if (btn) btn.textContent = zoomed ? 'Увеличить схему' : 'Вернуть размер';
}

function updateFormSeatsInfo() {
  const info = document.getElementById('formSeatsInfo');
  if (!info) return;
  info.innerHTML = '<strong>Выбранные места:</strong><br>' + selectedSeats
    .map(s => `${escapeHtml(s.sector)}, ряд ${s.row}, место ${s.seat}`).join('<br>');
}

// ===== BOOKING =====
async function handleBooking(e) {
  e.preventDefault();
  if (!selectedSeats.length) return;
  if (!isSupabaseConfigured()) {
    alert('Подключение Supabase ещё не настроено.');
    return;
  }

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!fullName || !phone || !email) return;

  const btn = e.currentTarget.querySelector('.btn-submit');
  const original = btn.textContent;
  btn.textContent = 'Бронируем…';
  btn.disabled = true;
  const seatsSnapshot = selectedSeats.map(s => ({ ...s }));

  try {
    await supabaseFetch('/rest/v1/rpc/create_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_full_name: fullName, p_phone: phone, p_email: email, p_seats: seatsSnapshot })
    });

    seatsSnapshot.forEach(s => bookedSeats.add(seatKey(s.sector, s.row, s.seat)));
    selectedSeats = [];
    paintBookedSeats();
    document.getElementById('successMessage').textContent = seatsSnapshot
      .map(s => `${s.sector}: ряд ${s.row}, место ${s.seat}`).join('\n');
    closeModal('modalRegister');
    openModal('modalSuccess');
    e.currentTarget.reset();
    await loadBookedSeats();
  } catch (error) {
    console.error(error);
    if (/SEAT_ALREADY_BOOKED|duplicate key|23505/i.test(error.message)) {
      await loadBookedSeats();
      alert('Одно из выбранных мест уже забронировали. Схема обновлена.');
    } else {
      alert(`Не удалось отправить бронь: ${error.message || 'ошибка подключения'}`);
    }
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-overlay.active')) document.body.style.overflow = '';
}

function formatPhone(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.startsWith('7') || value.startsWith('8')) value = value.slice(1);
  value = value.slice(0, 10);
  let formatted = '+7';
  if (value.length) formatted += ` (${value.slice(0,3)}`;
  if (value.length >= 3) formatted += `) ${value.slice(3,6)}`;
  if (value.length >= 6) formatted += `-${value.slice(6,8)}`;
  if (value.length >= 8) formatted += `-${value.slice(8,10)}`;
  e.target.value = formatted;
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

// Visual portrait fallbacks: real client photos can be added later without broken-image icons.
document.querySelectorAll('.artist-photo img, .guest-photo img').forEach((img) => {
  img.addEventListener('error', () => {
    img.style.display = 'none';
  }, { once: true });
});

async function sendContactMessage(e) {
 e.preventDefault();
 const form=e.currentTarget, status=document.getElementById('contactStatus'),button=form.querySelector('button[type=submit]');
 button.disabled=true;status.textContent='Отправляем…';
 try {
  await supabaseFetch('/rest/v1/rpc/send_organizer_message',{method:'POST',body:JSON.stringify({p_name:document.getElementById('contactName').value.trim(),p_phone:document.getElementById('contactPhone').value.trim(),p_message:document.getElementById('contactMessage').value.trim()})});
  status.textContent='Сообщение отправлено организаторам.';form.reset();
 } catch(err){status.textContent='Не удалось отправить: '+err.message+' (проверьте SQL-настройку).';}
 finally{button.disabled=false;}
}

// Mobile sector navigation: the desktop diagram remains unchanged.
document.querySelectorAll('[data-hall-sector]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-hall-sector]').forEach(t => t.classList.toggle('active', t === tab));
    document.getElementById('hallContainer')?.setAttribute('data-mobile-sector', tab.dataset.hallSector);
    const wrapper = document.querySelector('.hall-wrapper');
    if (wrapper) wrapper.scrollLeft = 0;
  });
});
if (window.matchMedia('(max-width: 760px)').matches) {
  document.getElementById('hallContainer')?.setAttribute('data-mobile-sector', 'parterre');
}
