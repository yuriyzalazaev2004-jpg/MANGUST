// ===== SUPABASE CONFIG =====
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DONATION_URL } = window.APP_CONFIG || {};

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_URL.includes('YOUR_PROJECT')) {
  console.error('Заполни js/config.js: SUPABASE_URL и SUPABASE_PUBLISHABLE_KEY');
  alert('Сайт ещё не подключён к Supabase. Заполни файл js/config.js.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ===== HALL CONFIGURATION (из фото 2) =====
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderHall();
  loadBookedSeats();
  setupEventListeners();
  setupRealtime();
});

// ===== RENDER HALL =====
function renderHall() {
  const floor = document.getElementById('hallFloor');
  const balcony = document.getElementById('hallBalcony');

  // Сцена — левая + правая части
  const stageRows = 10;
  for (let r = 1; r <= stageRows; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'hall-row';

    // Номер ряда слева
    const rowNumLeft = document.createElement('div');
    rowNumLeft.className = 'row-number';
    rowNumLeft.textContent = r;
    rowDiv.appendChild(rowNumLeft);

    // Левые места
    const leftConfig = HALL_CONFIG.stage_left.rows.find(row => row.row === r);
    if (leftConfig) {
      leftConfig.seats.forEach(seat => {
        rowDiv.appendChild(createSeat('Сцена', r, seat));
      });
    }

    // Проход
    const aisle = document.createElement('div');
    aisle.className = 'seat seat-aisle';
    rowDiv.appendChild(aisle);

    // Правые места
    const rightConfig = HALL_CONFIG.stage_right.rows.find(row => row.row === r);
    if (rightConfig) {
      rightConfig.seats.forEach(seat => {
        rowDiv.appendChild(createSeat('Сцена', r, seat));
      });
    }

    // Номер ряда справа
    const rowNumRight = document.createElement('div');
    rowNumRight.className = 'row-number';
    rowNumRight.textContent = r;
    rowDiv.appendChild(rowNumRight);

    floor.appendChild(rowDiv);
  }

  // Пульт
  const pultRow = document.createElement('div');
  pultRow.className = 'hall-row';
  const pultLabel = document.createElement('div');
  pultLabel.className = 'row-number';
  pultLabel.textContent = 'П';
  pultRow.appendChild(pultLabel);
  HALL_CONFIG.pult.seats.forEach(seat => {
    pultRow.appendChild(createSeat('Пульт', 1, seat));
  });
  floor.appendChild(pultRow);

  // Ряды 11-19
  for (let r = 11; r <= 19; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'hall-row';

    const rowNumLeft = document.createElement('div');
    rowNumLeft.className = 'row-number';
    rowNumLeft.textContent = r;
    rowDiv.appendChild(rowNumLeft);

    // Левая часть (1-18)
    for (let s = 1; s <= 18; s++) {
      rowDiv.appendChild(createSeat('Зал', r, s));
    }

    const aisle = document.createElement('div');
    aisle.className = 'seat seat-aisle';
    rowDiv.appendChild(aisle);

    // Правая часть (19-36)
    for (let s = 19; s <= 36; s++) {
      rowDiv.appendChild(createSeat('Зал', r, s));
    }

    const rowNumRight = document.createElement('div');
    rowNumRight.className = 'row-number';
    rowNumRight.textContent = r;
    rowDiv.appendChild(rowNumRight);

    floor.appendChild(rowDiv);
  }

  // Балкон
  HALL_CONFIG.balcony.sections.forEach(section => {
    const sectionLabel = document.createElement('div');
    sectionLabel.style.cssText = 'font-size:0.8rem; color:#999; margin: 1rem 0 0.5rem; text-align:center;';
    sectionLabel.textContent = section.label;
    balcony.appendChild(sectionLabel);

    section.rows.forEach(rowConfig => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'hall-row';

      const rowNum = document.createElement('div');
      rowNum.className = 'row-number';
      rowNum.textContent = rowConfig.row;
      rowDiv.appendChild(rowNum);

      rowConfig.seats.forEach(seat => {
        rowDiv.appendChild(createSeat('Балкон', rowConfig.row, seat));
      });

      const rowNumRight = document.createElement('div');
      rowNumRight.className = 'row-number';
      rowNumRight.textContent = rowConfig.row;
      rowDiv.appendChild(rowNumRight);

      balcony.appendChild(rowDiv);
    });
  });
}

function createSeat(sector, row, seat) {
  const seatEl = document.createElement('div');
  seatEl.className = 'seat seat-available';
  seatEl.textContent = seat;
  seatEl.dataset.sector = sector;
  seatEl.dataset.row = row;
  seatEl.dataset.seat = seat;

  seatEl.addEventListener('click', () => toggleSeat(seatEl));
  seatEl.addEventListener('mouseenter', (e) => showTooltip(e, sector, row, seat));
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

  const key = `${sector}-${row}-${seat}`;
  if (bookedSeats.has(key)) {
    tooltip.textContent = `${sector}, Ряд ${row}, Место ${seat} — занято`;
    tooltip.style.display = 'block';
  } else {
    tooltip.textContent = `${sector}, Ряд ${row}, Место ${seat}`;
    tooltip.style.display = 'block';
  }

  tooltip.style.left = e.clientX + 10 + 'px';
  tooltip.style.top = e.clientY - 40 + 'px';
}

