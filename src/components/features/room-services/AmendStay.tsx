"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { IReservation } from "@/src/types/reservation.interface";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";

interface AmendStayProps {
  reservation: IReservation;
  onClose: () => void;
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
      const res = await axios.patch(`/reserve`, {
        reservationId: reservation._id,
        ...newDates,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserve"] });
      toast.success("Stay amended successfully!");
      setOpen(false);
      onClose();
    },
    onError: (error) => {
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
        <Button>Amend Stay</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Amend Stay</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
        <div className={cn("grid gap-2")}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-75 justify-start text-left font-normal",
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
                      <span>Pick a date</span>
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
                  />
                </PopoverContent>
              </Popover>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
