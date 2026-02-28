/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  User,
  Briefcase,
  DollarSign,
  MessageSquare,
  BedDouble,
  CalendarDays,
  Users,
  Hash,
  Mail,
  Phone,
  Globe,
  Fingerprint,
  Plane,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { IReservation } from "../types/reservation.interface";
import { IGuest } from "../types/guest.interface";
import { IRoom } from "../types/room.interface";
import { RESERVATION_STATUS } from "../types/enums";

import AmendStay from "../components/features/room-services/AmendStay";
import CancelReservationButton from "../components/features/room-services/CancelReservationButton";
import StayOver from "../components/features/room-services/StayOver";
import MoveRoom from "../components/features/room-services/MoveRoom";
import CheckOut from "../components/features/room-services/CheckOut";

interface GuestDetailsDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  selectedGuest: IReservation | null;
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

const DetailItem = ({ icon: Icon, label, value }: DetailItemProps) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground text-base font-mono">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

const PaymentRow = ({
  label,
  value,
  amount,
  className = "",
  isTotal = false,
}: {
  label: string;
  value?: string;
  amount?: number;
  className?: string;
  isTotal?: boolean;
}) => (
  <div
    className={`flex justify-between items-center py-2.5 px-3 rounded-md ${
      isTotal ? "bg-muted" : ""
    } ${className}`}
  >
    <span className="text-sm text-muted-foreground">{label}</span>
    {amount !== undefined ? (
      <span
        className={`font-semibold text-base ${
          isTotal ? "text-primary" : "text-foreground"
        }`}
      >
        RM {amount.toFixed(2)}
      </span>
    ) : (
      <span className="font-semibold text-base text-foreground">
        {value || "0"}
      </span>
    )}
  </div>
);

export function GuestDetailsDialog({
  isDialogOpen,
  setIsDialogOpen,
  selectedGuest,
}: GuestDetailsDialogProps) {
  if (!selectedGuest) return null;

  const guest = selectedGuest.guestId as unknown as IGuest;
  const { stay, payment, status } = selectedGuest;
  const room = selectedGuest.roomId as unknown as IRoom;
  const isProfileOnly = (status as string) === "PROFILE";

  const guestNameInitial = guest?.name
    ? guest.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "G";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="min-w-4xl p-0 max-h-[95vh] flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${guest?.name}`}
                alt={guest?.name}
              />
              <AvatarFallback>{guestNameInitial}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {guest?.name}
              </DialogTitle>
              <p className="text-base text-muted-foreground">
                {room?.roomNo
                  ? `Room ${room.roomNo} - ${room.roomType}`
                  : isProfileOnly
                    ? "Guest Profile"
                    : "No room assigned"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 px-6 pb-6 overflow-y-auto flex-1">
          {/* Left Column - Personal & Stay Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pl-7">
                <DetailItem icon={Mail} label="Email" value={guest?.email} />
                <DetailItem icon={Phone} label="Phone" value={guest?.phone} />
                <DetailItem
                  icon={Globe}
                  label="Country"
                  value={guest?.country || "N/A"}
                />
                <DetailItem
                  icon={Fingerprint}
                  label="Passport/IC"
                  value={guest?.passport}
                />
                <DetailItem
                  icon={Plane}
                  label="Source"
                  value={selectedGuest.source || "N/A"}
                />

                <DetailItem
                  icon={Hash}
                  label="Confirmation No"
                  value={selectedGuest.confirmationNo}
                />
              </div>
            </div>

            {!isProfileOnly && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Stay Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pl-7">
                    <DetailItem
                      icon={CalendarDays}
                      label="Arrival"
                      value={
                        stay.arrival
                          ? format(new Date(stay.arrival), "PPP")
                          : "N/A"
                      }
                    />
                    <DetailItem
                      icon={CalendarDays}
                      label="Departure"
                      value={
                        stay.departure
                          ? format(new Date(stay.departure), "PPP")
                          : "N/A"
                      }
                    />
                    <DetailItem
                      icon={Users}
                      label="Adults"
                      value={stay.adults || 0}
                    />
                    <DetailItem
                      icon={Users}
                      label="Children"
                      value={stay.children || 0}
                    />
                    <DetailItem
                      icon={BedDouble}
                      label="Status"
                      value={status}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Payment & Remarks */}
          {!isProfileOnly && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Details
                </h3>
                <div className="space-y-1 rounded-lg border bg-card text-card-foreground shadow-sm p-2">
                  <PaymentRow
                    label="Room Price"
                    amount={selectedGuest.rate?.roomPrice}
                  />
                  <Separator />
                  <PaymentRow
                    label="Subtotal"
                    amount={selectedGuest.rate?.subtotal}
                    isTotal
                  />
                  <Separator />
                  <PaymentRow
                    label="Paid Amount"
                    amount={payment.paidAmount}
                    className="text-green-600"
                  />
                  <PaymentRow
                    label="Due Amount"
                    amount={payment.dueAmount}
                    className="text-red-600 font-bold"
                  />
                  {payment.deposit ? (
                    <PaymentRow
                      label="Deposit Amount"
                      amount={payment.deposit}
                      className="text-red-600"
                    />
                  ) : (
                    ""
                  )}
                  <Separator />
                  <PaymentRow
                    label="Payment Method"
                    value={payment.paymentMethod}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Remarks
                </h3>
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  <p className="leading-relaxed">
                    {payment.remarks || "No remarks provided."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 bg-muted/40 border-t">
          <div className="flex w-full gap-2">
            {!isProfileOnly && (
              <>
                {status === RESERVATION_STATUS.CHECKED_IN ? (
                  <>
                    <StayOver
                      reservation={selectedGuest}
                      onClose={() => setIsDialogOpen(false)}
                    />
                    <MoveRoom
                      reservationId={selectedGuest._id!}
                      currentRoom={room as any}
                      onClose={() => setIsDialogOpen(false)}
                    />
                    <CheckOut
                      reservation={selectedGuest}
                      onClose={() => setIsDialogOpen(false)}
                    />
                  </>
                ) : status === RESERVATION_STATUS.CONFIRMED ||
                  status === RESERVATION_STATUS.RESERVED ? (
                  <>
                    <AmendStay
                      reservation={selectedGuest}
                      onClose={() => setIsDialogOpen(false)}
                    />
                    <MoveRoom
                      reservationId={selectedGuest._id!}
                      currentRoom={room as any}
                      onClose={() => setIsDialogOpen(false)}
                    />
                    <CancelReservationButton
                      reservationId={selectedGuest._id!}
                      onClose={() => setIsDialogOpen(false)}
                    />
                  </>
                ) : null}
              </>
            )}
          </div>

          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogDescription className="sr-only">Guest Details</DialogDescription>
    </Dialog>
  );
}
