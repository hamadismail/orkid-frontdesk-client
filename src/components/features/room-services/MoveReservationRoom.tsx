"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Combobox } from "@/src/components/ui/combobox";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { IRoom } from "@/src/types/room.interface";
import { IReservation } from "@/src/types/reservation.interface";

type MoveReservationRoomProps = {
  reservation: IReservation;
  onClose: () => void;
};

export default function MoveReservationRoom({
  reservation,
  onClose,
}: MoveReservationRoomProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const { data: availableRooms, isLoading } = useQuery<IRoom[]>({
    queryKey: ["available-rooms-for-reservation", reservation._id],
    queryFn: async () => {
      const { data } = await axios.get<{ data: IRoom[] }>("/rooms");

      const reservationRoomId =
        typeof reservation.roomId === "string"
          ? reservation.roomId
          : reservation.roomId?._id;

      return data?.data?.filter((r: IRoom) => r._id !== reservationRoomId);
    },
    enabled: open,
  });

  const { mutate: moveRoom, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedRoom) {
        throw new Error("Please select a room to move to");
      }

      const { data } = await axios.patch("/reserve", {
        reservationId: reservation._id,
        roomId: selectedRoom,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserve"] });
      toast.success("Room moved successfully");
      setOpen(false);
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error("Move failed", {
        description: error.message,
      });
    },
  });

  const roomOptions =
    availableRooms
      ?.filter((room) => room._id) // remove undefined ids
      .map((room) => ({
        value: room._id!.toString(),
        label: `${room.roomNo} - ${room.roomType}`,
      })) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    moveRoom();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Move Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Reservation Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p>
              Current Room:{" "}
              {typeof reservation.roomId === "string"
                ? reservation.roomId
                : reservation.roomId?.roomNo}
            </p>
          </div>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Combobox
              options={roomOptions}
              value={selectedRoom || ""}
              onChange={setSelectedRoom}
              placeholder="Select a new room"
              // emptyMessage="No available rooms found for the selected dates."
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedRoom}>
              {isPending ? "Moving..." : "Move Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <DialogDescription className="sr-only">
        Move Reservation Room
      </DialogDescription>
    </Dialog>
  );
}
