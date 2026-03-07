/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
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
import { cn, normalizeToMalaysiaMidnight } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import { extendStay } from "@/src/services/reservation.service";
import { IReservation } from "@/src/types/reservation.interface";
import { PAYMENT_METHOD } from "@/src/types/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PaymentInvoice } from "@/src/shared/PaymentInvoice";
import { Badge } from "../../ui/badge";

type StayOverProps = {
  reservation: IReservation;
  groupReservations?: IReservation[];
  onClose?: () => void;
  variant?: "secondary" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
};

export default function StayOver({
  reservation,
  groupReservations,
  onClose,
  variant = "secondary",
  size = "sm",
  className,
}: StayOverProps) {
  const [open, setOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const [newDeparture, setNewDeparture] = useState<Date | undefined>(
    reservation?.stay?.departure
      ? addDays(new Date(reservation.stay.departure), 1)
      : undefined,
  );

  const [updatedRoomPrice, setUpdatedRoomPrice] = useState(
    reservation?.rate?.roomPrice?.toString() || "0",
  );
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PAYMENT_METHOD>(
    PAYMENT_METHOD.CASH,
  );
  const [remarks, setRemarks] = useState("");

  const queryClient = useQueryClient();

  const group = reservation?.groupId as any;

  // Financial context for the group
  const groupFinancials = useMemo(() => {
    // If group object has payment data, use it
    if (group?.payment) {
      return {
        paidAmount: group.payment.paidAmount || 0,
        dueAmount: group.payment.dueAmount || 0,
        deposit: group.payment.deposit || 0,
      };
    }

    // Fallback: If we have group reservations, calculate the totals
    if (groupReservations && groupReservations.length > 0) {
      const totalDue = groupReservations.reduce(
        (acc, res) => acc + (res.rate?.subtotal || 0),
        0,
      );
      // Since individual paidAmount was moved to group, we check if any reservation still has it (legacy)
      // but ideally we just return 0/placeholder if the central group object isn't populated yet
      return {
        paidAmount: 0,
        dueAmount: totalDue,
        deposit: 0,
      };
    }

    return { paidAmount: 0, dueAmount: 0, deposit: 0 };
  }, [group, groupReservations]);

  const additionalNights = useMemo(() => {
    if (!newDeparture || !reservation?.stay?.departure) return 0;
    const nights = differenceInCalendarDays(
      startOfDay(newDeparture),
      startOfDay(new Date(reservation.stay.departure)),
    );
    return Math.max(0, nights);
  }, [newDeparture, reservation?.stay?.departure]);

  const extraCharge = useMemo(() => {
    return additionalNights * parseFloat(updatedRoomPrice || "0");
  }, [additionalNights, updatedRoomPrice]);

  const totalDueAfterExtension = useMemo(() => {
    return groupFinancials.dueAmount + extraCharge;
  }, [groupFinancials.dueAmount, extraCharge]);

  const remainingDue = useMemo(() => {
    return totalDueAfterExtension - parseFloat(paidAmount || "0");
  }, [totalDueAfterExtension, paidAmount]);

  const { mutate: extendMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!reservation?._id) throw new Error("Reservation not found");
      if (!newDeparture) throw new Error("Select new departure date");

      const payload = {
        newDeparture: normalizeToMalaysiaMidnight(newDeparture),
        extraCharge,
        paidAmount: parseFloat(paidAmount || "0"),
        paymentMethod,
        remarks: remarks || `Stay extended by ${additionalNights} night(s)`,
      };

      return await extendStay(reservation._id.toString(), payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Stay extended successfully");

      if (result.payment) {
        // Prepare data for receipt
        const res = result.reservation;
        const guest = res.guestId;
        const room = res.roomId;

        setPaymentData({
          guest: {
            name: (guest as any).name,
            phone: (guest as any).phone,
            source: res.source,
            refId: res.refId,
          },
          stay: {
            arrival: res.stay.arrival,
            departure: res.stay.departure,
          },
          room: {
            number: (room as any).roomNo,
            type: (room as any).roomType,
          },
          payment: {
            paidAmount: result.payment.amount,
            method: result.payment.paymentMethod,
            remarks: result.payment.remarks,
          },
          paymentDate: result.payment.createdAt,
          paymentId: result.payment._id?.toUpperCase(),
        });
        setShowReceipt(true);
        setOpen(false); // Close extension input dialog
      } else {
        setOpen(false);
        onClose?.();
      }
    },
    onError: (error: any) => {
      toast.error("Extension failed", { description: error.message });
    },
  });

  if (!reservation) return null;

  const handleCloseReceipt = (val: boolean) => {
    setShowReceipt(val);
    if (!val) {
      onClose?.();
    }
  };

  return (
    <>
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

        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Extend Stay (Stay Over)</DialogTitle>
            <DialogDescription>
              Extend the stay and update payment details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                      {newDeparture
                        ? format(newDeparture, "PPP")
                        : "Select date"}
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Room Price (Per Night)
                </Label>
                <Input
                  type="number"
                  value={updatedRoomPrice}
                  onChange={(e) => setUpdatedRoomPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount Paid Now</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) =>
                    setPaymentMethod(val as PAYMENT_METHOD)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PAYMENT_METHOD).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Additional Nights</Label>
                <div className="p-2 border rounded bg-muted font-bold text-center">
                  {additionalNights} nights
                </div>
              </div>
              <div className="space-y-2">
                <Label>Extra Charge (Total)</Label>
                <div className="p-2 border rounded bg-muted font-bold text-center text-blue-600">
                  RM {extraCharge.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Latest stay remarks..."
              />
            </div>

            {groupReservations && groupReservations.length > 1 && (
              <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <BedDouble size={14} /> Linked Rooms in Group
                </h4>
                <div className="flex flex-wrap gap-2">
                  {groupReservations.map((res) => {
                    const isCurrent = res._id === reservation._id;
                    const r = res.roomId as any;
                    return (
                      <div
                        key={res._id}
                        className={cn(
                          "px-2 py-1 rounded border text-[10px] flex items-center gap-2",
                          isCurrent
                            ? "bg-blue-100 border-blue-200 font-bold"
                            : "bg-white border-gray-100",
                        )}
                      >
                        Room {r?.roomNo}
                        <span className="text-[8px] opacity-70">
                          ({res.status})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-2 p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  Group Billing Context
                </span>
                {group?.groupName && (
                  <Badge variant="outline" className="text-[8px] h-4">
                    {group.groupName}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span>Group Total Due:</span>
                <span className="font-bold">
                  RM {(groupFinancials.dueAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-blue-600 font-medium">
                <span>Extension Charge ({additionalNights} nights):</span>
                <span>+ RM {extraCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-muted-foreground/20 pt-1 font-bold">
                <span>New Group Total:</span>
                <span>RM {totalDueAfterExtension.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid Now:</span>
                <span>- RM {parseFloat(paidAmount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-primary/20 pt-1 font-extrabold text-lg text-primary">
                <span>Remaining Group Balance:</span>
                <span
                  className={
                    remainingDue > 0 ? "text-red-600" : "text-green-600"
                  }
                >
                  RM {remainingDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => extendMutation()}
              disabled={isPending || additionalNights === 0}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={handleCloseReceipt}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold text-center">
              Payment Receipt
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
            {paymentData && (
              <PaymentInvoice
                bookingInfo={paymentData}
                isBooking={false}
                printOnly={true}
              />
            )}
          </div>

          <div className="px-6 py-4 border-t bg-muted/50">
            <Button
              onClick={() => setShowReceipt(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
