import { BedDouble, BedSingle, Crown, Hotel } from "lucide-react";
import { RoomType } from "../types/enums";

export const GetRoomIcon = (type: RoomType) => {
  switch (type) {
    case RoomType.SQUEEN:
      return <Crown className="h-5 w-5" />;
    case RoomType.DQUEEN:
      return <Crown className="h-5 w-5" />;
    case RoomType.DFAMILLY:
      return <BedDouble className="h-5 w-5" />;
    case RoomType.DTRIPPLE:
      return <Hotel className="h-5 w-5" />;
    case RoomType.SFAMILLY:
      return <Hotel className="h-5 w-5" />;
    case RoomType.DTWIN:
      return <BedSingle className="h-5 w-5" />;
    default:
      return <BedSingle className="h-5 w-5" />;
  }
};
