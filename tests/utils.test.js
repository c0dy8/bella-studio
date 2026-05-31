const {
  isoToDate,
  dateToISO,
  spanishDate,
  filterName,
  filterPhone,
  todayMidnight,
  maxDate,
} = require('../script.js');

// ─── isoToDate ───────────────────────────────────────────────
describe('isoToDate', () => {
  test('convierte correctamente año, mes y día', () => {
    const d = isoToDate('2025-06-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5);   // junio = índice 5
    expect(d.getDate()).toBe(15);
  });

  test('usa hora local — no desplaza el día por UTC', () => {
    // new Date('2025-01-01') puede retornar Dec 31 en zonas UTC-
    const d = isoToDate('2025-01-01');
    expect(d.getDate()).toBe(1);
  });

  test('maneja último día de mes correctamente', () => {
    const d = isoToDate('2025-02-28');
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

// ─── dateToISO ───────────────────────────────────────────────
describe('dateToISO', () => {
  test('rellena mes y día con cero cuando son de un dígito', () => {
    expect(dateToISO(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  test('maneja mes y día de dos dígitos sin relleno extra', () => {
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

  test('incluye el número de día correcto', () => {
    expect(spanishDate('2025-07-04')).toContain('4');
  });

  test('incluye el día de la semana en español', () => {
    // 2026-06-01 es lunes
    expect(spanishDate('2026-06-01')).toContain('lunes');
  });

  test('formato completo: "día, D de mes"', () => {
    // 2026-06-01 = lunes, 1 de junio
    expect(spanishDate('2026-06-01')).toBe('lunes, 1 de junio');
  });
});

// ─── todayMidnight ───────────────────────────────────────────
describe('todayMidnight', () => {
  test('retorna fecha de hoy a medianoche', () => {
    const t = todayMidnight();
    expect(t.getHours()).toBe(0);
    expect(t.getMinutes()).toBe(0);
    expect(t.getSeconds()).toBe(0);
    expect(t.getMilliseconds()).toBe(0);
  });

  test('coincide con la fecha de hoy', () => {
    const t = todayMidnight();
    const now = new Date();
    expect(t.getFullYear()).toBe(now.getFullYear());
    expect(t.getMonth()).toBe(now.getMonth());
    expect(t.getDate()).toBe(now.getDate());
  });
});

// ─── maxDate ─────────────────────────────────────────────────
describe('maxDate', () => {
  test('es exactamente 30 días después de hoy', () => {
    const today = todayMidnight();
    const max   = maxDate();
    const diffMs   = max.getTime() - today.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });
});

// ─── filterName ──────────────────────────────────────────────
describe('filterName', () => {
  test('elimina números', () => {
    const el = { value: 'Juan123' };
    filterName(el);
    expect(el.value).toBe('Juan');
  });

  test('conserva tildes y ñ', () => {
    const el = { value: 'María Muñoz' };
    filterName(el);
    expect(el.value).toBe('María Muñoz');
  });

  test('elimina símbolos especiales', () => {
    const el = { value: 'Ana@#!' };
    filterName(el);
    expect(el.value).toBe('Ana');
  });

  test('conserva espacios entre palabras', () => {
    const el = { value: 'Luis Carlos' };
    filterName(el);
    expect(el.value).toBe('Luis Carlos');
  });

  test('cadena vacía permanece vacía', () => {
    const el = { value: '' };
    filterName(el);
    expect(el.value).toBe('');
  });
});

// ─── filterPhone ─────────────────────────────────────────────
describe('filterPhone', () => {
  test('elimina letras', () => {
    const el = { value: '300abc456' };
    filterPhone(el);
    expect(el.value).toBe('300456');
  });

  test('elimina guiones y signos', () => {
    const el = { value: '300-123-4567' };
    filterPhone(el);
    expect(el.value).toBe('3001234567');
  });

  test('deja solo los dígitos intactos', () => {
    const el = { value: '3001234567' };
    filterPhone(el);
    expect(el.value).toBe('3001234567');
  });

  test('cadena vacía permanece vacía', () => {
    const el = { value: '' };
    filterPhone(el);
    expect(el.value).toBe('');
  });
});

// ─── Lógica de validación de fechas ──────────────────────────
describe('Validación de fechas del calendario', () => {
  test('domingo es inválido (getDay() === 0)', () => {
    const sunday = isoToDate('2026-05-31'); // domingo conocido
    expect(sunday.getDay()).toBe(0);
  });

  test('fecha pasada es menor que hoy a medianoche', () => {
    const today     = todayMidnight();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(yesterday < today).toBe(true);
  });

  test('fecha de hoy no es pasada', () => {
    const today = todayMidnight();
    expect(today < today).toBe(false);
  });

  test('fecha a 31 días supera el límite de 30 días', () => {
    const today  = todayMidnight();
    const max    = maxDate();
    const tooFar = new Date(today);
    tooFar.setDate(today.getDate() + 31);
    expect(tooFar > max).toBe(true);
  });

  test('fecha a exactamente 30 días está dentro del límite', () => {
    const today  = todayMidnight();
    const max    = maxDate();
    const edge   = new Date(today);
    edge.setDate(today.getDate() + 30);
    expect(edge > max).toBe(false);
  });
});
