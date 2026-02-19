import { API_BASE_URL } from '../lib/config';

export const getAllPayments = async (page: number, search: string, filter: string) => {
  const query = new URLSearchParams({
    page: String(page),
    search: search || '',
    filter: filter || '',
  }).toString();

  const res = await fetch(`${API_BASE_URL}/payments?${query}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch payments');
  }

  const result = await res.json();
  return result.data || result;
};

export const getSalesReportPayment = async (
  page: number,
  search: string,
  date: Date | undefined,
  paymentMethod: string | undefined,
) => {
  const query = new URLSearchParams({
    page: String(page),
    search: search || '',
    date: date ? date.toISOString() : '',
    paymentMethod: paymentMethod || '',
  }).toString();

  const res = await fetch(`${API_BASE_URL}/payments/sales-report?${query}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch sales report');
  }

  const result = await res.json();
  return result.data || result;
};
