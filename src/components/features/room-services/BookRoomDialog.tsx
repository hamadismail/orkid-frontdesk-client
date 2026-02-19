"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  CreditCard,
  FileText,
  BookOpen,
  Hotel,
  Users,
  DollarSign,
  MessageSquare,
  Search,
  Loader2,
  PersonStanding,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Calendar as DatePicker } from "@/src/components/ui/calendar";
import { format, isValid } from "date-fns";
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
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";

import { GetRoomIcon } from "@/src/shared/GetRoomIcon";
import { PaymentInvoice } from "../../../shared/PaymentInvoice";
import { IRoom } from "@/src/types/room.interface";
import {
  DEPOSIT_METHOD,
  GUEST_STATUS,
  IBook,
  OTAS,
  PAYMENT_METHOD,
} from "@/src/types/book.interface";
import { IReservation } from "@/src/types/reservation.interface";

type BookRoomDialogProps = {
  room: IRoom;
  allReservations?: IReservation[];
  onClose?: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
};

type FormData = {
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
    ic: string;
    otas: OTAS;
    refId: string;
    status: GUEST_STATUS;
  };
  stay: {
    arrival?: Date;
    departure?: Date;
    adults: number;
    children: number;
  };
  payment: {
    roomPrice: string;
    sst: string;
    tourismTax: string;
    discount: string;
    paidAmount: string;
    deposit: string;
    depositMethod: DEPOSIT_METHOD;
    paymentMethod: PAYMENT_METHOD;
    remarks: string;
  };
};

const STEPS = [
  { number: 1, title: "Guest", icon: User },
  { number: 2, title: "Stay", icon: Calendar },
  { number: 3, title: "Payment", icon: CreditCard },
  { number: 4, title: "Confirm", icon: Check },
] as const;

