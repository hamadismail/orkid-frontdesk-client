/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Hotel } from "lucide-react";
import RoomCard from "@/src/components/features/room-management/RoomCard";
import RoomFilter from "@/src/components/features/room-management/RoomFilter";
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus, RoomType, RESERVATION_STATUS } from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { useQuery } from "@tanstack/react-query";
import LoadingSpiner from "@/src/shared/LoadingSpiner";
import { getAllRooms } from "@/src/services/room.service";
import { getAllReservations } from "@/src/services/reservation.service";
import AddRoomDialog from "../room-services/AddRoomDialog";

import { isSameDay, startOfDay } from "date-fns";
import DateTimeClock from "@/src/shared/DateTimeClock";

function AllRooms() {
  const [floorFilter, setFloorFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  });
  const [roomNumberFilter, setRoomNumberFilter] = useState("");

  const { data: rooms, isLoading: RoomLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getAllRooms(),
  });

  const { data: reservations, isLoading: ReserveLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => getAllReservations(),
  });

  const allRooms = useMemo(() => rooms || [], [rooms]);
  const allReservations = useMemo(() => {
    if (!reservations) return [];
    if (Array.isArray(reservations)) return reservations;
    if (reservations.data && Array.isArray(reservations.data))
      return reservations.data;
    return [];
  }, [reservations]);

  const filteredRooms = allRooms.filter((room: IRoom) => {
    // Basic filters
    const matchesFloor =
      floorFilter === "all" || room.roomFloor.toString() === floorFilter;
    const matchesType = typeFilter === "all" || room.roomType === typeFilter;
    const matchesNumber =
      roomNumberFilter === "" ||
      room.roomNo.toLowerCase().includes(roomNumberFilter.toLowerCase());

    // Status filter logic needs to be updated for the new unified model
    let matchesStatus = statusFilter === "all";
    if (!matchesStatus) {
      if (statusFilter === RoomStatus.AVAILABLE)
        matchesStatus = room.roomStatus === RoomStatus.AVAILABLE;
      else if (statusFilter === RoomStatus.OCCUPIED)
        matchesStatus = room.roomStatus === RoomStatus.OCCUPIED;
      else if (statusFilter === RoomStatus.DIRTY)
        matchesStatus = room.roomStatus === RoomStatus.DIRTY;
      else if (statusFilter === RoomStatus.RESERVED)
        matchesStatus = room.roomStatus === RoomStatus.RESERVED;
    }

    return matchesFloor && matchesType && matchesNumber && matchesStatus;
  });

  const getRoomInfo = (room: IRoom) => {
    const selectedDate = startOfDay(new Date(dateFilter));

    // 1. Check if there's a reservation arriving on the selected date
    const arrivalRes = allReservations.find((r: IReservation) => {
      const resRoomId = typeof r.roomId === "object" ? r.roomId._id : r.roomId;
      const roomId =
        typeof room._id === "object" ? (room._id as any).toString() : room._id;

      if (resRoomId?.toString() !== roomId?.toString()) return false;

      const arrival = startOfDay(new Date(r.stay.arrival));
      return (
        [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.RESERVED].includes(
          r.status,
        ) && isSameDay(arrival, selectedDate)
      );
    });

    // 2. Find the current stay (for name display on occupied rooms)
    const currentRes = allReservations.find((r: IReservation) => {
      const resRoomId = typeof r.roomId === "object" ? r.roomId._id : r.roomId;
      const roomId =
        typeof room._id === "object" ? (room._id as any).toString() : room._id;

      return (
        resRoomId?.toString() === roomId?.toString() &&
        r.status === RESERVATION_STATUS.CHECKED_IN
      );
    });

    const activeRes = arrivalRes || currentRes;
    const guest = activeRes?.guestId as unknown as IGuest;

    // Use Reserved status only for arrivals, otherwise use DB roomStatus (which handles Occupied)
    const visualStatus = arrivalRes ? RoomStatus.RESERVED : room.roomStatus;

    return {
      roomStatus: visualStatus,
      guestName: guest?.name || "",
      guestStatus: activeRes?.status || "",
      arrival: activeRes ? new Date(activeRes.stay.arrival) : undefined,
      departure: activeRes ? new Date(activeRes.stay.departure) : undefined,
      reservation: activeRes,
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Room Management</h2>
        </div>

        {/* ... time display ... */}
        <DateTimeClock />
        <AddRoomDialog />
      </div>

      <div className="flex flex-col gap-4">
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

      {RoomLoading || ReserveLoading ? (
        <LoadingSpiner />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room: IRoom) => {
            const info = getRoomInfo(room);
            return (
              <RoomCard
                key={room._id}
                roomStatus={info.roomStatus}
                room={room}
                guestName={info.guestName}
                guestStatus={info.guestStatus}
                arrival={info.arrival}
                departure={info.departure}
                allReservations={allReservations}
                reservation={info.reservation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AllRooms;
