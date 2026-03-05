/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  LogOut,
  User,
  Calendar,
  Loader2,
  Receipt,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkOutReservation } from "@/src/services/reservation.service";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

export default function CheckOut({
  reservation,
  onClose,
  variant = "default",
  size = "sm",
  className,
}: {
  reservation: IReservation;
  onClose?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: checkOutMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await checkOutReservation(reservation?._id!.toString());
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Checkout successful");
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Checkout failed", { description: error.message });
    },
  });

  if (!reservation) return null;

  const dueAmount = reservation.payment?.dueAmount || 0;
  const isFullyPaid = dueAmount <= 0;
  const guest = reservation.guestId as unknown as IGuest;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          <LogOut className="h-4 w-4" />
          Check Out
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Check Out</DialogTitle>
          <DialogDescription>
            Complete the checkout process for Room{" "}
            {(reservation.roomId as any)?.roomNo}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{guest?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Stay: {format(new Date(reservation.stay.arrival), "PP")} -{" "}
                  {format(new Date(reservation.stay.departure), "PP")}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="text-sm">Balance Due</span>
              </div>
              <Badge variant={isFullyPaid ? "outline" : "destructive"}>
                RM {dueAmount.toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="ack"
              checked={acknowledged}
              onCheckedChange={(c) => setAcknowledged(!!c)}
            />
            <label
              htmlFor="ack"
              className="text-sm cursor-pointer leading-none"
            >
              I confirm all belongings are cleared and room keys returned.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => checkOutMutation()}
            disabled={isPending || !acknowledged}
            variant={isFullyPaid ? "default" : "destructive"}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirm Check Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