function hideTooltip() {
  const tooltip = document.getElementById('seatTooltip');
  if (tooltip) tooltip.style.display = 'none';
}

// ===== SEAT SELECTION =====
function toggleSeat(el) {
  const sector = el.dataset.sector;
  const row = parseInt(el.dataset.row);
  const seat = parseInt(el.dataset.seat);
  const key = `${sector}-${row}-${seat}`;

  if (bookedSeats.has(key)) return;

  const index = selectedSeats.findIndex(s =>
    s.sector === sector && s.row === row && s.seat === seat
  );

  if (index > -1) {
    selectedSeats.splice(index, 1);
    el.classList.remove('seat-selected');
    el.classList.add('seat-available');
  } else {
    selectedSeats.push({ sector, row, seat });
    el.classList.remove('seat-available');
    el.classList.add('seat-selected');
  }

  updateSelectedPanel();
}

function updateSelectedPanel() {
  const list = document.getElementById('selectedSeatsList');
  const btnBook = document.getElementById('btnBook');

  list.innerHTML = '';
  selectedSeats.forEach((s, i) => {
    const tag = document.createElement('span');
    tag.className = 'selected-seat-tag';
    tag.innerHTML = `${s.sector}, Ряд ${s.row}, Место ${s.seat}
      <span class="remove-seat" data-index="${i}">&times;</span>`;
    list.appendChild(tag);
  });

  btnBook.disabled = selectedSeats.length === 0;

  // Remove handlers
  document.querySelectorAll('.remove-seat').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      const s = selectedSeats[idx];
      const key = `${s.sector}-${s.row}-${s.seat}`;
      const seatEl = document.querySelector(
        `.seat[data-sector="${s.sector}"][data-row="${s.row}"][data-seat="${s.seat}"]`
      );
      if (seatEl) {
        seatEl.classList.remove('seat-selected');
        seatEl.classList.add('seat-available');
      }
      selectedSeats.splice(idx, 1);
      updateSelectedPanel();
    });
  });
}

// ===== LOAD BOOKED SEATS =====
async function loadBookedSeats() {
  const { data, error } = await supabase
    .from('reserved_seats')
    .select('sector, row_num, seat_num');

  if (error) {
    console.error('Error loading bookings:', error);
    return;
  }

  data.forEach(b => {
    const key = `${b.sector}-${b.row_num}-${b.seat_num}`;
    bookedSeats.add(key);
    const seatEl = document.querySelector(
      `.seat[data-sector="${b.sector}"][data-row="${b.row_num}"][data-seat="${b.seat_num}"]`
    );
    if (seatEl) {
      seatEl.classList.remove('seat-available', 'seat-selected');
      seatEl.classList.add('seat-booked');
    }
  });
}

async function refreshBookedSeats() {
  bookedSeats.clear();
  document.querySelectorAll('.seat-booked').forEach(el => {
    el.classList.remove('seat-booked');
    el.classList.add('seat-available');
  });
  await loadBookedSeats();
}

// ===== REALTIME =====
function setupRealtime() {
  supabase
    .channel('bookings')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reserved_seats' }, payload => {
      const b = payload.new;
      const key = `${b.sector}-${b.row_num}-${b.seat_num}`;
      bookedSeats.add(key);
      const seatEl = document.querySelector(
        `.seat[data-sector="${b.sector}"][data-row="${b.row_num}"][data-seat="${b.seat_num}"]`
      );
      if (seatEl) {
        seatEl.classList.remove('seat-available', 'seat-selected');
        seatEl.classList.add('seat-booked');
      }
      // Remove from selected if was selected
      const idx = selectedSeats.findIndex(s =>
        s.sector === b.sector && s.row === b.row_num && s.seat === b.seat_num
      );
      if (idx > -1) {
        selectedSeats.splice(idx, 1);
        updateSelectedPanel();
      }
    })
    .subscribe();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Donate hero button
  document.getElementById('btnDonateHero').addEventListener('click', () => {
    openModal('modalDonation');
  });

  // Book button
  document.getElementById('btnBook').addEventListener('click', () => {
    if (selectedSeats.length === 0) return;
    openModal('modalRegister');
    updateFormSeatsInfo();
  });

  // Booking form submit
  document.getElementById('bookingForm').addEventListener('submit', handleBooking);

  // Close modals
  document.getElementById('closeRegister').addEventListener('click', () => closeModal('modalRegister'));
  document.getElementById('closeDonation').addEventListener('click', () => closeModal('modalDonation'));
  document.getElementById('closeSuccess').addEventListener('click', () => closeModal('modalSuccess'));

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Donation amounts
  document.querySelectorAll('.donation-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.donation-amount').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('customAmount').value = '';
    });
  });

  // Custom amount
  document.getElementById('customAmount').addEventListener('input', () => {
    document.querySelectorAll('.donation-amount').forEach(b => b.classList.remove('active'));
  });

  // Donate submit
  document.getElementById('btnDonateSubmit').addEventListener('click', handleDonation);

  // Donate after success
  document.getElementById('btnDonateAfter').addEventListener('click', () => {
    closeModal('modalSuccess');
    setTimeout(() => openModal('modalDonation'), 300);
  });

  // Skip donation
  document.getElementById('btnSkipDonation').addEventListener('click', () => {
    closeModal('modalSuccess');
  });

  // Zoom
  document.getElementById('btnZoom').addEventListener('click', () => {
    const container = document.getElementById('hallContainer');
    container.style.transform = container.style.transform === 'scale(1.5)' ? 'scale(1)' : 'scale(1.5)';
    container.style.transformOrigin = 'top center';
    container.style.transition = 'transform 0.3s';
  });
}

