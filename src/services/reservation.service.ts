import { API_BASE_URL } from '../lib/config';

export const getAllReservations = async () => {
  const res = await fetch(`${API_BASE_URL}/reserve`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reservations');
  }

  const result = await res.json();
  return result.data || result;
};
