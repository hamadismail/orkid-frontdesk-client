/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { IRoom } from "@/src/types/room.interface";
import {
  OTAS,
  PAYMENT_METHOD,
  RESERVATION_STATUS,
  RoomType,
} from "@/src/types/enums";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { createGroup } from "@/src/services/group.service";
import { createReservation } from "@/src/services/reservation.service";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  MessageSquare,
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
import { PreviousGuestSearch } from "../guest/PreviousGuestSearch";

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
  isOpen,
  onClose,
  room,
}: NewReservationDialogProps) {
  const [step, setStep] = useState(1);
  const [isGroup, setIsGroup] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<IGuest | null>(null);
  const [invoiceType, setInvoiceType] = useState<"payment" | "reservation">(
    "reservation",
  );
  const queryClient = useQueryClient();

  // 1. Form initialization
  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      isGroup: false,
      groupName: "",
      refId: "",
      source: OTAS.WALKING_GUEST,
      name: "",
      phone: "",
      email: "",
      passport: "",
      arrivalDate: new Date(),
      departureDate: addDays(new Date(), 1),
      rooms: room ? [{
        roomType: room.roomType,
        roomNo: room.roomNo,
        roomPrice: "0",
        adults: 1,
        children: 0,
      }] : [{
        roomType: "" as any,
        roomNo: "",
        roomPrice: "0",
        adults: 1,
        children: 0,
      }],
      roomPrice: "0",
      paidAmount: "",
      paymentMethod: PAYMENT_METHOD.CASH,
      sst: "",
      tourismTax: "",
      discount: "",
      remarks: "",
    },
  });

  // 2. Field Array
  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "rooms",
  });

  // Fetch data
  const { data: allRoomsData, isLoading: isLoadingRooms } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => getAllRooms(),
  });

  const allRooms = useMemo(() => allRoomsData ?? [], [allRoomsData]);

  const arrivalDate = form.watch("arrivalDate");
  const departureDate = form.watch("departureDate");

  const stayDuration = useMemo(() => {
    if (!arrivalDate || !departureDate) return 1;
    return Math.max(1, differenceInCalendarDays(departureDate, arrivalDate));
  }, [arrivalDate, departureDate]);

  const paymentInvoiceData = useMemo(() => {
    if (!reservationData) return null;
    const res = reservationData.reservations ? reservationData.reservations[0] : reservationData;
    const guest = res.guestId as unknown as IGuest;
    const room = res.roomId as any;

    return {
      guest: {
        name: guest?.name || "",
        phone: guest?.phone || "",
        otas: res.source || "",
        refId: res.confirmationNo || "",
      },
      stay: {
        arrival: new Date(res.stay.arrival),
        departure: new Date(res.stay.departure),
      },
      room: {
        number: room?.roomNo || "",
        type: room?.roomType || "",
      },
      payment: {
        paidAmount: res.payment.paidAmount || 0,
        deposit: 0,
        method: res.payment.paymentMethod || "",
        remarks: res.payment.remarks,
      },
      paymentDate: new Date(),
      paymentId: res._id?.toUpperCase(),
    };
  }, [reservationData]);


  const { mutate: reserveRoom, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof reservationSchema>) => {
      const guestData = selectedGuest?._id
        ? { guestId: selectedGuest._id }
        : { guest: { name: data.name, phone: data.phone, email: data.email, passport: data.passport, country: data.country } };

      if (data.isGroup) {
        // Handle Group Reservation
        const payload = {
          groupData: {
            groupName: data.groupName || `${data.name}'s Group`,
            ...guestData,
            source: data.source,
            refId: data.refId,
          },
          rooms: data.rooms.map(r => {
            const selectedRoom = allRooms.find(room => room.roomNo === r.roomNo);
            if (!selectedRoom) throw new Error(`Room ${r.roomNo} not found`);

            return {
              ...guestData,
              roomId: selectedRoom._id,
              stay: {
                arrival: data.arrivalDate,
                departure: data.departureDate,
                adults: r.adults,
                children: r.children,
              },
              rate: {
                roomPrice: parseFloat(r.roomPrice),
                subtotal: parseFloat(r.roomPrice) * stayDuration,
              },
              payment: {
                paidAmount: 0,
                dueAmount: parseFloat(r.roomPrice) * stayDuration,
              }
            };
          })
        };
        const response = await createGroup(payload);
        if (response?.success) {
          setReservationData(response.data);
          return response;
        }
        throw new Error(response?.message || "Group reservation failed");
      } else {
        // Handle Single Reservation
        const roomInfo = data.rooms[0];
        const selectedRoom = allRooms.find(r => r.roomNo === roomInfo.roomNo);
        if (!selectedRoom) throw new Error(`Room ${roomInfo.roomNo} not found`);

        const payload = {
          ...guestData,
          roomId: selectedRoom._id,
          status: RESERVATION_STATUS.CONFIRMED,
          stay: {
            arrival: data.arrivalDate,
            departure: data.departureDate,
            adults: roomInfo.adults,
            children: roomInfo.children,
          },
          rate: {
            roomPrice: parseFloat(roomInfo.roomPrice || "0"),
            subtotal: parseFloat(calculateTotalAmount()),
          },
          payment: {
            paidAmount: parseFloat(data.paidAmount || "0"),
            dueAmount: parseFloat(calculateDueAmount()),
            paymentMethod: data.paymentMethod,
            remarks: data.remarks,
          },
          source: data.source as any,
          refId: data.refId,
        };
        const response = await createReservation(payload as any);
        if (response?.success) {
          setReservationData(response.data);
          return response;
        }
        throw new Error(response?.message || "Reservation failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Reservation confirmed");
      setStep(4);
    },
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

    if (step === 1) fieldsToValidate = ["name", "phone", "refId", "source"];
    else if (step === 2)
      fieldsToValidate = ["arrivalDate", "departureDate", "rooms" as any];
    else if (step === 3) fieldsToValidate = ["paymentMethod"];

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
    setSelectedGuest(null);
    setReservationData(null);
  };

  const calculateTotalAmount = () => {
    const totalRoomPrice = form.watch("rooms").reduce((acc, r) => acc + (parseFloat(r.roomPrice || "0") * stayDuration), 0);
    const sst = parseFloat(form.watch("sst") || "0");
    const tourismTax = parseFloat(form.watch("tourismTax") || "0");

    const subtotal = totalRoomPrice + sst + tourismTax;

    return subtotal.toFixed(2);
  };

  const calculateDueAmount = () => {
    const totalAmount = parseFloat(calculateTotalAmount());
    const paidAmount = parseFloat(form.watch("paidAmount") || "0");
    const discount = parseFloat(form.watch("discount") || "0");

    const dueAmount = totalAmount - paidAmount - discount;
    return dueAmount.toFixed(2);
  };

  const isLoading = isLoadingRooms;

  const handleGuestSelection = (guest: any) => {
    setSelectedGuest(guest);

    form.setValue("name", guest.name || guest.guest?.name, { shouldDirty: true });
    form.setValue("phone", guest.phone || guest.guest?.phone || "", { shouldDirty: true });
    form.setValue("email", guest.email || guest.guest?.email || "", { shouldDirty: true });
    form.setValue("passport", guest.passport || guest.guest?.passport || "", { shouldDirty: true });
    form.setValue("country", guest.country || guest.guest?.country || "", { shouldDirty: true });

    toast.success(`Guest information loaded: ${guest.name || guest.guest?.name}`);
  };
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
              onSubmit={form.handleSubmit(onSubmit as any)}
              className="flex-1 overflow-y-auto"
            >
              <div className="px-6 py-4 space-y-6">
                {/* Step 1: Guest Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                      <Label className="text-sm font-medium">Reservation Type</Label>
                      <RadioGroup
                        defaultValue={isGroup ? "group" : "single"}
                        onValueChange={(val) => {
                            setIsGroup(val === "group");
                            form.setValue("isGroup", val === "group");
                        }}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <Label htmlFor="single">Single Room</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="group" id="group" />
                          <Label htmlFor="group">Group (Multi-Room)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {isGroup && (
                      <FormField
                        control={form.control as any}
                        name="groupName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Ahmad Family" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <PreviousGuestSearch
                      value={form.watch("name") || ""}
                      selectedGuest={selectedGuest}
                      onSelectedGuestChange={setSelectedGuest}
                      onValueChange={(value) =>
                        form.setValue("name", value, { shouldDirty: true })
                      }
                      onGuestSelect={handleGuestSelection}
                    />

                    {selectedGuest && (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        Previous Guest
                      </Badge>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
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
                        control={form.control as any}
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
                        control={form.control as any}
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
                        control={form.control as any}
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
                        control={form.control as any}
                        name="otas"
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
                        control={form.control as any}
                        name="refId"
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
                        control={form.control as any}
                        name="arrivalDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Stay Dates *
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
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Stay Duration
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {stayDuration} nights
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Room Selection</h3>
                        {isGroup && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ roomType: "" as any, roomNo: "", roomPrice: "0", adults: 1, children: 0 })}
                            className="gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Add Room
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <Card key={field.id} className="relative">
                            {isGroup && fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-destructive"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control as any}
                                name={`rooms.${index}.roomType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Room Type *</FormLabel>
                                    <Select
                                      onValueChange={(val) => {
                                        field.onChange(val);
                                        // Reset room number when type changes
                                        form.setValue(`rooms.${index}.roomNo`, "");
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {Object.values(RoomType).map((type) => (
                                          <SelectItem key={type} value={type}>
                                            {type}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name={`rooms.${index}.roomNo`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Room No *</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Select No" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {allRooms
                                          .filter(r => r.roomType === form.watch(`rooms.${index}.roomType`))
                                          .map((room) => (
                                          <SelectItem
                                            key={room._id}
                                            value={room.roomNo}
                                          >
                                            {room.roomNo}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name={`rooms.${index}.roomPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Price *</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <FormField
                                  control={form.control as any}
                                  name={`rooms.${index}.adults`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Adults</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} className="h-9" onChange={e => field.onChange(parseInt(e.target.value))} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control as any}
                                  name={`rooms.${index}.children`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Children</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} className="h-9" onChange={e => field.onChange(parseInt(e.target.value))} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
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
                            control={form.control as any}
                            name="paidAmount"
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
                            control={form.control as any}
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
                            control={form.control as any}
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
                            control={form.control as any}
                            name="discount"
                            render={({ field }) => (
                              <FormItem>
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

                          <FormField
                            control={form.control as any}
                            name="remarks"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Remarks *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
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
                          control={form.control as any}
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
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Rooms</span>
                                {form.watch("rooms").map((r, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{r.roomNo || "Not selected"} ({r.roomType})</span>
                                        <span>RM {parseFloat(r.roomPrice || "0").toFixed(2)} x {stayDuration}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            {/* ... existing taxes ... */}
                            <div className="flex justify-between font-medium">
                              <span>Total Amount</span>
                              <span>RM {calculateTotalAmount()}</span>
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
                    {(() => {
                      const res = reservationData.reservations
                        ? reservationData.reservations[0]
                        : reservationData;
                      const roomInfo = res.roomId as any;

                      return (
                        <>
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
                                    Confirmation No
                                  </div>
                                  <div className="font-medium">
                                    {res.confirmationNo}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground">
                                    Room
                                  </div>
                                  <div className="font-medium">
                                    {roomInfo?.roomNo || "Multiple"}
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="text-muted-foreground">
                                    Check-in
                                  </div>
                                  <div className="font-medium">
                                    {format(
                                      new Date(res.stay.arrival),
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
                                      new Date(res.stay.departure),
                                      "MMM d, yyyy",
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}

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
                        Payment Receipt
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
                    onClick={form.handleSubmit(onSubmit as any)}
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
                ? "Payment Receipt"
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



