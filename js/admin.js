const CONFIG = window.APP_CONFIG || {};
const SUPABASE_URL = String(CONFIG.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = String(CONFIG.SUPABASE_PUBLISHABLE_KEY || '');
const SESSION_KEY = 'concert_admin_session_v1';

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginButton = document.getElementById('loginButton');
const tableBody = document.getElementById('bookingTableBody');
const emptyState = document.getElementById('emptyState');
const statusLine = document.getElementById('statusLine');
const searchInput = document.getElementById('searchInput');
const bookingCount = document.getElementById('bookingCount');
const seatCount = document.getElementById('seatCount');
const lastBooking = document.getElementById('lastBooking');
const adminIdentity = document.getElementById('adminIdentity');

let allRows = [];
let session = null;

function configured() {
  return Boolean(
    SUPABASE_URL && /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL) &&
    SUPABASE_KEY && !SUPABASE_KEY.includes('PASTE_') && !SUPABASE_KEY.includes('YOUR_KEY')
  );
}

function saveSession(value) {
  session = value;
  if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else localStorage.removeItem(SESSION_KEY);
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

async function authRequest(path, body, bearer = null) {
  const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST', headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.msg || data.message || `HTTP ${response.status}`);
  return data;
}

async function restGet(path, accessToken) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const message = data?.message || data?.hint || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function ensureSession() {
  let current = session || readSession();
  if (!current) return null;

  const now = Math.floor(Date.now() / 1000);
  if (current.expires_at && current.expires_at > now + 60) {
    session = current;
    return current;
  }

  if (!current.refresh_token) {
    saveSession(null);
    return null;
  }

  try {
    const refreshed = await authRequest('/auth/v1/token?grant_type=refresh_token', {
      refresh_token: current.refresh_token
    });
    current = normalizeSession(refreshed);
    saveSession(current);
    return current;
  } catch (error) {
    console.warn('Не удалось обновить админ-сессию:', error);
    saveSession(null);
    return null;
  }
}

function normalizeSession(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
    user: data.user || null
  };
}

async function verifyAdmin(current) {
  const userId = current?.user?.id;
  if (!userId) return false;
  const rows = await restGet(`/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`, current.access_token);
  return Array.isArray(rows) && rows.length === 1;
}

async function init() {
  if (!configured()) {
    loginMessage.textContent = 'В js/config.js ещё не вставлен Publishable key Supabase.';
    loginButton.disabled = true;
    return;
  }

  const current = await ensureSession();
  if (!current) {
    showLogin();
    return;
  }

  try {
    if (await verifyAdmin(current)) await openDashboard(current);
    else {
      saveSession(null);
      showLogin();
      loginMessage.textContent = 'У этой учётной записи нет доступа к панели организатора.';
    }
  } catch (error) {
    console.error(error);
    showLogin();
    loginMessage.textContent = 'Не удалось проверить права администратора. Проверьте SQL-настройку Supabase.';
  }
}

loginForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!configured()) return;

  loginMessage.textContent = '';
  loginButton.disabled = true;
  loginButton.textContent = 'Входим…';

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  try {
    const data = await authRequest('/auth/v1/token?grant_type=password', { email, password });
    const current = normalizeSession(data);

    if (!(await verifyAdmin(current))) {
      loginMessage.textContent = 'У этой учётной записи нет доступа к панели организатора.';
      return;
    }

    saveSession(current);
    await openDashboard(current);
  } catch (error) {
    console.error(error);
    loginMessage.textContent = 'Не удалось войти. Проверьте email, пароль и настройки Supabase.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Войти';
  }
});

document.getElementById('logoutButton')?.addEventListener('click', async () => {
  const current = await ensureSession();
  if (current?.access_token) {
    try { await authRequest('/auth/v1/logout', null, current.access_token); } catch {}
  }
  saveSession(null);
  showLogin();
});

