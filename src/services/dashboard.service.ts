import { API_BASE_URL } from "../lib/config";

export const getDashboardData = async (query: {
  filters: { startDate?: Date; endDate?: Date };
}) => {
  const { startDate, endDate } = query.filters;
  const params = new URLSearchParams();
  if (startDate) {
    params.append("startDate", startDate.toISOString());
  }
  if (endDate) {
    params.append("endDate", endDate.toISOString());
  }

  const res = await fetch(`${API_BASE_URL}/dashboard?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  const result = await res.json();
  return result.data || result;
};
