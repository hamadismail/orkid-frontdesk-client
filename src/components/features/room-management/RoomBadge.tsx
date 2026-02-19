import { Circle } from "lucide-react";
import React from "react";
import { Badge } from "../../ui/badge";
import { RoomStatus } from "../../../types/room.interface";

type RoomBadgeProps = {
  roomStatus: RoomStatus;
};

export default function RoomBadge({ roomStatus }: RoomBadgeProps) {
  const statusConfig = {
    [RoomStatus.AVAILABLE]: {
      className: "bg-green-100 text-green-800 border-green-300",
      text: "AVAILABLE",
    },
    [RoomStatus.RESERVED]: {
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      text: "RESERVED",
    },
    [RoomStatus.DUE_OUT]: {
      className: "bg-blue-100 text-blue-800 border-blue-300",
      text: "DUE OUT",
    },
    [RoomStatus.OCCUPIED]: {
      className: "bg-red-100 text-red-800 border-red-300",
      text: "OCCUPIED",
    },
    [RoomStatus.DIRTY]: {
      className: "bg-yellow-700 text-white",
      text: "DIRTY",
    },
    [RoomStatus.SERVICE]: {
      className: "bg-red-100 text-red-800 border-red-300",
      text: "OCCUPIED",
    },
  };

  const config = statusConfig[roomStatus] || {
    className: "bg-gray-100 text-gray-800",
    text: "UNKNOWN",
  };

  return (
    <Badge
      className={`flex items-center gap-1 ${config.className}`}
    >
      <Circle className="h-2 w-2 fill-current" />
      {config.text}
    </Badge>
  );
}
