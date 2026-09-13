import api from '../api';

export async function fetchClientDni(clientId) {
  const response = await api.get(`/clients/${clientId}/dni`);
  return response.data;
}

export async function uploadClientDni(clientId, side, file) {
  const response = await api.put(`/clients/${clientId}/dni/${side}`, file, {
    headers: { 'Content-Type': file.type },
    transformRequest: [(data) => data],
  });
  return response.data;
}
