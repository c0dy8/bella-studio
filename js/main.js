import { MOCK_SPECIALISTS, MOCK_SERVICES, loadCache, saveCache } from './data.js';
import { setSpecialists, setServices }  from './store.js';
import { supabaseClient,
         fetchSpecialistsAndServices }  from './supabase.js';
import { render }                       from './actions/navigation.js';
import { state }                        from './state.js';

// ─── Acciones expuestas al DOM (onclick="...") ───────────────
import { pickSpecialist, pickDate, pickTime,
         pickServiceStep2, pickPayment,
         refreshNextBtn }               from './actions/booking.js';
import { calPrev, calNext, goTo,
         restart, renderCalendar,
         renderTimeGrid }               from './actions/navigation.js';
import { submitForm, filterName,
         filterPhone }                  from './actions/form.js';

// Exposición global — necesaria porque los onclick del HTML no usan imports
window.pickSpecialist  = pickSpecialist;
window.pickDate        = pickDate;
window.pickTime        = pickTime;
window.pickServiceStep2 = pickServiceStep2;
window.pickPayment     = pickPayment;
window.calPrev         = calPrev;
window.calNext         = calNext;
window.goTo            = goTo;
window.restart         = restart;
window.submitForm      = submitForm;
window.filterName      = filterName;
window.filterPhone     = filterPhone;

// ─── Inicialización de datos ─────────────────────────────────
async function initData() {
  const cached = loadCache();
  if (cached) {
    setSpecialists(cached.specialists);
    setServices(cached.services);
  } else {
    setSpecialists(MOCK_SPECIALISTS);
    setServices(MOCK_SERVICES);
  }
  render();

  if (!supabaseClient) return;

  try {
    const { specResult, servResult } = await fetchSpecialistsAndServices();
    let updated = false;

    if (!specResult.error && specResult.data?.length) {
      setSpecialists(specResult.data);
      updated = true;
    }
    if (!servResult.error && servResult.data?.length) {
      setServices(servResult.data.map(s => s.name));
      updated = true;
    }

    if (updated) {
      const { SPECIALISTS } = await import('./store.js');
      const { SERVICES }    = await import('./store.js');
      saveCache(SPECIALISTS, SERVICES);
      if (state.step === 1) render();
    }
  } catch (err) {
    console.error('💥 Error con Supabase, usando datos locales:', err);
  }
}

// ─── Arranque ────────────────────────────────────────────────
document.addEventListener('click', e => {
  const sel = document.getElementById('serviceSelect');
  if (sel && !sel.contains(e.target)) {
    sel.classList.remove('open');
    const trigger = sel.querySelector('.cs-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
});

initData();
