/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
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
  CalendarCheck,
  Loader2,
  User,
  Calendar,
  Check,
  Phone,
  Mail,
  Fingerprint,
  Globe,
  DollarSign,
  Users,
  MessageSquare,
  Plane,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar as DatePicker } from "@/src/components/ui/calendar";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { PreviousGuestSearch } from "../guest/PreviousGuestSearch";
import { IRoom } from "@/src/types/room.interface";
import {
  OTAS,
  PAYMENT_METHOD,
  RESERVATION_STATUS,
  DEPOSIT_METHOD,
} from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import {
  createReservation,
  checkInReservation,
} from "@/src/services/reservation.service";

type BookRoomDialogProps = {
  room: IRoom;
  allReservations?: IReservation[];
  onClose?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
};

const STEPS = [
  { number: 1, title: "Guest", icon: User },
  { number: 2, title: "Stay", icon: Calendar },
  { number: 3, title: "Rates", icon: DollarSign },
  { number: 4, title: "Confirm", icon: Check },
] as const;

interface FormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  passport: string;
  company: string;
  notes: string;
  source: OTAS;
  refId: string;
  arrivalDate: Date;
  departureDate?: Date;
  adults: number;
  children: number;
  roomPrice: string;
  paidAmount: string;
  paymentMethod: PAYMENT_METHOD;
  deposit: string;
  depositMethod: DEPOSIT_METHOD;
  remarks: string;
  sst: string;
  tourismTax: string;
  discount: string;
}