export default function BookRoomDialog({
  room,
  allReservations,
  onClose,
  variant = "default",
  size = "sm",
  className,
}: BookRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState<IBook | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestSearchInput, setGuestSearchInput] = useState("");
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const queryClient = useQueryClient();

  const isReserved = useMemo(
    () =>
      allReservations?.filter((res) => res.room.roomNo === room.roomNo) || [],
    [allReservations, room.roomNo],
  );

  const reserveGuest = isReserved[0];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setGuestSearch(guestSearchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [guestSearchInput]);

  // Fetch guest suggestions
  const { data: guestSuggestions = [], isLoading: isLoadingGuests } = useQuery<
    IBook[]
  >({
    queryKey: ["guest-search", guestSearch],
    queryFn: async () => {
      if (!guestSearch || guestSearch.length < 2) return [];
      const response = await axios.get(`/guests?search=${guestSearch}`);
      return response.data.data?.guests || [];
    },
    enabled: guestSearch.length >= 2,
  });

  // Form State
  const [formData, setFormData] = useState<FormData>({
    guest: {
      name: "",
      email: "",
      phone: "",
      country: "",
      passport: "",
      ic: "",
      otas: "" as OTAS,
      refId: "",
      status: GUEST_STATUS.CHECKED_IN,
    },
    stay: {
      arrival: new Date(),
      departure: undefined,
      adults: 1,
      children: 0,
    },
    payment: {
      roomPrice: "",
      sst: "",
      tourismTax: "",
      discount: "",
      paidAmount: "",
      deposit: "",
      depositMethod: "" as DEPOSIT_METHOD,
      paymentMethod: "" as PAYMENT_METHOD,
      remarks: "",
    },
  });

  // Handle guest selection
  const handleGuestSelection = useCallback((guest: IBook) => {
    setSelectedGuest(guest);
    setShowGuestDropdown(false);
    setGuestSearchInput(guest.guest.name);

    setFormData((prev) => ({
      ...prev,
      guest: {
        name: guest.guest.name,
        email: guest.guest.email || "",
        phone: guest.guest.phone,
        country: guest.guest.country || "",
        passport: guest.guest.passport || "",
        ic: "",
        otas: guest.guest.otas || OTAS.BOOKING_COM,
        refId: guest.guest.refId || "",
        status: GUEST_STATUS.CHECKED_IN,
      },
      stay: {
        ...prev.stay,
        departure: new Date(),
        adults: guest.stay.adults || 1,
        children: guest.stay.children || 0,
      },
      payment: {
        ...prev.payment,
        roomPrice: guest?.payment?.roomPrice?.toString() || "",
        sst: guest?.payment?.sst?.toString() || "",
        tourismTax: guest?.payment?.tourismTax?.toString() || "",
        discount: guest?.payment?.discount?.toString() || "",
        paidAmount: guest?.payment?.paidAmount?.toString() || "",
        deposit: guest?.payment?.deposit?.toString() || "",
        depositMethod: guest?.payment?.depositMethod || DEPOSIT_METHOD.CASH,
        paymentMethod: guest?.payment?.paymentMethod || PAYMENT_METHOD.CASH,
        remarks: guest?.payment?.remarks || "",
      },
    }));

    toast.success(`Guest information loaded: ${guest.guest.name}`);
  }, []);

  // Set reserved guest info
  useEffect(() => {
    if (reserveGuest) {
      setFormData((prev) => ({
        ...prev,
        guest: {
          ...prev.guest,
          refId: reserveGuest.guest?.reservationNo || "",
          name: reserveGuest.guest?.name || "",
          email: reserveGuest.guest?.email || "",
          phone: reserveGuest.guest?.phone || "",
          country: reserveGuest.guest?.nationality || "",
          passport: reserveGuest.guest?.passport || "",
          otas: (reserveGuest.guest?.ota as OTAS) || OTAS.WALKING_GUEST,
        },
        stay: {
          ...prev.stay,
          departure: reserveGuest.room?.departure
            ? new Date(reserveGuest.room.departure)
            : prev.stay.departure,
        },
        payment: {
          ...prev.payment,
          sst: reserveGuest.payment?.sst?.toString() || "",
          tourismTax: reserveGuest.payment?.tourismTax?.toString() || "",
          // discount: reserveGuest.payment?.fnfDiscount?.toString() || "",
          // paidAmount: reserveGuest.payment?.advancePayment?.toString() || "",
        },
      }));
    }
  }, [reserveGuest]);

  // Calculations
  const calculateNights = useCallback(() => {
    const { arrival, departure } = formData.stay;
    if (arrival && departure) {
      const diffTime = Math.abs(departure.getTime() - arrival.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    return 0;
  }, [formData.stay]);

  const calculateTotal = useCallback(() => {
    const nights = calculateNights();
    const roomPrice = parseFloat(formData.payment.roomPrice) || 0;
    return roomPrice * Math.max(nights, 1);
  }, [calculateNights, formData.payment.roomPrice]);

  const calculateDue = useCallback(() => {
    const total = calculateTotal();
    const paid = parseFloat(formData.payment.paidAmount) || 0;
    const advancePayment = Number(reserveGuest?.payment?.advancePayment || "0");
    return total - (paid + advancePayment);
  }, [calculateTotal, formData.payment.paidAmount, reserveGuest]);

  // Mutation
  const { mutate: bookRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/book", {
        bookingInfo: {
          guest: { ...formData.guest },
          stay: { ...formData.stay },
          payment: {
            ...formData.payment,
            paidAmount: Number(formData.payment.paidAmount || "0"),
            subtotal: calculateTotal(),
            dueAmount: calculateDue(),
          },
          roomId: room?._id,
          currentPaid: parseFloat(formData.payment.paidAmount || "0").toFixed(
            2,
          ),
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["book"] }),
      ]);

      toast.success("Room booked successfully!", {
        description: `Room ${room.roomNo} assigned to ${formData.guest.name}`,
      });

      handleClose();
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          toast.error("Booking conflict", {
            description: error.response.data?.message || "Room not available",
          });
        } else {
          toast.error("Booking failed", {
            description: error.response?.data?.message || error.message,
          });
        }
      } else {
        toast.error("Booking failed", {
          description: "An unexpected error occurred",
        });
      }
    },
  });

  const handleClose = () => {
    setOpen(false);
    resetForm();
    onClose?.();
  };

  const resetForm = () => {
    setFormData({
      guest: {
        name: "",
        email: "",
        phone: "",
        country: "",
        passport: "",
        ic: "",
        otas: OTAS.BOOKING_COM,
        refId: "",
        status: GUEST_STATUS.CHECKED_IN,
      },
      stay: {
        arrival: new Date(),
        departure: undefined,
        adults: 1,
        children: 0,
      },
      payment: {
        roomPrice: "",
        sst: "",
        tourismTax: "",
        discount: "",
        paidAmount: "",
        deposit: "",
        depositMethod: DEPOSIT_METHOD.CASH,
        paymentMethod: PAYMENT_METHOD.CASH,
        remarks: "",
      },
    });
    setStep(1);
    setGuestSearch("");
    setGuestSearchInput("");
    setSelectedGuest(null);
  };

  const handleNext = () => {
    const validations = {
      1: () => {
        const { name, phone, otas, refId, passport } = formData.guest;
        return name && phone && otas && refId && passport;
      },
      2: () =>
        formData.stay.arrival &&
        formData.stay.departure &&
        formData.stay.adults,
      3: () => {
        const { roomPrice, paidAmount, paymentMethod, depositMethod, remarks } =
          formData.payment;
        return (
          roomPrice && paidAmount && paymentMethod && depositMethod && remarks
        );
      },
    };

    if (validations[step as keyof typeof validations]?.()) {
      setStep(step + 1);
    } else {
      toast.warning("Please fill in all required fields");
    }
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const updateFormData = useCallback(
    (section: keyof FormData, updates: Partial<FormData[keyof FormData]>) => {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...updates },
      }));
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
          <CalendarCheck className="h-4 w-4" />
          Check-in
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {GetRoomIcon(room.roomType)}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Book Room {room.roomNo}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {room.roomType} • Floor {room.roomFloor} • Max{" "}
                  {/* {room.maxCapacity} guests */}
                </p>
              </div>
            </div>
            {selectedGuest && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                Previous Guest
              </Badge>
            )}
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

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Guest Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Previous Guest
                </Label>
                <div className="relative">
                  <Input
                    value={guestSearchInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGuestSearchInput(value);
                      updateFormData("guest", { name: value });
                      setShowGuestDropdown(value.length >= 2);
                      if (selectedGuest && value !== selectedGuest.guest.name) {
                        setSelectedGuest(null);
                      }
                    }}
                    placeholder="Search by name, phone, or email..."
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  {showGuestDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingGuests ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : guestSuggestions.length > 0 ? (
                        <div className="py-1">
                          <div className="px-3 py-2 text-xs text-muted-foreground bg-muted border-b">
                            Previous guests ({guestSuggestions.length})
                          </div>
                          {guestSuggestions.map((guest) => (
                            <button
                              key={guest._id}
                              onClick={() => handleGuestSelection(guest)}
                              className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                            >
                              <div className="font-medium">
                                {guest.guest.name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3 w-3" />{" "}
                                {guest.guest.phone}
                                {guest.guest.email && (
                                  <>
                                    <span>•</span>
                                    <Mail className="h-3 w-3" />{" "}
                                    {guest.guest.email}
                                  </>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        guestSearchInput.length >= 2 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No previous guests found
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    value={formData.guest.name}
                    onChange={(e) =>
                      updateFormData("guest", { name: e.target.value })
                    }
                    placeholder="Guest Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone *
                  </Label>
                  <Input
                    value={formData.guest.phone}
                    onChange={(e) =>
                      updateFormData("guest", { phone: e.target.value })
                    }
                    placeholder="+60123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.guest.email}
                    onChange={(e) =>
                      updateFormData("guest", { email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country
                  </Label>
                  <Input
                    value={formData.guest.country}
                    onChange={(e) =>
                      updateFormData("guest", { country: e.target.value })
                    }
                    placeholder="Malaysia"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Passport/IC *
                  </Label>
                  <Input
                    value={formData.guest.passport}
                    onChange={(e) =>
                      updateFormData("guest", { passport: e.target.value })
                    }
                    placeholder="A12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    OTA/Reference *
                  </Label>
                  <Select
                    value={formData.guest.otas}
                    onValueChange={(value: OTAS) =>
                      updateFormData("guest", { otas: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select OTA/Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OTAS).map((ota) => (
                        <SelectItem key={ota} value={ota}>
                          {ota}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Reference ID *
                  </Label>
                  <Input
                    value={formData.guest.refId}
                    onChange={(e) =>
                      updateFormData("guest", { refId: e.target.value })
                    }
                    placeholder="Enter reference ID"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Stay Information */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Check-out Date *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.stay.departure &&
                                "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.stay.departure &&
                            isValid(formData.stay.departure)
                              ? format(formData.stay.departure, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <DatePicker
                            mode="single"
                            selected={formData.stay.departure}
                            onSelect={(date) =>
                              updateFormData("stay", { departure: date })
                            }
                            disabled={{ before: new Date() }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Adults
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.stay.adults}
                        onChange={(e) =>
                          updateFormData("stay", {
                            adults: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <PersonStanding className="h-4 w-4" />
                        Children
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.stay.children}
                        onChange={(e) =>
                          updateFormData("stay", {
                            children: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Duration
                      </span>
                      <span className="font-semibold">
                        {calculateNights()} nights
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Check-in
                      </span>
                      <span className="font-medium">
                        {format(formData.stay.arrival || new Date(), "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Check-out
                      </span>
                      <span className="font-medium">
                        {formData.stay.departure
                          ? format(formData.stay.departure, "PPP")
                          : "Not set"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Guests</span>
                      <span className="font-bold">
                        {formData.stay.adults + formData.stay.children}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Payment Information */}
          {step === 3 && (
            <div className="space-y-6">
              <Tabs defaultValue="payment">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="payment">Payment Details</TabsTrigger>
                  <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="payment" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Room Price *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.payment.roomPrice}
                        onChange={(e) =>
                          updateFormData("payment", {
                            roomPrice: e.target.value,
                          })
                        }
                        placeholder="200.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Deposit
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.payment.deposit}
                        onChange={(e) =>
                          updateFormData("payment", {
                            deposit: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Paid Amount *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.payment.paidAmount}
                        onChange={(e) =>
                          updateFormData("payment", {
                            paidAmount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Deposit Method *
                      </Label>
                      <Select
                        value={formData.payment.depositMethod}
                        onValueChange={(value: DEPOSIT_METHOD) =>
                          updateFormData("payment", { depositMethod: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Deposit Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(DEPOSIT_METHOD).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method *
                      </Label>
                      <Select
                        value={formData.payment.paymentMethod}
                        onValueChange={(value: PAYMENT_METHOD) =>
                          updateFormData("payment", { paymentMethod: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PAYMENT_METHOD).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Remarks *
                      </Label>
                      <Input
                        value={formData.payment.remarks}
                        onChange={(e) =>
                          updateFormData("payment", { remarks: e.target.value })
                        }
                        placeholder="Additional notes or instructions"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="space-y-4 pt-4">
                  <Card>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Rate</span>
                        <span>
                          RM{" "}
                          {parseFloat(
                            formData.payment.roomPrice || "0",
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nights</span>
                        <span>{calculateNights()} nights</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Subtotal</span>
                        <span>RM {calculateTotal().toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4 pt-4">
                  <Card>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Amount
                        </span>
                        <span className="font-semibold">
                          RM {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Amount Paid
                        </span>
                        <span className="font-semibold text-green-600">
                          RM{" "}
                          {Number(formData.payment.paidAmount || "0") +
                            Number(
                              reserveGuest?.payment?.advancePayment || "0",
                            )}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Balance Due
                        </span>
                        <span className="font-bold text-red-600">
                          RM {calculateDue().toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <PaymentInvoice
                bookingInfo={{
                  guest: {
                    name: formData.guest.name,
                    phone: formData.guest.phone,
                    otas: formData.guest.otas,
                    refId: formData.guest.refId,
                  },
                  stay: {
                    arrival: formData.stay.arrival,
                    departure: formData.stay.departure,
                  },
                  room: {
                    number: room.roomNo,
                    type: room.roomType,
                  },
                  payment: {
                    paidAmount: parseFloat(formData.payment.paidAmount) || 0,
                    deposit: parseFloat(formData.payment.deposit) || 0,
                    depositMethod: formData.payment.depositMethod,
                    method: formData.payment.paymentMethod,
                    remarks: formData.payment.remarks,
                  },
                  paymentDate: new Date(),
                  paymentId: `PAY-${Date.now().toString(36).toUpperCase()}`,
                }}
                onConfirmBooking={bookRoom}
                isBooking={isPending}
              />
            </div>
          )}
        </div>

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
              {step < 4 ? (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleNext} className="gap-2">
                    {step === 3 ? "Review & Confirm" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => bookRoom()}
                  disabled={isPending}
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
                      Confirm Booking
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogDescription className="sr-only">Book Room</DialogDescription>
    </Dialog>
  );
}
