/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";
import { IRoom } from "@/src/types/room.interface";
import { RoomStatus } from "@/src/types/enums";
import { updateRoomStatus } from "@/src/services/room.service";
import { cn } from "@/src/lib/utils";

export default function ToggleRoomStatus({
  room,
  onClose,
  // variant = "outline",
  size = "sm",
  className,
}: {
  room: IRoom;
  onClose?: () => void;
  // variant?: "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const queryClient = useQueryClient();

  const isOOO = room.roomStatus === RoomStatus.OUT_OF_ORDER;
  const targetStatus = isOOO ? RoomStatus.AVAILABLE : RoomStatus.OUT_OF_ORDER;

  const { mutate: toggleStatusMutation, isPending } = useMutation({
    mutationFn: () => {
      if (!room?._id) throw new Error("Room ID is missing");
      return updateRoomStatus(room._id, isOOO ? "clean" : "ooo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        `Room ${room.roomNo} is now ${targetStatus.replace(/_/g, " ")}`,
      );
      setOpen(false);
      setConfirmation("");
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Failed to update room status", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleConfirm = () => {
    if (confirmation === "CONFIRM") {
      toggleStatusMutation();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setConfirmation("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={isOOO ? "default" : "destructive"}
          size={size}
          className={cn("gap-2", className)}
        >
          {isOOO ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {isOOO ? "Mark Available" : "Block Room"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isOOO ? "Mark Room Available" : "Mark Room Out of Order"}
          </DialogTitle>
          <DialogDescription>
            {isOOO
              ? `Are you sure you want to make Room ${room.roomNo} available for guests?`
              : `This will block Room ${room.roomNo} and make it unavailable for any bookings.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-bold">CONFIRM</span> to proceed
            </Label>
            <Input
              id="confirmation"
              placeholder="CONFIRM"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || confirmation !== "CONFIRM"}
            variant={isOOO ? "default" : "destructive"}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
