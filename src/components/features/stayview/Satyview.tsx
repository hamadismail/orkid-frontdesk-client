"use client";

import React, { useState, useMemo } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  BedDouble,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { GUEST_STATUS, IBook } from "@/src/types/book.interface";
import { IReservation } from "@/src/types/reservation.interface";
import { useQuery } from "@tanstack/react-query";
import LoadingSpiner from "@/src/shared/LoadingSpiner";
import { getRoomTypeShortForm } from "../dashboard/room-type-utils";
import { IRoom } from "@/src/types/room.interface";
import { getAllRooms } from "@/src/services/room.service";
import { getAllBookings } from "@/src/services/booking.service";
import { getAllReservations } from "@/src/services/reservation.service";

const VIEW_DAYS = 14; // Show 21 days at a time for better monthly view

const DAY_WIDTH = 58; // Define a constant for the width of a single day column

function StayViewPage() {
  const { data: rooms, isLoading: RoomLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getAllRooms(),
  });
  const { data: bookings, isLoading: BookingLoading } = useQuery({
    queryKey: ["book"],
    queryFn: () => getAllBookings(),
  });
  const { data: reservations, isLoading: ReserveLoading } = useQuery({
    queryKey: ["reserve"],
    queryFn: () => getAllReservations(),
  });

  const allRooms = useMemo(() => rooms || [], [rooms]);
  const allBookings = useMemo(() => bookings || [], [bookings]);
  const allReservations = useMemo(() => reservations || [], [reservations]);

  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [selectedGuest, setSelectedGuest] = useState<
    IBook | IReservation | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const endDate = addDays(startDate, VIEW_DAYS - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const handleNext = () => setStartDate(addDays(startDate, VIEW_DAYS));
  const handlePrev = () => setStartDate(subDays(startDate, VIEW_DAYS));
  const handleToday = () => setStartDate(startOfWeek(new Date()));

  const handleViewGuest = (guest: IBook | IReservation) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  const groupedAndSortedRooms = useMemo(() => {
    const grouped = allRooms.reduce(
      (acc: Record<string, IRoom[]>, room: IRoom) => {
        const { roomType } = room;
        if (!acc[roomType]) {
          acc[roomType] = [];
        }
        acc[roomType].push(room);
        return acc;
      },
      {} as Record<string, typeof allRooms>,
    );

    Object.keys(grouped).forEach((roomType) => {
      grouped[roomType].sort((a: IRoom, b: IRoom) =>
        a.roomNo.localeCompare(b.roomNo),
      );
    });

    return Object.entries(grouped);
  }, [allRooms]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getBookingStatus = (booking: IBook) => {
    const departureDate = new Date(booking.stay.departure);
    departureDate.setHours(0, 0, 0, 0);

    if (departureDate <= today) {
      return GUEST_STATUS.CHECKED_OUT;
    }
    return booking.guest.status;
  };

  const calculateBookingPosition = (arrival: Date, departure: Date) => {
    const bookingStart = new Date(arrival);
    bookingStart.setHours(0, 0, 0, 0);
    const bookingEnd = new Date(departure);
    bookingEnd.setHours(0, 0, 0, 0);

    if (bookingEnd < startDate || bookingStart > endDate) {
      return null;
    }

    const visibleStart = max([bookingStart, startDate]);
    const visibleEnd = min([bookingEnd, endDate]);
    // const visibleEnd = addDays(min([bookingEnd, endDate]), 1);

    const startDayIndex = differenceInDays(visibleStart, startDate);
    const duration = differenceInDays(visibleEnd, visibleStart);
    // const duration = differenceInDays(visibleEnd, visibleStart) - 1;

    return { startDayIndex, duration };
  };

  const statusClasses = {
    [GUEST_STATUS.CHECKED_IN]: {
      bg: "bg-linear-to-r from-blue-500 to-blue-600",
      hover: "hover:from-blue-600 hover:to-blue-700",
      border: "border-blue-400",
      shadow: "shadow-blue-500/25",
    },
    [GUEST_STATUS.CHECKED_OUT]: {
      bg: "bg-linear-to-r from-gray-400 to-gray-500",
      hover: "hover:from-gray-500 hover:to-gray-600",
      border: "border-gray-300",
      shadow: "shadow-gray-500/25",
    },
    [GUEST_STATUS.RESERVED]: {
      bg: "bg-linear-to-r from-amber-400 to-amber-500",
      hover: "hover:from-amber-500 hover:to-amber-600",
      border: "border-amber-300",
      shadow: "shadow-amber-500/25",
    },
    [GUEST_STATUS.CANCEL]: {
      bg: "bg-linear-to-r from-red-400 to-red-500",
      hover: "hover:from-red-500 hover:to-red-600",
      border: "border-red-300",
      shadow: "shadow-red-500/25",
    },
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
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
          <div className="hidden md:block ml-4 font-semibold text-gray-600">
            {format(startDate, "MMM dd, yyyy")} -{" "}
            {format(endDate, "MMM dd, yyyy")}
          </div>
        </div>
      </div>

      {/* Stay View Grid */}
      {RoomLoading || BookingLoading || ReserveLoading ? (
        <LoadingSpiner />
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto overflow-y-hidden">
          <div
            className="inline-grid w-full"
            style={{
              gridTemplateColumns: `180px repeat(${VIEW_DAYS}, ${DAY_WIDTH}px)`,
              minWidth: `${180 + VIEW_DAYS * DAY_WIDTH}px`,
            }}
          >
            {/* Date Header */}
            <div className="sticky top-0 z-20 bg-linear-to-r from-blue-50 to-blue-100 p-3 border-b-2 border-r border-blue-200 font-bold text-sm text-blue-900 flex items-center justify-center">
              <div className="text-center">
                <BedDouble className="h-5 w-5 mx-auto mb-1" />
                <div>ROOMS</div>
              </div>
            </div>

            {dateRange.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              const isWeekend = [0, 6].includes(date.getDay());
              return (
                <div
                  key={date.toString()}
                  className={cn(
                    "sticky top-0 z-20 p-2 border-b-2 border-r border-gray-200 text-center transition-all",
                    isToday
                      ? "bg-linear-to-b from-blue-500 to-blue-600 text-white font-bold"
                      : isWeekend
                        ? "bg-linear-to-b from-orange-50 to-orange-100 text-orange-800"
                        : "bg-linear-to-b from-gray-50 to-gray-100 text-gray-700",
                    index === 0 && "border-l-0",
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isToday
                        ? "text-blue-100"
                        : isWeekend
                          ? "text-orange-600"
                          : "text-gray-500",
                    )}
                  >
                    {format(date, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-bold mt-1",
                      isToday ? "text-white" : "text-gray-800",
                    )}
                  >
                    {format(date, "d")}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isToday ? "text-blue-100" : "text-gray-500",
                    )}
                  >
                    {format(date, "MMM")}
                  </div>
                </div>
              );
            })}

            {/* Room Rows and Bookings */}
            {groupedAndSortedRooms.map(([roomType, rooms]) => (
              <React.Fragment key={roomType}>
                <div className="sticky left-0 p-3 border-r-2 border-b border-gray-200 font-bold text-sm text-gray-800 flex items-center justify-center z-10 col-span-full bg-gray-100">
                  {roomType}
                </div>
                {(rooms as IRoom[]).map((room: IRoom, roomIndex: number) => {
                  const isEvenRow = roomIndex % 2 === 0;
                  return (
                    <React.Fragment key={room._id?.toString()}>
                      {/* Room Info Cell */}
                      <div
                        className={cn(
                          "sticky left-0 p-3 border-r-2 border-b border-gray-200 font-semibold text-sm text-gray-800 flex flex-col justify-center min-h-15 z-10",
                          isEvenRow ? "bg-blue-50" : "bg-white",
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <BedDouble className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-lg text-gray-900">
                              {room.roomNo}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "text-xs px-2 py-1 rounded-full mt-1 w-fit font-medium",
                              room.roomStatus === "AVAILABLE"
                                ? "bg-green-100 text-green-800"
                                : room.roomStatus === "OCCUPIED"
                                  ? "bg-blue-100 text-blue-800"
                                  : room.roomStatus === "RESERVED"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : room.roomStatus === "DIRTY"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800",
                            )}
                          >
                            {room.roomStatus}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 font-medium truncate max-w-40">
                          {room.roomType.replace("Room", "").trim()}
                        </div>
                      </div>

                      {/* Timeline Cells */}
                      <div
                        className="col-start-2 col-span-full grid relative"
                        style={{
                          gridTemplateColumns: `repeat(${VIEW_DAYS}, ${DAY_WIDTH}px)`,
                          minHeight: "60px",
                        }}
                      >
                        {/* Grid cells with alternating background */}
                        {dateRange.map((date, dateIndex) => {
                          const isToday = isSameDay(date, new Date());
                          const isWeekend = [0, 6].includes(date.getDay());
                          return (
                            <div
                              key={date.toString()}
                              className={cn(
                                "border-r border-b min-h-15 relative",
                                isToday
                                  ? "bg-blue-50 border-blue-300 border-r-2"
                                  : isWeekend
                                    ? "bg-orange-25 border-orange-200"
                                    : isEvenRow
                                      ? "bg-blue-25 border-gray-200"
                                      : "bg-white border-gray-200",
                                (dateIndex + 1) % 7 === 0 &&
                                  "border-r-gray-400 border-r-2",
                              )}
                            />
                          );
                        })}

                        {/* Render Bookings */}
                        {allBookings
                          .filter((booking: IBook) => {
                            const bookingRoomId =
                              typeof booking.roomId === "object" &&
                              booking.roomId !== null
                                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  (booking.roomId as any)._id.toString()
                                : booking.roomId;
                            return bookingRoomId === room._id?.toString();
                          })
                          .map((booking: IBook) => {
                            const position = calculateBookingPosition(
                              booking.stay.arrival,
                              booking.stay.departure,
                            );

                            if (!position) return null;

                            const { startDayIndex, duration } = position;
                            const status = getBookingStatus(booking);

                            const statusStyle = statusClasses[status] || {
                              bg: "bg-linear-to-r from-gray-400 to-gray-500",
                              hover: "hover:from-gray-500 hover:to-gray-600",
                              border: "border-gray-300",
                              shadow: "shadow-gray-500/25",
                            };

                            return (
                              <div
                                key={booking._id}
                                onClick={() => handleViewGuest(booking)}
                                className={cn(
                                  "absolute inset-y-1 mx-0.5 rounded-lg text-white text-xs font-medium flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg z-21 border-2",
                                  statusStyle.bg,
                                  statusStyle.hover,
                                  statusStyle.border,
                                  statusStyle.shadow,
                                  "hover:scale-[1.02] hover:z-30",
                                )}
                                style={{
                                  gridColumnStart: startDayIndex + 1,
                                  gridColumnEnd: `span ${duration}`,
                                  minHeight: "54px",
                                  minWidth: `${duration * DAY_WIDTH}px`,
                                }}
                                title={`${booking.guest.name}\n${format(
                                  new Date(booking.stay.arrival),
                                  "MMM d, yyyy",
                                )} - ${format(
                                  new Date(booking.stay.departure),
                                  "MMM d, yyyy",
                                )}\nStatus: ${status}\nRoom: ${
                                  typeof booking.roomId === "object"
                                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      (booking.roomId as any).roomNo
                                    : "N/A"
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center px-2 py-1">
                                  <div className="font-bold text-sm leading-tight mb-1 drop-shadow-sm">
                                    {getRoomTypeShortForm(booking.guest.name)}
                                  </div>
                                  <div className="text-xs opacity-90 font-medium">
                                    {format(
                                      new Date(booking.stay.arrival),
                                      "d",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      new Date(booking.stay.departure),
                                      "d",
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {/* Render Reservations */}
                        {allReservations
                          .filter(
                            (res: IReservation) =>
                              res.room.roomNo === room.roomNo,
                          )
                          .map((reservation: IReservation) => {
                            const position = calculateBookingPosition(
                              reservation.room.arrival,
                              reservation.room.departure,
                            );

                            if (!position) return null;

                            const { startDayIndex, duration } = position;

                            const statusStyle =
                              statusClasses[GUEST_STATUS.RESERVED];

                            return (
                              <div
                                key={reservation._id}
                                onClick={() => handleViewGuest(reservation)}
                                className={cn(
                                  "absolute inset-y-1 mx-0.5 rounded-lg text-white min-w-48 text-xs font-medium flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg z-20 border-2",
                                  statusStyle.bg,
                                  statusStyle.hover,
                                  statusStyle.border,
                                  statusStyle.shadow,
                                  "hover:scale-[1.02] hover:z-30",
                                )}
                                style={{
                                  gridColumnStart: startDayIndex + 1,
                                  gridColumnEnd: `span ${duration}`,
                                  minHeight: "54px",
                                  // minWidth: `minmax(${duration * DAY_WIDTH}px, ${duration}fr)`,
                                  minWidth: `${duration * DAY_WIDTH}px`,
                                }}
                                title={`${
                                  reservation.guest.name
                                } (RESERVATION)\n${format(
                                  new Date(reservation.room.arrival),
                                  "MMM d, yyyy",
                                )} - ${format(
                                  new Date(reservation.room.departure),
                                  "MMM d, yyyy",
                                )}\nRoom: ${reservation.room.roomNo || "TBA"}`}
                              >
                                <div className="flex flex-col items-center justify-center h-full text-center px-2 py-1">
                                  <div className="font-bold text-sm leading-tight mb-1 drop-shadow-sm">
                                    {getRoomTypeShortForm(
                                      reservation.guest.name,
                                    )}
                                  </div>
                                  <div className="text-xs opacity-90 font-medium">
                                    {format(
                                      new Date(reservation.room.arrival),
                                      "d",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      new Date(reservation.room.departure),
                                      "d",
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-linear-to-r from-blue-500 to-blue-600 rounded border border-blue-400"></div>
            <span className="text-xs text-gray-600">Checked In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-linear-to-r from-yellow-400 to-orange-400 rounded border-2 border-dashed border-yellow-200"></div>
            <span className="text-xs text-gray-600">Reservation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-linear-to-r from-gray-400 to-gray-500 rounded border border-gray-300"></div>
            <span className="text-xs text-gray-600">Checked Out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-linear-to-r from-red-400 to-red-500 rounded border border-red-300"></div>
            <span className="text-xs text-gray-600">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 rounded border-2 border-blue-300"></div>
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 rounded border border-orange-200"></div>
            <span className="text-xs text-gray-600">Weekend</span>
          </div>
        </div>
      </div>

      {/* Guest Details Dialog */}
      <GuestDetailsDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedGuest={selectedGuest}
      />
    </div>
  );
}

export default StayViewPage;
