export const TIME_SLOTS = ['9:00am','10:00am','11:00am','12:00pm','2:00pm','3:00pm','4:00pm','5:00pm'];

export const MOCK_SPECIALISTS = [
  {
    id: 1, name: 'Lina', specialty: 'Manicure y pedicure',
    schedule: 'Lun–Sáb · 9am–5:30pm', closingMinutes: 1050,
    photo: 'https://i.pravatar.cc/200?img=47',
    serviceCategories: [
      { category: 'Pies', items: [
        { name: 'Pies tradicional',    duration: 90 },
        { name: 'Pies semipermanente', duration: 90 },
      ]},
      { category: 'Manos', items: [
        { name: 'Manos tradicional',    duration: 90 },
        { name: 'Manos semipermanente', duration: 90 },
        { name: 'Poligel',              duration: 180 },
        { name: 'Retoque de poligel',   duration: 120 },
      ]},
      { category: 'Otros', items: [
        { name: 'Presón',      duration: 120 },
        { name: 'Base rubber', duration: 120 },
      ]},
    ],
    services: [
      { name: 'Pies tradicional' }, { name: 'Pies semipermanente' },
      { name: 'Manos tradicional' }, { name: 'Manos semipermanente' },
      { name: 'Poligel' }, { name: 'Retoque de poligel' },
      { name: 'Presón' }, { name: 'Base rubber' },
    ],
  },
  {
    id: 2, name: 'Alejandra', specialty: 'Cejas y pestañas',
    schedule: 'Lun–Sáb · 10am–6pm', closingMinutes: 1080,
    photo: 'https://i.pravatar.cc/200?img=44',
    serviceCategories: [
      { category: 'Cejas', items: [
        { name: 'Diseño de cejas', duration: 45 },
      ]},
      { category: 'Pestañas', items: [
        { name: 'Pestañas clásicas',   duration: 90 },
        { name: 'Lifting de pestañas', duration: 60 },
      ]},
      { category: 'Depilación', items: [
        { name: 'Depilación facial', duration: 30 },
      ]},
    ],
    services: [
      { name: 'Diseño de cejas' }, { name: 'Pestañas clásicas' },
      { name: 'Lifting de pestañas' }, { name: 'Depilación facial' },
    ],
  },
];

export const MOCK_SERVICES = [
  'Pies tradicional','Pies semipermanente',
  'Manos tradicional','Manos semipermanente','Poligel','Retoque de poligel','Presón','Base rubber',
  'Diseño de cejas','Pestañas clásicas','Lifting de pestañas','Depilación facial',
];

export const CACHE_KEY = 'bella_data';
export const CACHE_TTL = 5 * 60 * 1000;

export function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

export function saveCache(specialists, services) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: { specialists, services }, ts: Date.now() }));
  } catch { /* sessionStorage lleno o bloqueado */ }
}
