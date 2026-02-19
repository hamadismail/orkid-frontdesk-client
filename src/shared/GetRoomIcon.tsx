import { BedDouble, BedSingle, Crown, Hotel } from "lucide-react";
import { RoomType } from "../types/room.interface";

export const GetRoomIcon = (type: RoomType) => {
  switch (type) {
    case RoomType.SDOUBLE:
      return <BedSingle className="h-5 w-5" />;
    case RoomType.DQUEEN:
      return <BedDouble className="h-5 w-5" />;
    case RoomType.DTRIPLE:
      return <Crown className="h-5 w-5" />;
    case RoomType.DFAMILYS:
      return <Crown className="h-5 w-5" />;
    case RoomType.DFAMILY:
      return <Hotel className="h-5 w-5" />;
    case RoomType.FJUNIOR:
      return <Hotel className="h-5 w-5" />;
    case RoomType.DTWIN:
      return <Hotel className="h-5 w-5" />;
    case RoomType.SKING:
      return <Hotel className="h-5 w-5" />;
    default:
      return <BedSingle className="h-5 w-5" />;
  }
};
