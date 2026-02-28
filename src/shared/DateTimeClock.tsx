"use client";
import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function DateTimeClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm border rounded-xl px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2 border-r pr-4">
        <Calendar className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Current Date
          </span>
          <span className="text-sm font-bold">
            {currentTime?.toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }) || "..."}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Local Time
          </span>
          <span className="text-sm font-bold tabular-nums">
            {currentTime?.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }) || "..."}
          </span>
        </div>
      </div>
    </div>
  );
}
