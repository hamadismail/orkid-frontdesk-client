import { OTAS } from "./book.interface";

export interface IReservation {
  _id?: string;
  guest: {
    reservationNo?: string;
    ota?: string;
    name: string;
    email?: string;
    phone: string;
    nationality?: string;
    passport?: string;
  };
  room: {
    roomNo?: string;
    roomType?: string;
    numOfGuest?: string;
    arrival: Date;
    departure: Date;
    roomDetails?: string;
    otherGuest?: string;
  };
  payment: {
    bookingFee: number;
    advancePayment: number;
    sst: number;
    tourismTax: number;
    fnfDiscount: number;
    totalAmount?: number;
    remarks?: string;
  };
  reservationDate: string;
  isDeleted?: boolean;
}

export interface IQuickBooking {
  guestName: string;
  guestPhone: string;
  roomId: string;
  arrival: string;
  departure: string;
  adults: number;
  ota: OTAS;
  notes: string;
}
