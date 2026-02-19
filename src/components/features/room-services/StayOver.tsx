"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  BedDouble,
  Calendar,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  MessageSquare,
  CreditCard,
  CalendarDays,
  Hotel,
  User,
  TrendingUp,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Calendar as DatePicker } from "@/src/components/ui/calendar";
import { format, addDays, differenceInDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { PaymentInvoice } from "../../../shared/PaymentInvoice";
import { IRoom } from "@/src/types/room.interface";
import { IBook, PAYMENT_METHOD } from "@/src/types/book.interface";

type StayOverProps = {
  room: IRoom;
  onClose?: () => void;
  variant?: "secondary" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
};

const STEPS = [
  { number: 1, title: "Extension", icon: CalendarDays },
  { number: 2, title: "Payment", icon: CreditCard },
  { number: 3, title: "Confirm", icon: Check },
] as const;

export default function StayOver({
  room,
  onClose,
  variant = "secondary",
  size = "sm",
  className,
}: StayOverProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PAYMENT_METHOD>(PAYMENT_METHOD.CASH);
  const queryClient = useQueryClient();

  const { data: singleGuest, isLoading: isLoadingGuest } = useQuery<IBook>({
    queryKey: ["single-guest", room?.guestId],
    queryFn: () =>
      axios.get(`/stayover/${room?.guestId}`).then((res) => res.data.data),
    enabled: !!room?.guestId && open,
    staleTime: 1000 * 60 * 5,
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: "",
    newRoomPrice: "",
    remarks: "",
    paymentMethod: PAYMENT_METHOD.CASH,
  });

  // Calculate values
  const previousDeparture = useMemo(
    () =>
      singleGuest?.stay?.departure
        ? new Date(singleGuest.stay.departure)
        : null,
    [singleGuest],
  );

  const additionalNights = useMemo(() => {
    if (!stayInfo.arrival || !stayInfo.departure) return 0;
    return differenceInDays(stayInfo.departure, stayInfo.arrival);
  }, [stayInfo.arrival, stayInfo.departure]);

  const previousDue = singleGuest?.payment?.dueAmount || 0;
  const roomPrice = singleGuest?.payment?.roomPrice || 0;
  const newPayment = parseFloat(paymentInfo.paidAmount) || 0;
  const newRoomPrice = parseFloat(paymentInfo.newRoomPrice) || roomPrice;

  const extensionCost = additionalNights * newRoomPrice;
  const newTotal = extensionCost + previousDue;
  const currentDue = newTotal - newPayment;

  // Initialize form with guest data
  useEffect(() => {
    if (singleGuest) {
      if (singleGuest.stay?.departure) {
        const departureDate = new Date(singleGuest.stay.departure);
        setStayInfo({
          arrival: departureDate,
          departure: addDays(departureDate, 1),
        });
      }
      if (singleGuest.payment?.roomPrice) {
        setPaymentInfo((prev) => ({
          ...prev,
          newRoomPrice: singleGuest.payment.roomPrice.toString(),
        }));
      }
    }
  }, [singleGuest]);

  // Mutation
  const { mutate: updateGuest, isPending } = useMutation({
    mutationFn: async () => {
      if (!room?.guestId) throw new Error("Guest ID is missing");
      if (!stayInfo.departure) throw new Error("Check-out date is required");

      const payload = {
        bookingInfo: {
          stay: {
            departure: stayInfo.departure,
          },
          payment: {
            paidAmount: newPayment,
            paymentMethod: paymentInfo.paymentMethod,
            remarks: paymentInfo.remarks,
            roomPrice: newRoomPrice,
          },
        },
      };

      const { data } = await axios.patch(
        `/stayover/${room.guestId}`,
        payload,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["book"] }),
        queryClient.invalidateQueries({
          queryKey: ["single-guest", room?.guestId],
        }),
      ]);

      toast.success("Stay extended successfully", {
        description: `Room ${room.roomNo} extended to ${format(stayInfo.departure!, "MMM d, yyyy")}`,
        icon: <Check className="h-5 w-5 text-green-500" />,
      });

      handleClose();
    },
    onError: (error: AxiosError) => {
      const errorData = error.response?.data as { message?: string };
      toast.error("Extension failed", {
        description: errorData?.message || error.message,
        icon: <Loader2 className="h-5 w-5 text-red-500" />,
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    resetForm();
    onClose?.();
  };

  const resetForm = () => {
    setStayInfo({
      arrival: undefined,
      departure: undefined,
    });
    setPaymentInfo({
      paidAmount: "",
      newRoomPrice: "",
      remarks: "",
      paymentMethod: PAYMENT_METHOD.CASH,
    });
    setSelectedPaymentMethod(PAYMENT_METHOD.CASH);
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1 && !stayInfo.departure) {
      toast.warning("Date required", {
        description: "Please select a new check-out date",
      });
      return;
    }
    if (step === 2 && !paymentInfo.paidAmount) {
      toast.warning("Payment required", {
        description: "Please enter a payment amount",
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const updatePaymentInfo = useCallback(
    (updates: Partial<typeof paymentInfo>) => {
      setPaymentInfo((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

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

      <DialogContent className="sm:max-w-4xl p-0 overflow-auto max-h-[95vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Hotel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Extend Stay
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Room {room.roomNo} • {room.roomType}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Extension
            </Badge>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {STEPS.map(({ number, title, icon: Icon }) => (
              <div key={number} className="flex flex-col items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      step === number && "bg-primary text-primary-foreground",
                      step > number &&
                        "bg-green-100 text-green-800 border-2 border-green-500",
                      step < number && "bg-muted text-muted-foreground",
                    )}
                  >
                    {step > number ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {step >= number && (
                    <div className="ml-2">
                      <div className="text-xs font-medium">Step {number}</div>
                      <div className="text-xs text-muted-foreground">
                        {title}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingGuest ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading guest information...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-0">
            {/* Step 1: Extension Details */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Guest Info Card */}
                <Card>
                  <CardContent className="px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {singleGuest?.guest?.name || "Guest"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Current departure:{" "}
                            {previousDeparture
                              ? format(previousDeparture, "MMM d, yyyy")
                              : "Not set"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {previousDue >= 0 ? "Due" : "Refund"}: RM{" "}
                        {Math.abs(previousDue).toFixed(2)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Extension Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        New Check-out Date *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !stayInfo.departure && "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {stayInfo.departure
                              ? format(stayInfo.departure, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <DatePicker
                            mode="single"
                            selected={stayInfo.departure}
                            onSelect={(date) =>
                              setStayInfo((prev) => ({
                                ...prev,
                                departure: date ?? undefined,
                              }))
                            }
                            disabled={{
                              before: stayInfo.arrival || new Date(),
                            }}
                            className="p-3"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Additional Nights
                      </Label>
                      <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/50">
                        <span className="text-sm">Extension period</span>
                        <span className="font-semibold">
                          {additionalNights} night
                          {additionalNights !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Preview */}
                  <Card className="border-dashed py-3">
                    <CardContent className="px-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Room rate per night
                          </span>
                          <span>RM {roomPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {previousDue >= 0
                              ? "Previous balance"
                              : "Previous refund"}
                          </span>
                          <span
                            className={
                              previousDue > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {previousDue > 0 ? "+" : "-"} RM{" "}
                            {Math.abs(previousDue).toFixed(2)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>
                            {newTotal >= 0 ? "New total" : "New refund"}
                          </span>
                          <span>RM {Math.abs(newTotal).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-6">
                <Tabs defaultValue="payment" className="w-full">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="payment">Payment Details</TabsTrigger>
                    <TabsTrigger value="summary">Cost Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="payment" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          New Room Price
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentInfo.newRoomPrice}
                          onChange={(e) =>
                            updatePaymentInfo({ newRoomPrice: e.target.value })
                          }
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Payment Amount *
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentInfo.paidAmount}
                          onChange={(e) =>
                            updatePaymentInfo({ paidAmount: e.target.value })
                          }
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Remarks
                        </Label>
                        <Input
                          value={paymentInfo.remarks}
                          onChange={(e) =>
                            updatePaymentInfo({ remarks: e.target.value })
                          }
                          placeholder="Additional notes for this extension"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                      </Label>
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={(value: PAYMENT_METHOD) => {
                          setSelectedPaymentMethod(value);
                          updatePaymentInfo({ paymentMethod: value });
                        }}
                        className="flex flex-wrap gap-2"
                      >
                        {Object.values(PAYMENT_METHOD).map((method) => (
                          <div key={method}>
                            <RadioGroupItem
                              value={method}
                              id={method}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={method}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <div className="text-sm font-medium">
                                {method}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4 pt-4">
                    <Card>
                      <CardContent className="px-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Extension cost
                          </span>
                          <span>RM {extensionCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {previousDue >= 0
                              ? "Previous balance"
                              : "Previous refund"}
                          </span>
                          <span>RM {Math.abs(previousDue).toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>
                            {newTotal >= 0
                              ? "Total amount due"
                              : "Total amount refund"}
                          </span>
                          <span>RM {Math.abs(newTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>New payment</span>
                          <span>+ RM {newPayment.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>
                            {currentDue >= 0
                              ? "Remaining balance"
                              : "Remaining refund"}
                          </span>
                          <span
                            className={
                              currentDue > 0 ? "text-red-600" : "text-green-600"
                            }
                          >
                            RM {Math.abs(currentDue).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <PaymentInvoice
                  bookingInfo={{
                    guest: {
                      name: singleGuest?.guest?.name || "",
                      phone: singleGuest?.guest?.phone || "",
                      otas: singleGuest?.guest?.otas || "",
                      refId: singleGuest?.guest?.refId || "",
                    },
                    stay: {
                      arrival: singleGuest?.stay?.arrival,
                      departure: stayInfo?.departure,
                    },
                    room: {
                      number: room.roomNo,
                      type: room.roomType,
                    },
                    payment: {
                      paidAmount: newPayment,
                      deposit: singleGuest?.payment?.deposit || 0,
                      depositMethod: singleGuest?.payment?.depositMethod || "",
                      method: paymentInfo.paymentMethod,
                      remarks: paymentInfo.remarks,
                    },
                    paymentDate: new Date(),
                    paymentId: `EXT-${Date.now().toString(36).toUpperCase()}`,
                  }}
                  onConfirmBooking={updateGuest}
                  isBooking={isPending}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext} className="gap-2">
                  {step === 2 ? "Review & Confirm" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => updateGuest()}
                  disabled={isPending || !stayInfo.departure}
                  className="gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Extension
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogDescription className="sr-only">
        Stay Over Dialog
      </DialogDescription>
    </Dialog>
  );
}
