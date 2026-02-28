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
import { cancelReservation } from "@/src/services/reservation.service";
import { cancelGroup } from "@/src/services/group.service";
import { Clock } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export default function CancelReservationButton({
  reservationId,
  groupId,
  onClose,
}: {
  reservationId?: string;
  groupId?: string;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { mutate: cancelMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (groupId) {
        return await cancelGroup(groupId, reason);
      } else if (reservationId) {
        return await cancelReservation(reservationId, reason);
      }
      throw new Error("No ID provided");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Cancelled successfully!");
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Failed to cancel", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1">
          <Clock className="h-4 w-4" />
          <span>{groupId ? "Cancel Group" : "Cancel"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {groupId ? "Group" : "Reservation"}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this {groupId ? "entire group" : "reservation"}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="reason">Reason for cancellation</Label>
          <Input
            id="reason"
            placeholder="e.g. Change of plans"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancelMutation()}
            disabled={isPending || !reason}
          >
            {isPending ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
