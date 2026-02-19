"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { IRoom, RoomType } from "@/src/types/room.interface";
import {
  GUEST_STATUS,
  IBook,
  OTAS,
  PAYMENT_METHOD,
} from "@/src/types/book.interface";
import { IReservation } from "@/src/types/reservation.interface";
import { toast } from "sonner";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  User,
  Phone,
  Mail,
  FileText,
  Bed,
  Calendar,
  CreditCard,
  Printer,
  CheckCircle,
  Loader2,
  Hotel,
  DollarSign,
  Percent,
  Receipt,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { cn } from "@/src/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as DatePicker } from "../../ui/calendar";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

import { PaymentInvoice } from "@/src/shared/PaymentInvoice";
import ReservationInvoice from "@/src/shared/ReservationInvoice";
import { reservationSchema } from "./reservation.schema";
import { Label } from "../../ui/label";
import { getAllRooms } from "@/src/services/room.service";
import { getAllBookings } from "@/src/services/booking.service";

interface NewReservationDialogProps {
  allReservations: IReservation[];
  isOpen: boolean;
  onClose: () => void;
  room?: IRoom;
}

const STEPS = [
  { number: 1, title: "Guest Details", icon: User },
  { number: 2, title: "Room Selection", icon: Bed },
  { number: 3, title: "Payment", icon: CreditCard },
  { number: 4, title: "Confirmation", icon: CheckCircle },
] as const;

