import { Types } from "mongoose";

export enum RoomType {
  SSINGLE = "Standard Single Room",
  STWIN = "Standard Twin Room",
  SQUEEN = "Standard Queen Room",
  DTWIN = "Delux Twin Room",
  DTRIPPLE = "Delux Triple Room",
  DQUEEN = "Delux Queen Room",
  DFAMILLY = "Delux Family Room",
  SFAMILLY = "Superior Family Room",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  OCCUPIED = "OCCUPIED",
  DUE_OUT = "DUE_OUT",
  DIRTY = "DIRTY",
  SERVICE = "SERVICE",
}

export interface IRoom {
  _id?: Types.ObjectId;
  guestId?: Types.ObjectId;
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
  roomStatus: RoomStatus;
  adults: number;
  children: number;
  createdAt?: Date;
  updatedAt?: Date;
}
