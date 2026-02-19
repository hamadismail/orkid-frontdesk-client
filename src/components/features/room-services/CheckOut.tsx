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
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  LogOut,
  AlertCircle,
  CheckCircle,
  Receipt,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import PaymentModal from "../payments/PaymentModal";
import { revalidateBookings } from "@/src/utils/revalidate";
import { IRoom } from "@/src/types/room.interface";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

export default function CheckOut({
  room,
  onClose,
  variant = "default",
  size = "sm",
  className,
}: {
  room: IRoom;
  onClose?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const queryClient = useQueryClient();

  const { data: singleGuest, isLoading: isLoadingGuest } = useQuery({
    queryKey: ["single-guest", room?.guestId],
    queryFn: () =>
      axios.get(`/stayover/${room?.guestId}`).then((res) => res.data.data),
    enabled: !!room?.guestId && open,
  });

  const dueAmount = singleGuest?.payment?.dueAmount || 0;
  const hasDueAmount = dueAmount > 0;
  const isFullyPaid = dueAmount === 0;
  const totalCharges = singleGuest?.payment?.subtotal || 0;
  const amountPaid = singleGuest?.payment?.paidAmount || 0;

  const { mutate: checkOutMutation, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.patch(`/rooms/${room?._id}/checkout`);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["book"] }),
        queryClient.invalidateQueries({
          queryKey: ["single-guest", room?.guestId],
        }),
        revalidateBookings(),
      ]);

      toast.success("Checkout successful", {
        description: `Guest checked out from Room ${room.roomNo}`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      handleClose();
    },
    onError: (error: unknown) => {
      toast.error("Checkout failed", {
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "Something went wrong",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setAcknowledged(false);
    onClose?.();
  };

  const handleCheckout = () => {
    if (hasDueAmount && !acknowledged) {
      toast.warning("Acknowledgement required", {
        description: "Please acknowledge the outstanding balance",
      });
      return;
    }
    checkOutMutation();
  };

  const getPaymentStatusColor = () => {
    if (isFullyPaid) return "bg-green-100 text-green-800 border-green-300";
    if (hasDueAmount) return "bg-red-100 text-red-800 border-red-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

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

      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-auto">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Check Out
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Room {room.roomNo} • {room.roomType}
                </p>
              </div>
            </div>
            <Badge
              variant={isFullyPaid ? "default" : "destructive"}
              className="gap-1"
            >
              {isFullyPaid ? "Fully Paid" : "Balance Due"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 space-y-4">
          {isLoadingGuest ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading guest information...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Guest Information */}
              <Card>
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {singleGuest?.guest?.name || "Guest Name"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {singleGuest?.guest?.phone || "No phone"}
                          {singleGuest?.guest?.ota && (
                            <>
                              <span>•</span>
                              <span>{singleGuest.guest.ota}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {singleGuest?.stay?.departure && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Departure
                        </div>
                        <div className="text-sm font-medium">
                          {format(
                            new Date(singleGuest.stay.departure),
                            "MMM d",
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Payment Summary
                  </h3>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      getPaymentStatusColor(),
                    )}
                  >
                    {isFullyPaid
                      ? "No Due Amount"
                      : `RM ${dueAmount.toFixed(2)} Due`}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Charges
                    </span>
                    <span className="font-medium">
                      RM {totalCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Amount Paid
                    </span>
                    <span className="font-medium text-green-600">
                      RM {amountPaid.toFixed(2)}
                    </span>
                  </div>
                  {/* <Separator /> */}
                  {/* <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Balance</span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        isFullyPaid ? "text-green-600" : "text-red-600",
                      )}
                    >
                      RM {dueAmount.toFixed(2)}
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Outstanding Balance Warning */}
              {/* {hasDueAmount && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-300">
                    Outstanding Balance
                  </AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    Guest has an unpaid balance of RM {dueAmount.toFixed(2)}.
                    {amountPaid > 0
                      ? " Partial payment has been made."
                      : " No payments have been made."}
                  </AlertDescription>
                </Alert>
              )} */}

              {/* Payment Status */}
              {/* <Card
                className={cn(
                  "border-dashed",
                  isFullyPaid &&
                    "border-green-200 bg-green-50/50 dark:bg-green-950/10",
                  hasDueAmount &&
                    "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-md",
                          isFullyPaid
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-amber-100 dark:bg-amber-900/30",
                        )}
                      >
                        {isFullyPaid ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>

                      <div>
                        <div className="font-medium">
                          {isFullyPaid
                            ? "Payment Complete"
                            : "Payment Required"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isFullyPaid
                            ? "All charges have been settled"
                            : "Outstanding balance needs to be addressed"}
                        </div>
                      </div>

                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card> */}

              {/* Acknowledgment */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="acknowledge"
                    checked={acknowledged}
                    onCheckedChange={(checked) =>
                      setAcknowledged(Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="acknowledge"
                    className="text-sm leading-tight cursor-pointer"
                  >
                    {hasDueAmount ? (
                      <>
                        <span className="font-medium">
                          I acknowledge the outstanding balance
                        </span>
                        <span className="text-muted-foreground block mt-1">
                          I understand that RM {dueAmount.toFixed(2)} is still
                          due and wish to proceed with checkout anyway.
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">
                          I confirm there are no pending charges
                        </span>
                        <span className="text-muted-foreground block mt-1">
                          All payments have been processed and there are no
                          outstanding balances.
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {hasDueAmount && !acknowledged && (
                  <p className="text-xs text-amber-600">
                    Please acknowledge the outstanding balance to proceed with
                    checkout
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {hasDueAmount && singleGuest && (
                <PaymentModal guest={singleGuest} />
              )}

              <Button
                onClick={handleCheckout}
                disabled={isPending || (hasDueAmount && !acknowledged)}
                className="gap-2"
                variant={hasDueAmount ? "destructive" : "default"}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    {hasDueAmount ? "Check Out Anyway" : "Confirm Checkout"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogDescription className="sr-only"> Checkout Modal</DialogDescription>
    </Dialog>
  );
}

// Helper component for phone icon
const Phone = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
