/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
import { Calendar } from "@/src/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IReservation } from "@/src/types/reservation.interface";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { amendStay } from "@/src/services/reservation.service";

interface AmendStayProps {
  reservation: IReservation;
  onClose?: () => void;
}

export default function AmendStay({ reservation, onClose }: AmendStayProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(reservation.stay.arrival),
    to: new Date(reservation.stay.departure),
  });
  const queryClient = useQueryClient();

  const { mutate: amendStayMutation, isPending } = useMutation({
    mutationFn: async (newDates: { arrival: Date; departure: Date }) => {
      return await amendStay(reservation._id!.toString(), newDates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Stay amended successfully!");
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error("Failed to amend stay", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleSave = () => {
    if (date?.from && date?.to) {
      amendStayMutation({ arrival: date.from, departure: date.to });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Amend Stay</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Amend Stay Dates</DialogTitle>
          <DialogDescription>
            Change the arrival and departure dates for this reservation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
            <div className="text-sm font-medium">Current Stay: {format(new Date(reservation.stay.arrival), "PP")} - {format(new Date(reservation.stay.departure), "PP")}</div>
            <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick new dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
            </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !date?.to}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Stay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
