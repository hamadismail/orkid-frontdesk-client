/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useCallback } from "react";
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
    queryFn: () => getAllReservations({ limit: 1000 }),
  });

  const allRooms = useMemo(() => rooms || [], [rooms]);
  const allReservations = useMemo(() => {
    if (!reservations) return [];
    if (Array.isArray(reservations)) return reservations;
    if (reservations.data && Array.isArray(reservations.data))
      return reservations.data;
    return [];
  }, [reservations]);

  const getRoomInfo = useCallback(
    (room: IRoom) => {
      const selectedDate = startOfDay(new Date(dateFilter));

      // 1. Check if there's a reservation arriving on the selected date
      const arrivalRes = allReservations.find((r: IReservation) => {
        const resRoomId =
          typeof r.roomId === "object" ? r.roomId._id : r.roomId;
        const roomId =
          typeof room._id === "object"
            ? (room._id as any).toString()
            : room._id;

        if (resRoomId?.toString() !== roomId?.toString()) return false;

        const arrival = startOfDay(new Date(r.stay.arrival));
        return (
          [RESERVATION_STATUS.RESERVED].includes(r.status) &&
          isSameDay(arrival, selectedDate)
        );
      });

      // 2. Find the current stay (for name display on occupied rooms)
      const currentRes = allReservations.find((r: IReservation) => {
        const resRoomId =
          typeof r.roomId === "object" ? r.roomId._id : r.roomId;
        const roomId =
          typeof room._id === "object"
            ? (room._id as any).toString()
            : room._id;

        return (
          resRoomId?.toString() === roomId?.toString() &&
          r.status === RESERVATION_STATUS.CHECKED_IN
        );
      });

      const activeRes = arrivalRes || currentRes;
      const guest = activeRes?.guestId as unknown as IGuest;

      // Determine visual status
      let visualStatus = room.roomStatus;

      if (arrivalRes) {
        visualStatus = RoomStatus.RESERVED;
      } else if (currentRes) {
        const departure = startOfDay(new Date(currentRes.stay.departure));
        // If departure is today or in the past, mark as DUE_OUT
        if (departure <= selectedDate) {
          visualStatus = RoomStatus.DUE_OUT;
        }
      }

      return {
        roomStatus: visualStatus,
        guestName: guest?.name || "",
        guestStatus: activeRes?.status || "",
        arrival: activeRes ? new Date(activeRes.stay.arrival) : undefined,
        departure: activeRes ? new Date(activeRes.stay.departure) : undefined,
        reservation: activeRes,
      };
    },
    [dateFilter, allReservations],
  );

  const roomStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      [RoomStatus.AVAILABLE]: 0,
      [RoomStatus.OCCUPIED]: 0,
      [RoomStatus.RESERVED]: 0,
      [RoomStatus.DIRTY]: 0,
      [RoomStatus.DUE_OUT]: 0,
      [RoomStatus.OUT_OF_ORDER]: 0,
      [RoomStatus.SERVICE]: 0,
    };

    allRooms.forEach((room: IRoom) => {
      const info = getRoomInfo(room);
      const visualStatus = info.roomStatus;
      if (counts[visualStatus] !== undefined) {
        counts[visualStatus]++;
      } else {
        counts[visualStatus] = 1;
      }
    });

    return counts;
  }, [allRooms, getRoomInfo]);

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
      const info = getRoomInfo(room);
      const currentVisualStatus = info.roomStatus;

      if (statusFilter === RoomStatus.AVAILABLE)
        matchesStatus = currentVisualStatus === RoomStatus.AVAILABLE;
      else if (statusFilter === RoomStatus.OCCUPIED)
        matchesStatus =
          currentVisualStatus === RoomStatus.OCCUPIED ||
          currentVisualStatus === RoomStatus.SERVICE ||
          currentVisualStatus === RoomStatus.DUE_OUT;
      else if (statusFilter === RoomStatus.DIRTY)
        matchesStatus = currentVisualStatus === RoomStatus.DIRTY;
      else if (statusFilter === RoomStatus.RESERVED)
        matchesStatus = currentVisualStatus === RoomStatus.RESERVED;
      else if (statusFilter === RoomStatus.DUE_OUT)
        matchesStatus = currentVisualStatus === RoomStatus.DUE_OUT;
      else if (statusFilter === RoomStatus.SERVICE)
        matchesStatus = currentVisualStatus === RoomStatus.SERVICE;
    }

    return matchesFloor && matchesType && matchesNumber && matchesStatus;
  });

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

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
          <span>AVAILABLE</span>
          <span className="bg-green-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.AVAILABLE]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold border border-red-200">
          <span>OCCUPIED</span>
          <span className="bg-red-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.OCCUPIED] +
              roomStatusCounts[RoomStatus.SERVICE] +
              roomStatusCounts[RoomStatus.DUE_OUT]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
          <span>RESERVED</span>
          <span className="bg-blue-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.RESERVED]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-200">
          <span>DIRTY</span>
          <span className="bg-yellow-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.DIRTY]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200">
          <span>DUE OUT</span>
          <span className="bg-orange-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.DUE_OUT]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold border border-gray-200">
          <span>OUT OF ORDER</span>
          <span className="bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.OUT_OF_ORDER]}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200">
          <span>SERVICE</span>
          <span className="bg-purple-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.SERVICE]}
          </span>
        </div>
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