export function NewReservationDialog({
  allReservations,
  isOpen,
  onClose,
  room,
}: NewReservationDialogProps) {
  const [step, setStep] = useState(1);
  const [reservationData, setReservationData] = useState<IReservation | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"payment" | "reservation">(
    "reservation",
  );
  const queryClient = useQueryClient();

  // Fetch data
  const { data: allRoomsData, isLoading: isLoadingRooms } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => getAllRooms(),
  });

  const { data: allBookingsData, isLoading: isLoadingBookings } = useQuery<
    IBook[]
  >({
    queryKey: ["book"],
    queryFn: () => getAllBookings(),
  });

  const allRooms = useMemo(() => allRoomsData ?? [], [allRoomsData]);
  const allBookings = useMemo(() => allBookingsData ?? [], [allBookingsData]);

  // Form initialization
  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      reservationNo: "",
      ota: "",
      name: "",
      phone: "",
      email: "",
      passport: "",
      roomType: room?.roomType || null,
      roomNo: room?.roomNo || "",
      numOfGuest: "",
      arrivalDate: new Date(),
      departureDate: addDays(new Date(), 1),
      roomDetails: "",
      otherGuest: "",
      bookingFee: "0",
      advancePayment: "",
      paymentMethod: PAYMENT_METHOD.CASH,
      sst: "",
      tourismTax: "",
      discount: "",
    },
  });

  const arrivalDate = form.watch("arrivalDate");
  const departureDate = form.watch("departureDate");
  const selectedRoomType = form.watch("roomType");

  // Calculate stay duration
  const stayDuration = useMemo(() => {
    if (!arrivalDate || !departureDate) return 0;
    const diffTime = Math.abs(departureDate.getTime() - arrivalDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [arrivalDate, departureDate]);

  // Available rooms calculation
  const availableRooms = useMemo(() => {
    if (!arrivalDate || !departureDate || !allRooms.length) return [];

    const selectedInterval = { start: arrivalDate, end: departureDate };

    return allRooms.filter((room) => {
      // Check for overlapping bookings
      const isOccupied = allBookings.some((booking) => {
        if (booking.guest.status !== GUEST_STATUS.CHECKED_IN) return false;

        const bookingStart = new Date(booking.stay.arrival);
        const bookingEnd = new Date(booking.stay.departure);
        const bookingRoomId =
          typeof booking.roomId === "object" &&
          booking.roomId !== null &&
          "_id" in booking.roomId
            ? (booking.roomId as unknown as { _id: string })._id.toString()
            : booking.roomId?.toString();

        return (
          bookingRoomId === room._id?.toString() &&
          selectedInterval.start < bookingEnd &&
          selectedInterval.end > bookingStart
        );
      });

      // Check for overlapping reservations
      const isReserved = allReservations.some((reservation) => {
        const reservationStart = new Date(reservation.room.arrival);
        const reservationEnd = new Date(reservation.room.departure);
        return (
          reservation.room.roomNo === room.roomNo &&
          selectedInterval.start <= reservationEnd &&
          selectedInterval.end >= reservationStart
        );
      });

      return !isOccupied && !isReserved;
    });
  }, [arrivalDate, departureDate, allRooms, allBookings, allReservations]);

  const availableRoomsByType = useMemo(() => {
    const roomsByType: Record<string, IRoom[]> = {};
    availableRooms.forEach((room) => {
      if (!roomsByType[room.roomType]) {
        roomsByType[room.roomType] = [];
      }
      roomsByType[room.roomType].push(room);
    });
    return roomsByType;
  }, [availableRooms]);

  // Mutation
  const { mutate: reserveRoom, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof reservationSchema>) => {
      const payload = {
        guest: {
          reservationNo: data.reservationNo,
          ota: data.ota,
          name: data.name,
          email: data.email,
          phone: data.phone,
          passport: data.passport,
        },
        room: {
          roomNo: data.roomNo,
          numOfGuest: data.numOfGuest,
          arrival: data.arrivalDate,
          departure: data.departureDate,
          roomDetails: data.roomDetails,
          otherGuest: data.otherGuest,
        },
        payment: {
          bookingFee: parseFloat(data.bookingFee),
          advancePayment: parseFloat(data.advancePayment || "0"),
          sst: parseFloat(data.sst || "0"),
          tourismTax: parseFloat(data.tourismTax || "0"),
          fnfDiscount: parseFloat(data.discount || "0"),
          paymentMethod: data.paymentMethod,
        },
        reservationDate: new Date().toISOString(),
        isDeleted: false,
      };

      const { data: response } = await axios.post("/reserve", payload);

      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: ["reserve"] });
        // Express backend wraps response in 'data'
        const booking = response.data?.booking || response.data;
        setReservationData(booking);
        return response;
      } else {
        throw new Error(response?.message || "Reservation failed");
      }
    },
    onSuccess: () => {
      toast.success("Reservation confirmed", {
        description: "Room has been successfully reserved",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      setStep(4);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Reservation failed", {
        description: error?.response?.data?.message || error.message,
        icon: <Loader2 className="h-5 w-5 text-red-500" />,
      });
    },
  });

  // Form handlers
  const handleNext = async () => {
    let fieldsToValidate: (keyof z.infer<typeof reservationSchema>)[] = [];

    if (step === 1) fieldsToValidate = ["name", "phone", "reservationNo"];
    else if (step === 2)
      fieldsToValidate = ["arrivalDate", "departureDate", "roomType", "roomNo"];
    else if (step === 3) fieldsToValidate = ["bookingFee", "paymentMethod"];

    const isStepValid = await form.trigger(fieldsToValidate);
    if (!isStepValid) {
      toast.warning("Please fill all required fields correctly");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const onSubmit = (data: z.infer<typeof reservationSchema>) => {
    reserveRoom(data);
  };

  const handleReset = () => {
    form.reset();
    setStep(1);
    setReservationData(null);
  };

  const paymentInvoiceData = useMemo(() => {
    if (!reservationData) return null;

    return {
      guest: {
        name: reservationData.guest.name,
        phone: reservationData.guest.phone,
        otas: reservationData.guest.ota,
        reservationNo: reservationData.guest.reservationNo,
      },
      stay: {
        arrival: new Date(reservationData.room.arrival),
        departure: new Date(reservationData.room.departure),
      },
      room: {
        number: reservationData.room.roomNo,
        type: form.getValues("roomType") || "",
      },
      payment: {
        paidAmount: reservationData.payment.advancePayment || 0,
        deposit: 0,
        method: form.getValues("paymentMethod"),
        remarks: reservationData.payment.remarks,
      },
      paymentDate: new Date(),
      paymentId: reservationData._id?.toUpperCase(),
    };
  }, [reservationData, form]);

  const isLoading = isLoadingRooms || isLoadingBookings;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-auto max-h-148">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hotel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  New Reservation
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Create a new room reservation
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              Step {step} of 4
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto"
            >
              <div className="px-6 py-4 space-y-6">
                {/* Step 1: Guest Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Full Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Guest full name"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+60123456789"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="guest@example.com"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="passport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              IC/Passport
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="IC or Passport number"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ota"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Hotel className="h-4 w-4" />
                              OTA
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder="Select OTA/Reference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(OTAS).map((ota) => (
                                  <SelectItem key={ota} value={ota}>
                                    {ota}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reservationNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Reference ID *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter reference ID"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Room Selection */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="arrivalDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Stay Duration *
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "h-10 pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {arrivalDate && departureDate ? (
                                      <>
                                        {format(arrivalDate, "PPP")} -{" "}
                                        {format(departureDate, "PPP")}
                                      </>
                                    ) : (
                                      <span>Select stay dates</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <DatePicker
                                  mode="range"
                                  defaultMonth={arrivalDate}
                                  selected={{
                                    from: arrivalDate,
                                    to: departureDate,
                                  }}
                                  onSelect={(range) => {
                                    form.setValue(
                                      "arrivalDate",
                                      range?.from as Date,
                                    );
                                    form.setValue(
                                      "departureDate",
                                      range?.to as Date,
                                    );
                                  }}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  numberOfMonths={2}
                                  className="p-3"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Card className="border-dashed">
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              Stay Duration
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {stayDuration} nights
                              </span>
                              <Badge variant="outline">
                                {stayDuration} night
                                {stayDuration !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Room Categories</h3>
                        <span className="text-sm text-muted-foreground">
                          {availableRooms.length} rooms available
                        </span>
                      </div>

                      <FormField
                        control={form.control}
                        name="roomType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.keys(availableRoomsByType).map(
                                  (type) => (
                                    <Card
                                      key={type}
                                      className={cn(
                                        "cursor-pointer transition-all hover:shadow-md",
                                        field.value === type &&
                                          "border-primary ring-2 ring-primary/20",
                                      )}
                                      onClick={() =>
                                        field.onChange(type as RoomType)
                                      }
                                    >
                                      <CardContent>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                              {type}
                                            </span>
                                            <Badge variant="secondary">
                                              {
                                                availableRoomsByType[type]
                                                  .length
                                              }
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Available rooms
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ),
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedRoomType &&
                      availableRoomsByType[selectedRoomType]?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-medium">Select Room Number</h3>
                          <FormField
                            control={form.control}
                            name="roomNo"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select a room number" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRoomsByType[
                                      selectedRoomType
                                    ]?.map((room) => (
                                      <SelectItem
                                        key={room._id?.toString()}
                                        value={room.roomNo}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{room.roomNo}</span>
                                          {/* <span className="text-xs text-muted-foreground">
                                          Floor {room.roomFloor}
                                        </span> */}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                    {selectedRoomType &&
                      availableRoomsByType[selectedRoomType]?.length === 0 && (
                        <Card className="border-amber-200 bg-amber-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-amber-100">
                                <Bed className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  No rooms available
                                </div>
                                <div className="text-sm text-amber-700">
                                  No {selectedRoomType} rooms available for
                                  selected dates
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <div className="space-y-6">
                    <Tabs defaultValue="payment" className="w-full">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="payment">
                          Payment Details
                        </TabsTrigger>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                      </TabsList>

                      <TabsContent value="payment" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bookingFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Booking Fee *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="advancePayment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Advance Payment
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sst"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Percent className="h-4 w-4" />
                                  SST (optional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tourismTax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Tourism Tax (optional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="flex items-center gap-2">
                                  <Percent className="h-4 w-4" />
                                  Discount (optional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Payment Method *
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  className="grid grid-cols-2 md:grid-cols-4 gap-2"
                                >
                                  {Object.values(PAYMENT_METHOD).map(
                                    (method) => (
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
                                    ),
                                  )}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="summary" className="space-y-4 pt-4">
                        <Card>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Stay duration
                              </span>
                              <span>{stayDuration} nights</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Room type
                              </span>
                              <span className="font-medium">
                                {selectedRoomType || "Not selected"}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                              <span>Booking fee</span>
                              <span>
                                RM{" "}
                                {parseFloat(
                                  form.watch("bookingFee") || "0",
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Advance payment</span>
                              <span>
                                RM{" "}
                                {parseFloat(
                                  form.watch("advancePayment") || "0",
                                ).toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && reservationData && (
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          Reservation Confirmed!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your reservation has been successfully created
                        </p>
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-left">
                            <div className="text-muted-foreground">
                              Reservation ID
                            </div>
                            <div className="font-medium">
                              {reservationData._id?.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">Room</div>
                            <div className="font-medium">
                              {reservationData.room.roomNo}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-muted-foreground">
                              Check-in
                            </div>
                            <div className="font-medium">
                              {format(
                                new Date(reservationData.room.arrival),
                                "MMM d, yyyy",
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">
                              Check-out
                            </div>
                            <div className="font-medium">
                              {format(
                                new Date(reservationData.room.departure),
                                "MMM d, yyyy",
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={() => {
                          setInvoiceType("payment");
                          setDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Payment Invoice
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setInvoiceType("reservation");
                          setDialogOpen(true);
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Reservation Voucher
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReset}
                        variant="secondary"
                      >
                        New Reservation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Form>
        )}

        {/* Footer Actions */}
        {step < 4 && (
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
                {step < 3 ? (
                  <Button onClick={handleNext} className="gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
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
                        Confirm Reservation
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              {invoiceType === "payment"
                ? "Payment Invoice"
                : "Reservation Voucher"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
            {invoiceType === "payment" && paymentInvoiceData && (
              <PaymentInvoice
                bookingInfo={paymentInvoiceData}
                isBooking={false}
                printOnly={true}
              />
            )}
            {invoiceType === "reservation" && reservationData && (
              <ReservationInvoice
                bookingInfo={reservationData}
                onConfirmBooking={() => {}}
                onBack={() => setDialogOpen(false)}
                isPending={false}
              />
            )}
          </div>

          <div className="px-6 py-4 border-t bg-muted/50">
            <Button
              onClick={() => setDialogOpen(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogDescription className="sr-only">
        Reservation Dialog
      </DialogDescription>
    </Dialog>
  );
}
