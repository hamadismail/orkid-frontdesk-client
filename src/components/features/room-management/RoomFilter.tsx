import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  Calendar,
  Layers,
  Bed,
  CheckCircle,
  Clock,
  User,
  Brush,
  Hotel,
  ChevronDown,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { RoomStatus, RoomType } from "@/src/types/room.interface";
import { cn } from "@/src/lib/utils";

type RoomFilterProps = {
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  setFloorFilter: React.Dispatch<React.SetStateAction<string>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<"all" | RoomStatus>>;
  setTypeFilter: React.Dispatch<React.SetStateAction<"all" | RoomType>>;
  roomNumberFilter: string;
  setRoomNumberFilter: React.Dispatch<React.SetStateAction<string>>;
  showQuickFilters?: boolean;
  className?: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", icon: Filter, color: "bg-gray-100" },
  {
    value: RoomStatus.AVAILABLE,
    label: "Available",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700",
  },
  {
    value: RoomStatus.RESERVED,
    label: "Reserved",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: RoomStatus.OCCUPIED,
    label: "Occupied",
    icon: User,
    color: "bg-red-100 text-red-700",
  },
  {
    value: RoomStatus.DUE_OUT,
    label: "Due Out",
    icon: Clock,
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: RoomStatus.DIRTY,
    label: "Dirty",
    icon: Brush,
    color: "bg-orange-100 text-orange-700",
  },
] as const;

const FLOOR_OPTIONS = [
  { value: "all", label: "All Floors" },
  { value: "m", label: "M Floor" },
  { value: "1", label: "1st Floor" },
  { value: "2", label: "2nd Floor" },
  { value: "3", label: "3rd Floor" },
  { value: "4", label: "4th Floor" },
  { value: "5", label: "5th Floor" },
  { value: "6", label: "6th Floor" },
  { value: "7", label: "7th Floor" },
  { value: "8", label: "8th Floor" },
  { value: "9", label: "9th Floor" },
] as const;

const ROOM_TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  SQUEEN: Hotel,
  DQUEEN: Hotel,
  DTWIN: Bed,
  DTRIPPLE: Bed,
  SFAMILLY: Bed,
  DFAMILLY: Bed,
} as const;

