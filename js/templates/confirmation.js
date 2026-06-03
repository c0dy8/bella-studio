import { state }       from '../state.js';
import { spanishDate } from '../utils/dates.js';

export function tplConfirm() {
  const s         = state.specialist;
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
