import { OTAS } from "@/src/types/book.interface";
import { RoomType } from "@/src/types/room.interface";
import z from "zod";

export const reservationSchema = z.object({
  // Guest Info
  refId: z.string().min(1, "Reservation no. is required"),
  otas: z.enum(OTAS),
  name: z.string().min(1, "Please enter the guest full name."),
  phone: z.string().min(1, "Please enter the guest phone number."),
  email: z.string().optional(),
  passport: z.string().optional(),
  country: z.string().optional(),

  // Booking Info
  roomType: z.enum(RoomType).nullable(),
  roomNo: z.string().min(1, "Room no. is required"),
  numOfGuest: z.string().optional(),
  arrivalDate: z.date(),
  departureDate: z.date(),
  roomDetails: z.string().optional(),
  otherGuest: z.string().optional(),

  // Payment Info
  roomPrice: z.string().min(1, "Room price is required"),
  paidAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  sst: z.string().optional(),
  tourismTax: z.string().optional(),
  discount: z.string().optional(),
  remarks: z.string().min(1, "Remarks is required"),
});


