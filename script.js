/* ============================================================
   SUPABASE CLIENT CONFIG
=========================================================== */
// ⚠️ IMPORTANTE: REEMPLAZA ESTAS VARIABLES CON TUS CREDENCIALES REALES
const SUPABASE_URL = 'https://irhhoqrukaedcnrvmadn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaGhvcXJ1a2FlZGNucnZtYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjIzNjgsImV4cCI6MjA5NTE5ODM2OH0.PuM1obEGmzKOvE1E5160u9LcmDCLwHsL96oR9AoZrHs';

// Inicializar cliente (la librería fue añadida en el index.html)
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ============================================================
   DATOS (Cargados dinámicamente con respaldo)
=========================================================== */
let SPECIALISTS = [];
let SERVICES = [];

const TIME_SLOTS = ['9:00am', '10:00am', '11:00am', '12:00pm', '2:00pm', '3:00pm', '4:00pm', '5:00pm'];

// Datos locales de respaldo si la conexión a Supabase falla
const MOCK_SPECIALISTS = [
  { id: 1, name: 'Valentina', specialty: 'Uñas y acrílicas',   schedule: 'Lun–Sáb · 9am–5pm',  photo: 'https://i.pravatar.cc/200?img=1', services: [{ name: 'Manicure' }, { name: 'Pedicure' }, { name: 'Uñas acrílicas' }] },
  { id: 2, name: 'Isabella',  specialty: 'Corte y coloración', schedule: 'Mar–Sáb · 10am–6pm', photo: 'https://i.pravatar.cc/200?img=5', services: [{ name: 'Corte' }, { name: 'Coloración' }] },
  { id: 3, name: 'Camila',    specialty: 'Cejas y pestañas',   schedule: 'Lun–Vie · 9am–4pm',  photo: 'https://i.pravatar.cc/200?img=9', services: [{ name: 'Cejas' }, { name: 'Pestañas' }] },
  { id: 4, name: 'Daniela',   specialty: 'Facial y masajes',   schedule: 'Mié–Dom · 11am–7pm', photo: 'https://i.pravatar.cc/200?img=10', services: [{ name: 'Facial' }] },
];

const MOCK_SERVICES = ['Manicure','Pedicure','Uñas acrílicas','Corte','Coloración','Cejas','Pestañas','Facial'];

