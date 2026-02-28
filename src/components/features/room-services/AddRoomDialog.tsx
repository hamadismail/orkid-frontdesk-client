/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { BedSingle, BedDouble, Crown, Plus, Hotel, Loader2 } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomType } from "@/src/types/enums";
import { createRoom } from "@/src/services/room.service";

type RoomData = {
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
};

export default function AddRoomDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomNo: "",
    roomType: RoomType.DQUEEN,
    roomFloor: "1",
  });
  const queryClient = useQueryClient();

  const { mutate: createRoomMutate, isPending } = useMutation({
    mutationFn: (data: RoomData) => createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room added successfully");
      setFormData({ roomNo: "", roomType: RoomType.DQUEEN, roomFloor: "1" });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to add room", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createRoomMutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value as any,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new room to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomNo">Room Number</Label>
            <Input
              id="roomNo"
              value={formData.roomNo}
              onChange={(e) => handleChange("roomNo", e.target.value)}
              placeholder="e.g. 101"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Room Type</Label>
              <Select
                value={formData.roomType}
                onValueChange={(value: RoomType) =>
                  handleChange("roomType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RoomType).map((type) => {
                    let Icon;
                    if (type.includes("King")) Icon = Hotel;
                    else if (type.includes("Queen")) Icon = Crown;
                    else if (type.includes("Family") || type.includes("Triple")) Icon = BedDouble;
                    else if (type.includes("Twin")) Icon = BedSingle;
                    else Icon = BedSingle;

                    return (
                      <SelectItem
                        key={type}
                        value={type}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />} 
                            <span>{type}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Floor</Label>
              <Select
                value={formData.roomFloor}
                onValueChange={(value) => handleChange("roomFloor", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">M Floor</SelectItem>
                  <SelectItem value="1">1st Floor</SelectItem>
                  <SelectItem value="2">2nd Floor</SelectItem>
                  <SelectItem value="3">3rd Floor</SelectItem>
                  <SelectItem value="4">4th Floor</SelectItem>
                  <SelectItem value="5">5th Floor</SelectItem>
                  <SelectItem value="6">6th Floor</SelectItem>
                  <SelectItem value="7">7th Floor</SelectItem>
                  <SelectItem value="8">8th Floor</SelectItem>
                  <SelectItem value="9">9th Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