export default function BookRoomDialog({
  room,
  allReservations,
  variant = "default",
  size = "sm",
  className,
}: BookRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const queryClient = useQueryClient();

  const existingReservation = useMemo(() => {
    return allReservations?.find((res) => {
      const resRoomId =
        typeof res.roomId === "object" ? res.roomId._id : res.roomId;
      return (
        resRoomId === room._id && res.status === RESERVATION_STATUS.CONFIRMED
      );
    });
  }, [allReservations, room._id]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    country: "",
    passport: "",
    company: "",
    notes: "",
    source: OTAS.WALKING_GUEST,
    refId: "",
    arrivalDate: new Date(),
    departureDate: undefined,
    adults: 1,
    children: 0,
    roomPrice: "",
    paidAmount: "0",
    paymentMethod: PAYMENT_METHOD.CASH,
    deposit: "0",
    depositMethod: DEPOSIT_METHOD.CASH,
    remarks: "",
    sst: "0",
    tourismTax: "0",
    discount: "0",
  });

  useEffect(() => {
    if (existingReservation) {
      const guest = existingReservation.guestId as unknown as IGuest;
      setFormData((prev) => ({
        ...prev,
        name: guest?.name || "",
        phone: guest?.phone || "",
        email: guest?.email || "",
        passport: guest?.passport || "",
        country: guest?.country || "",
        source: (existingReservation.source as OTAS) || OTAS.WALKING_GUEST,
        refId: existingReservation.confirmationNo,
        arrivalDate: new Date(existingReservation.stay.arrival),
        departureDate: new Date(existingReservation.stay.departure),
        adults: existingReservation.stay.adults,
        children: existingReservation.stay.children,
        roomPrice: existingReservation.rate.roomPrice.toString(),
        paidAmount: existingReservation.payment.paidAmount.toString(),
        remarks: existingReservation.payment.remarks || "",
        sst: existingReservation.rate.sst?.toString() || "0",
        tourismTax: existingReservation.rate.tourismTax?.toString() || "0",
        discount: existingReservation.rate.discount?.toString() || "0",
      }));
      setSelectedGuest(guest);
    }
  }, [existingReservation]);

  const calculateNights = () => {
    if (formData.arrivalDate && formData.departureDate) {
      return Math.max(
        1,
        differenceInCalendarDays(formData.departureDate, formData.arrivalDate),
      );
    }
    return 1;
  };

  const calculateSubtotal = () => {
    const price = parseFloat(formData.roomPrice || "0");
    const nights = calculateNights();
    const sst = parseFloat(formData.sst || "0");
    const ttax = parseFloat(formData.tourismTax || "0");
    const disc = parseFloat(formData.discount || "0");
    return price * nights + sst + ttax - disc;
  };

  const { mutateAsync: performCheckIn, isPending } = useMutation({
    mutationFn: async () => {
      if (existingReservation) {
        return await checkInReservation(existingReservation._id!);
      } else {
        const subtotal = calculateSubtotal();
        const paid = parseFloat(formData.paidAmount || "0");

        const reservationData: any = {
          roomId: room._id,
          status: RESERVATION_STATUS.CHECKED_IN,
          stay: {
            arrival: formData.arrivalDate,
            departure: formData.departureDate,
            adults: formData.adults,
            children: formData.children,
          },
          rate: {
            roomPrice: parseFloat(formData.roomPrice || "0"),
            sst: parseFloat(formData.sst || "0"),
            tourismTax: parseFloat(formData.tourismTax || "0"),
            discount: parseFloat(formData.discount || "0"),
            subtotal: subtotal,
          },
          payment: {
            paidAmount: paid,
            dueAmount: subtotal - paid,
            paymentMethod: formData.paymentMethod,
            deposit: formData.deposit,
            depositMethod: formData.depositMethod,
            remarks: formData.remarks,
          },
          source: formData.source,
          refId: formData.refId,
        };

        if (selectedGuest?._id) {
          reservationData.guestId = selectedGuest._id;
        } else {
          if (!formData.name) throw new Error("Guest name is required");
          reservationData.guest = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            passport: formData.passport,
            country: formData.country,
          };
        }

        return await createReservation(reservationData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Check-in completed successfully");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to complete check-in");
    },
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          <CalendarCheck className="h-4 w-4" />
          Check-in
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Room {room.roomNo} Check-in
              </DialogTitle>
              <DialogDescription>
                {existingReservation
                  ? `Reservation ${existingReservation.confirmationNo}`
                  : "New walk-in guest"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Steps Indicator */}
          <div className="flex justify-between mb-8">
            {STEPS.map((s) => (
              <div
                key={s.number}
                className="flex flex-col items-center gap-2 flex-1 relative"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10 bg-white",
                    step === s.number
                      ? "border-primary text-primary font-bold"
                      : step > s.number
                        ? "border-green-500 bg-green-50 text-green-500"
                        : "border-muted text-muted-foreground",
                  )}
                >
                  {step > s.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    step >= s.number
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
                {s.number < 4 && (
                  <div className="absolute top-5 left-1/2 w-full h-1 bg-muted z-0" />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <PreviousGuestSearch
                label="Guest Full Name *"
                placeholder="Enter full name (search returning guests...)"
                value={formData.name || ""}
                onGuestSelect={(g) => {
                  setSelectedGuest(g);
                  setFormData((prev) => ({
                    ...prev,
                    name: g.name || "",
                    phone: g.phone || "",
                    email: g.email || "",
                    passport: g.passport || "",
                    country: g.country || "",
                    company: g.company || "",
                    notes: g.notes || "",
                  }));
                }}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, name: v }))
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Phone Number
                  </Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+60..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Email Address
                  </Label>
                  <Input
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="guest@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" /> Passport / IC No.
                  </Label>
                  <Input
                    value={formData.passport || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        passport: e.target.value,
                      }))
                    }
                    placeholder="ID Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-3 w-3" /> Country
                  </Label>
                  <Input
                    value={formData.country || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    placeholder="Malaysia"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> Company (Optional)
                  </Label>
                  <Input
                    value={formData.company || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> Notes
                  </Label>
                  <Input
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Special requests..."
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Plane className="h-3 w-3" /> Booking Source
                  </Label>
                  <Select
                    value={formData.source || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, source: v as OTAS }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OTAS).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Reference ID
                  </Label>
                  <Input
                    value={formData.refId || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        refId: e.target.value,
                      }))
                    }
                    placeholder="OTA Ref / Note"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Departure Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-left font-normal h-12"
                      >
                        {formData.departureDate
                          ? format(formData.departureDate, "PPP")
                          : "Select check-out date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker
                        mode="single"
                        selected={formData.departureDate}
                        onSelect={(d) =>
                          setFormData((prev) => ({ ...prev, departureDate: d }))
                        }
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center border border-dashed">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Stay Duration
                  </span>
                  <span className="text-2xl font-bold">
                    {calculateNights()} Night(s)
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-3 w-3" /> Adults
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.adults || 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        adults: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-3 w-3" /> Children
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.children || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        children: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Price (Per Night)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="number"
                      value={formData.roomPrice || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          roomPrice: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    value={formData.discount || "0"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SST</Label>
                  <Input
                    type="number"
                    value={formData.sst || "0"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sst: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tourism Tax</Label>
                  <Input
                    type="number"
                    value={formData.tourismTax || "0"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tourismTax: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount Paid Now</Label>
                  <Input
                    type="number"
                    value={formData.paidAmount || "0"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paidAmount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: v as PAYMENT_METHOD,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deposit Amount</Label>
                  <Input
                    type="number"
                    value={formData.deposit || "0"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deposit: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deposit Method</Label>
                  <Select
                    value={formData.depositMethod || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        depositMethod: v as DEPOSIT_METHOD,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DEPOSIT_METHOD).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Remarks
                </Label>
                <Input
                  value={formData.remarks || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-primary/5 border rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ready to Check-in</h3>
                  <p className="text-muted-foreground">
                    Please review the stay details below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 border rounded-lg space-y-1">
                  <p className="text-muted-foreground text-xs uppercase font-bold">
                    Guest
                  </p>
                  <p className="font-bold text-base">{formData.name}</p>
                  <p>{formData.phone}</p>
                </div>
                <div className="p-4 border rounded-lg space-y-1">
                  <p className="text-muted-foreground text-xs uppercase font-bold">
                    Room
                  </p>
                  <p className="font-bold text-base">
                    {room.roomNo} ({room.roomType})
                  </p>
                  <p>{calculateNights()} Night(s)</p>
                </div>
                <div className="p-4 border rounded-lg space-y-1 bg-muted/20 col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold">
                      Total Balance
                    </p>
                    <p className="text-2xl font-black text-primary">
                      RM {calculateSubtotal().toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs uppercase font-bold">
                      Paid Today
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      RM {parseFloat(formData.paidAmount || "0").toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 flex justify-between shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isPending}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                !formData.name || (step === 2 && !formData.departureDate)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => performCheckIn()}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 min-w-35"
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <CalendarCheck className="mr-2 h-4 w-4" />
              )}
              Complete Check-in
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
