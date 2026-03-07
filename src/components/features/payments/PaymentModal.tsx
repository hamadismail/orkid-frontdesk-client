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
import { PaymentInvoice } from "@/src/shared/PaymentInvoice";

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
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
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

      // With centralized architecture, we create one payment record for the group
      const result = await createPayment({
        groupId: groupId || (reservation.groupId as any)?._id || (reservation.groupId as any),
        reservationId: isGroup ? undefined : reservation._id,
        amount: amountToPay,
        paymentMethod: method,
        remarks: remarksText,
        type: PAYMENT_TYPE.PAYMENT,
        guestName: (reservation.guestId as any).name,
      });

      // Prepare data for receipt
      const res = currentReservation || reservation;
      const guest = res.guestId as any;
      const room = res.roomId as any;

      return {
        guest: {
          name: guest.name,
          phone: guest.phone,
          source: res.source,
          refId: res.refId
        },
        stay: {
          arrival: res.stay.arrival,
          departure: res.stay.departure
        },
        room: {
          number: isGroup ? "GROUP" : room.roomNo,
          type: isGroup ? (groupData?.groupName || "Group") : room.roomType
        },
        payment: {
          paidAmount: result.amount || amountToPay,
          method: result.paymentMethod || method,
          remarks: result.remarks || remarksText
        },
        paymentDate: result.createdAt || new Date(),
        paymentId: result._id?.toUpperCase()
      };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["reservations", "payment"] });
      queryClient.invalidateQueries({ queryKey: ["reservations", reservation?._id] });
      if (groupId) queryClient.invalidateQueries({ queryKey: ["reservations", "group", groupId] });

      toast.success("Payment recorded successfully");
      setPaymentData(data);
      setShowReceipt(true);
      setOpen(false);
      setAmount("");
      setRemarks("");
    },
    onError: (error: any) => {
      toast.error("Payment failed", { description: error.message });
    },
  });

  const group = (reservation?.groupId as any) || (currentReservation?.groupId as any);
  const totalDue = isGroup
    ? (group?.payment?.dueAmount || groupData?.payment?.dueAmount || 0)
    : (group?.payment?.dueAmount || 0);

  const isLoading = isGroup ? isLoadingGroup : isLoadingSingle;

  return (
    <>
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

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Payment Receipt</DialogTitle>
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
