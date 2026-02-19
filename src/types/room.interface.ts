import { Types } from "mongoose";

export enum RoomType {
  SDOUBLE = "Standard Double Room",
  DQUEEN = "Deluxe Queen Room",
  DTWIN = "Deluxe Twin Room",
  SKING = "Superior King Room",
  DTRIPLE = "Deluxe Triple Room",
  FJUNIOR = "Family Junior Suite",
  DFAMILY = "Deluxe Family Room",
  DFAMILYS = "Deluxe Family Suite",
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