document.getElementById('refreshButton')?.addEventListener('click', () => loadBookings());
document.getElementById('exportButton')?.addEventListener('click', exportCsv);
searchInput?.addEventListener('input', applyFilter);

async function openDashboard(current) {
  session = current;
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  adminIdentity.textContent = 'Закрытая панель организатора';
  await loadBookings();
}

function showLogin() {
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
  allRows = [];
  tableBody.innerHTML = '';
}

async function loadBookings() {
  const current = await ensureSession();
  if (!current) {
    showLogin();
    loginMessage.textContent = 'Сессия завершилась. Войдите снова.';
    return;
  }

  statusLine.textContent = 'Обновляем данные…';
  try {
    const [bookings, seats] = await Promise.all([
      restGet('/rest/v1/bookings?select=id,full_name,phone,email,created_at&order=created_at.desc', current.access_token),
      restGet('/rest/v1/reserved_seats?select=booking_id,sector,row_num,seat_num,status,created_at&order=created_at.desc', current.access_token)
    ]);

    const seatsByBooking = new Map();
    (seats || []).forEach(seat => {
      if (!seatsByBooking.has(seat.booking_id)) seatsByBooking.set(seat.booking_id, []);
      seatsByBooking.get(seat.booking_id).push(seat);
    });

    allRows = (bookings || []).map(booking => ({
      ...booking,
      seats: (seatsByBooking.get(booking.id) || []).sort(sortSeats)
    }));

    bookingCount.textContent = String(allRows.length);
    seatCount.textContent = String((seats || []).length);
    lastBooking.textContent = allRows.length ? formatDate(allRows[0].created_at) : '—';
    searchInput.value = '';
    renderRows(allRows);
    statusLine.textContent = `Показано бронирований: ${allRows.length}`;
  } catch (error) {
    console.error(error);
    statusLine.textContent = `Ошибка загрузки: ${error.message}`;
    if (error.status === 401) {
      saveSession(null);
      showLogin();
    }
  }
}

function sortSeats(a, b) {
  return a.sector.localeCompare(b.sector, 'ru') || a.row_num - b.row_num || a.seat_num - b.seat_num;
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderRows(allRows);
    statusLine.textContent = `Показано бронирований: ${allRows.length}`;
    return;
  }

  const filtered = allRows.filter(row => {
    const seatsText = row.seats.map(formatSeat).join(' ');
    return [row.full_name, row.phone, row.email, seatsText].join(' ').toLowerCase().includes(q);
  });
  renderRows(filtered);
  statusLine.textContent = `Найдено: ${filtered.length} из ${allRows.length}`;
}

function renderRows(rows) {
  tableBody.innerHTML = '';
  emptyState.classList.toggle('hidden', rows.length > 0);
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="person-name">${escapeHtml(row.full_name)}</span></td>
      <td><a class="contact-link" href="tel:${escapeAttr(row.phone)}">${escapeHtml(row.phone)}</a></td>
      <td><a class="contact-link" href="mailto:${escapeAttr(row.email)}">${escapeHtml(row.email)}</a></td>
      <td><div class="seat-list">${row.seats.map(seat => `<span class="seat-chip">${escapeHtml(formatSeat(seat))}</span>`).join('')}</div></td>
      <td>${escapeHtml(formatDate(row.created_at))}</td>`;
    tableBody.appendChild(tr);
  });
}

function formatSeat(seat) {
  return `${seat.sector}: ряд ${seat.row_num}, место ${seat.seat_num}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function exportCsv() {
  if (!allRows.length) {
    alert('Пока нечего выгружать.');
    return;
  }
  const lines = [
    ['ФИО', 'Телефон', 'Email', 'Места', 'Дата брони'],
    ...allRows.map(row => [row.full_name, row.phone, row.email, row.seats.map(formatSeat).join('; '), formatDate(row.created_at)])
  ];
  const csv = '\uFEFF' + lines.map(cols => cols.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

init();
