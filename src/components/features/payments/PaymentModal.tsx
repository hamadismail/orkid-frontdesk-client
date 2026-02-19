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
import { CreditCard, DollarSign } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Label } from "@/src/components/ui/label";
import { PaymentInvoice } from "../../../shared/PaymentInvoice";
import { IBook, PAYMENT_METHOD } from "@/src/types/book.interface";
import { IRoom } from "@/src/types/room.interface";

export default function PaymentModal({ guest }: { guest: IBook }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [formErrors, setFormErrors] = useState({ paidAmount: "" });

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["single-guest", guest?._id],
    queryFn: async () => {
      const { data } = await axios.get(`/stayover/${guest._id}`);
      return data.data;
    },
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
    remarks: "",
    paymentMethod: PAYMENT_METHOD.CASH,
  });

  const validateForm = () => {
    const errors = {
      paidAmount: !paymentInfo.paidAmount
        ? "Amount is required"
        : isNaN(Number(paymentInfo.paidAmount))
          ? "Must be a valid number"
          : "",
    };
    setFormErrors(errors);
    return !errors.paidAmount;
  };

  const { mutate: updateGuest, isPending } = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error("Please fix form errors");
      }
      const payload = {
        payment: {
          paidAmount: Number(paymentInfo.paidAmount),
          paymentMethod: paymentInfo.paymentMethod,
          remarks: paymentInfo.remarks,
        },
      };
      const { data } = await axios.patch(`/payments/${guest._id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // resetForm();
      setShowReceipt(true);
    },
    onError: (error: AxiosError) => {
      const errorData = error.response?.data as {
        message?: string;
        error?: string;
      };
      toast.error("Payment failed", {
        description:
          errorData?.error || errorData?.message || "Something went wrong",
      });
    },
  });

  const resetForm = () => {
    setPaymentInfo({
      paidAmount: "",
      remarks: "",
      paymentMethod: PAYMENT_METHOD.CASH,
    });
    setFormErrors({ paidAmount: "" });
  };

  const totalDue = singleGuest?.payment?.dueAmount || 0;
  const paymentAmount = Number(paymentInfo.paidAmount) || 0;
  const currentDue = totalDue - paymentAmount;
  const room = singleGuest?.roomId as IRoom; // Re-added declaration

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setShowReceipt(false);
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <CreditCard className="h-4 w-4" />
          Process Payment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-150">
        {showReceipt ? (
          <div className="grid gap-6 overflow-scroll max-h-80">
            <PaymentInvoice
              bookingInfo={{
                guest: {
                  name: singleGuest?.guest.name || "",
                  phone: singleGuest?.guest.phone || "",
                },
                stay: {
                  arrival: singleGuest?.stay.arrival
                    ? new Date(singleGuest.stay.arrival)
                    : new Date(),
                  departure: singleGuest?.stay.departure
                    ? new Date(singleGuest.stay.departure)
                    : new Date(),
                },
                room: {
                  number: room?.roomNo || "",
                  type: room?.roomType || "",
                },
                payment: {
                  paidAmount: parseFloat(paymentInfo.paidAmount) || 0,
                  deposit: singleGuest?.payment.deposit || 0,
                  method: paymentInfo.paymentMethod || "Cash",
                  remarks: paymentInfo.remarks || "N/A",
                },
                paymentId: `PAY-${Date.now()
                  .toString(36)
                  .toUpperCase()}-${Math.random()
                  .toString(36)
                  .substring(2, 10)
                  .toUpperCase()}`,
                paymentDate: new Date(),
              }}
              isBooking={isPending}
              printOnly
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Payment Details
                  </DialogTitle>
                  <DialogDescription>
                    Record payment for guest
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Amount Paid *</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={paymentInfo.paidAmount}
                  onChange={(e) => {
                    setPaymentInfo({
                      ...paymentInfo,
                      paidAmount: e.target.value,
                    });
                    if (formErrors.paidAmount) {
                      setFormErrors({ paidAmount: "" });
                    }
                  }}
                  placeholder="0.00"
                  className={formErrors.paidAmount ? "border-destructive" : ""}
                  min="0"
                  step="0.01"
                />
                {formErrors.paidAmount && (
                  <p className="text-sm text-destructive">
                    {formErrors.paidAmount}
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  type="text"
                  value={paymentInfo.remarks}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      remarks: e.target.value,
                    })
                  }
                  placeholder="Type remarks"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2 col-span-2">
                <Label>Payment Method</Label>
                <div className="flex gap-4">
                  {Object.values(PAYMENT_METHOD).map((method) => (
                    <Button
                      key={method}
                      variant={
                        paymentInfo.paymentMethod === method
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setPaymentInfo({
                          ...paymentInfo,
                          paymentMethod: method,
                        })
                      }
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div
                  className={`flex justify-between items-center ${
                    totalDue > 0 ? "text-destructive" : "text-green-600"
                  }`}
                >
                  <span className="text-sm font-medium">
                    {totalDue > 0 ? "Total Due:" : "Credit:"}
                  </span>
                  <span className="font-bold">
                    RM {Math.abs(totalDue).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount Paid:</span>
                  <span className="font-bold">
                    RM {paymentAmount.toFixed(2)}
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center pt-2 border-t ${
                    currentDue > 0 ? "text-destructive" : "text-green-600"
                  }`}
                >
                  <span className="text-sm font-medium">
                    {currentDue > 0 ? "Remaining Due:" : "Remaining Credit:"}
                  </span>
                  <span className="font-bold">
                    RM {Math.abs(currentDue).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateGuest();
                }}
                disabled={isPending || !paymentInfo.paidAmount}
                className="gap-1"
              >
                {isPending ? "Processing..." : "Submit Payment"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
