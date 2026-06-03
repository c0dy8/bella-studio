// Datos dinámicos — se poblan desde Supabase o mocks en initData()
export let SPECIALISTS = [];
export let SERVICES    = [];

export function setSpecialists(data) { SPECIALISTS = data; }
export function setServices(data)    { SERVICES    = data; }
