import api from '../api';

export async function fetchDniData(dni) {
  const cleanDni = String(dni || '').trim();
  if (!/^\d{8}$/.test(cleanDni)) {
    throw new Error('El DNI debe contener exactamente 8 dígitos');
  }
  const response = await api.get(`/reniec/${cleanDni}`);
  return response.data;
}
