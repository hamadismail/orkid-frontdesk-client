/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../lib/config';

export const getAllRooms = async (query?: Record<string, any>) => {
  const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
  const res = await fetch(`${API_BASE_URL}/rooms${queryString}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch rooms');
  }

  const result = await res.json();
  return result.data || { rooms: [], counts: {} };
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

export const updateRoomStatus = async (roomId: string, status: 'clean' | 'service' | 'sclean' | 'ooo') => {
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
