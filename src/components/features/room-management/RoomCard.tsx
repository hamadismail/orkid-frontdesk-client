import React, { useState } from "react";
import { Card } from "../../ui/card";
import { GetRoomIcon } from "@/src/shared/GetRoomIcon";
import { Home } from "lucide-react";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";
import RoomDetailsDialog from "./RoomDetailsDialog";
import { cn } from "@/src/lib/utils";
import RoomBadge from "@/src/components/features/room-management/RoomBadge"; // Re-import RoomBadge
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus } from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";

type RoomCardProps = {
  roomStatus: RoomStatus;
  room: IRoom;
  guestName: string;
  guestStatus: string;
  arrival?: Date;
  departure?: Date;
  allReservations: IReservation[];
  reservation?: IReservation;
};

export default function RoomCard({
  roomStatus,
  room,
  guestName,
  guestStatus,
  arrival,
  departure,
  allReservations,
  reservation,
}: RoomCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card
          className={cn(
            `flex flex-col justify-between p-4 transition-all hover:shadow-lg cursor-pointer`,
            roomStatus === RoomStatus.AVAILABLE &&
              "bg-green-100 border-green-400 dark:bg-green-950 dark:border-green-800",
            roomStatus === RoomStatus.RESERVED &&
              "bg-yellow-100 border-yellow-400 dark:bg-yellow-950 dark:border-yellow-800",
            roomStatus === RoomStatus.DUE_OUT &&
              "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-800",
            roomStatus === RoomStatus.DIRTY &&
              "bg-orange-100 border-orange-400 dark:bg-orange-950 dark:border-orange-800",
            roomStatus === RoomStatus.OCCUPIED &&
              "bg-red-100 border-red-400 dark:bg-red-950 dark:border-red-800",
            roomStatus === RoomStatus.SERVICE &&
              "bg-purple-100 border-purple-400 dark:bg-purple-950 dark:border-purple-800",
            roomStatus === RoomStatus.OUT_OF_ORDER &&
              "bg-gray-100 border-gray-400 dark:bg-gray-950 dark:border-gray-800",
            roomStatus === RoomStatus.NO_SHOW &&
              "bg-purple-100 border-purple-400 dark:bg-purple-950 dark:border-purple-800",
          )}
        >
          {/* Card Heading */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {GetRoomIcon(room.roomType)}
              {room.roomNo}
            </h3>
            <RoomBadge roomStatus={roomStatus} /> {/* Re-add RoomBadge */}
          </div>

          {/* Card Body */}
          <div className="flex flex-col text-sm gap-2">
            {room.roomStatus === RoomStatus.SERVICE && (
              <div className="font-bold text-purple-600">Service Request</div>
            )}

            {/* {roomStatus !== RoomStatus.AVAILABLE && guestName && (
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-md border border-black/5">
                    <p className="font-bold truncate">{guestName}</p>
                    {arrival && departure && (
                        <p className="text-[10px] opacity-70">
                            {format(arrival, "MMM d")} - {format(departure, "MMM d")}
                        </p>
                    )}
                    <Badge variant="outline" className="mt-1 text-[9px] h-4 px-1 uppercase leading-none">
                        {guestStatus}
                    </Badge>
                </div>
            )} */}

            <div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Home className="h-4 w-4" />
                <span>Floor {room.roomFloor}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Type:</span>
                <span className="font-medium">{room.roomType}</span>
              </div>
            </div>
          </div>

          {/* Removed Button Container */}
        </Card>
      </DialogTrigger>
      <RoomDetailsDialog
        room={room}
        reservation={reservation}
        allReservations={allReservations}
        roomStatus={roomStatus}
        guestName={guestName}
        guestStatus={guestStatus}
        arrival={arrival}
        departure={departure}
        setOpen={setOpen}
      />
    </Dialog>
  );
}
