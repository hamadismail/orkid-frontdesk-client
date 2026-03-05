/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
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
import { BedDouble, Loader2, DollarSign, CalendarDays } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar as DatePicker } from "@/src/components/ui/calendar";
import {
  format,
  addDays,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import { extendStay } from "@/src/services/reservation.service";
import { IReservation } from "@/src/types/reservation.interface";

type StayOverProps = {
  reservation: IReservation;
  onClose?: () => void;
  variant?: "secondary" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
};

export default function StayOver({
  reservation,
  onClose,
  variant = "secondary",
  size = "sm",
  className,
}: StayOverProps) {
  const [open, setOpen] = useState(false);
  const [newDeparture, setNewDeparture] = useState<Date | undefined>(
    reservation?.stay?.departure
      ? addDays(new Date(reservation.stay.departure), 1)
      : undefined,
  );
  const [extraCharge, setExtraCharge] = useState("0");
  const [remarks, setRemarks] = useState("");
  const queryClient = useQueryClient();

  const additionalNights = useMemo(() => {
    if (!newDeparture || !reservation?.stay?.departure) return 0;
    return differenceInCalendarDays(
      startOfDay(newDeparture),
      startOfDay(new Date(reservation.stay.departure)),
    );
  }, [newDeparture, reservation?.stay?.departure]);

  const { mutate: extendMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!reservation?._id) throw new Error("Reservation not found");
      if (!newDeparture) throw new Error("Select new departure date");
      return await extendStay(reservation._id.toString(), {
        newDeparture,
        extraCharge: parseFloat(extraCharge),
        remarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Stay extended successfully");
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Extension failed", { description: error.message });
    },
  });

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          <BedDouble className="h-4 w-4" />
          Stay Over
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Stay</DialogTitle>
          <DialogDescription>
            Extend the stay for this reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              New Check-out Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {newDeparture ? format(newDeparture, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DatePicker
                  mode="single"
                  selected={newDeparture}
                  onSelect={setNewDeparture}
                  disabled={(date) =>
                    date <= new Date(reservation.stay.departure)
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="p-3 bg-muted rounded-lg flex justify-between items-center text-sm">
            <span>Additional Nights</span>
            <span className="font-bold">{additionalNights} nights</span>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Extra Charge
            </Label>
            <Input
              type="number"
              value={extraCharge}
              onChange={(e) => setExtraCharge(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Latest stay remarks..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => extendMutation()}
            disabled={isPending || !newDeparture}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirm Extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