export default function RoomFilter({
  dateFilter,
  setDateFilter,
  setFloorFilter,
  setStatusFilter,
  setTypeFilter,
  roomNumberFilter,
  setRoomNumberFilter,
  showQuickFilters = true,
  className,
}: RoomFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [quickStatus, setQuickStatus] = useState<RoomStatus | "all">("all");

  const handleQuickFilter = (status: RoomStatus | "all") => {
    setQuickStatus(status);
    setStatusFilter(status);

    if (status === "all") {
      setActiveFilters((prev) => prev.filter((f) => !f.startsWith("status-")));
    } else {
      setActiveFilters((prev) => {
        const filtered = prev.filter((f) => !f.startsWith("status-"));
        return [...filtered, `status-${status}`];
      });
    }
  };

  const handleClearAll = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    setDateFilter(today.toISOString().split("T")[0]);
    setFloorFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
    setRoomNumberFilter("");
    setQuickStatus("all");
    setActiveFilters([]);
  };

  const roomTypeEntries = Object.entries(RoomType);
  const activeFilterCount = activeFilters.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms by number, type, or floor..."
              value={roomNumberFilter}
              onChange={(e) => {
                setRoomNumberFilter(e.target.value);
                if (e.target.value) {
                  setActiveFilters((prev) => [
                    ...prev.filter((f) => f !== "search"),
                    "search",
                  ]);
                } else {
                  setActiveFilters((prev) =>
                    prev.filter((f) => f !== "search")
                  );
                }
              }}
              className="pl-9 h-10"
            />
            {roomNumberFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setRoomNumberFilter("");
                  setActiveFilters((prev) =>
                    prev.filter((f) => f !== "search")
                  );
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {/* <AddRoomDialog /> */}
        </div>
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="flex flex-wrap gap-2">
          {/* {STATUS_OPTIONS.slice(1).map((option) => ( */}
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={quickStatus === option.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(option.value as RoomStatus)}
              className={cn(
                "gap-2",
                quickStatus === option.value && option.color
              )}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="rounded-lg border bg-card p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Advanced Filters</h3>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value) {
                    setActiveFilters((prev) => [
                      ...prev.filter((f) => f !== "date"),
                      "date",
                    ]);
                  } else {
                    setActiveFilters((prev) =>
                      prev.filter((f) => f !== "date")
                    );
                  }
                }}
                className="h-9"
              />
            </div>

            {/* Floor Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                Floor
              </label>
              <Select
                onValueChange={(value) => {
                  setFloorFilter(value);
                  if (value !== "all") {
                    setActiveFilters((prev) => [
                      ...prev.filter((f) => f !== "floor"),
                      "floor",
                    ]);
                  } else {
                    setActiveFilters((prev) =>
                      prev.filter((f) => f !== "floor")
                    );
                  }
                }}
                defaultValue="all"
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {FLOOR_OPTIONS.map((floor) => (
                    <SelectItem key={floor.value} value={floor.value}>
                      {floor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Bed className="h-3.5 w-3.5" />
                Room Type
              </label>
              <Select
                onValueChange={(value: RoomType | "all") => {
                  setTypeFilter(value);
                  if (value !== "all") {
                    setActiveFilters((prev) => [
                      ...prev.filter((f) => f !== "type"),
                      "type",
                    ]);
                  } else {
                    setActiveFilters((prev) =>
                      prev.filter((f) => f !== "type")
                    );
                  }
                }}
                defaultValue="all"
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  {roomTypeEntries.map(([key, label]) => {
                    const Icon = ROOM_TYPE_ICONS[key] || Bed;
                    return (
                      <SelectItem key={key} value={label}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                Status
              </label>
              <Select
                onValueChange={(value: RoomStatus | "all") => {
                  setStatusFilter(value);
                  setQuickStatus(value);
                  if (value !== "all") {
                    setActiveFilters((prev) => [
                      ...prev.filter((f) => f !== "status"),
                      "status",
                    ]);
                  } else {
                    setActiveFilters((prev) =>
                      prev.filter((f) => f !== "status")
                    );
                  }
                }}
                value={quickStatus}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Active filters:
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeFilters.includes("search") && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Search: {roomNumberFilter}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setRoomNumberFilter("");
                          setActiveFilters((prev) =>
                            prev.filter((f) => f !== "search")
                          );
                        }}
                      />
                    </Badge>
                  )}
                  {activeFilters.includes("date") && dateFilter && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Date: {dateFilter}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setDateFilter("");
                          setActiveFilters((prev) =>
                            prev.filter((f) => f !== "date")
                          );
                        }}
                      />
                    </Badge>
                  )}
                  {activeFilters.includes("floor") && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Floor:{" "}
                      {FLOOR_OPTIONS.find((f) => f.value !== "all")?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setFloorFilter("all");
                          setActiveFilters((prev) =>
                            prev.filter((f) => f !== "floor")
                          );
                        }}
                      />
                    </Badge>
                  )}
                  {activeFilters.includes("type") && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Type:{" "}
                      {
                        roomTypeEntries.find(([key]) =>
                          activeFilters.some((f) => f === `type-${key}`)
                        )?.[1]
                      }
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setTypeFilter("all");
                          setActiveFilters((prev) =>
                            prev.filter((f) => f !== "type")
                          );
                        }}
                      />
                    </Badge>
                  )}
                  {activeFilters.includes("status") &&
                    quickStatus !== "all" && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        Status:{" "}
                        {
                          STATUS_OPTIONS.find((o) => o.value === quickStatus)
                            ?.label
                        }
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setStatusFilter("all");
                            setQuickStatus("all");
                            setActiveFilters((prev) =>
                              prev.filter((f) => f !== "status")
                            );
                          }}
                        />
                      </Badge>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
