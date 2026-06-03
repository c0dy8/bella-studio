import { state }                        from '../state.js';
import { spanishDate }                   from '../utils/dates.js';
import { formatDuration }                from '../utils/time.js';

export function tplStep3() {
  const s = state.specialist;
  const f = state.form;

  return `
    <div class="step-view">
      <button class="btn-back" onclick="goTo(2)" aria-label="Volver a elegir fecha y hora">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
          <polyline points="13,4 7,10 13,16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
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
          <div class="sum-service">✦ ${f.service}${f.serviceDuration ? ` · ${formatDuration(f.serviceDuration)}` : ''}</div>
        </div>
      </div>

      <form id="bookingForm" onsubmit="submitForm(event)" novalidate>

        <div class="form-group">
          <label class="form-label" for="iName">Nombre completo</label>
          <input class="form-input" type="text" id="iName" name="name"
            placeholder="Ej: María García" value="${f.name || ''}"
            required autocomplete="name" oninput="filterName(this)">
        </div>

        <div class="form-group">
          <label class="form-label" for="iPhone">Teléfono</label>
          <input class="form-input" type="tel" id="iPhone" name="phone"
            placeholder="Ej: 300 123 4567" value="${f.phone || ''}"
            required autocomplete="tel" oninput="filterPhone(this)">
        </div>

        <div class="form-group">
          <label class="form-label" for="iEmail">Correo electrónico</label>
          <input class="form-input" type="email" id="iEmail" name="email"
            placeholder="Ej: maria@correo.com" value="${f.email || ''}"
            required autocomplete="email">
        </div>

        <div class="form-group">
          <label class="form-label">Servicio</label>
          <div class="svc-readonly">
            <span class="svc-readonly-name">${f.service}</span>
            ${f.serviceDuration ? `<span class="svc-readonly-dur">${formatDuration(f.serviceDuration)}</span>` : ''}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Método de pago</label>
          <div class="payment-methods" id="paymentMethods">

            <button type="button" class="pay-btn${f.payment==='Efectivo'?' pay-selected':''}"
              data-method="Efectivo" onclick="pickPayment('Efectivo')">
              <svg class="pay-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3">
                <rect x="36" y="2" width="24" height="13" rx="2.5" transform="rotate(12 48 8.5)"/>
                <rect x="4" y="49" width="24" height="13" rx="2.5" transform="rotate(12 16 55.5)"/>
                <rect x="2" y="16" width="60" height="34" rx="5"/>
                <path d="M9 22 L9 28 M9 22 L15 22"/><path d="M55 22 L55 28 M55 22 L49 22"/>
                <path d="M9 44 L9 38 M9 44 L15 44"/><path d="M55 44 L55 38 M55 44 L49 44"/>
                <circle cx="32" cy="33" r="11"/>
                <line x1="32" y1="25" x2="32" y2="41" stroke-width="2"/>
                <path d="M35.5 29 C35.5 26.5 28.5 26.5 28.5 29.5 C28.5 32.5 35.5 33 35.5 36 C35.5 39 28.5 39 28.5 36.5" stroke-width="2" fill="none"/>
              </svg>
              <span class="pay-label">Efectivo</span>
            </button>

            <button type="button" class="pay-btn${f.payment==='Tarjeta'?' pay-selected':''}"
              data-method="Tarjeta" onclick="pickPayment('Tarjeta')">
              <svg class="pay-icon" viewBox="0 0 68 58" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3">
                <rect x="16" y="2" width="50" height="32" rx="6" transform="rotate(-16 41 18)"/>
                <rect x="2" y="21" width="60" height="35" rx="6"/>
                <rect x="9" y="29" width="14" height="11" rx="3"/>
                <rect x="12" y="33" width="8" height="3" rx="1.5" stroke-width="2"/>
                <circle cx="40" cy="39" r="1.8" fill="currentColor" stroke="none"/>
                <path d="M 44,35 A 4,4 0 0 1 44,43" stroke-width="2"/>
                <path d="M 44,32 A 7,7 0 0 1 44,46" stroke-width="2"/>
                <line x1="9" y1="47" x2="22" y2="47"/><line x1="26" y1="47" x2="39" y2="47"/><line x1="43" y1="47" x2="56" y2="47"/>
                <line x1="9" y1="52" x2="32" y2="52"/>
              </svg>
              <span class="pay-label">Tarjeta</span>
            </button>

            <button type="button" class="pay-btn${f.payment==='Transferencia'?' pay-selected':''}"
              data-method="Transferencia" onclick="pickPayment('Transferencia')">
              <svg class="pay-icon" viewBox="0 0 64 60" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="1" width="30" height="58" rx="7" stroke-width="2.4"/>
                <rect x="11" y="5" width="12" height="3" rx="1.5" stroke-width="2"/>
                <rect x="13" y="52" width="8" height="3" rx="1.5" stroke-width="2"/>
                <circle cx="17" cy="30" r="11" stroke-width="2.3"/>
                <line x1="17" y1="22" x2="17" y2="38" stroke-width="2"/>
                <path d="M21 25.5 Q21 23 17 23 Q13 23 13 26 Q13 29 17 29.5 Q21 30 21 33 Q21 36 17 36 Q13 36 13 33.5" stroke-width="2"/>
                <path d="M33 21 L49 21 L49 18 L60 27 L49 36 L49 33 L33 33 Z" stroke-width="2.3" fill="white"/>
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
