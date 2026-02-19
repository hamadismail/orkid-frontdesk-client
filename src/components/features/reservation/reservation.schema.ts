import { RoomType } from "@/src/types/room.interface";
import z from "zod";

export const reservationSchema = z.object({
  // Guest Info
  reservationNo: z.string().min(1, "Reservation no. is required"),
  ota: z.string().optional(),
  name: z.string().min(1, "Please enter the guest full name."),
  phone: z.string().min(1, "Please enter the guest phone number."),
  email: z.string().optional(),
  passport: z.string().optional(),
  nationality: z.string().optional(),

  // Booking Info
  roomType: z.nativeEnum(RoomType).nullable(),
  roomNo: z.string().min(1, "Room no. is required"),
  numOfGuest: z.string().optional(),
  arrivalDate: z.date(),
  departureDate: z.date(),
  roomDetails: z.string().optional(),
  otherGuest: z.string().optional(),

  // Payment Info
  bookingFee: z.string().min(1, "Booking fee is required"),
  advancePayment: z.string().optional(),
  paymentMethod: z.string().optional(),
  sst: z.string().optional(),
  tourismTax: z.string().optional(),
  discount: z.string().optional(),
});


