"use client";

import { PaymentInvoice } from "@/src/shared/PaymentInvoice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { IPayment } from "@/src/types/payment.interface";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function PaymentReceiptDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: IPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: receiptData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["receipt", payment._id],
    queryFn: async () => {
      const { data } = await axios.get(`/payments/receipt/${payment._id}`);
      return data.data;
    },
    enabled: !!payment._id && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        {isLoading && <div>Loading...</div>}
        {error && <div>Error fetching receipt details.</div>}
        {receiptData && (
          <PaymentInvoice
            bookingInfo={receiptData}
            onConfirmBooking={() => {}}
            isBooking={false}
            printOnly
          />
        )}
      </DialogContent>
      <DialogDescription className="sr-only">Payment Receipt</DialogDescription>
    </Dialog>
  );
}
