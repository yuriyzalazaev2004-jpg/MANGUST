const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = window.APP_CONFIG || {};

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

let db = null;
let allRows = [];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('YOUR_KEY')) {
  loginMessage.textContent = 'Сначала вставьте Publishable key в js/config.js.';
  loginButton.disabled = true;
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  initAdmin();
}

async function initAdmin() {
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    await openDashboard(session.user);
  } else {
    showLogin();
  }

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      showLogin();
    }
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!db) return;

  loginMessage.textContent = '';
  loginButton.disabled = true;
  loginButton.textContent = 'Входим…';

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    loginMessage.textContent = 'Не удалось войти. Проверьте email и пароль.';
    loginButton.disabled = false;
    loginButton.textContent = 'Войти';
    return;
  }

  await openDashboard(data.user);
  loginButton.disabled = false;
  loginButton.textContent = 'Войти';
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  if (!db) return;
  await db.auth.signOut();
  showLogin();
});

document.getElementById('refreshButton').addEventListener('click', () => loadBookings());
document.getElementById('exportButton').addEventListener('click', exportCsv);
searchInput.addEventListener('input', applyFilter);

async function openDashboard(user) {
  const isAdmin = await verifyAdmin(user.id);

  if (!isAdmin) {
    await db.auth.signOut();
    showLogin();
    loginMessage.textContent = 'У этой учётной записи нет доступа к панели организатора.';
    return;
  }

  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  adminIdentity.textContent = `Вход: ${user.email || 'организатор'}`;
  await loadBookings();
}

function showLogin() {
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
  allRows = [];
  tableBody.innerHTML = '';
}

async function verifyAdmin(userId) {
  const { data, error } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Admin check error:', error);
    return false;
  }
  return Boolean(data);
}

async function loadBookings() {
  statusLine.textContent = 'Обновляем данные…';

  const [bookingsResult, seatsResult] = await Promise.all([
    db.from('bookings')
      .select('id, full_name, phone, email, created_at')
      .order('created_at', { ascending: false }),
    db.from('reserved_seats')
      .select('booking_id, sector, row_num, seat_num, status, created_at')
      .order('created_at', { ascending: false })
  ]);

  if (bookingsResult.error) {
    console.error(bookingsResult.error);
    statusLine.textContent = 'Ошибка загрузки бронирований. Проверьте права администратора в Supabase.';
    return;
  }
  if (seatsResult.error) {
    console.error(seatsResult.error);
    statusLine.textContent = 'Ошибка загрузки мест.';
    return;
  }

  const seatsByBooking = new Map();
  (seatsResult.data || []).forEach(seat => {
    if (!seatsByBooking.has(seat.booking_id)) seatsByBooking.set(seat.booking_id, []);
    seatsByBooking.get(seat.booking_id).push(seat);
  });

  allRows = (bookingsResult.data || []).map(booking => ({
    ...booking,
    seats: (seatsByBooking.get(booking.id) || []).sort(sortSeats)
  }));

  bookingCount.textContent = String(allRows.length);
  seatCount.textContent = String((seatsResult.data || []).length);
  lastBooking.textContent = allRows.length ? formatDate(allRows[0].created_at) : '—';

  searchInput.value = '';
  renderRows(allRows);
  statusLine.textContent = `Показано бронирований: ${allRows.length}`;
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
    return [row.full_name, row.phone, row.email, seatsText]
      .join(' ')
      .toLowerCase()
      .includes(q);
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
      <td>${escapeHtml(formatDate(row.created_at))}</td>
    `;

    tableBody.appendChild(tr);
  });
}

function formatSeat(seat) {
  return `${seat.sector}: ряд ${seat.row_num}, место ${seat.seat_num}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function exportCsv() {
  if (!allRows.length) {
    alert('Пока нечего выгружать.');
    return;
  }

  const lines = [
    ['ФИО', 'Телефон', 'Email', 'Места', 'Дата брони'],
    ...allRows.map(row => [
      row.full_name,
      row.phone,
      row.email,
      row.seats.map(formatSeat).join('; '),
      formatDate(row.created_at)
    ])
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
  const text = String(value ?? '').replaceAll('"', '""');
  return `"${text}"`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
