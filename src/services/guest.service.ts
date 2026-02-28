import { API_BASE_URL } from '../lib/config';

const createQueryString = (params: any) => {
  const cleanParams: any = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      cleanParams[key] = params[key];
    }
  });
  return new URLSearchParams(cleanParams).toString();
};

export const getAllGuests = async (params?: any) => {
  const query = createQueryString(params || {});
  const res = await fetch(`${API_BASE_URL}/guests?${query}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || { data: [], meta: { total: 0, page: 1, limit: 10 } };
};

export const createGuest = async (data: any) => {
  const res = await fetch(`${API_BASE_URL}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || {};
};

export const getGuestDetails = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/guests/${id}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const result = await res.json();
  return result.data || { guest: {}, history: [] };
};
