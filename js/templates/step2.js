import { state }                      from '../state.js';
import { TIME_SLOTS }                  from '../data.js';
import { MONTH_NAMES, DAY_LABELS,
         todayMidnight, maxDate,
         dateToISO, spanishDate }      from '../utils/dates.js';
import { slotToMinutes, formatDuration } from '../utils/time.js';

export function tplServiceSelector() {
  const s = state.specialist;
  if (!s || !s.serviceCategories) return '';
  return `
    <div class="svc-selector" id="svcSelector">
      <label class="form-label" style="margin-bottom:10px">Servicio</label>
      ${s.serviceCategories.map(cat => `
        <div class="svc-category">
          <div class="svc-cat-title">${cat.category}</div>
          <div class="svc-items">
            ${cat.items.map(item => {
              const sel = state.form.service === item.name;
              return `
                <button type="button"
                  class="svc-btn${sel ? ' svc-selected' : ''}"
                  data-service="${item.name}"
                  data-duration="${item.duration}"
                  onclick="pickServiceStep2('${item.name}', ${item.duration})">
                  <span class="svc-name">${item.name}</span>
                  <span class="svc-dur">${formatDuration(item.duration)}</span>
                </button>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}

export function tplCalendar() {
  const today = todayMidnight();
  const maxD  = maxDate();
  const y = state.calYear;
  const m = state.calMonth;

  const firstDow  = new Date(y, m, 1).getDay();
  const offset    = firstDow === 0 ? 6 : firstDow - 1;
  const totalDays = new Date(y, m + 1, 0).getDate();

  const prevLast  = new Date(y, m, 0);  prevLast.setHours(0,0,0,0);
  const nextFirst = new Date(y, m+1, 1); nextFirst.setHours(0,0,0,0);
  const canPrev = prevLast  >= today;
  const canNext = nextFirst <= maxD;

  let cells = '';
  for (let i = 0; i < offset; i++) cells += `<div class="cal-day cal-empty" aria-hidden="true"></div>`;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(y, m, d); date.setHours(0,0,0,0);
    const iso  = dateToISO(date);
    const isSun      = date.getDay() === 0;
    const isPast     = date < today;
    const isFuture   = date > maxD;
    const isDisabled = isSun || isPast || isFuture;
    const isToday    = date.getTime() === today.getTime();
    const isSelected = state.date === iso;

    let cls = 'cal-day';
    if (isDisabled)              cls += ' cal-disabled';
    if (isSun)                   cls += ' cal-sunday';
    if (isToday && !isDisabled)  cls += ' cal-today';
    if (isSelected)              cls += ' cal-selected';

    const interactive = isDisabled
      ? `aria-disabled="true"`
      : `tabindex="0" role="button" data-iso="${iso}"
         aria-label="${d} de ${MONTH_NAMES[m]}${isToday ? ' (hoy)' : ''}"
         onclick="pickDate('${iso}')"
         onkeydown="if(event.key==='Enter'||event.key===' ')pickDate('${iso}')"`;

    cells += `<div class="${cls}" ${interactive}>${d}</div>`;
  }

  const labelText = state.date
    ? `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="margin-right:5px;vertical-align:-1px">
        <circle cx="8" cy="8" r="7" fill="#4d8b6a"/>
        <polyline points="4.5,8 7,10.5 11.5,5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>${spanishDate(state.date)}`
    : 'Selecciona un día disponible';

  return `
    <div class="calendar" role="group" aria-label="Selector de fecha">
      <div class="cal-header">
        <button class="cal-nav" onclick="calPrev()" ${!canPrev ? 'disabled' : ''} aria-label="Mes anterior">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="cal-title-wrap">
          <span class="cal-title">${MONTH_NAMES[m]}</span>
          <span class="cal-year">${y}</span>
        </div>
        <button class="cal-nav" onclick="calNext()" ${!canNext ? 'disabled' : ''} aria-label="Mes siguiente">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <polyline points="7,4 13,10 7,16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="cal-grid">
        ${DAY_LABELS.map((n,i) => `<div class="cal-weekday${i===6?' cal-weekday-sun':''}">${n}</div>`).join('')}
        ${cells}
      </div>
      <div class="cal-label ${state.date ? 'cal-label-active' : ''}" id="calLabel">${labelText}</div>
    </div>`;
}

export function timeGridHTML() {
  const s          = state.specialist;
  const duration   = state.form.serviceDuration || 0;
  const closingMin = s ? (s.closingMinutes || 1020) : 1020;

  if (!state.form.service) return `<p class="no-slots-msg">Selecciona un servicio para ver los horarios disponibles.</p>`;
  if (!state.date)         return `<p class="no-slots-msg">Selecciona una fecha para ver los horarios disponibles.</p>`;

  const booked = state.bookedTimes || [];

  const isSlotDisabled = t => {
    const startMin = slotToMinutes(t);
    const endMin   = startMin + duration;
    if (booked.includes(t))  return true;
    if (endMin > closingMin) return true;
    return booked.some(b => { const bMin = slotToMinutes(b); return bMin > startMin && bMin < endMin; });
  };

  if (TIME_SLOTS.every(isSlotDisabled)) {
    return `<p class="no-slots-msg">No hay horarios disponibles para <strong>${state.form.service}</strong> en esta fecha. Por favor elige otro día.</p>`;
  }

  return TIME_SLOTS.map(t => {
    const sel      = state.time === t;
    const disabled = isSlotDisabled(t);
    const startMin = slotToMinutes(t);
    const endMin   = startMin + duration;
    const title    = booked.includes(t)  ? 'Horario ocupado'
                   : endMin > closingMin ? 'No alcanza antes del cierre'
                   : disabled            ? 'Hay una cita en ese rango horario' : '';
    return `
      <button
        class="time-btn${sel ? ' selected' : ''}${disabled ? ' time-unavail' : ''}"
        aria-pressed="${sel}"
        aria-label="Hora ${t}${title ? ` — ${title}` : ''}"
        onclick="${disabled ? '' : `pickTime('${t}')`}"
        ${disabled ? 'disabled' : ''}
        title="${title}"
      >${t}</button>`;
  }).join('');
}

export function tplStep2() {
  const s = state.specialist;
  return `
    <div class="step-view">
      <button class="btn-back" onclick="goTo(1)" aria-label="Volver a elegir especialista">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
          <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
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
      <p class="sec-sub">Elige el servicio, tu día y horario preferido</p>

      ${tplServiceSelector()}

      <label class="form-label" style="margin-bottom:12px">Fecha</label>
      <div id="calContainer">${tplCalendar()}</div>

      <label class="form-label" style="margin-bottom:10px; margin-top:4px">Hora</label>
      <div class="time-grid">${timeGridHTML()}</div>

      <button class="btn-primary" id="btnNext" onclick="goTo(3)"
        ${!state.form.service || !state.date || !state.time ? 'disabled' : ''}
        aria-label="Ir al paso de confirmación">
        Siguiente
        <svg class="btn-arrow" viewBox="0 0 20 20" width="18" height="18" fill="none">
          <line x1="4" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="11,5 16,10 11,15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>`;
}
