"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Skeleton } from "../../ui/skeleton";

interface SalesData {
  name: string;
  shortName?: string;
  total: number;
  count: number;
}

interface SalesTrendChartProps {
  data?:
    | Record<string, { total: number; count: number }>
    | Array<{ name: string; shortName?: string; total: number; count: number }>;
  isLoading?: boolean;
  title?: string;
  chartType?: "line" | "bar" | "area";
  useShortNames?: boolean;
}

export const SalesTrendChart = ({
  data,
  isLoading = false,
  chartType = "area",
  useShortNames = false,
}: SalesTrendChartProps) => {
  if (isLoading) {
    return <Skeleton className="w-full h-80" />;
  }

  let chartData: SalesData[];

  // Handle both Record and Array formats
  if (Array.isArray(data)) {
    chartData = data;
  } else {
    chartData = Object.entries(data || {}).map(([name, stats]) => ({
      name,
      total: stats.total,
      count: stats.count,
    }));
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const baseProps = {
    data: chartData,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  const TooltipComponent = (props: {
    active?: boolean;
    payload?: Array<{ value: number; payload: SalesData }>;
  }) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-primary">
            RM{" "}
            {payload[0].value.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: {payload[0].payload.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart {...baseProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={useShortNames ? "shortName" : "name"} />
          <YAxis />
          <Tooltip content={<TooltipComponent />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Total Sales (RM)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart {...baseProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={useShortNames ? "shortName" : "name"} />
          <YAxis />
          <Tooltip content={<TooltipComponent />} />
          <Legend />
          <Bar
            dataKey="total"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            name="Total Sales (RM)"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart {...baseProps}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={useShortNames ? "shortName" : "name"} />
        <YAxis />
        <Tooltip content={<TooltipComponent />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          fill="url(#colorTotal)"
          name="Total Sales (RM)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