async function initData() {
  console.log('%c[Bella Studio] Iniciando carga de datos...', 'color: #b86a4a; font-weight: bold;');
  
  if (!supabaseClient) {
    console.warn('⚠️ Supabase no está instanciado. Cargando datos locales de respaldo.');
    SPECIALISTS = MOCK_SPECIALISTS;
    SERVICES = MOCK_SERVICES;
    render();
    return;
  }
  
  try {
    // Obtener especialistas con sus servicios asociados usando la relación de base de datos
    const { data: specData, error: specErr } = await supabaseClient.from('specialists').select('*, services(name)').order('id');
    if (specErr) {
      console.error('❌ Error de Supabase al obtener especialistas:', specErr);
      SPECIALISTS = MOCK_SPECIALISTS;
    } else if (!specData || specData.length === 0) {
      console.warn('⚠️ La tabla specialists está vacía en Supabase. Cargando respaldo local.');
      SPECIALISTS = MOCK_SPECIALISTS;
    } else {
      console.log('✅ Especialistas cargados con éxito:', specData);
      SPECIALISTS = specData;
    }

    // Obtener servicios
    const { data: servData, error: servErr } = await supabaseClient.from('services').select('*').order('id');
    if (servErr) {
      console.error('❌ Error de Supabase al obtener servicios:', servErr);
      SERVICES = MOCK_SERVICES;
    } else if (!servData || servData.length === 0) {
      console.warn('⚠️ La tabla services está vacía en Supabase. Cargando respaldo local.');
      SERVICES = MOCK_SERVICES;
    } else {
      console.log('✅ Servicios cargados con éxito:', servData);
      SERVICES = servData.map(s => s.name);
    }
  } catch (error) {
    console.error('💥 Excepción crítica de red al conectar con Supabase:', error);
    SPECIALISTS = MOCK_SPECIALISTS;
    SERVICES = MOCK_SERVICES;
  }

  // Renderizar la UI con los datos cargados (ya sean de Supabase o mocks)
  render();
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/* ============================================================
  ESTADO
============================================================ */
const _now = new Date();

let state = {
  step: 1,                      // 1 | 2 | 3 | 4 (confirmación)
  specialist: null,                   // objeto de SPECIALISTS
  date:       '',                     // "YYYY-MM-DD"
  time:       '',                     // "HH:MMam/pm"
  form:       { name: '', phone: '', email: '', service: '', payment: '' }, // { name, phone, email, service }
  calYear:    _now.getFullYear(),     // año visible en el calendario
  calMonth:   _now.getMonth(),        // mes visible en el calendario (0-11)
  bookedTimes: [],                    // Lista de horas ocupadas para el especialista y fecha seleccionada
};

/* ============================================================
  UTILIDADES DE FECHA
============================================================ */
function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function maxDate() {
  const d = todayMidnight();
  d.setDate(d.getDate() + 30);
  return d;
}

function isoToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function spanishDate(iso) {
  if (!iso) return '';
  const date = isoToDate(iso);
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/* ============================================================
  BARRA DE PROGRESO
============================================================ */
const CHECK_SVG = `<svg viewBox="0 0 20 20" width="15" height="15" fill="none">
  <polyline points="4,10 8.5,15 16,6" stroke="#c9a96e" stroke-width="2.8"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function updateProgress(step) {
  const bar = document.getElementById('progressBar');
  bar.style.display = step === 4 ? 'none' : '';

  [1, 2, 3].forEach(i => {
    const circle = document.getElementById('c' + i);
    const label = document.getElementById('l' + i);
    circle.classList.remove('active', 'done');
    label.classList.remove('active');

    if (i < step) {
      circle.classList.add('done');
      circle.innerHTML = CHECK_SVG;
      circle.removeAttribute('aria-current');
    } else if (i === step) {
      circle.classList.add('active');
      circle.textContent = i;
      circle.setAttribute('aria-current', 'step');
      label.classList.add('active');
    } else {
      circle.textContent = i;
      circle.removeAttribute('aria-current');
    }
  });

  document.getElementById('ln1').classList.toggle('filled', step > 1);
  document.getElementById('ln2').classList.toggle('filled', step > 2);
}

/* ============================================================
  RENDERIZADO PRINCIPAL
============================================================ */
function render() {
  const main = document.getElementById('main');

  main.style.transition = 'opacity .18s ease, transform .18s ease';
  main.style.opacity = '0';
  main.style.transform = 'translateY(-8px)';

  setTimeout(() => {
    let html = '';
    switch (state.step) {
      case 1: html = tplStep1(); break;
      case 2: html = tplStep2(); break;
      case 3: html = tplStep3(); break;
      case 4: html = tplConfirm(); break;
    }
    main.innerHTML = html;

    main.style.transition = '';
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';

    updateProgress(state.step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 190);
}

/* ============================================================
  TEMPLATE PASO 1 — Elegir especialista
============================================================ */
function tplStep1() {
  const cards = SPECIALISTS.map(s => {
    const sel = state.specialist && state.specialist.id === s.id;
    return `
      <div
        class="spec-card${sel ? ' selected' : ''}"
        data-id="${s.id}"
        role="button"
        tabindex="0"
        aria-pressed="${sel}"
        aria-label="Seleccionar a ${s.name}, ${s.specialty}"
        onclick="pickSpecialist(${s.id})"
        onkeydown="if(event.key==='Enter'||event.key===' ')pickSpecialist(${s.id})"
      >
        <img class="spec-photo" src="${s.photo}" alt="Foto de ${s.name}" loading="lazy">
        <div class="spec-name">${s.name}</div>
        <div class="spec-specialty">${s.specialty}</div>
        <div class="spec-schedule">${s.schedule}</div>
      </div>`;
  }).join('');

  return `
    <div class="step-view">
      <h2 class="sec-title">Elige tu especialista</h2>
      <p class="sec-sub">Selecciona con quién deseas agendar tu cita</p>
      <div class="specialists-grid">${cards}</div>
    </div>`;
}

/* ============================================================
  CALENDARIO PERSONALIZADO
============================================================ */
function tplCalendar() {
  const today = todayMidnight();
  const maxD = maxDate();
  const y = state.calYear;
  const m = state.calMonth;

  // Offset lunes-primero: Dom=6, Lun=0, Mar=1, ...
  const firstDow = new Date(y, m, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const totalDays = new Date(y, m + 1, 0).getDate();

  // Controles de navegación
  const prevLast = new Date(y, m, 0);   // último día del mes anterior
  prevLast.setHours(0, 0, 0, 0);
  const nextFirst = new Date(y, m + 1, 1);
  nextFirst.setHours(0, 0, 0, 0);
  const canPrev = prevLast >= today;
  const canNext = nextFirst <= maxD;

  // Celdas vacías antes del primer día
  let cells = '';
  for (let i = 0; i < offset; i++) {
    cells += `<div class="cal-day cal-empty" aria-hidden="true"></div>`;
  }

  // Días del mes
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    const iso = dateToISO(date);
    const isSun = date.getDay() === 0;
    const isPast = date < today;
    const isFuture = date > maxD;
    const isDisabled = isSun || isPast || isFuture;
    const isToday = date.getTime() === today.getTime();
    const isSelected = state.date === iso;

    let cls = 'cal-day';
    if (isDisabled) cls += ' cal-disabled';
    if (isSun) cls += ' cal-sunday';
    if (isToday && !isDisabled) cls += ' cal-today';
    if (isSelected) cls += ' cal-selected';

    const interactive = isDisabled ? `aria-disabled="true"` : `
      tabindex="0"
      role="button"
      data-iso="${iso}"
      aria-label="${d} de ${MONTH_NAMES[m]}${isToday ? ' (hoy)' : ''}"
      onclick="pickDate('${iso}')"
      onkeydown="if(event.key==='Enter'||event.key===' ')pickDate('${iso}')"
    `;

    cells += `<div class="${cls}" ${interactive}>${d}</div>`;
  }

  // Etiqueta de fecha seleccionada
  const labelText = state.date
    ? `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="margin-right:5px;vertical-align:-1px">
        <circle cx="8" cy="8" r="7" fill="#c9a96e"/>
        <polyline points="4.5,8 7,10.5 11.5,5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>${spanishDate(state.date)}`
    : 'Selecciona un día disponible';

  return `
    <div class="calendar" role="group" aria-label="Selector de fecha">

      <!-- Encabezado: mes + navegación -->
      <div class="cal-header">
        <button
          class="cal-nav"
          onclick="calPrev()"
          ${!canPrev ? 'disabled' : ''}
          aria-label="Mes anterior"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="cal-title-wrap">
          <span class="cal-title">${MONTH_NAMES[m]}</span>
          <span class="cal-year">${y}</span>
        </div>

        <button
          class="cal-nav"
          onclick="calNext()"
          ${!canNext ? 'disabled' : ''}
          aria-label="Mes siguiente"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <polyline points="7,4 13,10 7,16" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Grilla de días -->
      <div class="cal-grid">
        ${DAY_LABELS.map((n, i) =>
    `<div class="cal-weekday${i === 6 ? ' cal-weekday-sun' : ''}">${n}</div>`
  ).join('')}
        ${cells}
      </div>

      <!-- Leyenda / fecha seleccionada -->
      <div class="cal-label ${state.date ? 'cal-label-active' : ''}" id="calLabel">
        ${labelText}
      </div>

    </div>`;
}

/* Actualizar solo el contenedor del calendario sin re-renderizar el paso */
function renderCalendar() {
  const container = document.getElementById('calContainer');
  if (container) container.innerHTML = tplCalendar();
}

function calPrev() {
  if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
  else { state.calMonth--; }
  renderCalendar();
}

function calNext() {
  if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
  else { state.calMonth++; }
  renderCalendar();
}

/* ============================================================
  TEMPLATE PASO 2 — Fecha y hora
============================================================ */
function tplStep2() {
  const s = state.specialist;
  const timeButtons = TIME_SLOTS.map(t => {
    const sel = state.time === t;
    const isBooked = state.bookedTimes && state.bookedTimes.includes(t);
    return `
      <button
        class="time-btn${sel ? ' selected' : ''}"
        aria-pressed="${sel}"
        aria-label="Hora ${t}"
        onclick="pickTime('${t}')"
        ${isBooked ? 'disabled' : ''}
      >${t}</button>`;
  }).join('');

  return `
    <div class="step-view">
      <button class="btn-back" onclick="goTo(1)" aria-label="Volver a elegir especialista">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
          <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.3"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Volver
      </button>

      <div class="mini-card">
        <img class="mini-photo" src="${s.photo}" alt="${s.name}">
        <div>
          <div class="mini-name">${s.name}</div>
          <div class="mini-specialty">${s.specialty}</div>
        </div>
      </div>

      <h2 class="sec-title">Fecha y hora</h2>
      <p class="sec-sub">Elige tu día y bloque horario preferido</p>

      <label class="form-label" style="margin-bottom:12px">Fecha</label>
      <div id="calContainer">${tplCalendar()}</div>

      <label class="form-label" style="margin-bottom:10px; margin-top:4px">Hora</label>
      <div class="time-grid">${timeButtons}</div>

      <button
        class="btn-primary"
        id="btnNext"
        onclick="goTo(3)"
        ${!state.date || !state.time ? 'disabled' : ''}
        aria-label="Ir al paso de confirmación"
      >
        Siguiente
        <svg class="btn-arrow" viewBox="0 0 20 20" width="18" height="18" fill="none">
          <line x1="4" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="11,5 16,10 11,15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>`;
}

/* ============================================================
  TEMPLATE PASO 3 — Datos y confirmación
============================================================ */
function tplStep3() {
  const s    = state.specialist;
  const f    = state.form;
  
  // Filtrar servicios específicos del especialista seleccionado
  const specServices = s && s.services ? s.services.map(sv => sv.name) : [];
  const opts = specServices.map(sv =>
    `<option value="${sv}"${f.service === sv ? ' selected' : ''}>${sv}</option>`
  ).join('');

  return `
    <div class="step-view">
      <button class="btn-back" onclick="goTo(2)" aria-label="Volver a elegir fecha y hora">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
          <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.3"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Volver
      </button>

      <h2 class="sec-title">Confirma tu cita</h2>
      <p class="sec-sub">Revisa los detalles y completa tus datos</p>

      <div class="summary-card" role="region" aria-label="Resumen de tu cita">
        <img class="sum-photo" src="${s.photo}" alt="${s.name}">
        <div class="sum-info">
          <div class="sum-name">${s.name}</div>
          <div class="sum-specialty">${s.specialty}</div>
          <div class="sum-datetime">📅 ${spanishDate(state.date)} · ${state.time}</div>
        </div>
      </div>

      <form id="bookingForm" onsubmit="submitForm(event)" novalidate>

        <div class="form-group">
          <label class="form-label" for="iName">Nombre completo</label>
          <input class="form-input" type="text" id="iName" name="name"
            placeholder="Ej: María García" value="${f.name || ''}"
            required autocomplete="name"
            oninput="filterName(this)">
        </div>

        <div class="form-group">
          <label class="form-label" for="iPhone">Teléfono</label>
          <input class="form-input" type="tel" id="iPhone" name="phone"
            placeholder="Ej: 300 123 4567" value="${f.phone || ''}"
            required autocomplete="tel"
            oninput="filterPhone(this)">
        </div>

        <div class="form-group">
          <label class="form-label" for="iEmail">Correo electrónico</label>
          <input class="form-input" type="email" id="iEmail" name="email"
            placeholder="Ej: maria@correo.com" value="${f.email || ''}"
            required autocomplete="email">
        </div>

        <div class="form-group">
          <label class="form-label" for="cs-trigger">Servicio deseado</label>
          <div class="custom-select" id="serviceSelect">
            <button
              class="cs-trigger"
              id="cs-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded="false"
              onclick="toggleServiceSelect()"
            >
              <span class="cs-value${f.service ? '' : ' cs-placeholder'}" id="csLabel">
                ${f.service || 'Selecciona un servicio'}
              </span>
              <svg class="cs-chevron" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <polyline points="4,7 10,13 16,7" stroke="currentColor" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="cs-dropdown" role="listbox" aria-label="Servicios disponibles">
              ${specServices.map(sv => {
                const sel = f.service === sv;
                return `
                  <div
                    class="cs-option${sel ? ' cs-selected' : ''}"
                    role="option"
                    aria-selected="${sel}"
                    onclick="pickService('${sv}')"
                  >
                    <span>${sv}</span>
                    ${sel ? `<svg viewBox="0 0 16 16" width="15" height="15" fill="none">
                      <polyline points="3,8 6.5,11.5 13,5" stroke="#b86a4a" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>` : ''}
                  </div>`;
  }).join('')}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Método de pago</label>
          <div class="payment-methods" id="paymentMethods">

            <button type="button"
              class="pay-btn${f.payment === 'Efectivo' ? ' pay-selected' : ''}"
              data-method="Efectivo"
              onclick="pickPayment('Efectivo')">
              <svg class="pay-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3">
                <!-- Billete trasero superior-derecho -->
                <rect x="36" y="2" width="24" height="13" rx="2.5" transform="rotate(12 48 8.5)"/>
                <!-- Billete trasero inferior-izquierdo -->
                <rect x="4" y="49" width="24" height="13" rx="2.5" transform="rotate(12 16 55.5)"/>
                <!-- Billete principal -->
                <rect x="2" y="16" width="60" height="34" rx="5"/>
                <!-- Brackets en esquinas -->
                <path d="M9 22 L9 28 M9 22 L15 22"/>
                <path d="M55 22 L55 28 M55 22 L49 22"/>
                <path d="M9 44 L9 38 M9 44 L15 44"/>
                <path d="M55 44 L55 38 M55 44 L49 44"/>
                <!-- Círculo central -->
                <circle cx="32" cy="33" r="11"/>
                <!-- Signo $ -->
                <line x1="32" y1="25" x2="32" y2="41" stroke-width="2"/>
                <path d="M35.5 29 C35.5 26.5 28.5 26.5 28.5 29.5 C28.5 32.5 35.5 33 35.5 36 C35.5 39 28.5 39 28.5 36.5" stroke-width="2" fill="none"/>
              </svg>
              <span class="pay-label">Efectivo</span>
            </button>

            <button type="button"
              class="pay-btn${f.payment === 'Tarjeta' ? ' pay-selected' : ''}"
              data-method="Tarjeta"
              onclick="pickPayment('Tarjeta')">
              <svg class="pay-icon" viewBox="0 0 68 58" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3">
                <!-- Tarjeta trasera -->
                <rect x="16" y="2" width="50" height="32" rx="6" transform="rotate(-16 41 18)"/>
                <!-- Tarjeta frontal -->
                <rect x="2" y="21" width="60" height="35" rx="6"/>
                <!-- Chip -->
                <rect x="9" y="29" width="14" height="11" rx="3"/>
                <rect x="12" y="33" width="8" height="3" rx="1.5" stroke-width="2"/>
                <!-- Punto NFC -->
                <circle cx="40" cy="39" r="1.8" fill="currentColor" stroke="none"/>
                <!-- Ondas NFC -->
                <path d="M 44,35 A 4,4 0 0 1 44,43" stroke-width="2"/>
                <path d="M 44,32 A 7,7 0 0 1 44,46" stroke-width="2"/>
                <!-- Líneas número -->
                <line x1="9" y1="47" x2="22" y2="47"/>
                <line x1="26" y1="47" x2="39" y2="47"/>
                <line x1="43" y1="47" x2="56" y2="47"/>
                <!-- Línea nombre -->
                <line x1="9" y1="52" x2="32" y2="52"/>
              </svg>
              <span class="pay-label">Tarjeta</span>
            </button>

            <button type="button"
              class="pay-btn${f.payment === 'Transferencia' ? ' pay-selected' : ''}"
              data-method="Transferencia"
              onclick="pickPayment('Transferencia')">
              <svg class="pay-icon" viewBox="0 0 64 60" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <!-- Teléfono -->
                <rect x="2" y="1" width="30" height="58" rx="7" stroke-width="2.4"/>
                <!-- Notch superior -->
                <rect x="11" y="5" width="12" height="3" rx="1.5" stroke-width="2"/>
                <!-- Barra inferior -->
                <rect x="13" y="52" width="8" height="3" rx="1.5" stroke-width="2"/>
                <!-- Círculo dólar -->
                <circle cx="17" cy="30" r="11" stroke-width="2.3"/>
                <!-- Signo $ -->
                <line x1="17" y1="22" x2="17" y2="38" stroke-width="2"/>
                <path d="M21 25.5 Q21 23 17 23 Q13 23 13 26 Q13 29 17 29.5 Q21 30 21 33 Q21 36 17 36 Q13 36 13 33.5" stroke-width="2"/>
                <!-- Flecha derecha → (outline) -->
                <path d="M33 21 L49 21 L49 18 L60 27 L49 36 L49 33 L33 33 Z" stroke-width="2.3" fill="white"/>
                <!-- Flecha izquierda ← (outline) -->
                <path d="M60 39 L44 39 L44 36 L33 45 L44 54 L44 51 L60 51 Z" stroke-width="2.3" fill="white"/>
              </svg>
              <span class="pay-label">Transferencia</span>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" id="btnConfirm" style="margin-top:8px">
          Confirmar cita
          <svg class="btn-arrow" viewBox="0 0 20 20" width="18" height="18" fill="none">
            <line x1="4" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <polyline points="11,5 16,10 11,15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

      </form>
    </div>`;
}

/* ============================================================
  TEMPLATE PANTALLA DE CONFIRMACIÓN
============================================================ */
function tplConfirm() {
  const s = state.specialist;
  const firstName = (state.form.name || '').split(' ')[0];

  return `
    <div class="step-view confirm-screen">

      <div class="check-circle" role="img" aria-label="Cita confirmada exitosamente">
        <svg viewBox="0 0 48 48" width="46" height="46" fill="none">
          <polyline points="10,25 20,35 38,14"
            stroke="white" stroke-width="4.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h2 class="confirm-title">¡Tu cita está<br><em>confirmada!</em></h2>

      <p class="confirm-msg">
        Gracias, <strong>${firstName}</strong>. Te esperamos el
        <strong>${spanishDate(state.date)}</strong><br>
        a las <strong>${state.time}</strong> con <strong>${s.name}</strong>.
      </p>

      <p class="confirm-secondary">
        Método de pago: <strong>${state.form.payment || 'Efectivo'}</strong>.<br>
        Recibirás un recordatorio en tu WhatsApp y correo electrónico.
      </p>

      <button class="btn-outline" onclick="restart()" aria-label="Agendar otra cita desde el inicio">
        + Agendar otra cita
      </button>

    </div>`;
}

/* ============================================================
  ACCIONES
============================================================ */

function pickSpecialist(id) {
  state.specialist = SPECIALISTS.find(s => s.id === id);
  
  // Limpiar selección de fecha y hora previas al cambiar de especialista
  state.date = '';
  state.time = '';
  state.bookedTimes = [];

  document.querySelectorAll('.spec-card').forEach(c => {
    const isSelected = Number(c.dataset.id) === id;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  setTimeout(() => goTo(2), 250);
}

async function pickDate(iso) {
  // Validaciones lógicas de seguridad
  const targetDate = isoToDate(iso);
  const today = todayMidnight();
  const maxD = maxDate();
  const isSun = targetDate.getDay() === 0;
  const isPast = targetDate < today;
  const isFuture = targetDate > maxD;

  if (isSun || isPast || isFuture) {
    console.warn("⚠️ Intento de seleccionar fecha inválida bloqueado:", iso);
    return;
  }

  state.date = iso;
  state.time = ''; // Resetear hora al cambiar de fecha
  state.bookedTimes = []; // Limpiar ocupados mientras carga la nueva fecha

  if (typeof document !== 'undefined') {
    // Actualizar selección visual en el calendario sin re-renderizarlo
    document.querySelectorAll('.cal-day[data-iso]').forEach(el => {
      el.classList.remove('cal-selected');
    });
    const el = document.querySelector(`.cal-day[data-iso="${iso}"]`);
    if (el) el.classList.add('cal-selected');

    // Actualizar etiqueta de fecha seleccionada
    const label = document.getElementById('calLabel');
    if (label) {
      label.classList.add('cal-label-active');
      label.innerHTML = `
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="margin-right:5px;vertical-align:-1px">
          <circle cx="8" cy="8" r="7" fill="#c9a96e"/>
          <polyline points="4.5,8 7,10.5 11.5,5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>${spanishDate(iso)}`;
    }
  }

  refreshNextBtn();

  // Obtener las horas ya agendadas de Supabase de forma asíncrona
  await fetchBookedTimes(iso);
}

async function fetchBookedTimes(dateVal) {
  if (!supabaseClient || !state.specialist) return;
  
  try {
    // Usar la función RPC segura para evadir RLS de forma controlada y proteger la privacidad
    const { data, error } = await supabaseClient
      .rpc('get_booked_times', {
        p_specialist_id: state.specialist.id,
        p_date: dateVal
      });

    if (error) {
      console.error('❌ Error al consultar citas ocupadas (RPC):', error);
      state.bookedTimes = [];
    } else {
      // Mapear los datos garantizando la compatibilidad del formato retornado por PostgreSQL
      state.bookedTimes = data ? data.map(row => typeof row === 'object' && row !== null ? row.appointment_time : row) : [];
      console.log('📅 Horas ocupadas para este día:', state.bookedTimes);
    }
  } catch (error) {
    console.error('💥 Excepción al buscar citas ocupadas:', error);
    state.bookedTimes = [];
  }
  
  // Actualizar solo los botones horarios en pantalla de forma fluida (sin recargar toda la página)
  renderTimeGrid();
}

function renderTimeGrid() {
  const grid = document.querySelector('.time-grid');
  if (!grid) return;
  
  grid.innerHTML = TIME_SLOTS.map(t => {
    const sel = state.time === t;
    const isBooked = state.bookedTimes && state.bookedTimes.includes(t);
    return `
      <button
        class="time-btn${sel ? ' selected' : ''}"
        aria-pressed="${sel}"
        aria-label="Hora ${t}"
        onclick="pickTime('${t}')"
        ${isBooked ? 'disabled' : ''}
      >${t}</button>`;
  }).join('');
}

function pickTime(t) {
  if (!TIME_SLOTS.includes(t)) {
    console.warn("⚠️ Intento de seleccionar hora fuera de rango:", t);
    return;
  }
  if (state.bookedTimes && state.bookedTimes.includes(t)) {
    console.warn("⚠️ Intento de seleccionar hora ya reservada:", t);
    return;
  }

  state.time = t;

  if (typeof document !== 'undefined') {
    document.querySelectorAll('.time-btn').forEach(btn => {
      const sel = btn.textContent.trim() === t;
      btn.classList.toggle('selected', sel);
      btn.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
  }
  refreshNextBtn();
}

function pickPaymentMethod(method) {
  if (!state.form) state.form = {};
  state.form.payment_method = method;

  document.querySelectorAll('.pm-card').forEach(card => {
    const radio = card.querySelector('input');
    if (radio) {
      const isSelected = radio.value === method;
      card.classList.toggle('selected', isSelected);
      radio.checked = isSelected;
    }
  });
}

function refreshNextBtn() {
  const btn = document.getElementById('btnNext');
  if (btn) btn.disabled = !state.date || !state.time;
}

function goTo(step) {
  if (state.step === 3) snapshotForm();
  state.step = step;
  render();
}

function snapshotForm() {
  const get = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const pmRadio = document.querySelector('input[name="paymentMethod"]:checked');
  state.form = {
    name: get('iName'),
    phone: get('iPhone'),
    email: get('iEmail'),
    service: state.form.service || '',
    payment: state.form.payment || '',
  };
}

function toggleServiceSelect() {
  const sel = document.getElementById('serviceSelect');
  if (!sel) return;
  const isOpen = sel.classList.toggle('open');
  sel.querySelector('.cs-trigger').setAttribute('aria-expanded', isOpen);
}

function pickPayment(method) {
  state.form.payment = method;
  document.querySelectorAll('.pay-btn').forEach(b => {
    b.classList.toggle('pay-selected', b.dataset.method === method);
  });
  const pm = document.getElementById('paymentMethods');
  if (pm) pm.classList.remove('pay-error');
}

function pickService(value) {
  state.form.service = value;

  // Actualizar etiqueta del trigger
  const label = document.getElementById('csLabel');
  if (label) {
    label.textContent = value;
    label.classList.remove('cs-placeholder');
  }

  // Actualizar opciones: resaltar la elegida
  document.querySelectorAll('.cs-option').forEach(opt => {
    const isSel = opt.querySelector('span').textContent.trim() === value;
    opt.classList.toggle('cs-selected', isSel);
    opt.setAttribute('aria-selected', isSel);
    // Añadir o quitar el checkmark
    const existing = opt.querySelector('svg');
    if (isSel && !existing) {
      opt.insertAdjacentHTML('beforeend', `
        <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
          <polyline points="3,8 6.5,11.5 13,5" stroke="#b86a4a" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`);
    } else if (!isSel && existing) {
      existing.remove();
    }
  });

  // Cerrar dropdown
  const sel = document.getElementById('serviceSelect');
  if (sel) {
    sel.classList.remove('open', 'cs-error');
    sel.querySelector('.cs-trigger').setAttribute('aria-expanded', 'false');
  }
}

function filterName(el) {
  el.value = el.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/g, '').replace(/\s+/g, ' ');
}

function filterPhone(el) {
  el.value = el.value.replace(/\D/g, '');
}

async function submitForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (!state.specialist || !state.date || !state.time) {
    if (typeof alert !== 'undefined') {
      alert("Por favor selecciona un especialista, fecha y hora antes de continuar.");
    }
    return;
  }

  snapshotForm();

  // Mensajes de validación en español
  const nameEl = document.getElementById('iName');
  const phoneEl = document.getElementById('iPhone');
  const emailEl = document.getElementById('iEmail');

  if (nameEl) nameEl.setCustomValidity(
    !nameEl.value.trim() ? 'Por favor ingresa tu nombre completo' :
      /[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/.test(nameEl.value) ? 'El nombre solo puede contener letras' : ''
  );
  if (phoneEl) phoneEl.setCustomValidity(
    !phoneEl.value ? 'Por favor ingresa tu número de teléfono' :
      /\D/.test(phoneEl.value) ? 'El teléfono solo puede contener números' : ''
  );
  if (emailEl) emailEl.setCustomValidity(
    !emailEl.value ? 'Por favor ingresa tu correo electrónico' : ''
  );

  const form = document.getElementById('bookingForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validar custom select de servicio
  if (!state.form.service) {
    const sel = document.getElementById('serviceSelect');
    if (sel) {
      sel.classList.add('cs-error');
      sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => sel.classList.remove('cs-error'), 2000);
    }
    return;
  }

  // Validar método de pago
  if (!state.form.payment) {
    const pm = document.getElementById('paymentMethods');
    if (pm) {
      pm.classList.add('pay-error');
      pm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => pm.classList.remove('pay-error'), 2000);
    }
    return;
  }

  const btn = document.getElementById('btnConfirm');
  btn.innerHTML = '<div class="btn-spinner"></div> Confirmando...';
  btn.disabled = true;

  if (!supabaseClient) {
    alert("Falta configurar el cliente de Supabase.");
    btn.innerHTML = 'Confirmar cita';
    btn.disabled = false;
    return;
  }

  // Guardar cita en Supabase
  const { error } = await supabaseClient.from('appointments').insert([
    {
      specialist_id: state.specialist.id,
      appointment_date: state.date,
      appointment_time: state.time,
      customer_name: state.form.name,
      customer_phone: state.form.phone,
      customer_email: state.form.email,
      service_name: state.form.service,
      payment_method: state.form.payment || 'Efectivo'
    }
  ]);

  if (error) {
    console.error('Error al agendar:', error);
    alert('Hubo un error al confirmar tu cita. Por favor intenta de nuevo.');
    btn.innerHTML = 'Confirmar cita';
    btn.disabled = false;
    return;
  }

  state.step = 4;
  render();
}

function restart() {
  const now = new Date();
  state.step = 1;
  state.specialist = null;
  state.date = '';
  state.time = '';
  state.form = { name: '', phone: '', email: '', service: '', payment: '' };
  state.calYear = now.getFullYear();
  state.calMonth = now.getMonth();
  state.bookedTimes = [];
  render();
}

/* ============================================================
  CERRAR CUSTOM SELECT AL HACER CLICK FUERA AND INITIALIZATION
============================================================ */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    const sel = document.getElementById('serviceSelect');
    if (sel && !sel.contains(e.target)) {
      sel.classList.remove('open');
      const trigger = sel.querySelector('.cs-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });

  initData();
}

/* ============================================================
  EXPORTACIONES PARA PRUEBAS UNITARIAS (NODE.JS)
============================================================ */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    state,
    SPECIALISTS,
    SERVICES,
    TIME_SLOTS,
    todayMidnight,
    maxDate,
    isoToDate,
    dateToISO,
    spanishDate,
    filterName,
    filterPhone,
    pickTime,
    pickDate,
    pickPayment,
    pickService,
    submitForm,
    restart
  };
}
