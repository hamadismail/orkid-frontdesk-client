import {
  DEPOSIT_METHOD,
  GROUP_STATUS,
  OTAS,
  PAYMENT_METHOD,
} from './enums';
import { IGuest } from './guest.interface';

export interface IGroupPayment {
  paidAmount: number;
  dueAmount: number;
  deposit: number;
  depositMethod?: DEPOSIT_METHOD;
  paymentMethod?: PAYMENT_METHOD;
}

export interface IReservationGroup {
  _id?: string;
  groupCode: string;
  groupName: string;
  primaryGuestId: string | IGuest;
  source?: OTAS;
  refId?: string;
  status: GROUP_STATUS;
  remarks?: string;
  payment?: IGroupPayment;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
