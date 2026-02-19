import { Types } from "mongoose";
import { PAYMENT_METHOD } from "./book.interface";

export interface IPayment {
  _id?: string;
  guestId: Types.ObjectId;
  guestName: string;
  arrival: Date;
  departure: Date;
  roomNo: string;
  roomType: string;
  paymentMethod: PAYMENT_METHOD;
  paidAmount: number;
  deposit: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentReceiptProps {
  bookingInfo: {
    guest: {
      name: string | undefined;
      phone: string | undefined;
      otas?: string | undefined;
      refId?: string | undefined;
    };
    stay: {
      arrival: Date | undefined;
      departure: Date | undefined;
    };
    room: {
      number: string | undefined;
      type: string | undefined;
    };
    payment: {
      paidAmount: number;
      deposit: number;
      depositMethod?: string | undefined;
      method: string | undefined;
      remarks?: string | undefined;
    };
    paymentDate: Date;
    paymentId: string | undefined;
  };
  onConfirmBooking?: () => Promise<void> | void;
  isBooking: boolean;
  printOnly?: boolean;
}
