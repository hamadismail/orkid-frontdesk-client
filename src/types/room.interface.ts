/* eslint-disable @typescript-eslint/no-explicit-any */
import { RoomStatus, RoomType } from './enums';

export interface IRoom {
  _id?: string;
  currentReservationId?: any; // Changed from string | null to any to support populated reservation
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
  roomStatus: RoomStatus;
  visualStatus?: RoomStatus;
  adults: number;
  children: number;
  createdAt?: string;
  updatedAt?: string;
}
