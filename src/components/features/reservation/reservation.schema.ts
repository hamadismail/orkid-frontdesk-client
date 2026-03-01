import { OTAS, RoomType, PAYMENT_METHOD } from "@/src/types/enums";
import z from "zod";

export const reservationSchema = z.object({
  // Group Info
  isGroup: z.boolean(),
  groupName: z.string().optional(),
  
  // Primary Guest Info (also used as single guest)
  name: z.string().min(1, "Please enter the guest full name."),
  phone: z.string().min(1, "Please enter the guest phone number."),
  email: z.string().optional(),
  passport: z.string().optional(),
  country: z.string().optional(),
  source: z.enum(Object.values(OTAS) as [string, ...string[]]).optional(),
  refId: z.string().optional(),

  // Stay Info
  arrivalDate: z.date(),
  departureDate: z.date(),

  // Rooms (for group mode)
  rooms: z.array(z.object({
    roomType: z.enum(Object.values(RoomType) as [string, ...string[]]),
    roomNo: z.string().min(1, "Room no. is required"),
    roomPrice: z.string().min(1, "Room price is required"),
    adults: z.number(),
    children: z.number(),
    guestName: z.string().optional(), // Override guest name per room
  })).min(1, "At least one room is required"),

  // Single Room mode (kept for backward compatibility with UI if needed, or just use rooms[0])
  roomType: z.string().optional(),
  roomNo: z.string().optional(),
  roomPrice: z.string().optional(),

  // Payment Info (shared for group or for single)
  paidAmount: z.string().optional(),
  paymentMethod: z.enum(Object.values(PAYMENT_METHOD) as [string, ...string[]]).optional(),
  depositAmount: z.string().optional(),
  depositMethod: z.enum(Object.values(PAYMENT_METHOD) as [string, ...string[]]).optional(),
  sst: z.string().optional(),
  tourismTax: z.string().optional(),
  discount: z.string().optional(),
  remarks: z.string().optional(),
});
