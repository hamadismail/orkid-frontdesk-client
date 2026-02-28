import { GROUP_STATUS, OTAS } from './enums';
import { IGuest } from './guest.interface';

export interface IReservationGroup {
  _id?: string;
  groupCode: string;
  groupName: string;
  primaryGuestId: string | IGuest;
  source?: OTAS;
  refId?: string;
  status: GROUP_STATUS;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
