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
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { CreditCard } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Label } from "@/src/components/ui/label";
import { IReservation } from "@/src/types/reservation.interface";
import { PAYMENT_METHOD, PAYMENT_TYPE } from "@/src/types/enums";
import { createPayment } from "@/src/services/payment.service";
import { getGroupDetails } from "@/src/services/group.service";

export default function PaymentModal({ 
    reservation, 
    isGroup = false, 
    groupId 
}: { 
    reservation: IReservation; 
    isGroup?: boolean; 
    groupId?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHOD.CASH);

  const { data: groupData, isLoading: isLoadingGroup } = useQuery({
    queryKey: ["reservations", "group", groupId],
    queryFn: () => getGroupDetails(groupId as string),
    enabled: !!groupId && isGroup && open,
  });

  const { data: currentReservation, isLoading: isLoadingSingle } = useQuery<IReservation>({
    queryKey: ["reservations", reservation?._id],
    queryFn: async () => {
      const { data } = await axios.get(`/reservations/${reservation._id}`);
      return data.data;
    },
    enabled: !!reservation?._id && !isGroup && open,
  });

  const { mutate: processPayment, isPending } = useMutation({
    mutationFn: async () => {
      const amountToPay = parseFloat(amount);
      const remarksText = remarks || (isGroup ? "Group payment" : "Single payment");

      if (isGroup && groupData?.reservations) {
        let remaining = amountToPay;
        const reservationsToPay = [...groupData.reservations].sort((a, b) => 
            (b.payment?.dueAmount || 0) - (a.payment?.dueAmount || 0)
        );

        for (const res of reservationsToPay) {
          if (remaining <= 0) break;
          const due = res.payment?.dueAmount || 0;
          if (due <= 0) continue;

          const payForThis = Math.min(remaining, due);
          await createPayment({
            reservationId: res._id,
            amount: payForThis,
            paymentMethod: method,
            remarks: `${remarksText} (Split for Room ${(res.roomId as any)?.roomNo || "-"})`,
            type: PAYMENT_TYPE.PAYMENT,
            guestName: (res.guestId as any).name || (reservation.guestId as any).name,
          });
          remaining -= payForThis;
        }

        // If there's still money left after clearing all dues, put it in the first reservation
        if (remaining > 0 && groupData.reservations.length > 0) {
            await createPayment({
                reservationId: groupData.reservations[0]._id,
                amount: remaining,
                paymentMethod: method,
                remarks: `${remarksText} (Overpayment/Balance)`,
                type: PAYMENT_TYPE.PAYMENT,
                guestName: (groupData.reservations[0].guestId as any).name || (reservation.guestId as any).name,
            });
        }
        return { success: true };
      } else {
        return await createPayment({
            reservationId: reservation._id,
            amount: amountToPay,
            paymentMethod: method,
            remarks: remarksText,
            type: PAYMENT_TYPE.PAYMENT,
            guestName: (reservation.guestId as any).name,
        });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations", "payment"] });
      queryClient.invalidateQueries({ queryKey: ["reservations", reservation?._id] });
      if (groupId) queryClient.invalidateQueries({ queryKey: ["reservations", "group", groupId] });
      
      toast.success("Payment recorded successfully");
      setOpen(false);
      setAmount("");
      setRemarks("");
    },
    onError: (error: any) => {
      toast.error("Payment failed", { description: error.message });
    },
  });

  const totalDue = isGroup 
    ? (groupData?.reservations?.reduce((acc: number, res: any) => acc + (res.payment?.dueAmount || 0), 0) || 0)
    : (currentReservation?.payment?.dueAmount || 0);

  const isLoading = isGroup ? isLoadingGroup : isLoadingSingle;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <CreditCard className="h-4 w-4" /> Process Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Add a payment transaction for this stay.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded text-sm flex justify-between">
                <span>Current Balance Due:</span>
                <span className="font-bold text-red-600 font-mono text-lg">
                    {isLoading ? "Loading..." : `RM ${totalDue.toFixed(2)}`}
                </span>
            </div>
            <div className="space-y-2">
                <Label>Amount to Pay</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
                <Label>Method</Label>
                <div className="flex gap-2">
                    {Object.values(PAYMENT_METHOD).map(m => (
                        <Button key={m} variant={method === m ? "default" : "outline"} onClick={() => setMethod(m)} size="sm">{m}</Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Remarks</Label>
                <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Paid via QR" />
            </div>
            <Button className="w-full" onClick={() => processPayment()} disabled={isPending || !amount}>
                {isPending ? "Processing..." : "Confirm Payment"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
