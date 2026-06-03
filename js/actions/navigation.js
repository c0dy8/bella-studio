import { state }           from '../state.js';
import { tplStep1 }        from '../templates/step1.js';
import { tplStep2,
         tplCalendar,
         timeGridHTML }    from '../templates/step2.js';
import { tplStep3 }        from '../templates/step3.js';
import { tplConfirm }      from '../templates/confirmation.js';

const CHECK_SVG = `<svg viewBox="0 0 20 20" width="15" height="15" fill="none">
  <polyline points="4,10 8.5,15 16,6" stroke="#4d8b6a" stroke-width="2.8"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function updateProgress(step) {
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

export function render() {
  const main = document.getElementById('main');
  main.style.transition = 'opacity .18s ease, transform .18s ease';
  main.style.opacity    = '0';
  main.style.transform  = 'translateY(-8px)';

  setTimeout(() => {
    const map = { 1: tplStep1, 2: tplStep2, 3: tplStep3, 4: tplConfirm };
    main.innerHTML = (map[state.step] || tplStep1)();
    main.style.transition = '';
    main.style.opacity    = '1';
    main.style.transform  = 'translateY(0)';
    updateProgress(state.step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 190);
}

export function renderCalendar() {
  const container = document.getElementById('calContainer');
  if (container) container.innerHTML = tplCalendar();
}

export function renderTimeGrid() {
  const grid = document.querySelector('.time-grid');
  if (grid) grid.innerHTML = timeGridHTML();
}

export function goTo(step) {
  if (state.step === 3) snapshotForm();
  state.step = step;
  render();
}

export function calPrev() {
  if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
  else { state.calMonth--; }
  renderCalendar();
}

export function calNext() {
  if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
  else { state.calMonth++; }
  renderCalendar();
}

export function restart() {
  const now = new Date();
  state.step       = 1;
  state.specialist = null;
  state.date       = '';
  state.time       = '';
  state.form       = { name: '', phone: '', email: '', service: '', serviceDuration: 0, payment: '' };
  state.calYear    = now.getFullYear();
  state.calMonth   = now.getMonth();
  state.bookedTimes = [];
  render();
}

// Importación tardía para evitar circular dep (navigation ↔ form)
function snapshotForm() {
  const get = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  state.form = {
    name:            get('iName'),
    phone:           get('iPhone'),
    email:           get('iEmail'),
    service:         state.form.service         || '',
    serviceDuration: state.form.serviceDuration || 0,
    payment:         state.form.payment         || '',
  };
}
