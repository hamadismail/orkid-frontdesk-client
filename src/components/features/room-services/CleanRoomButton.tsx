"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { BrushCleaning } from "lucide-react";
import { IRoom } from "@/src/types/room.interface";

export default function CleanRoomButton({
  room,
  onClose,
}: {
  room: IRoom;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: cleanRoomMutation, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.patch(`/rooms/${room?._id}/clean`);
      return res.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room cleaned successfully!");
      setOpen(false);
      onClose?.(); // Call onClose if provided
    },
    onError: (error) => {
      toast.error("Failed to clean room", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1">
          <BrushCleaning className="h-4 w-4" />
          <span>Clean</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clean Room {room.roomNo}?</DialogTitle>
          <DialogDescription>
            This will mark the room as available for new guests.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => cleanRoomMutation()} disabled={isPending}>
            {isPending ? "Cleaning..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
