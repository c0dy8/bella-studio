import { isoToDate, dateToISO, spanishDate,
         todayMidnight, maxDate }        from '../js/utils/dates.js';
import { filterName, filterPhone }       from '../js/utils/validation.js';
import { slotToMinutes, formatDuration } from '../js/utils/time.js';

// ─── isoToDate ───────────────────────────────────────────────
describe('isoToDate', () => {
  test('convierte correctamente año, mes y día', () => {
    const d = isoToDate('2025-06-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  test('usa hora local — no desplaza el día por UTC', () => {
    expect(isoToDate('2025-01-01').getDate()).toBe(1);
  });

  test('maneja último día de mes correctamente', () => {
    const d = isoToDate('2025-02-28');
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

// ─── dateToISO ───────────────────────────────────────────────
describe('dateToISO', () => {
  test('rellena mes y día con cero', () => {
    expect(dateToISO(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  test('maneja dos dígitos sin relleno extra', () => {
    expect(dateToISO(new Date(2025, 11, 25))).toBe('2025-12-25');
  });

  test('round-trip con isoToDate', () => {
    const iso = '2025-09-20';
    expect(dateToISO(isoToDate(iso))).toBe(iso);
  });
});

// ─── spanishDate ─────────────────────────────────────────────
describe('spanishDate', () => {
  test('retorna cadena vacía para input vacío', () => {
    expect(spanishDate('')).toBe('');
  });

  test('incluye nombre del mes en español', () => {
    expect(spanishDate('2025-03-10')).toContain('marzo');
  });

  test('formato completo: "día, D de mes"', () => {
    expect(spanishDate('2026-06-01')).toBe('lunes, 1 de junio');
  });

  test('detecta correctamente el domingo', () => {
    expect(spanishDate('2026-05-31')).toContain('domingo');
  });
});

// ─── todayMidnight ───────────────────────────────────────────
describe('todayMidnight', () => {
  test('retorna medianoche exacta', () => {
    const t = todayMidnight();
    expect(t.getHours()).toBe(0);
    expect(t.getMinutes()).toBe(0);
    expect(t.getSeconds()).toBe(0);
  });

  test('coincide con la fecha de hoy', () => {
    const t   = todayMidnight();
    const now = new Date();
    expect(t.getFullYear()).toBe(now.getFullYear());
    expect(t.getMonth()).toBe(now.getMonth());
    expect(t.getDate()).toBe(now.getDate());
  });
});

// ─── maxDate ─────────────────────────────────────────────────
describe('maxDate', () => {
  test('es exactamente 30 días después de hoy', () => {
    const diffDays = (maxDate().getTime() - todayMidnight().getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });
});

// ─── slotToMinutes ───────────────────────────────────────────
describe('slotToMinutes', () => {
  test('9:00am → 540', ()  => expect(slotToMinutes('9:00am')).toBe(540));
  test('12:00pm → 720', () => expect(slotToMinutes('12:00pm')).toBe(720));
  test('2:00pm → 840', ()  => expect(slotToMinutes('2:00pm')).toBe(840));
  test('5:00pm → 1020', () => expect(slotToMinutes('5:00pm')).toBe(1020));
  test('12:00am → 0', ()   => expect(slotToMinutes('12:00am')).toBe(0));
});

// ─── formatDuration ──────────────────────────────────────────
describe('formatDuration', () => {
  test('60 → "1h"',       () => expect(formatDuration(60)).toBe('1h'));
  test('90 → "1h 30min"', () => expect(formatDuration(90)).toBe('1h 30min'));
  test('120 → "2h"',      () => expect(formatDuration(120)).toBe('2h'));
  test('180 → "3h"',      () => expect(formatDuration(180)).toBe('3h'));
});

// ─── filterName ──────────────────────────────────────────────
describe('filterName', () => {
  test('elimina números',           () => { const el = { value: 'Juan123' };    filterName(el); expect(el.value).toBe('Juan'); });
  test('conserva tildes y ñ',       () => { const el = { value: 'María Muñoz'}; filterName(el); expect(el.value).toBe('María Muñoz'); });
  test('elimina símbolos',          () => { const el = { value: 'Ana@#!' };     filterName(el); expect(el.value).toBe('Ana'); });
  test('conserva espacios simples', () => { const el = { value: 'Luis Carlos'}; filterName(el); expect(el.value).toBe('Luis Carlos'); });
});

// ─── filterPhone ─────────────────────────────────────────────
describe('filterPhone', () => {
  test('elimina letras',    () => { const el = { value: '300abc456' };  filterPhone(el); expect(el.value).toBe('300456'); });
  test('elimina guiones',   () => { const el = { value: '300-123-456'}; filterPhone(el); expect(el.value).toBe('300123456'); });
  test('deja dígitos solo', () => { const el = { value: '3001234567'}; filterPhone(el); expect(el.value).toBe('3001234567'); });
});

// ─── Lógica de validación de fechas ──────────────────────────
describe('Validación de fechas', () => {
  test('domingo → getDay() === 0',          () => expect(isoToDate('2026-05-31').getDay()).toBe(0));
  test('ayer < hoy',                        () => { const t = todayMidnight(); const y = new Date(t); y.setDate(t.getDate()-1); expect(y < t).toBe(true); });
  test('hoy no es pasado',                  () => { const t = todayMidnight(); expect(t < t).toBe(false); });
  test('día 31 supera límite de 30 días',   () => { const t = todayMidnight(); const m = maxDate(); const f = new Date(t); f.setDate(t.getDate()+31); expect(f > m).toBe(true); });
  test('día 30 está dentro del límite',     () => { const t = todayMidnight(); const m = maxDate(); const f = new Date(t); f.setDate(t.getDate()+30); expect(f > m).toBe(false); });
});
