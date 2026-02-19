import { Types } from "mongoose";

export enum OTAS {
  BOOKING_COM = "Booking.com",
  AGODA = "Agoda",
  TRAVELOKA = "Traveloka",
  EXPEDIA = "Expedia",
  WALKING_GUEST = "Walking Guest",
  TICKET = "Ticket",
  TRIP_COM = "Trip.com",
}

export enum GUEST_STATUS {
  CHECKED_IN = "CheckedIn",
  CHECKED_OUT = "CheckedOut",
  RESERVED = "Reserved",
  CANCEL = "Cancel",
}

export enum PAYMENT_METHOD {
  CREDIT_CARD = "Credit/Debit Card",
  QR = "QR/Bank Transfer",
  CITY_LEDGER = "City Ledger",
  CASH = "Cash",
}

export enum DEPOSIT_METHOD {
  // CREDIT_CARD = "Credit/Debit Card",
  OR = "QR/Bank Transfer",
  // CITY_LEDGER = "City Ledger",
  CASH = "Cash",
  OC = "Others Currency",
}

export interface IBook {
  _id?: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
    refId: string;
    otas: OTAS;
    status: GUEST_STATUS;
  };
  stay: {
    arrival: Date;
    departure: Date;
    adults: number;
    children: number;
  };
  payment: {
    roomPrice: number;
    subtotal: number;
    sst?: number;
    tourismTax?: number;
    discount?: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: PAYMENT_METHOD;
    deposit?: number;
    depositMethod?: DEPOSIT_METHOD;
    remarks: string;
  };
  isCheckOut: boolean;
  roomId?: Types.ObjectId | { roomNo: string; roomType: string };
  createdAt?: Date;
  updatedAt?: Date;
}
