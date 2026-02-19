"use client";

import * as React from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Calendar as CalendarIcon, X, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/src/lib/utils";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { DashboardFilters } from "./Dashboard";

// ==================== CONSTANTS & TYPES ====================
// interface PresetOption {
//   value: string;
//   label: string;
//   icon?: React.ReactNode;
//   getDateRange: () => DateRange;
// }

type QuickRange =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom"
  | "all";

const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "thisYear", label: "This year" },
  { value: "lastYear", label: "Last year" },
  { value: "all", label: "All time" },
];

const getDateRangeForQuickRange = (
  range: QuickRange
): DateRange | undefined => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    case "last7":
      return { from: subDays(today, 6), to: today };
    case "last30":
      return { from: subDays(today, 29), to: today };
    case "thisMonth":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "lastMonth":
      const firstDayOfLastMonth = startOfMonth(subDays(startOfMonth(today), 1));
      return { from: firstDayOfLastMonth, to: endOfMonth(firstDayOfLastMonth) };
    case "thisYear":
      return { from: startOfYear(today), to: endOfYear(today) };
    case "lastYear":
      const lastYear = today.getFullYear() - 1;
      return {
        from: startOfYear(new Date(lastYear, 0, 1)),
        to: endOfYear(new Date(lastYear, 11, 31)),
      };
    case "all":
      return undefined;
    default:
      return undefined;
  }
};

const formatDateRange = (range?: DateRange): string => {
  if (!range?.from) return "Select date range";
  if (!range.to) return format(range.from, "MMM dd, yyyy");
  if (format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
    return format(range.from, "MMM dd, yyyy");
  }
  return `${format(range.from, "MMM dd, yyyy")} - ${format(
    range.to,
    "MMM dd, yyyy"
  )}`;
};

// ==================== MAIN COMPONENT ====================
export const FiltersSection = ({
  filters,
  onDateRangeChange,
  onClearFilters,
  isLoading,
}: {
  filters: DashboardFilters;
  onDateRangeChange: (range?: DateRange) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [activeQuickRange, setActiveQuickRange] =
    React.useState<QuickRange>("all");

  // Update active quick range based on current date range
  React.useEffect(() => {
    if (!filters.dateRange?.from) {
      setActiveQuickRange("all");
      return;
    }

    // const today = new Date();
    const from = filters.dateRange.from;
    const to = filters.dateRange.to || filters.dateRange.from;

    // Check for exact matches with quick ranges
    const quickRangeEntries = QUICK_RANGES.slice(0, -2); // Exclude 'custom' and 'all'
    for (const { value } of quickRangeEntries) {
      const range = getDateRangeForQuickRange(value as QuickRange);
      if (range?.from && range.to) {
        if (
          format(range.from, "yyyy-MM-dd") === format(from, "yyyy-MM-dd") &&
          format(range.to, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")
        ) {
          setActiveQuickRange(value as QuickRange);
          return;
        }
      }
    }

    // If no exact match, it's a custom range
    setActiveQuickRange("custom");
  }, [filters.dateRange]);

  const handleQuickRangeSelect = (value: string) => {
    const quickRange = value as QuickRange;
    setActiveQuickRange(quickRange);
    const dateRange = getDateRangeForQuickRange(quickRange);
    onDateRangeChange(dateRange);
  };

  const handleCalendarDateSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    // setIsCalendarOpen(false);
    if (range?.from && range.to) {
      setActiveQuickRange("custom");
    }
  };

  const hasActiveFilters = Boolean(filters.dateRange?.from);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Main Filter Card */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Quick Range Selector */}
          <div className="lg:w-64">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Quick Range
            </label>
            <Select
              value={activeQuickRange}
              onValueChange={handleQuickRangeSelect}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select range" />
                {/* <ChevronDown className="h-4 w-4 opacity-50" /> */}
              </SelectTrigger>
              <SelectContent>
                {QUICK_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-10" />

          {/* Custom Date Range Picker */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Custom Range
            </label>
            <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.from && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange(filters.dateRange)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={filters.dateRange?.from || new Date()}
                    selected={filters.dateRange}
                    onSelect={handleCalendarDateSelect}
                    numberOfMonths={2}
                    className="p-3"
                    disabled={{ after: new Date() }}
                    showOutsideDays={false}
                  />
                </PopoverContent>
              </Popover>

              {/* {filters.dateRange?.from && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClearFilters}
                  className="h-9 w-9 shrink-0"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )} */}
            </div>
          </div>

          {/* Selected Range Display */}
          {/* {hasActiveFilters && (
            <>
              <Separator
                orientation="vertical"
                className="hidden lg:block h-10"
              />
              <div className="lg:w-64">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Selected Range
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-normal px-3 py-1"
                    >
                      {formatDateRange(filters.dateRange)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearFilters}
                      className="h-7 px-2 text-xs"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )} */}
        </div>

        {/* Preset Buttons */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.slice(0, 4).map((range) => (
              <Button
                key={range.value}
                variant={
                  activeQuickRange === range.value ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => handleQuickRangeSelect(range.value)}
                disabled={isLoading}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 px-2 py-1 text-xs font-normal"
                >
                  <CalendarIcon className="h-3 w-3" />
                  {formatDateRange(filters.dateRange)}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 px-2 text-xs"
              disabled={isLoading}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
