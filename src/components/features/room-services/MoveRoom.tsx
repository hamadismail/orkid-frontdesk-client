import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Combobox } from "@/src/components/ui/combobox";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2,
  MoveRight,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { IRoom, RoomStatus } from "@/src/types/room.interface";
import { cn } from "@/src/lib/utils";

type MoveRoomProps = {
  room: IRoom;
  onClose: () => void;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
};

export default function MoveRoom({
  room,
  onClose,
  size = "sm",
  variant = "default",
  className,
}: MoveRoomProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  // const [searchQuery, setSearchQuery] = useState("");

  const { data: availableRooms, isLoading } = useQuery<IRoom[]>({
    queryKey: ["available-rooms", room._id],
    queryFn: async () => {
      const { data } = await axios.get<{ data: IRoom[] }>("/rooms");
      return data?.data?.filter(
        (r: IRoom) =>
          r.roomStatus === RoomStatus.AVAILABLE && r._id !== room._id
      );
    },
    enabled: open,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { mutate: moveRoom, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedRoom) {
        throw new Error("Please select a room to move to");
      }

      const { data } = await axios.post("/book/move", {
        currentRoomId: room._id,
        guestId: room.guestId,
        newRoomId: selectedRoom,
        timestamp: new Date().toISOString(),
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["available-rooms"] });

      toast.success("Room moved successfully", {
        description: `Guest moved from ${room.roomNo} to ${selectedRoomNumber}`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });

      setOpen(false);
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error("Move failed", {
        description: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error.message,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    },
  });

  // Filter rooms based on search query
  // const filteredRooms = availableRooms?.filter(
  //   (room) =>
  //     room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     room.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     room.roomFloor.toString().includes(searchQuery)
  // );

  const roomOptions =
    availableRooms?.map((room) => ({
      value: room._id!.toString(),
      label: `${room.roomNo}`,
      description: `${room.roomType} • Floor ${room.roomFloor}`,
      meta: {
        type: room.roomType,
        floor: room.roomFloor,
        // capacity: room.maxCapacity,
      },
    })) || [];

  const selectedRoomNumber = availableRooms?.find(
    (r) => r._id?.toString() === selectedRoom
  )?.roomNo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      toast.error("Selection required", {
        description: "Please select a room to move to",
      });
      return;
    }
    moveRoom();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className={cn("gap-2", className)}
        >
          <MoveRight className="h-4 w-4" />
          Move Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MoveRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Move Guest
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Transfer from Room {room.roomNo} to another available room
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {/* Current Room Info */}
          <Card className="border-dashed">
            <CardContent className="px-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    Moving from
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {room.roomNo}
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {room.roomType}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Floor {room.roomFloor}
                    </div>
                  </div>
                </div>
                <MoveRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Room Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Select destination room
              </label>
              {availableRooms && (
                <span className="text-xs text-muted-foreground">
                  {availableRooms.length} available
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Loading available rooms...
                  </p>
                </div>
              </div>
            ) : !availableRooms?.length ? (
              <div className="text-center py-8 space-y-2">
                <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <p className="font-medium">No rooms available</p>
                  <p className="text-sm text-muted-foreground">
                    All rooms are currently occupied or reserved
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Combobox
                  options={roomOptions}
                  value={selectedRoom || ""}
                  onChange={setSelectedRoom}
                  // onSearchChange={setSearchQuery}
                  placeholder="Search rooms by number, type, or floor..."
                  // searchIcon={<Search className="h-4 w-4" />}
                  // emptyMessage="No matching rooms found"
                  // renderOption={(option) => (
                  //   <div className="flex items-center justify-between w-full">
                  //     <div>
                  //       <div className="font-medium">{option.label}</div>
                  //       <div className="text-xs text-muted-foreground">
                  //         {option.description}
                  //       </div>
                  //     </div>
                  //     <Badge variant="outline" className="text-xs">
                  //       Max {option.meta.capacity}
                  //     </Badge>
                  //   </div>
                  // )}
                />

                {/* Selected Room Preview */}
                {selectedRoom && (
                  <Card className="mt-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-green-700 dark:text-green-300">
                            Selected Room
                          </div>
                          <div className="text-lg font-semibold">
                            Room {selectedRoomNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {
                              roomOptions.find(
                                (opt) => opt.value === selectedRoom
                              )?.description
                            }
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isPending || !selectedRoom}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MoveRight className="h-4 w-4" />
                  Move Guest
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      <DialogDescription className="sr-only">Move Room</DialogDescription>
    </Dialog>
  );
}
