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

export type TPaymentReceiptInfo = {
  guest: {
    name: string | undefined;
    phone: string | undefined;
    otas?: string | undefined;
    refId?: string | undefined;
  };
  stay: {
    arrival: Date | string | undefined;
    departure: Date | string | undefined;
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
  paymentDate: Date | string;
  paymentId: string | undefined;
};

export interface IPaymentReceiptProps {
  bookingInfo: TPaymentReceiptInfo;
  onConfirmBooking?: () =>
    | Promise<TPaymentReceiptInfo | void>
    | TPaymentReceiptInfo
    | void;
  isBooking: boolean;
  printOnly?: boolean;
  onAfterPrint?: () => Promise<void> | void;
}

