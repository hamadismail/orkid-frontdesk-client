import { OTAS, RESERVATION_STATUS } from "./enums";

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

export interface IReservation {
  _id?: string;
  confirmationNo: string;
  groupId: string;
  guestId: string;
  roomId: string;
  status: RESERVATION_STATUS;
  stay: IReservationStay;
  rate: IReservationRate;
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
