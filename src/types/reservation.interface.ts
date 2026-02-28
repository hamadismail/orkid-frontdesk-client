import { OTAS, RESERVATION_STATUS } from './enums';
import { IGuest } from './guest.interface';
import { IRoom } from './room.interface';
import { IReservationGroup } from './group.interface';

export interface IReservation {
  _id?: string;
  confirmationNo: string;
  groupId: string | IReservationGroup;
  guestId: string | IGuest;
  roomId: string | IRoom;
  status: RESERVATION_STATUS;
  stay: {
    arrival: string | Date;
    departure: string | Date;
    adults: number;
    children: number;
  };
  rate: {
    roomPrice: number;
    sst?: number;
    tourismTax?: number;
    discount?: number;
    subtotal: number;
  };
  payment: {
    paidAmount: number;
    dueAmount: number;
    deposit?: number;
    depositMethod?: string;
    paymentMethod?: string;
    remarks?: string;
  };
  source?: OTAS;
  refId?: string;
  cancelledAt?: string | Date;
  cancelReason?: string;
  checkedInAt?: string | Date;
  checkedOutAt?: string | Date;
  movedFromRoomId?: string | IRoom;
  createdAt?: string;
  updatedAt?: string;
}
