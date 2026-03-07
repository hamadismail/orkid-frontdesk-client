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
  _id?: string;
  confirmationNo: string;
  groupId: string;
  guestId: string;
  roomId: string;
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
  movedFromRoomId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
