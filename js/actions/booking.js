import { state }                        from '../state.js';
import { SPECIALISTS }                  from '../store.js';
import { TIME_SLOTS }                   from '../data.js';
import { todayMidnight, maxDate,
         isoToDate, spanishDate }       from '../utils/dates.js';
import { slotToMinutes }                from '../utils/time.js';
import { fetchBookedTimes as apiFetch } from '../supabase.js';
import { goTo, renderTimeGrid,
         renderCalendar }               from './navigation.js';

export function pickSpecialist(id) {
  state.specialist = SPECIALISTS.find(s => s.id === id);
  state.date            = '';
  state.time            = '';
  state.bookedTimes     = [];
  state.form.service    = '';
  state.form.serviceDuration = 0;

  document.querySelectorAll('.spec-card').forEach(c => {
    const isSelected = Number(c.dataset.id) === id;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  setTimeout(() => goTo(2), 250);
}

export async function pickDate(iso) {
  const targetDate = isoToDate(iso);
  const today      = todayMidnight();
  const maxD       = maxDate();

  if (targetDate.getDay() === 0 || targetDate < today || targetDate > maxD) {
    console.warn('⚠️ Fecha inválida bloqueada:', iso);
    return;
  }

  state.date        = iso;
  state.time        = '';
  state.bookedTimes = [];

  document.querySelectorAll('.cal-day[data-iso]').forEach(el => el.classList.remove('cal-selected'));
  const el = document.querySelector(`.cal-day[data-iso="${iso}"]`);
  if (el) el.classList.add('cal-selected');

  const label = document.getElementById('calLabel');
  if (label) {
    label.classList.add('cal-label-active');
    label.innerHTML = `
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="margin-right:5px;vertical-align:-1px">
        <circle cx="8" cy="8" r="7" fill="#4d8b6a"/>
        <polyline points="4.5,8 7,10.5 11.5,5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>${spanishDate(iso)}`;
  }

  renderTimeGrid();
  refreshNextBtn();
  await fetchAndUpdateBookedTimes(iso);
}

async function fetchAndUpdateBookedTimes(dateVal) {
  state.bookedTimes = await apiFetch(dateVal);
  renderTimeGrid();
}

export function pickTime(t) {
  if (!TIME_SLOTS.includes(t)) { console.warn('⚠️ Hora fuera de rango:', t); return; }
  if (state.bookedTimes && state.bookedTimes.includes(t)) { console.warn('⚠️ Hora ya reservada:', t); return; }

  state.time = t;
  document.querySelectorAll('.time-btn').forEach(btn => {
    const sel = btn.textContent.trim() === t;
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-pressed', sel ? 'true' : 'false');
  });
  refreshNextBtn();
}

export function pickServiceStep2(name, duration) {
  state.form.service         = name;
  state.form.serviceDuration = duration;

  document.querySelectorAll('.svc-btn').forEach(btn => {
    btn.classList.toggle('svc-selected', btn.dataset.service === name);
  });

  if (state.time && state.specialist) {
    const closingMin = state.specialist.closingMinutes || 1020;
    const startMin   = slotToMinutes(state.time);
    const booked     = state.bookedTimes || [];
    
    const getDuration = (svcName) => {
      if (!state.specialist || !state.specialist.serviceCategories) return 60;
      for (const cat of state.specialist.serviceCategories) {
        const item = cat.items.find(i => i.name === svcName);
        if (item) return item.duration;
      }
      return 60;
    };

    const overlap = booked.some(b => { 
      const bTime = typeof b === 'object' ? b.appointment_time : b;
      const bSvc  = typeof b === 'object' ? b.service_name : '';
      const bStart = slotToMinutes(bTime);
      const bDur   = bSvc ? getDuration(bSvc) : 60;
      const bEnd   = bStart + bDur;
      
      return (startMin < bEnd) && ((startMin + duration) > bStart);
    });
    if (startMin + duration > closingMin || overlap) state.time = '';
  }

  renderTimeGrid();
  refreshNextBtn();
}

export function pickPayment(method) {
  state.form.payment = method;
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.toggle('pay-selected', b.dataset.method === method));
  const pm = document.getElementById('paymentMethods');
  if (pm) pm.classList.remove('pay-error');
}

export function refreshNextBtn() {
  const btn = document.getElementById('btnNext');
  if (btn) btn.disabled = !state.form.service || !state.date || !state.time;
}
