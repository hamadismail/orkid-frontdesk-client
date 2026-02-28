import { RoomStatus, RoomType } from './enums';

export interface IRoom {
  _id?: string;
  currentReservationId?: string | null;
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
  roomStatus: RoomStatus;
  adults: number;
  children: number;
  createdAt?: string;
  updatedAt?: string;
}
