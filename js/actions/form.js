import { state }              from '../state.js';
import { insertAppointment }  from '../supabase.js';
import { render }             from './navigation.js';
import { filterName,
         filterPhone }        from '../utils/validation.js';

export { filterName, filterPhone };

export function snapshotForm() {
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

export async function submitForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (!state.specialist || !state.date || !state.time) {
    alert('Por favor selecciona un especialista, fecha y hora antes de continuar.');
    return;
  }

  snapshotForm();

  const nameEl  = document.getElementById('iName');
  const phoneEl = document.getElementById('iPhone');
  const emailEl = document.getElementById('iEmail');

  if (nameEl)  nameEl.setCustomValidity(!nameEl.value.trim() ? 'Ingresa tu nombre completo' : /[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/.test(nameEl.value) ? 'Solo se permiten letras' : '');
  if (phoneEl) phoneEl.setCustomValidity(!phoneEl.value ? 'Ingresa tu número de teléfono' : /\D/.test(phoneEl.value) ? 'Solo se permiten números' : '');
  if (emailEl) emailEl.setCustomValidity(!emailEl.value ? 'Ingresa tu correo electrónico' : '');

  const form = document.getElementById('bookingForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }

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
  btn.disabled  = true;

  try {
    await insertAppointment({
      specialist_id:    state.specialist.id,
      appointment_date: state.date,
      appointment_time: state.time,
      customer_name:    state.form.name,
      customer_phone:   state.form.phone,
      customer_email:   state.form.email,
      service_name:     state.form.service,
      payment_method:   state.form.payment || 'Efectivo',
    });
    state.step = 4;
    render();
  } catch (err) {
    console.error('Error al agendar:', err);
    alert('Hubo un error al confirmar tu cita. Por favor intenta de nuevo.');
    btn.innerHTML = 'Confirmar cita';
    btn.disabled  = false;
  }
}
