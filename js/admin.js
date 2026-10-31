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
    console.error('Supabase login error:', error);
    const raw = String(error?.message || 'Неизвестная ошибка');
    const lower = raw.toLowerCase();
    let friendly = raw;

    if (lower.includes('invalid login credentials')) {
      friendly = 'Supabase отклонил email или пароль: Invalid login credentials. Проверьте пароль именно у этого нового пользователя.';
    } else if (lower.includes('email not confirmed')) {
      friendly = 'Email ещё не подтверждён в Supabase.';
    } else if (lower.includes('email logins are disabled') || lower.includes('provider is disabled')) {
      friendly = 'Вход по email отключён в Supabase Authentication → Providers → Email.';
    } else if (lower.includes('failed to fetch') || lower.includes('network')) {
      friendly = 'Браузер не смог связаться с Supabase. Проверьте Project URL, интернет и настройки проекта.';
    }

    loginMessage.textContent = `Ошибка Supabase: ${friendly}`;
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

document.getElementById('refreshButton')?.addEventListener('click', async () => {await loadBookings();await loadContactMessages();});
document.getElementById('pdfButton')?.addEventListener('click',exportPdf);
document.getElementById('exportButton')?.addEventListener('click', exportCsv);
searchInput?.addEventListener('input', applyFilter);

