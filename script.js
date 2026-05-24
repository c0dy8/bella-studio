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

/* ============================================================
   ESTADO
============================================================ */
let state = {
  step:       1,    // 1 | 2 | 3 | 4 (confirmación)
  specialist: null, // objeto de SPECIALISTS
  date:       '',   // "YYYY-MM-DD"
  time:       '',   // "HH:MMam/pm"
  form:       {},   // { name, phone, email, service }
};

/* ============================================================
   UTILIDADES DE FECHA
============================================================ */
function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function maxISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function isSunday(iso) {
  if (!iso) return false;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

function spanishDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date   = new Date(y, m - 1, d);
  const DAYS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/* ============================================================
   BARRA DE PROGRESO
============================================================ */
const CHECK_SVG = `<svg viewBox="0 0 20 20" width="15" height="15" fill="none">
  <polyline points="4,10 8.5,15 16,6" stroke="#b86a4a" stroke-width="2.8"
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
   RENDERIZADO
============================================================ */
function render() {
  const main = document.getElementById('main');

  // Salida suave
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

    // Entrada suave
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
      <button class="btn-back" onclick="goTo(1)" aria-label="Volver a elegir especialista">← Volver</button>

      <div class="mini-card">
        <img class="mini-photo" src="${s.photo}" alt="${s.name}">
        <div>
          <div class="mini-name">${s.name}</div>
          <div class="mini-specialty">${s.specialty}</div>
        </div>
      </div>

      <h2 class="sec-title">Fecha y hora</h2>
      <p class="sec-sub">Disponibilidad en los próximos 30 días</p>

      <label class="form-label" for="dateInput">Fecha</label>
      <input
        class="date-input"
        type="date"
        id="dateInput"
        min="${todayISO()}"
        max="${maxISO()}"
        value="${state.date}"
        aria-label="Selecciona la fecha de tu cita"
        onchange="pickDate(this.value)"
      >

      <div class="alert-box" id="sundayAlert" role="alert" aria-live="assertive">
        ⚠️ Los domingos no tenemos atención. Por favor elige otro día.
      </div>

      <label class="form-label">Hora</label>
      <div class="time-grid">${timeButtons}</div>

      <button
        class="btn-primary"
        id="btnNext"
        onclick="goTo(3)"
        ${!state.date || !state.time ? 'disabled' : ''}
        aria-label="Ir al paso de confirmación"
      >Siguiente →</button>
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
      <button class="btn-back" onclick="goTo(2)" aria-label="Volver a elegir fecha y hora">← Volver</button>

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
          <label class="form-label" for="iService">Servicio deseado</label>
          <select class="form-select" id="iService" name="service" required>
            <option value="" disabled${!f.service?' selected':''}>Selecciona un servicio</option>
            ${opts}
          </select>
        </div>

        <button type="submit" class="btn-primary" id="btnConfirm" style="margin-top:8px">
          Confirmar cita
        </button>

      </form>
    </div>`;
}

/* ============================================================
   TEMPLATE PANTALLA DE CONFIRMACIÓN
============================================================ */
function tplConfirm() {
  const s = state.specialist;
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
        Te esperamos el <strong>${spanishDate(state.date)}</strong><br>
        a las <strong>${state.time}</strong> con <strong>${s.name}</strong>.
      </p>

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

  // Resaltar tarjeta sin re-renderizar todo el paso
  document.querySelectorAll('.spec-card').forEach(c => {
    const isSelected = Number(c.dataset.id) === id;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  // Avanzar al paso 2 tras 250ms
  setTimeout(() => goTo(2), 250);
}

function pickDate(val) {
  const alertEl = document.getElementById('sundayAlert');
  const input   = document.getElementById('dateInput');

  if (isSunday(val)) {
    alertEl.classList.add('show');
    state.date = '';
    // Resetear el valor del input después de que el navegador lo asigne
    setTimeout(() => { input.value = ''; }, 0);
    setTimeout(() => alertEl.classList.remove('show'), 3800);
  } else {
    alertEl.classList.remove('show');
    state.date = val;
  }
  refreshNextBtn();
}

function pickTime(t) {
  state.time = t;

  // Actualizar botones sin re-renderizar todo el paso
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
  // Preservar datos del formulario si venimos del paso 3
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
    service: get('iService'),
  };
}

function submitForm(e) {
  e.preventDefault();
  snapshotForm();

  const form = document.getElementById('bookingForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Estado de carga en el botón
  const btn = document.getElementById('btnConfirm');
  btn.innerHTML = '<div class="btn-spinner"></div> Confirmando...';
  btn.disabled = true;

  // Simular envío con 1.5 segundos de espera
  setTimeout(() => {
    state.step = 4;
    render();
  }, 1500);
}

function restart() {
  state = { step: 1, specialist: null, date: '', time: '', form: {} };
  render();
}

/* ============================================================
   INICIO
============================================================ */
render();
