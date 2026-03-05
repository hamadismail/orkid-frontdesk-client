/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
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
import { Ghost, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { markAsNoShowReservation } from "@/src/services/reservation.service";
import { cn } from "@/src/lib/utils";

export default function MarkAsNoShow({
  reservationId,
  onClose,
  className,
}: {
  reservationId: string;
  onClose?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: noShowMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await markAsNoShowReservation(reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Reservation marked as No-Show");
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Action failed", { description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 border-orange-200 text-orange-700 hover:bg-orange-50", className)}
        >
          <Ghost className="h-4 w-4" />
          Mark No-Show
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm No-Show</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this reservation as a No-Show? This will release the room and set the reservation status to No-Show.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => noShowMutation()}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirm No-Show
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
