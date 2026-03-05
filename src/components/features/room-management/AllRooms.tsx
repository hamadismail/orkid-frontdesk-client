"use client";

import { useMemo, useState } from "react";
import { Hotel } from "lucide-react";
import RoomCard from "@/src/components/features/room-management/RoomCard";
import RoomFilter from "@/src/components/features/room-management/RoomFilter";
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus, RoomType } from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { useQuery } from "@tanstack/react-query";
import LoadingSpiner from "@/src/shared/LoadingSpiner";
import { getAllRooms } from "@/src/services/room.service";
import AddRoomDialog from "../room-services/AddRoomDialog";
import DateTimeClock from "@/src/shared/DateTimeClock";

function AllRooms() {
  const [floorFilter, setFloorFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [roomNumberFilter, setRoomNumberFilter] = useState("");

  const { data: roomData, isLoading: RoomLoading } = useQuery({
    queryKey: ["rooms", floorFilter, typeFilter, statusFilter, roomNumberFilter],
    queryFn: () => getAllRooms({
      roomFloor: floorFilter,
      roomType: typeFilter,
      roomStatus: statusFilter,
      search: roomNumberFilter,
    }),
  });

  const rooms = useMemo(() => roomData?.rooms || [], [roomData]);
  const roomStatusCounts = useMemo(() => {
    return roomData?.counts || {
      [RoomStatus.AVAILABLE]: 0,
      [RoomStatus.OCCUPIED]: 0,
      [RoomStatus.RESERVED]: 0,
      [RoomStatus.DIRTY]: 0,
      [RoomStatus.DUE_OUT]: 0,
      [RoomStatus.OUT_OF_ORDER]: 0,
      [RoomStatus.SERVICE]: 0,
      [RoomStatus.NO_SHOW]: 0,
    };
  }, [roomData]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Room Management</h2>
        </div>

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
        <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200">
          <span>NO SHOW</span>
          <span className="bg-orange-800 text-white px-2 py-0.5 rounded-full text-xs">
            {roomStatusCounts[RoomStatus.NO_SHOW]}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <RoomFilter
          setFloorFilter={setFloorFilter}
          setTypeFilter={setTypeFilter}
          setStatusFilter={setStatusFilter}
          roomNumberFilter={roomNumberFilter}
          setRoomNumberFilter={setRoomNumberFilter}
        />
      </div>

      {RoomLoading ? (
        <LoadingSpiner />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room: IRoom) => {
            const reservation = room.currentReservationId as IReservation | undefined;
            const guest = reservation?.guestId as unknown as IGuest | undefined;

            return (
              <RoomCard
                key={room._id}
                roomStatus={room.visualStatus || room.roomStatus}
                room={room}
                guestName={guest?.name || ""}
                guestStatus={reservation?.status || ""}
                arrival={reservation ? new Date(reservation.stay.arrival) : undefined}
                departure={reservation ? new Date(reservation.stay.departure) : undefined}
                allReservations={[]} // Not needed in dialog for now, fetch inside if needed
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
