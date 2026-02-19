"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

import { SalesByMethodTable } from "./SalesByMethod";
import { SalesByOtaTable } from "./SalesByOta";
import { SalesByRoomTypeTable } from "./SalesByRoomType";
import { StatCard, StatCardSkeleton } from "./StatCard";
import { FiltersSection } from "./FilterSection";
import { formatCurrency } from "@/src/utils/currency-formatter";
import { DollarSign, CreditCard, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SalesTrendChart } from "./SalesTrendChart";
import { TransactionDistributionChart } from "./TransactionDistributionChart";
// import { MetricsOverview } from "./MetricsOverview";
import { formatRoomTypeData } from "./room-type-utils";
import { getDashboardData } from "@/src/services/dashboard.service";

// ==================== TYPES ====================
export interface SalesByMethod {
  total: number;
  count: number;
}

interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  salesByMethod: Record<string, SalesByMethod>;
  salesByRoomType: Record<string, SalesByMethod>;
  salesByOta: Record<string, SalesByMethod>;
}

export interface DashboardFilters {
  dateRange?: DateRange;
}

// ==================== MAIN COMPONENT ====================
export function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data, isLoading, isFetching, refetch } = useQuery<DashboardStats>({
    queryKey: ["dashboardStats", filters],
    queryFn: () =>
      getDashboardData({
        filters: {
          startDate: filters.dateRange?.from,
          endDate: filters.dateRange?.to,
        },
      }),
  });

  // ==================== FILTER HANDLERS ====================
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setFilters({ dateRange: range });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ==================== DATA PROCESSING ====================
  const stats = data;

  // ==================== EVENT HANDLERS ====================
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const STAT_CARDS = [
    {
      title: "Total Revenue",
      key: "totalSales",
      icon: DollarSign,
      description: "Filtered sales",
      value: `RM ${formatCurrency(stats?.totalSales || 0)}`,
    },
    {
      title: "Total Transactions",
      key: "totalTransactions",
      icon: CreditCard,
      description: "Completed payments",
      value: (stats?.totalTransactions || 0).toLocaleString(),
    },
    {
      title: "Average Transaction",
      key: "averageTransaction",
      icon: TrendingUp,
      description: "Per transaction",
      value: `RM ${formatCurrency(
        (stats?.totalSales || 0) / (stats?.totalTransactions || 1),
      )}`,
    },
    {
      title: "Total Metrics",
      key: "totalMetrics",
      icon: BarChart3,
      description: "Analytics overview",
      value: Object.keys(stats?.salesByMethod || {}).length.toString(),
    },
  ] as const;

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FiltersSection
        filters={filters}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={clearFilters}
        isLoading={isFetching}
      />

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading && !stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : STAT_CARDS.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                icon={<card.icon className="h-4 w-4 text-primary" />}
                description={card.description}
              />
            ))}
      </div>

      {/* Charts Section - 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Payment Methods */}
        {/* <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Transaction Volume by Method</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsOverview
              data={stats?.salesByMethod}
              isLoading={isLoading && !stats}
              metric="count"
            />
          </CardContent>
        </Card> */}

        {/* Sales by Room Type */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart
              data={formatRoomTypeData(stats?.salesByRoomType)}
              isLoading={isLoading && !stats}
              chartType="area"
              useShortNames={true}
            />
          </CardContent>
        </Card>

        {/* Sales by Room Type Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Room Type Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByRoomTypeTable
              salesByRoomType={stats?.salesByRoomType}
              isLoading={isLoading && !stats}
            />
          </CardContent>
        </Card>
      </div>

      {/* OTA Revenue Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales by OTA Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sales Distribution by OTA</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart
              data={formatRoomTypeData(stats?.salesByOta)}
              isLoading={isLoading && !stats}
              chartType="bar"
              useShortNames={true}
            />
          </CardContent>
        </Card>

        {/* Sales by OTA Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Sales by OTA Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByOtaTable
              salesByOta={stats?.salesByOta}
              isLoading={isLoading && !stats}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionDistributionChart
              data={stats?.salesByMethod}
              isLoading={isLoading && !stats}
            />
          </CardContent>
        </Card>

        {/* Sales by Method Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByMethodTable
              salesByMethod={stats?.salesByMethod}
              isLoading={isLoading && !stats}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