async function openDashboard(current) {
  session = current;
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  adminIdentity.textContent = 'Закрытая панель организатора';
  await loadBookings();
  await loadContactMessages();
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
      <td>${escapeHtml(formatDate(row.created_at))}</td><td><button type="button" class="danger-btn delete-booking" data-id="${escapeAttr(row.id)}">Удалить бронь</button></td>`;
    if(row.full_name==='Резерв организаторов'){
      const td=tr.lastElementChild, btn=document.createElement('button');btn.type='button';btn.className='secondary-btn';btn.textContent='Пригласить гостя';btn.addEventListener('click',()=>inviteReserved(row.id));td.prepend(btn);
    }
    tr.querySelector(".delete-booking")?.addEventListener("click",()=>deleteBooking(row.id,row.full_name));
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

// Персональные приглашения
async function invitationRpc(name, payload, accessToken) {
 const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const data=await response.json().catch(()=>null);
 if(!response.ok) throw new Error(data?.message||`HTTP ${response.status}`);
 return data;
}
async function refreshInvitations(){
 const target=document.getElementById('invitationList'); if(!target)return;
 try{
  const current=await ensureSession();if(!current)return;
  const items=await restGet('/rest/v1/invitations?select=booking_id,status,created_at&order=created_at.desc',current.access_token);
  target.replaceChildren();
  if(!items.length){target.textContent='Приглашений пока нет.';return;}
  for(const item of items){const row=allRows.find(x=>x.id===item.booking_id);const el=document.createElement('p');el.className='invite-entry';el.textContent=`${row?.full_name||'Гость'} · ${(row?.seats||[]).map(formatSeat).join('; ')||'места освобождены'} · ${({'pending':'Ожидает ответа','accepted':'Придёт','declined':'Отказ'})[item.status]||item.status}`;target.append(el);}
 }catch(e){target.textContent='Не удалось загрузить приглашения: '+e.message;}
}
document.getElementById('invitationCreateForm')?.addEventListener('submit',async e=>{
 e.preventDefault();const msg=document.getElementById('inviteMessage');const btn=e.currentTarget.querySelector('button[type=submit]');
 try{
  const current=await ensureSession();if(!current)throw Error('Войдите в админ-панель');
  const lines=document.getElementById('inviteSeats').value.trim().split(/\n+/);
  const seats=lines.map(line=>{const bits=line.split(',').map(x=>x.trim());if(bits.length!==3||! /^-?\d+$/.test(bits[1])||!/^\d+$/.test(bits[2]))throw Error('Выберите места на схеме');return {sector:bits[0],row:Number(bits[1]),seat:Number(bits[2])};});
  btn.disabled=true;msg.textContent='Создаём…';
  const result=await invitationRpc('create_invitation',{p_name:document.getElementById('inviteName').value,p_seats:seats},current.access_token);
  const url=new URL('invite.html',location.href);url.searchParams.set('token',result.token);
  document.getElementById('inviteLink').value=url.href;document.getElementById('inviteLinkBox').classList.remove('hidden');msg.textContent='Приглашение создано. Места зарезервированы. Сохраните ссылку сейчас: повторно получить её нельзя.';
  await loadBookings();await refreshInvitations();
 }catch(err){msg.textContent='Ошибка: '+err.message;}finally{btn.disabled=false;}
});
document.getElementById('inviteCopy')?.addEventListener('click',async()=>{const input=document.getElementById('inviteLink');try{await navigator.clipboard.writeText(input.value);document.getElementById('inviteMessage').textContent='Ссылка скопирована';}catch{input.select();document.getElementById('inviteMessage').textContent='Выделите и скопируйте ссылку';}});
const originalLoadBookings=loadBookings;
loadBookings=async function(){await originalLoadBookings();await refreshInvitations();};

async function deleteBooking(id,name){
 if(!confirm(`Удалить бронь «${name}» и освободить все её места?`))return;
 try{const current=await ensureSession();if(!current)throw Error('Сессия завершилась');await invitationRpc('admin_delete_booking',{p_booking_id:id},current.access_token);await loadBookings();await refreshInvitations();}
 catch(e){alert('Не удалось удалить бронь: '+e.message+' (выполните SQL-файл 06).');}
}
async function loadContactMessages(){
 const target=document.getElementById('contactMessages');if(!target)return;
 try{const current=await ensureSession();if(!current)return;
 const rows=await restGet('/rest/v1/organizer_messages?select=id,full_name,phone,message,created_at&order=created_at.desc&limit=200',current.access_token);
 target.replaceChildren();if(!rows.length){target.textContent='Сообщений пока нет.';return;}
 for(const item of rows){const div=document.createElement('div');div.className='message-entry';
 const title=document.createElement('strong');title.textContent=`${item.full_name} · ${item.phone} · ${formatDate(item.created_at)}`;
 const body=document.createElement('p');body.textContent=item.message;div.append(title,body);target.append(div);}
 }catch(e){target.textContent='Не удалось загрузить сообщения: '+e.message+' (выполните SQL-файл 06).';}
}
function exportPdf(){
 if(!allRows.length){alert('Нет бронирований для PDF.');return;}
 const w=window.open('','_blank');if(!w){alert('Разрешите всплывающие окна для печати PDF.');return;}
 const body=allRows.map(r=>`<tr><td>${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.email)}</td><td>${escapeHtml(r.seats.map(formatSeat).join('; '))}</td><td>${escapeHtml(formatDate(r.created_at))}</td></tr>`).join('');
 w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Гости ДаБро</title><style>body{font:12px Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #aaa;padding:7px;text-align:left}h1{color:#98701d}@page{size:A4 landscape;margin:12mm}</style></head><body><h1>ДаБро — список гостей</h1><p>3 декабря · 19:00–20:30 · Москва, Тимирязевская, 17</p><table><thead><tr><th>ФИО</th><th>Телефон</th><th>Email</th><th>Места</th><th>Дата брони</th></tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);
 w.document.close();
}

async function inviteReserved(id){
 const name=prompt('Введите ФИО гостя для приглашения на это место:');if(!name)return;
 try{const current=await ensureSession();if(!current)throw Error('Сессия завершилась');
 const result=await invitationRpc('invite_reserved_seat',{p_booking_id:id,p_name:name.trim()},current.access_token);
 const url=new URL('invite.html',location.href);url.searchParams.set('token',result.token);
 const box=document.getElementById('inviteLinkBox');document.getElementById('inviteLink').value=url.href;box.classList.remove('hidden');
 document.getElementById('inviteMessage').textContent='Приглашение готово. Сохраните ссылку: повторно получить её нельзя.';
 await loadBookings();box.scrollIntoView({behavior:'smooth'});
 }catch(e){alert('Ошибка создания приглашения: '+e.message);}
}


// Визуальный выбор мест для приглашений. Номера рядов совпадают с публичной схемой.
const INVITE_HALL = {
 'ПАРТЕР': [[16,16],[17,17],[19,18],[19,18],[20,19],[20,19]],
 'АМФИТЕАТР': [[18,17],[19,18],[13,13],[13,12],[12,11],[10,10],[8,8]]
};
let inviteSector = 'ПАРТЕР';
let inviteSelected = new Map();
let inviteOccupied = new Set();
const inviteKey=(sector,row,seat)=>`${sector}::${row}::${seat}`;
async function refreshInviteOccupied(){
 try {
  const current=await ensureSession(); if(!current)return;
  const rows=await restGet('/rest/v1/reserved_seats?select=sector,row_num,seat_num',current.access_token);
  inviteOccupied=new Set(rows.map(s=>inviteKey(s.sector,s.row_num,s.seat_num)));
  renderInviteHall();
 }catch(err){const el=document.getElementById('inviteSeatSummary');if(el)el.textContent='Не удалось загрузить занятые места: '+err.message;}
}
function renderInviteHall(){
 const target=document.getElementById('inviteSeatMap');if(!target)return;
 target.replaceChildren();
 const stage=document.createElement('div');stage.className='invite-stage';stage.textContent='СЦЕНА';target.append(stage);
 const title=document.createElement('h3');title.textContent=inviteSector;target.append(title);
 INVITE_HALL[inviteSector].forEach(([left,right],index)=>{
  const row=index+1, line=document.createElement('div');line.className='invite-map-row';
  const bank=(start,end,step)=>{const wrap=document.createElement('div');wrap.className='invite-map-bank';for(let seat=start;step>0?seat<=end:seat>=end;seat+=step){
   const btn=document.createElement('button');btn.type='button';btn.className='invite-map-seat';btn.textContent=seat;
   const key=inviteKey(inviteSector,row,seat), occupied=inviteOccupied.has(key);
   btn.disabled=occupied;btn.classList.toggle('is-occupied',occupied);btn.classList.toggle('is-selected',inviteSelected.has(key));
   btn.setAttribute('aria-label',`${inviteSector}, ряд ${row}, место ${seat}`);
   btn.setAttribute('aria-pressed',String(inviteSelected.has(key)));
   btn.title=occupied?'Занято':`${inviteSector}, ряд ${row}, место ${seat}`;
   btn.addEventListener('click',()=>{
    if(inviteSelected.has(key))inviteSelected.delete(key);
    else if(inviteSelected.size>=6){alert('Можно выбрать максимум 6 мест для одного приглашения');return;}
    else inviteSelected.set(key,{sector:inviteSector,row,seat});
    syncInviteSelection();renderInviteHall();
   });wrap.append(btn);
  }return wrap;};
  line.append(bank(left+right,right+1,-1));
  const number=document.createElement('span');number.className='invite-map-row-number';number.textContent=row;line.append(number);
  line.append(bank(right,1,-1));target.append(line);
 });
 document.querySelectorAll('[data-invite-sector]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.inviteSector===inviteSector));
}
function syncInviteSelection(){
 const seats=[...inviteSelected.values()].sort((a,b)=>a.sector.localeCompare(b.sector,'ru')||a.row-b.row||a.seat-b.seat);
 const input=document.getElementById('inviteSeats');if(input)input.value=seats.map(s=>`${s.sector}, ${s.row}, ${s.seat}`).join('\n');
 const summary=document.getElementById('inviteSeatSummary');if(summary)summary.textContent=seats.length?`Выбрано мест: ${seats.length} — ${seats.map(s=>`${s.sector}, ряд ${s.row}, место ${s.seat}`).join('; ')}`:'Места не выбраны';
}
document.querySelectorAll('[data-invite-sector]').forEach(btn=>btn.addEventListener('click',()=>{inviteSector=btn.dataset.inviteSector;renderInviteHall();}));
document.getElementById('invitationCreateForm')?.addEventListener('submit',()=>{setTimeout(()=>{inviteSelected.clear();syncInviteSelection();refreshInviteOccupied();},1200);});
renderInviteHall();
const oldRefreshInvitations=refreshInvitations;
refreshInvitations=async function(){await oldRefreshInvitations();await refreshInviteOccupied();};
