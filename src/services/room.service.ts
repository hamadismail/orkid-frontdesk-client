import { API_BASE_URL } from '../lib/config';

export const getAllRooms = async () => {
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch rooms');
  }

  const result = await res.json();
  return result.data || [];
};

export const createRoom = async (data: any) => {
  const res = await fetch(`${API_BASE_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create room');
  }

  const result = await res.json();
  return result.data || {};
};

export const updateRoomStatus = async (roomId: string, status: 'clean' | 'service' | 'sclean') => {
  const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/${status}`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Failed to update room to ${status}`);
  }

  const result = await res.json();
  return result.data || {};
};
