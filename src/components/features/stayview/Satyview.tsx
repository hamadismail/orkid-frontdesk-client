/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  format,
  addDays,
  subDays,
  eachDayOfInterval,
  differenceInDays,
  startOfWeek,
  max,
  min,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn, normalizeToMalaysiaMidnight } from "@/src/lib/utils";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { RESERVATION_STATUS } from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { useQuery } from "@tanstack/react-query";
import LoadingSpiner from "@/src/shared/LoadingSpiner";
import { IRoom } from "@/src/types/room.interface";
import { getAllRooms } from "@/src/services/room.service";
import { getAllReservations } from "@/src/services/reservation.service";

const DESKTOP_MIN_VIEW_DAYS = 14;
const SMALL_SCREEN_MIN_VIEW_DAYS = 1;
const MAX_VIEW_DAYS = 31;
const DESKTOP_DAY_WIDTH = 58;
const MOBILE_DAY_WIDTH = 44;
const DESKTOP_ROOM_COLUMN_WIDTH = 180;
const MOBILE_ROOM_COLUMN_WIDTH = 130;

function StayViewPage() {
  const { data: rooms, isLoading: RoomLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getAllRooms(),
  });
  const { data: reservations, isLoading: ReserveLoading } = useQuery({
    queryKey: ["reservations", "stayview"],
    queryFn: () =>
      getAllReservations({
        limit: 1000,
        status: [
          RESERVATION_STATUS.CHECKED_IN,
          RESERVATION_STATUS.RESERVED,
        ].join(","),
      }),
  });

  const allRooms = useMemo(() => (rooms as any)?.rooms || [], [rooms]);
  const allReservations = useMemo(() => {
    if (!reservations) return [];
    if (Array.isArray(reservations)) return reservations;
    if (reservations.data && Array.isArray(reservations.data))
      return reservations.data;
    return [];
  }, [reservations]);

  const [startDate, setStartDate] = useState(normalizeToMalaysiaMidnight(startOfWeek(new Date())));
  const [selectedGuest, setSelectedGuest] = useState<IReservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [viewDays, setViewDays] = useState(DESKTOP_MIN_VIEW_DAYS);
  const [dayWidth, setDayWidth] = useState(DESKTOP_DAY_WIDTH);
  const [roomColumnWidth, setRoomColumnWidth] = useState(
    DESKTOP_ROOM_COLUMN_WIDTH,
  );

  const isStayViewLoading = RoomLoading || ReserveLoading;

  useEffect(() => {
    if (isStayViewLoading || !gridContainerRef.current) return;
    const gridElement = gridContainerRef.current;
    const updateViewDays = () => {
      const containerWidth = gridElement.clientWidth;
      const isDesktop = containerWidth >= 768;
      const nextRoomColumnWidth = isDesktop
        ? DESKTOP_ROOM_COLUMN_WIDTH
        : MOBILE_ROOM_COLUMN_WIDTH;
      const nextDayWidth = isDesktop ? DESKTOP_DAY_WIDTH : MOBILE_DAY_WIDTH;
      const calculatedDays = Math.max(
        1,
        Math.floor((containerWidth - nextRoomColumnWidth) / nextDayWidth),
      );
      const minDays = isDesktop
        ? DESKTOP_MIN_VIEW_DAYS
        : SMALL_SCREEN_MIN_VIEW_DAYS;
      const nextViewDays = Math.max(
        minDays,
        Math.min(MAX_VIEW_DAYS, calculatedDays),
      );
      setRoomColumnWidth(nextRoomColumnWidth);
      setDayWidth(nextDayWidth);
      setViewDays(nextViewDays);
    };
    updateViewDays();
    window.addEventListener("resize", updateViewDays);
    return () => window.removeEventListener("resize", updateViewDays);
  }, [isStayViewLoading]);

  const endDate = addDays(startDate, viewDays - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const handleNext = () => setStartDate(normalizeToMalaysiaMidnight(addDays(startDate, viewDays)));
  const handlePrev = () => setStartDate(normalizeToMalaysiaMidnight(subDays(startDate, viewDays)));
  const handleToday = () => setStartDate(normalizeToMalaysiaMidnight(startOfWeek(new Date())));

  const handleViewGuest = (res: IReservation) => {
    setSelectedGuest(res);
    setIsDialogOpen(true);
  };

  const groupedRooms = useMemo(() => {
    const grouped: Record<string, IRoom[]> = {};
    allRooms.forEach((room: IRoom) => {
      if (!grouped[room.roomType]) grouped[room.roomType] = [];
      grouped[room.roomType].push(room);
    });
    return Object.entries(grouped);
  }, [allRooms]);

  const calculatePosition = (
    arrival: Date | string,
    departure: Date | string,
  ) => {
    const start = normalizeToMalaysiaMidnight(arrival);
    const end = normalizeToMalaysiaMidnight(departure);

    if (end < startDate || start > endDate) return null;

    const visibleStart = max([start, startDate]);
    const visibleEnd = min([end, endDate]);
    const startDayIndex = differenceInDays(visibleStart, startDate);
    const duration = differenceInDays(visibleEnd, visibleStart) || 1;

    return { startDayIndex, duration };
  };

  const statusStyleMap: any = {
    [RESERVATION_STATUS.CHECKED_IN]:
      "bg-blue-500 border-blue-400 shadow-blue-500/25",
    [RESERVATION_STATUS.CHECKED_OUT]:
      "bg-gray-400 border-gray-300 shadow-gray-500/25",
    [RESERVATION_STATUS.CONFIRMED]:
      "bg-amber-400 border-amber-300 shadow-amber-500/25",
    [RESERVATION_STATUS.RESERVED]:
      "bg-amber-400 border-amber-300 shadow-amber-500/25",
    [RESERVATION_STATUS.CANCELLED]:
      "bg-red-400 border-red-300 shadow-red-500/25",
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800">Stay View</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isStayViewLoading ? (
        <LoadingSpiner />
      ) : (
        <div
          ref={gridContainerRef}
          className="bg-white rounded-lg shadow-lg overflow-x-auto"
        >
          <div
            className="inline-grid w-full"
            style={{
              gridTemplateColumns: `${roomColumnWidth}px repeat(${viewDays}, ${dayWidth}px)`,
            }}
          >
            {/* Header ... */}
            <div className="sticky top-0 z-20 bg-blue-50 p-3 border-b-2 border-r border-blue-200 font-bold text-xs text-center">
              ROOMS
            </div>
            {dateRange.map((date) => (
              <div
                key={date.toString()}
                className={cn(
                  "sticky top-0 z-20 p-2 border-b-2 border-r text-center",
                  isSameDay(date, new Date())
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50",
                )}
              >
                <div className="text-[10px] uppercase">
                  {format(date, "EEE")}
                </div>
                <div className="text-sm font-bold">{format(date, "d")}</div>
              </div>
            ))}

            {groupedRooms.map(([type, rooms]) => (
              <React.Fragment key={type}>
                <div className="col-span-full bg-gray-100 p-2 text-xs font-bold border-b">
                  {type}
                </div>
                {rooms.map((room) => (
                  <React.Fragment key={room._id}>
                    <div className="sticky left-0 bg-white p-3 border-r-2 border-b font-bold text-sm z-10">
                      {room.roomNo}
                    </div>
                    <div
                      className="col-start-2 col-span-full grid relative border-b"
                      style={{
                        gridTemplateColumns: `repeat(${viewDays}, ${dayWidth}px)`,
                        minHeight: "50px",
                      }}
                    >
                      {dateRange.map((date) => (
                        <div
                          key={date.toString()}
                          className="border-r h-full bg-white/50"
                        />
                      ))}
                      {allReservations
                        .filter((res: IReservation) => {
                          const resRoomId =
                            typeof res.roomId === "object"
                              ? res.roomId._id
                              : res.roomId;
                          const roomId =
                            typeof room._id === "object"
                              ? (room._id as any).toString()
                              : room._id;

                          return resRoomId?.toString() === roomId?.toString();
                        })
                        .map((res: IReservation) => {
                          const pos = calculatePosition(
                            res.stay.arrival,
                            res.stay.departure,
                          );
                          if (!pos) return null;
                          const guest = res.guestId as unknown as IGuest;
                          return (
                            <div
                              key={res._id!.toString()}
                              onClick={() => handleViewGuest(res)}
                              className={cn(
                                "absolute inset-y-1 mx-0.5 rounded text-white text-[10px] font-bold flex items-center justify-center cursor-pointer border",
                                statusStyleMap[res.status],
                              )}
                              style={{
                                gridColumnStart: pos.startDayIndex + 1,
                                gridColumnEnd: `span ${pos.duration}`,
                                minWidth: `${pos.duration * dayWidth - 4}px`,
                              }}
                            >
                              {guest?.name?.split(" ")[0]}
                            </div>
                          );
                        })}
                    </div>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <GuestDetailsDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedGuest={selectedGuest}
      />
    </div>
  );
}

export default StayViewPage;
