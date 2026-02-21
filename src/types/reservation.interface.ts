import { OTAS, PAYMENT_METHOD } from "./book.interface";

export interface IReservation {
  _id?: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
    refId: string; // Used as reservationNo
    otas: OTAS;
    // status: GUEST_STATUS;
  };
  stay: {
    arrival: Date;
    departure: Date;
    adults?: number;
    children?: number;
  };
  payment: {
    roomPrice: number;
    subtotal: number;
    sst?: number;
    tourismTax?: number;
    discount?: number;
    paidAmount: number; // Used as advancePayment
    dueAmount: number;
    paymentMethod: PAYMENT_METHOD;
    // deposit?: number;
    // depositMethod?: DEPOSIT_METHOD;
    remarks: string;
  };
  roomId?: string | { _id: string; roomNo: string; roomType: string };
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
