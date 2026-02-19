"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "../../ui/skeleton";

interface MetricsData {
  name: string;
  count: number;
}

interface MetricsOverviewProps {
  data?: Record<string, { total: number; count: number }>;
  isLoading?: boolean;
  metric?: "count" | "total";
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MetricsData; value: number }>;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export const MetricsOverview = ({
  data,
  isLoading = false,
  metric = "count",
}: MetricsOverviewProps) => {
  if (isLoading) {
    return <Skeleton className="w-full h-80" />;
  }

  const chartData: MetricsData[] = Object.entries(data || {})
    .map(([name, stats]) => ({
      name,
      count:
        metric === "count"
          ? stats.count
          : Math.round(stats.total / stats.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const TooltipComponent = (props: TooltipProps) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-primary">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={140} />
        <Tooltip content={<TooltipComponent />} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#3b82f6">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
