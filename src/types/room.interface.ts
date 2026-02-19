import { Types } from "mongoose";

export enum RoomType {
  SQUEEN = "Standard Queen Room",
  DTWIN = "Delux Twin Room",
  DQUEEN = "Delux Queen Room",
  DTRIPPLE = "Deluxe Triple Room",
  SFAMILLY = "Superior Family Room",
  DFAMILLY = "Deluxe Family Room",
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
  // isBooked: boolean;
  roomStatus: RoomStatus;
}
