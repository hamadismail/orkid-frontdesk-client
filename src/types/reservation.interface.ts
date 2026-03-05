import { Types } from "mongoose";
import {
  DEPOSIT_METHOD,
  OTAS,
  PAYMENT_METHOD,
  RESERVATION_STATUS,
} from "./enums";

export interface IReservationStay {
  arrival: Date;
  departure: Date;
  adults: number;
  children: number;
}

export interface IReservationRate {
  roomPrice: number;
  sst: number;
  tourismTax: number;
  discount: number;
  subtotal: number;
}

export interface IReservationPayment {
  paidAmount: number;
  dueAmount: number;
  deposit: number;
  depositMethod?: DEPOSIT_METHOD;
  paymentMethod?: PAYMENT_METHOD;
}

export interface IReservation {
  _id?: Types.ObjectId;
  confirmationNo: string;
  groupId: Types.ObjectId;
  guestId: Types.ObjectId;
  roomId: Types.ObjectId;
  status: RESERVATION_STATUS;
  stay: IReservationStay;
  rate: IReservationRate;
  payment: IReservationPayment;
  remarks?: string;
  source?: OTAS;
  refId?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  movedFromRoomId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
