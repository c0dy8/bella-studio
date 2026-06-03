export function filterName(el) {
  el.value = el.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]/g, '').replace(/\s+/g, ' ');
}

export function filterPhone(el) {
  el.value = el.value.replace(/\D/g, '');
}
