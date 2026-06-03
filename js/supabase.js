import { state } from './state.js';

let supabaseClient = null;
try {
  if (window.supabase && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('⚠️ Supabase no inicializado. Cargando datos locales.', e);
}

export { supabaseClient };

export async function fetchSpecialistsAndServices() {
  if (!supabaseClient) return null;
  const [specResult, servResult] = await Promise.all([
    supabaseClient.from('specialists').select('*, services(name)').order('id'),
    supabaseClient.from('services').select('*').order('id'),
  ]);
  return { specResult, servResult };
}

export async function fetchBookedTimes(dateVal) {
  if (!supabaseClient || !state.specialist) return [];
  try {
    const { data, error } = await supabaseClient.rpc('get_booked_times', {
      p_specialist_id: state.specialist.id,
      p_date: dateVal,
    });
    if (error) { console.error('❌ Error RPC citas ocupadas:', error); return []; }
    return data ? data.map(row => (typeof row === 'object' && row !== null ? row.appointment_time : row)) : [];
  } catch (e) {
    console.error('💥 Error al consultar citas:', e);
    return [];
  }
}

export async function insertAppointment(payload) {
  if (!supabaseClient) throw new Error('Supabase no configurado');
  const { error } = await supabaseClient.from('appointments').insert([payload]);
  if (error) throw error;
}
