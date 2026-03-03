"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Combobox } from "@/src/components/ui/combobox";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MoveRight,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus } from "@/src/types/enums";
import { cn } from "@/src/lib/utils";
import { getAllRooms } from "@/src/services/room.service";
import { moveReservationRoom } from "@/src/services/reservation.service";

type MoveRoomProps = {
  reservationId: string;
  currentRoom: {
      _id: string;
      roomNo: string;
      roomType: string;
      roomFloor: string;
  };
  onClose?: () => void;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
};

export default function MoveRoom({
  reservationId,
  currentRoom,
  onClose,
  size = "sm",
  variant = "default",
  className,
}: MoveRoomProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const { data: availableRooms, isLoading } = useQuery<IRoom[]>({
    queryKey: ["available-rooms", currentRoom._id],
    queryFn: async () => {
      const result = await getAllRooms();
      const rooms = result.rooms || [];
      return rooms.filter(
        (r: IRoom) =>
          r.roomStatus === RoomStatus.AVAILABLE && r._id !== currentRoom._id
      );
    },
    enabled: open,
  });

  const { mutate: moveRoomMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedRoomId) throw new Error("Please select a room");
      return await moveReservationRoom(reservationId, selectedRoomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room moved successfully");
      setOpen(false);
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error("Move failed", { description: error.message });
    },
  });

  const roomOptions =
    availableRooms?.map((room) => ({
      value: room._id!.toString(),
      label: `${room.roomNo}`,
      description: `${room.roomType} • Floor ${room.roomFloor}`,
    })) || [];

  const selectedRoomNumber = availableRooms?.find(
    (r) => r._id?.toString() === selectedRoomId
  )?.roomNo;

  if (!reservationId) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setSelectedRoomId(""); }}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className={cn("gap-2", className)}
        >
          <MoveRight className="h-4 w-4" />
          Move Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <MoveRight className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Move Room
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Transfer from Room {currentRoom.roomNo} to another available room
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">From</div>
                <div className="font-bold">Room {currentRoom.roomNo}</div>
                <div className="text-xs">{currentRoom.roomType}</div>
              </div>
              <MoveRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-right">
                <div className="text-sm text-muted-foreground">To</div>
                <div className="font-bold">{selectedRoomNumber ? `Room ${selectedRoomNumber}` : "Select Room"}</div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <Label>Select Destination Room</Label>
              <Combobox
                options={roomOptions}
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                placeholder="Search rooms..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => moveRoomMutation()}
            disabled={isPending || !selectedRoomId}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogDescription className="sr-only">Move Room</DialogDescription>
    </Dialog>
  );
}
