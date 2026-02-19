import React, { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { GetRoomIcon } from "@/src/shared/GetRoomIcon";
import { Home, User, Calendar, Clock } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import BookRoomDialog from "../room-services/BookRoomDialog";
import StayOver from "../room-services/StayOver";
import CheckOut from "../room-services/CheckOut";
import CancelReservationButton from "../room-services/CancelReservationButton";
import RoomService from "../room-services/RoomService";
import MoveRoom from "../room-services/MoveRoom";
import { IRoom, RoomStatus } from "@/src/types/room.interface";
import { IReservation } from "@/src/types/reservation.interface";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";
import { NewReservationDialog } from "../reservation/NewReservationDialog";

type RoomDetailsDialogProps = {
  roomStatus: RoomStatus;
  room: IRoom;
  guestName: string;
  guestStatus: string;
  arrival?: Date;
  departure?: Date;
  allReservations: IReservation[];
  reservation?: IReservation;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const STATUS_CONFIG = {
  [RoomStatus.AVAILABLE]: {
    variant: "default" as const,
    label: "Available",
    description: "Ready for booking",
  },
  [RoomStatus.RESERVED]: {
    variant: "secondary" as const,
    label: "Reserved",
    description: "Guest arriving soon",
  },
  [RoomStatus.OCCUPIED]: {
    variant: "destructive" as const,
    label: "Occupied",
    description: "Guest currently staying",
  },
  [RoomStatus.DUE_OUT]: {
    variant: "outline" as const,
    label: "Due Out",
    description: "Checking out today",
  },
  [RoomStatus.DIRTY]: {
    variant: "secondary" as const,
    label: "Dirty",
    description: "Needs cleaning",
  },
  [RoomStatus.SERVICE]: {
    variant: "outline" as const,
    label: "Service",
    description: "Maintenance required",
  },
} as const;

export default function RoomDetailsDialog({
  roomStatus,
  room,
  guestName,
  guestStatus,
  arrival,
  departure,
  allReservations,
  reservation,
  setOpen,
}: RoomDetailsDialogProps) {
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] =
    useState(false);

  const config = STATUS_CONFIG[roomStatus];

  const hasGuest = [
    RoomStatus.OCCUPIED,
    RoomStatus.RESERVED,
    RoomStatus.DUE_OUT,
  ].includes(roomStatus);

  const getStayDuration = () => {
    if (!arrival || !departure) return null;
    const nights = Math.ceil(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `${nights} night${nights !== 1 ? "s" : ""}`;
  };

  const actionButtons = () => {
    switch (roomStatus) {
      case RoomStatus.AVAILABLE:
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleNewReservationClick}
            >
              <Clock className="h-3.5 w-3.5" />
              Reserve
            </Button>
            <BookRoomDialog
              room={room}
              onClose={() => setOpen(false)}
              // variant="default"
              // size="sm"
              // className="flex-1 gap-2"
            />
          </div>
        );

      case RoomStatus.RESERVED:
        return (
          <div className="flex gap-2 justify-end">
            {reservation?._id && (
              <CancelReservationButton
                reservationId={reservation._id}
                onClose={() => setOpen(false)}
                // size="sm"
                // variant="outline"
                // className="flex-1 gap-2"
              />
            )}
            <BookRoomDialog
              room={room}
              allReservations={allReservations}
              onClose={() => setOpen(false)}
              // variant="default"
              // size="sm"
              // className="flex-1 gap-2"
            />
          </div>
        );

      case RoomStatus.DIRTY:
        return (
          <div className="flex flex-col gap-2">
            <Badge
              variant="outline"
              className="w-full justify-center py-2 bg-amber-50 dark:bg-amber-950/20"
            >
              Awaiting Cleaning
            </Badge>
            {/* <Button size="sm" className="gap-2">
              <Clock className="h-3.5 w-3.5" />
              Mark as Clean
            </Button> */}
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-2">
            <RoomService room={room} onClose={() => setOpen(false)} />
            <MoveRoom room={room} onClose={() => setOpen(false)} />
            <StayOver room={room} onClose={() => setOpen(false)} />
            <CheckOut room={room} onClose={() => setOpen(false)} />
          </div>
        );
    }
  };

  const handleNewReservationClick = () => {
    setIsNewReservationDialogOpen(true);
  };

  const closeNewReservationDialog = () => {
    setIsNewReservationDialogOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
      {/* Header with Status */}
      <div
        className={cn(
          "px-6 pt-6 pb-4",
          roomStatus === RoomStatus.AVAILABLE &&
            "bg-green-50 dark:bg-green-950/30",
          roomStatus === RoomStatus.RESERVED &&
            "bg-yellow-50 dark:bg-yellow-950/30",
          roomStatus === RoomStatus.OCCUPIED && "bg-red-50 dark:bg-red-950/30",
          roomStatus === RoomStatus.DUE_OUT && "bg-blue-50 dark:bg-blue-950/30",
          roomStatus === RoomStatus.DIRTY &&
            "bg-orange-50 dark:bg-orange-950/30",
          roomStatus === RoomStatus.SERVICE &&
            "bg-purple-50 dark:bg-purple-950/30",
        )}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {GetRoomIcon(room.roomType)}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Room {room.roomNo}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-3.5 w-3.5" />
                  <span>Floor {room.roomFloor}</span>
                  <span>•</span>
                  <span className="capitalize">{room.roomType}</span>
                </div>
              </div>
            </div>
            <Badge variant={config.variant} className="capitalize">
              {config.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{config.description}</p>
        </DialogHeader>
      </div>

      {/* Content */}
      <div className="px-6">
        {/* Room Details */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Capacity</div>
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Max {room.maxCapacity} guests</span>
            </div>
          </div>

          {reservation?.rate && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rate</div>
              <div className="flex items-center gap-2 font-medium">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${reservation.rate.toFixed(2)}/night</span>
              </div>
            </div>
          )}
        </div> */}

        {/* Guest Information */}
        {hasGuest && (
          <>
            {/* <Separator /> */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{guestName || "N/A"}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {guestStatus.toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>

              {(arrival || departure) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {arrival && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">Check-in</span>
                      </div>
                      <div className="font-medium">
                        {format(arrival, "MMM d, yyyy")}
                      </div>
                    </div>
                  )}

                  {departure && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">Check-out</span>
                      </div>
                      <div className="font-medium">
                        {format(departure, "MMM d, yyyy")}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {arrival && departure && getStayDuration() && (
                <Badge variant="outline" className="w-fit">
                  {getStayDuration()}
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-6 pb-6 pt-4 border-t bg-muted/50">
        {actionButtons()}
      </div>

      <DialogDescription className="sr-only">Room Details</DialogDescription>

      <NewReservationDialog
        allReservations={allReservations}
        isOpen={isNewReservationDialogOpen}
        onClose={closeNewReservationDialog}
        room={room}
      />
    </DialogContent>
  );
}
