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

export default function PaymentModal({ guest }: { guest: IReservation }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHOD.CASH);

  const { data: currentReservation } = useQuery<IReservation>({
    queryKey: ["reservation", guest?._id],
    queryFn: async () => {
      const { data } = await axios.get(`/reservations/${guest._id}`);
      return data.data;
    },
    enabled: !!guest?._id && open,
  });

  const { mutate: processPayment, isPending } = useMutation({
    mutationFn: async () => {
      return await createPayment({
          reservationId: guest._id,
          amount: parseFloat(amount),
          paymentMethod: method,
          remarks: remarks,
          type: PAYMENT_TYPE.PAYMENT,
          guestName: (guest.guestId as any).name,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded successfully");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error("Payment failed", { description: error.message });
    },
  });

  const totalDue = currentReservation?.payment?.dueAmount || 0;

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
                <span className="font-bold text-red-600 font-mono text-lg">RM {totalDue.toFixed(2)}</span>
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
