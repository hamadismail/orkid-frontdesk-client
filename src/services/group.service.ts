/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../lib/config';

export const getAllGroups = async (params?: any) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/groups?${query}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data;
};

export const createGroup = async (data: any) => {
  const res = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Group reservation failed');
  }

  return result.data;
};

export const getGroupDetails = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data;
};

export const cancelGroup = async (id: string, reason: string) => {
  const res = await fetch(`${API_BASE_URL}/groups/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
    credentials: 'include',
  });
  return res.json();
};

export const batchCheckIn = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/groups/${id}/check-in`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
};