function updateFormSeatsInfo() {
  const info = document.getElementById('formSeatsInfo');
  info.innerHTML = '<strong>Выбранные места:</strong><br>' +
    selectedSeats.map(s => `${s.sector}, Ряд ${s.row}, Место ${s.seat}`).join('<br>');
}

// ===== BOOKING =====
async function handleBooking(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!fullName || !phone || !email) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  const btn = e.target.querySelector('.btn-submit');
  btn.textContent = 'Бронирование...';
  btn.disabled = true;

  try {
    const { data: bookingId, error } = await supabase.rpc('create_booking', {
      p_full_name: fullName,
      p_phone: phone,
      p_email: email,
      p_seats: selectedSeats
    });

    if (error) {
      if (error.code === '23505' || String(error.message).includes('SEAT_ALREADY_BOOKED')) {
        await refreshBookedSeats();
        throw new Error('Одно из выбранных мест уже успели забронировать. Выбери другое место.');
      }
      throw error;
    }

    // Mark seats as booked
    selectedSeats.forEach(s => {
      const key = `${s.sector}-${s.row}-${s.seat}`;
      bookedSeats.add(key);
      const seatEl = document.querySelector(
        `.seat[data-sector="${s.sector}"][data-row="${s.row}"][data-seat="${s.seat}"]`
      );
      if (seatEl) {
        seatEl.classList.remove('seat-selected');
        seatEl.classList.add('seat-booked');
      }
    });

    const seatText = selectedSeats.map(s => `${s.sector}, Ряд ${s.row}, Место ${s.seat}`).join(', ');
    document.getElementById('successMessage').textContent =
      `Вы забронировали: ${seatText}\nДанные отправлены на ${email}`;

    selectedSeats = [];
    updateSelectedPanel();
    closeModal('modalRegister');
    openModal('modalSuccess');

    e.target.reset();
  } catch (err) {
    console.error('Booking error:', err);
    alert(err.message || 'Ошибка бронирования. Попробуйте ещё раз.');
  } finally {
    btn.textContent = 'Забронировать';
    btn.disabled = false;
  }
}

// ===== DONATION =====
async function handleDonation() {
  const activeBtn = document.querySelector('.donation-amount.active');
  const customAmount = document.getElementById('customAmount').value;
  const amount = customAmount ? parseFloat(customAmount) : (activeBtn ? parseFloat(activeBtn.dataset.amount) : 1000);
  const donorName = document.getElementById('donorName').value.trim() || 'Аноним';
  const message = document.getElementById('donorMessage').value.trim();

  if (amount < 50) {
    alert('Минимальная сумма пожертвования — 50 ₽');
    return;
  }

  const btn = document.getElementById('btnDonateSubmit');
  btn.textContent = 'Обработка...';
  btn.disabled = true;

  try {
    // Записываем намерение перейти к пожертвованию.
    // Это НЕ подтверждение оплаты: реальную оплату подтверждает только DonationAlerts API/webhook.
    const { error } = await supabase.rpc('log_donation_intent', {
      p_donor_name: donorName,
      p_amount: amount,
      p_message: message
    });

    if (error) console.warn('Не удалось записать намерение пожертвования:', error);

    if (!DONATION_URL || DONATION_URL.includes('YOUR_CHANNEL')) {
      throw new Error('Заполни DONATION_URL в js/config.js');
    }

    btn.textContent = 'Переходим ❤️';
    setTimeout(() => {
      window.open(DONATION_URL, '_blank', 'noopener,noreferrer');
      closeModal('modalDonation');
      btn.textContent = 'Пожертвовать';
      btn.disabled = false;
    }, 500);

  } catch (err) {
    console.error('Donation error:', err);
    alert(err.message || 'Не удалось открыть страницу пожертвования.');
    btn.textContent = 'Пожертвовать';
    btn.disabled = false;
  }
}

// ===== MODAL HELPERS =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// ===== PHONE MASK =====
document.getElementById('phone').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 0) {
    if (value[0] === '7' || value[0] === '8') {
      value = value.substring(1);
    }
    let formatted = '+7';
    if (value.length > 0) formatted += ' (' + value.substring(0, 3);
    if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
    if (value.length >= 6) formatted += '-' + value.substring(6, 8);
    if (value.length >= 8) formatted += '-' + value.substring(8, 10);
    e.target.value = formatted;
  }
});