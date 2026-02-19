import { API_BASE_URL } from '../lib/config';

export const getAllRooms = async () => {
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch rooms');
  }

  const result = await res.json();
  return result.data || result;
};
