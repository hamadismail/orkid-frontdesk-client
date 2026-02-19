import {
  CheckCircle,
  Clock,
  UserCheck,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { cn } from "@/src/lib/utils";

type RoomStatsProps = {
  availableCount: number;
  reservedCount: number;
  occupiedCount: number;
  dueOutCount: number;
  dirtyCount: number;
  serviceCount: number;
  showHeader?: boolean;
};

const STAT_CONFIGS = {
  available: {
    label: "Available",
    icon: CheckCircle,
    color:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    variant: "bg-green-500",
    description: "Ready for booking",
  },
  reserved: {
    label: "Reserved",
    icon: Calendar,
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    variant: "bg-yellow-500",
    description: "Arriving soon",
  },
  occupied: {
    label: "Occupied",
    icon: UserCheck,
    color:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    variant: "bg-red-500",
    description: "Currently staying",
  },
  dueOut: {
    label: "Due Out",
    icon: Clock,
    color:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    variant: "bg-blue-500",
    description: "Checking out today",
  },
  dirty: {
    label: "Dirty",
    icon: AlertCircle,
    color:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
    variant: "bg-orange-500",
    description: "Needs cleaning",
  },
  service: {
    label: "Service",
    icon: TrendingUp,
    color:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    // variant: "secondary" as const,
    variant: "bg-purple-500",
    description: "Maintenance required",
  },
} as const;

const StatItem = ({
  statKey,
  count,
}: {
  statKey: keyof typeof STAT_CONFIGS;
  count: number;
}) => {
  if (count === 0) return null;

  const config = STAT_CONFIGS[statKey];
  const Icon = config.icon;
  // const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
        config.color,
        "px-3 py-2"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "p-2 rounded-md",
            config.color
              .replace("bg-", "bg-")
              .replace("text-", "bg-")
              .split(" ")[0] + "/20"
          )}
        >
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{config.label}</span>
            {/* {showPercentages && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {percentage}%
                </span>
              )} */}
          </div>
          {
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.description}
            </p>
          }
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "px-2.5 py-1 font-semibold text-sm min-w-10 justify-center",
          "text-xs px-2 py-0.5 text-white",
          config.variant
        )}
      >
        {count}
      </Badge>
    </div>
  );
};

export default function RoomStats({
  availableCount = 0,
  reservedCount = 0,
  occupiedCount = 0,
  dueOutCount = 0,
  dirtyCount = 0,
  serviceCount = 0,
  showHeader = true,
}: RoomStatsProps) {
  const stats = [
    { key: "available", count: availableCount },
    { key: "reserved", count: reservedCount },
    { key: "occupied", count: occupiedCount },
    { key: "dueOut", count: dueOutCount },
    { key: "dirty", count: dirtyCount },
    { key: "service", count: serviceCount },
  ];

  // const total = totalRooms || stats.reduce((sum, stat) => sum + stat.count, 0);
  // const occupancyRate =
  //   total > 0 ? ((occupiedCount + reservedCount) / total) * 100 : 0;

  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Room Status</h3>
          {/* {showPercentages && (
            <span className="text-xs text-muted-foreground">
              Occupancy: {occupancyRate.toFixed(1)}%
            </span>
          )} */}
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {stats
          .filter((stat) => stat.count > 0)
          .map((stat) => (
            <StatItem
              key={stat.key}
              statKey={stat.key as keyof typeof STAT_CONFIGS}
              count={stat.count}
            />
          ))}
      </div>
    </div>
  );
}
