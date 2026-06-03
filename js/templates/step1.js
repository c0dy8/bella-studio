import { state }       from '../state.js';
import { SPECIALISTS } from '../store.js';

export function tplStep1() {
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
