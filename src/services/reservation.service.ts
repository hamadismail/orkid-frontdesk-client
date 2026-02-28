/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../lib/config';
import { IReservation } from '../types/reservation.interface';

const createQueryString = (params: any) => {
  const cleanParams: any = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      cleanParams[key] = params[key];
    }
  });
  return new URLSearchParams(cleanParams).toString();
};

export const getAllReservations = async (params?: any) => {
  const query = createQueryString(params || {});
  const res = await fetch(`${API_BASE_URL}/reservations?${query}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reservations');
  }

  const result = await res.json();
  return result.data || { data: [], meta: { total: 0, page: 1, limit: 10 } };
};

export const createReservation = async (data: Partial<IReservation>) => {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create reservation');
  }

  const result = await res.json();
  return result.data || {};
};

export const cancelReservation = async (id: string, reason: string) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const checkInReservation = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/check-in`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const checkOutReservation = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/check-out`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const moveReservationRoom = async (id: string, newRoomId: string) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/move-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newRoomId }),
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const amendStay = async (id: string, stay: any) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/amend-stay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stay),
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const extendStay = async (id: string, payload: any) => {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/extend-stay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};
