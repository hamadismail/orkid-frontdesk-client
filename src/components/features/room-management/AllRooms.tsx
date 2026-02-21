"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Hotel } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import RoomCard from "@/src/components/features/room-management/RoomCard";
import RoomFilter from "@/src/components/features/room-management/RoomFilter";
import RoomStats from "@/src/components/features/room-management/RoomStats";
import { IRoom, RoomStatus, RoomType } from "@/src/types/room.interface";
import { GUEST_STATUS, IBook } from "@/src/types/book.interface";
import { IReservation } from "@/src/types/reservation.interface";
import { useQuery } from "@tanstack/react-query";
import LoadingSpiner from "@/src/shared/LoadingSpiner";
import { getAllRooms } from "@/src/services/room.service";
import { getAllBookings } from "@/src/services/booking.service";
import { getAllReservations } from "@/src/services/reservation.service";

function AllRooms() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [floorFilter, setFloorFilter] = useState("all");

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for a "live" feel
    return () => clearInterval(timer);
  }, []);

  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // adjust to local time
    return d.toISOString().split("T")[0];
  });
  const [roomNumberFilter, setRoomNumberFilter] = useState("");

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

  // Filter rooms based on selected date
  const filteredRooms = allRooms.filter((room: IRoom) => {
    const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

    // Check if room is reserved on selected date
    const isReserved = allReservations.some((reservation: IReservation) => {
      const arrival = new Date(reservation.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(reservation.room.departure).setHours(
        0,
        0,
        0,
        0,
      );
      return (
        reservation.room.roomNo === room.roomNo &&
        arrival <= selected &&
        departure >= selected
      );
    });

    // Apply additional filters
    return (
      (floorFilter === "all" || room.roomFloor.toString() === floorFilter) &&
      (typeFilter === "all" || room.roomType === typeFilter) &&
      (statusFilter === "all" ||
        (statusFilter === RoomStatus.AVAILABLE &&
          room.roomStatus === RoomStatus.AVAILABLE &&
          !isReserved) ||
        (statusFilter === RoomStatus.OCCUPIED &&
          (room.roomStatus === RoomStatus.OCCUPIED ||
            room.roomStatus === RoomStatus.SERVICE)) ||
        (statusFilter === RoomStatus.RESERVED &&
          room.roomStatus !== RoomStatus.SERVICE &&
          room.roomStatus !== RoomStatus.OCCUPIED &&
          room.roomStatus !== RoomStatus.DUE_OUT &&
          isReserved) ||
        (statusFilter === RoomStatus.DUE_OUT &&
          room.roomStatus === RoomStatus.DUE_OUT) ||
        (statusFilter === RoomStatus.DIRTY &&
          room.roomStatus === RoomStatus.DIRTY)) &&
      (roomNumberFilter === "" ||
        room.roomNo
          .toString()
          .toLowerCase()
          .includes(roomNumberFilter.toLowerCase()))
    );
  });

  // Room Info
  const roomInfo = (room: IRoom) => {
    const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

    // Find reservation for this room on selected date
    const reservation = allReservations.find((r: IReservation) => {
      const arrival = new Date(r.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(r.room.departure).setHours(0, 0, 0, 0);
      return (
        r.room.roomNo === room.roomNo &&
        arrival <= selected &&
        departure >= selected
      );
    });

    // Determine room status for selected date
    let roomStatus = RoomStatus.AVAILABLE;
    let guestName = "";
    let guestStatus = "";
    let arrival = new Date();
    let departure = new Date();

    if (
      room.roomStatus === RoomStatus.OCCUPIED ||
      room.roomStatus === RoomStatus.SERVICE
    ) {
      roomStatus = RoomStatus.OCCUPIED;
      const occupiedBooking = allBookings.find(
        (b: IBook) =>
          (b.roomId as { _id: { toString(): string } })._id.toString() ===
          room._id?.toString(),
      );
      if (occupiedBooking) {
        guestName = occupiedBooking.guest.name;
        guestStatus = GUEST_STATUS.CHECKED_IN;
        arrival = occupiedBooking.stay.arrival;
        departure = occupiedBooking.stay.departure;
      }
    } else if (room.roomStatus === RoomStatus.DUE_OUT) {
      roomStatus = RoomStatus.DUE_OUT;
      const dueOutBooking = allBookings.find(
        (b: IBook) =>
          (b.roomId as { _id: { toString(): string } })._id.toString() ===
          room._id?.toString(),
      );
      if (dueOutBooking) {
        guestName = dueOutBooking.guest.name;
        guestStatus = "Due Out";
        arrival = dueOutBooking.stay.arrival;
        departure = dueOutBooking.stay.departure;
      }
    } else if (room.roomStatus === RoomStatus.DIRTY) {
      roomStatus = RoomStatus.DIRTY;
    } else if (reservation) {
      roomStatus = RoomStatus.RESERVED;
      guestName = reservation.guest.name;
      guestStatus = GUEST_STATUS.RESERVED;
      arrival = reservation.room.arrival;
      departure = reservation.room.departure;
    }

    return {
      roomStatus,
      guestName,
      guestStatus,
      arrival,
      departure,
      reservation,
    };
  };

  // Count rooms by status for the selected date
  const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

  // Get accurate counts by using the same logic as the room filtering
  const occupiedCount = allRooms.filter(
    (room: IRoom) =>
      room.roomStatus === RoomStatus.OCCUPIED ||
      room.roomStatus === RoomStatus.SERVICE,
  ).length;

  const reservedCount = allRooms.filter((room: IRoom) => {
    const isReserved = allReservations.some((reservation: IReservation) => {
      const arrival = new Date(reservation.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(reservation.room.departure).setHours(
        0,
        0,
        0,
        0,
      );
      return (
        reservation.room.roomNo === room.roomNo &&
        room.roomStatus !== RoomStatus.OCCUPIED &&
        room.roomStatus !== RoomStatus.DUE_OUT &&
        room.roomStatus !== RoomStatus.SERVICE &&
        arrival <= selected &&
        departure >= selected
      );
    });

    return isReserved;
  }).length;

  // Count due out rooms (rooms with DUE_OUT status)
  const dueOutCount = allRooms.filter(
    (room: IRoom) => room.roomStatus === RoomStatus.DUE_OUT,
  ).length;

  const dirtyCount = allRooms.filter(
    (room: IRoom) => room.roomStatus === RoomStatus.DIRTY,
  ).length;

  const serviceCount = allRooms.filter(
    (room: IRoom) => room.roomStatus === RoomStatus.SERVICE,
  ).length;

  const availableCount = allRooms.filter((room: IRoom) => {
    const isReserved = allReservations.some((reservation: IReservation) => {
      const arrival = new Date(reservation.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(reservation.room.departure).setHours(
        0,
        0,
        0,
        0,
      );
      return (
        reservation.room.roomNo === room.roomNo &&
        arrival <= selected &&
        departure >= selected
      );
    });

    return room.roomStatus === RoomStatus.AVAILABLE && !isReserved;
  }).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header with title and stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Room Management</h2>
        </div>

        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm border rounded-xl px-4 py-2 shadow-sm">
          <div className="flex items-center gap-2 border-r pr-4">
            <Calendar className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current Date</span>
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
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Local Time</span>
              <span className="text-sm font-bold tabular-nums">
                {currentTime?.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  second: "2-digit",
                }) || "..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats */}
        <RoomStats
          availableCount={availableCount}
          reservedCount={reservedCount}
          occupiedCount={occupiedCount}
          dueOutCount={dueOutCount}
          dirtyCount={dirtyCount}
          serviceCount={serviceCount}
        />

        {/* Filters */}
        <RoomFilter
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          setFloorFilter={setFloorFilter}
          setTypeFilter={setTypeFilter}
          setStatusFilter={setStatusFilter}
          roomNumberFilter={roomNumberFilter}
          setRoomNumberFilter={setRoomNumberFilter}
        />
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-4 text-muted-foreground">
          <Hotel className="h-12 w-12" />
          <p className="text-lg">No rooms found with selected filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setFloorFilter("all");
              setTypeFilter("all");
              setStatusFilter("all");
              setDateFilter(new Date().toISOString().split("T")[0]);
              setRoomNumberFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : RoomLoading || BookingLoading || ReserveLoading ? (
        <LoadingSpiner />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room: IRoom) => {
            const {
              roomStatus,
              guestName,
              guestStatus,
              arrival,
              departure,
              reservation,
            } = roomInfo(room);
            return (
              <RoomCard
                key={room._id?.toString()}
                roomStatus={roomStatus}
                room={room}
                guestName={guestName}
                guestStatus={guestStatus}
                arrival={arrival}
                departure={departure}
                allReservations={allReservations}
                reservation={reservation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AllRooms;
