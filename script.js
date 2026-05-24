/* ============================================================
   DATOS
============================================================ */
const SPECIALISTS = [
  { id: 1, name: 'Valentina', specialty: 'Uñas y acrílicas',   schedule: 'Lun–Sáb · 9am–5pm',  photo: 'https://i.pravatar.cc/200?img=1'  },
  { id: 2, name: 'Isabella',  specialty: 'Corte y coloración', schedule: 'Mar–Sáb · 10am–6pm', photo: 'https://i.pravatar.cc/200?img=5'  },
  { id: 3, name: 'Camila',    specialty: 'Cejas y pestañas',   schedule: 'Lun–Vie · 9am–4pm',  photo: 'https://i.pravatar.cc/200?img=9'  },
  { id: 4, name: 'Daniela',   specialty: 'Facial y masajes',   schedule: 'Mié–Dom · 11am–7pm', photo: 'https://i.pravatar.cc/200?img=10' },
];

const TIME_SLOTS = ['9:00am','10:00am','11:00am','12:00pm','2:00pm','3:00pm','4:00pm','5:00pm'];

const SERVICES = ['Manicure','Pedicure','Uñas acrílicas','Corte','Coloración','Cejas','Pestañas','Facial'];

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_LABELS  = ['L','M','M','J','V','S','D'];

/* ============================================================
   ESTADO
============================================================ */
const _now = new Date();

