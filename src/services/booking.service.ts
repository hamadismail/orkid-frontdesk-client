import { API_BASE_URL } from '../lib/config';

export const getAllBookings = async () => {
  const res = await fetch(`${API_BASE_URL}/book`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }

  const result = await res.json();
  return result.data || result;
};

export const getAllGuests = async (
  page: number,
  search: string,
  statusFilter: string,
  otaFilter: string,
  date: string | undefined,
  sortBy: string,
  sortOrder: string,
) => {
  const query = new URLSearchParams({
    page: String(page),
    search: search || '',
    status: statusFilter || '',
    otas: otaFilter || '',
    arrival: date || '',
    sortBy: sortBy,
    sortOrder: sortOrder,
  }).toString();

  const res = await fetch(`${API_BASE_URL}/guests?${query}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch guests');
  }

  const result = await res.json();
  return result.data || result;
};
