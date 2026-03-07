/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { GetRoomIcon } from "@/src/shared/GetRoomIcon";
import { Home, User, Calendar, Clock, CalendarCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import StayOver from "../room-services/StayOver";
import CheckOut from "../room-services/CheckOut";
import CancelReservationButton from "../room-services/CancelReservationButton";
import MarkAsNoShow from "../room-services/MarkAsNoShow";
import RoomService from "../room-services/RoomService";
import MoveRoom from "../room-services/MoveRoom";
import ToggleRoomStatus from "../room-services/ToggleRoomStatus";
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus } from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { format } from "date-fns";
import { cn, normalizeToMalaysiaMidnight } from "@/src/lib/utils";
import { ReservationDialog } from "../reservation/ReservationDialog";

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
    description: "Service required",
  },
  [RoomStatus.OUT_OF_ORDER]: {
    variant: "destructive" as const,
    label: "Out of Order",
    description: "Room is not available",
  },
  [RoomStatus.NO_SHOW]: {
    variant: "outline" as const,
    label: "No Show",
    description: "Guest did not arrive",
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
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"reserve" | "checkin">(
    "reserve",
  );

  const config = STATUS_CONFIG[roomStatus];

  const hasGuest =
    !!guestName ||
    [RoomStatus.OCCUPIED, RoomStatus.RESERVED, RoomStatus.DUE_OUT].includes(
      roomStatus,
    );

  const getStayDuration = () => {
    if (!arrival || !departure) return null;
    const nights = Math.ceil(
      (new Date(departure).getTime() - new Date(arrival).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `${nights} night${nights !== 1 ? "s" : ""}`;
  };

  const handleReserveClick = () => {
    setDialogMode("reserve");
    setIsReservationDialogOpen(true);
  };

  const handleCheckInClick = () => {
    setDialogMode("checkin");
    setIsReservationDialogOpen(true);
  };

  const closeReservationDialog = () => {
    setIsReservationDialogOpen(false);
  };

  const groupReservations = React.useMemo(() => {
    if (!reservation || !allReservations) return [];
    const gId = typeof reservation.groupId === "object" ? (reservation.groupId as any)._id : reservation.groupId;
    return allReservations.filter((res: any) => {
      const resGId = typeof res.groupId === "object" ? res.groupId._id : res.groupId;
      return resGId === gId;
    });
  }, [reservation, allReservations]);

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
          roomStatus === RoomStatus.OUT_OF_ORDER &&
            "bg-gray-50 dark:bg-gray-950/30",
          roomStatus === RoomStatus.SERVICE &&
            "bg-purple-50 dark:bg-purple-950/30",
          roomStatus === RoomStatus.NO_SHOW &&
            "bg-orange-50 dark:bg-orange-950/30",
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
        {/* Guest Information */}
        {hasGuest && (
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
              {reservation?.confirmationNo && (
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Conf. No
                  </div>
                  <div className="text-sm font-mono font-bold text-blue-600">
                    {reservation.confirmationNo}
                  </div>
                </div>
              )}
            </div>

            {reservation?.remarks && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Remarks
                </div>
                <p className="text-sm italic text-blue-800 dark:text-blue-300">
                  {reservation.remarks}
                </p>
              </div>
            )}

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
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-6 pb-6 pt-4 border-t bg-muted/50">
        {roomStatus === RoomStatus.AVAILABLE && (
          <div className="flex justify-end gap-2">
            <ToggleRoomStatus room={room} onClose={() => setOpen(false)} />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleReserveClick}
            >
              <Clock className="h-3.5 w-3.5" />
              Reserve
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleCheckInClick}
            >
              <CalendarCheck className="h-4 w-4" />
              Check-in
            </Button>
          </div>
        )}

        {roomStatus === RoomStatus.OUT_OF_ORDER && (
          <div className="flex justify-end gap-2">
            <ToggleRoomStatus room={room} onClose={() => setOpen(false)} />
          </div>
        )}

        {roomStatus === RoomStatus.RESERVED && (
          <div className="flex gap-2 justify-end">
            {reservation?._id && (
              <CancelReservationButton
                reservationId={reservation._id.toString()}
                onClose={() => setOpen(false)}
              />
            )}
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleCheckInClick}
            >
              <CalendarCheck className="h-4 w-4" />
              Check-in
            </Button>
          </div>
        )}

        {roomStatus === RoomStatus.NO_SHOW && (
          <div className="flex gap-2 justify-end">
            {reservation?._id && (
              <>
                {arrival &&
                  normalizeToMalaysiaMidnight(arrival) <
                    normalizeToMalaysiaMidnight(new Date()) && (
                    <MarkAsNoShow
                      reservationId={reservation._id.toString()}
                      onClose={() => setOpen(false)}
                    />
                  )}
                <CancelReservationButton
                  reservationId={reservation._id.toString()}
                  onClose={() => setOpen(false)}
                />
              </>
            )}
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleCheckInClick}
            >
              <CalendarCheck className="h-4 w-4" />
              Check-in
            </Button>
          </div>
        )}

        {/* Handling visual AVAILABLE but has ghost reservation (missed check-in) */}
        {roomStatus === RoomStatus.AVAILABLE &&
          !hasGuest &&
          reservation?._id && (
            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
              <span className="text-[10px] text-orange-600 font-medium self-center mr-auto italic">
                Missed Check-in
              </span>
              <MarkAsNoShow
                reservationId={reservation._id.toString()}
                onClose={() => setOpen(false)}
              />
            </div>
          )}

        {roomStatus === RoomStatus.DIRTY && (
          <div className="flex flex-col gap-2">
            <Badge
              variant="outline"
              className="w-full justify-center py-2 bg-amber-50 dark:bg-amber-950/20"
            >
              Awaiting Cleaning
            </Badge>
          </div>
        )}

        {[RoomStatus.OCCUPIED, RoomStatus.DUE_OUT, RoomStatus.SERVICE].includes(
          roomStatus,
        ) && (
          <div className="grid grid-cols-2 gap-2">
            <RoomService room={room} onClose={() => setOpen(false)} />
            {reservation && (
              <>
                <MoveRoom
                  reservationId={reservation._id?.toString() || ""}
                  currentRoom={room as any}
                  onClose={() => setOpen(false)}
                />
                <StayOver
                  reservation={reservation}
                  groupReservations={groupReservations}
                  onClose={() => setOpen(false)}
                />
                <CheckOut
                  reservation={reservation}
                  onClose={() => setOpen(false)}
                />
              </>
            )}
          </div>
        )}
      </div>

      <DialogDescription className="sr-only">Room Details</DialogDescription>

      <ReservationDialog
        allReservations={allReservations}
        isOpen={isReservationDialogOpen}
        onClose={closeReservationDialog}
        room={room}
        mode={dialogMode}
        existingReservation={reservation}
      />
    </DialogContent>
  );
}