let state = {
  step:       1,                      // 1 | 2 | 3 | 4 (confirmación)
  specialist: null,                   // objeto de SPECIALISTS
  date:       '',                     // "YYYY-MM-DD"
  time:       '',                     // "HH:MMam/pm"
  form:       {},                     // { name, phone, email, service }
  calYear:    _now.getFullYear(),     // año visible en el calendario
  calMonth:   _now.getMonth(),        // mes visible en el calendario (0-11)
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
  const date   = isoToDate(iso);
  const DAYS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
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
    const label  = document.getElementById('l' + i);
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
  main.style.opacity    = '0';
  main.style.transform  = 'translateY(-8px)';

  setTimeout(() => {
    let html = '';
    switch (state.step) {
      case 1: html = tplStep1();   break;
      case 2: html = tplStep2();   break;
      case 3: html = tplStep3();   break;
      case 4: html = tplConfirm(); break;
    }
    main.innerHTML = html;

    main.style.transition = '';
    main.style.opacity    = '1';
    main.style.transform  = 'translateY(0)';

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
  const today  = todayMidnight();
  const maxD   = maxDate();
  const y      = state.calYear;
  const m      = state.calMonth;

  // Offset lunes-primero: Dom=6, Lun=0, Mar=1, ...
  const firstDow = new Date(y, m, 1).getDay();
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const totalDays = new Date(y, m + 1, 0).getDate();

  // Controles de navegación
  const prevLast  = new Date(y, m, 0);   // último día del mes anterior
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
    const iso        = dateToISO(date);
    const isSun      = date.getDay() === 0;
    const isPast     = date < today;
    const isFuture   = date > maxD;
    const isDisabled = isSun || isPast || isFuture;
    const isToday    = date.getTime() === today.getTime();
    const isSelected = state.date === iso;

    let cls = 'cal-day';
    if (isDisabled) cls += ' cal-disabled';
    if (isSun)      cls += ' cal-sunday';
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
    return `
      <button
        class="time-btn${sel ? ' selected' : ''}"
        aria-pressed="${sel}"
        aria-label="Hora ${t}"
        onclick="pickTime('${t}')"
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
  const opts = SERVICES.map(sv =>
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
            placeholder="Ej: María García" value="${f.name||''}"
            required autocomplete="name">
        </div>

        <div class="form-group">
          <label class="form-label" for="iPhone">Teléfono</label>
          <input class="form-input" type="tel" id="iPhone" name="phone"
            placeholder="Ej: 300 123 4567" value="${f.phone||''}"
            required autocomplete="tel">
        </div>

        <div class="form-group">
          <label class="form-label" for="iEmail">Correo electrónico</label>
          <input class="form-input" type="email" id="iEmail" name="email"
            placeholder="Ej: maria@correo.com" value="${f.email||''}"
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
              ${SERVICES.map(sv => {
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
  const s         = state.specialist;
  const nombre    = state.form.name    || '';
  const servicio  = state.form.service || '';
  const telefono  = state.form.phone   || '';
  const correo    = state.form.email   || '';
  const firstName = nombre.split(' ')[0]; // solo el primer nombre para el saludo

  return `
    <div class="step-view confirm-screen">

      <div class="check-circle" role="img" aria-label="Cita confirmada exitosamente">
        <svg viewBox="0 0 48 48" width="46" height="46" fill="none">
          <polyline points="10,25 20,35 38,14"
            stroke="white" stroke-width="4.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h2 class="confirm-title">¡Gracias, <em>${firstName}!</em></h2>

      <p class="confirm-subtitle">Tu cita está confirmada</p>

      <!-- Detalle de la cita -->
      <div class="confirm-card">
        <div class="confirm-row">
          <span class="confirm-icon">👤</span>
          <div>
            <span class="confirm-row-label">Cliente</span>
            <span class="confirm-row-value">${nombre}</span>
          </div>
        </div>
        <div class="confirm-row">
          <span class="confirm-icon">✂️</span>
          <div>
            <span class="confirm-row-label">Especialista</span>
            <span class="confirm-row-value">${s.name} · <em>${s.specialty}</em></span>
          </div>
        </div>
        <div class="confirm-row">
          <span class="confirm-icon">💆</span>
          <div>
            <span class="confirm-row-label">Servicio</span>
            <span class="confirm-row-value">${servicio}</span>
          </div>
        </div>
        <div class="confirm-row">
          <span class="confirm-icon">📅</span>
          <div>
            <span class="confirm-row-label">Fecha y hora</span>
            <span class="confirm-row-value">${spanishDate(state.date)} · ${state.time}</span>
          </div>
        </div>
        <div class="confirm-row">
          <span class="confirm-icon">📱</span>
          <div>
            <span class="confirm-row-label">Contacto</span>
            <span class="confirm-row-value">${telefono} · ${correo}</span>
          </div>
        </div>
      </div>

      <p class="confirm-secondary">
        Recibirás un recordatorio en tu WhatsApp<br>y correo electrónico.
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

  document.querySelectorAll('.spec-card').forEach(c => {
    const isSelected = Number(c.dataset.id) === id;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  setTimeout(() => goTo(2), 250);
}

function pickDate(iso) {
  state.date = iso;

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

  refreshNextBtn();
}

function pickTime(t) {
  state.time = t;

  document.querySelectorAll('.time-btn').forEach(btn => {
    const sel = btn.textContent.trim() === t;
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-pressed', sel ? 'true' : 'false');
  });
  refreshNextBtn();
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
  state.form = {
    name:    get('iName'),
    phone:   get('iPhone'),
    email:   get('iEmail'),
    service: state.form.service || '', // viene de pickService(), no del DOM
  };
}

function toggleServiceSelect() {
  const sel = document.getElementById('serviceSelect');
  if (!sel) return;
  const isOpen = sel.classList.toggle('open');
  sel.querySelector('.cs-trigger').setAttribute('aria-expanded', isOpen);
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

function submitForm(e) {
  e.preventDefault();
  snapshotForm();

  const form = document.getElementById('bookingForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validar custom select manualmente (no participa en checkValidity)
  if (!state.form.service) {
    const sel = document.getElementById('serviceSelect');
    if (sel) {
      sel.classList.add('cs-error');
      sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => sel.classList.remove('cs-error'), 2000);
    }
    return;
  }

  const btn = document.getElementById('btnConfirm');
  btn.innerHTML = '<div class="btn-spinner"></div> Confirmando...';
  btn.disabled = true;

  setTimeout(() => {
    state.step = 4;
    render();
  }, 1500);
}

function restart() {
  const now = new Date();
  state = {
    step:      1,
    specialist: null,
    date:       '',
    time:       '',
    form:       {},
    calYear:    now.getFullYear(),
    calMonth:   now.getMonth(),
  };
  render();
}

/* ============================================================
   CERRAR CUSTOM SELECT AL HACER CLICK FUERA
============================================================ */
document.addEventListener('click', function(e) {
  const sel = document.getElementById('serviceSelect');
  if (sel && !sel.contains(e.target)) {
    sel.classList.remove('open');
    const trigger = sel.querySelector('.cs-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
});

/* ============================================================
   INICIO
============================================================ */
render();
