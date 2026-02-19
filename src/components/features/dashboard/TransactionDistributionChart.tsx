"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "../../ui/skeleton";

interface TransactionData {
  name: string;
  value: number;
  count: number;
}

interface TransactionDistributionChartProps {
  data?: Record<string, { total: number; count: number }>;
  isLoading?: boolean;
}

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#6366f1", // indigo
];

export const TransactionDistributionChart = ({
  data,
  isLoading = false,
}: TransactionDistributionChartProps) => {
  if (isLoading) {
    return <Skeleton className="w-full h-80" />;
  }

  const chartData: TransactionData[] = Object.entries(data || {}).map(
    ([name, stats]) => ({
      name,
      value: stats.total,
      count: stats.count,
    }),
  );

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const TooltipComponent = (props: {
    active?: boolean;
    payload?: Array<{ payload: TransactionData }>;
  }) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-primary">
            RM{" "}
            {data.value.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipComponent />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
