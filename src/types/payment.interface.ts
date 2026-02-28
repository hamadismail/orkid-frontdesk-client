import { OTAS, PAYMENT_METHOD, PAYMENT_TYPE } from './enums';

export interface IPayment {
  _id?: string;
  reservationId?: string;
  groupId: string;
  type: PAYMENT_TYPE;
  amount: number;
  paymentMethod: PAYMENT_METHOD;
  guestName: string;
  roomNo: string;
  roomType: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPaymentReceiptProps {
  bookingInfo: {
    guest: {
      name: string;
      phone: string;
      otas: string;
      refId: string;
    };
    stay: {
      arrival: any;
      departure: any;
    };
    room: {
      number: string;
      type: string;
    };
    payment: {
      paidAmount: number;
      deposit?: number;
      depositMethod?: string;
      method: string;
      remarks?: string;
    };
    paymentDate: any;
    paymentId: string;
  };
  onConfirmBooking?: () => Promise<any>;
  isBooking?: boolean;
  printOnly?: boolean;
  onAfterPrint?: () => Promise<void>;
}

export type TPaymentReceiptInfo = IPaymentReceiptProps["bookingInfo"];
