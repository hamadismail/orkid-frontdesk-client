/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  User,
  Briefcase,
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
  Clock,
  MapPin,
  CreditCard,
  History,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { IReservation } from "../types/reservation.interface";
import { IGuest } from "../types/guest.interface";
import { IRoom } from "../types/room.interface";
import { RESERVATION_STATUS } from "../types/enums";

import AmendStay from "../components/features/room-services/AmendStay";
import CancelReservationButton from "../components/features/room-services/CancelReservationButton";
import StayOver from "../components/features/room-services/StayOver";
import MoveRoom from "../components/features/room-services/MoveRoom";
import CheckOut from "../components/features/room-services/CheckOut";
import { cn } from "../lib/utils";

interface GuestDetailsDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  selectedGuest: IReservation | null;
  groupReservations?: IReservation[];
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: any;
  label: string;
  value: any;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-3 py-2 px-1", className)}>
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground truncate">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

const PaymentItem = ({
  label,
  amount,
  isTotal = false,
  isNegative = false,
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
  isNegative?: boolean;
}) => (
  <div
    className={cn(
      "flex justify-between items-center py-2 px-1",
      isTotal && "bg-primary/5 rounded-md px-2 mt-2 border border-primary/10",
    )}
  >
    <span
      className={cn(
        "text-sm",
        isTotal ? "font-semibold text-primary" : "text-muted-foreground",
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        "font-mono font-semibold text-sm",
        isTotal ? "text-primary text-base" : "text-foreground",
        isNegative && "text-destructive",
      )}
    >
      {isNegative ? "-" : ""}RM {Math.abs(amount).toFixed(2)}
    </span>
  </div>
);

const getStatusBadge = (status: RESERVATION_STATUS) => {
  switch (status) {
    case RESERVATION_STATUS.CHECKED_IN:
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Checked In</Badge>
      );
    case RESERVATION_STATUS.CONFIRMED:
    case RESERVATION_STATUS.RESERVED:
      return <Badge className="bg-blue-500 hover:bg-blue-600">Reserved</Badge>;
    case RESERVATION_STATUS.CHECKED_OUT:
      return <Badge variant="secondary">Checked Out</Badge>;
    case RESERVATION_STATUS.NO_SHOW:
      return (
        <Badge className="bg-purple-300 hover:bg-purple-400" variant="outline">
          No Show
        </Badge>
      );
    case RESERVATION_STATUS.CANCELLED:
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function GuestDetailsDialog({
  isDialogOpen,
  setIsDialogOpen,
  selectedGuest,
  groupReservations,
}: GuestDetailsDialogProps) {
  if (!selectedGuest) return null;

  const guest = selectedGuest.guestId as unknown as IGuest;
  const group = selectedGuest.groupId as any;
  const { stay, status } = selectedGuest;
  const payment = group?.payment || { paidAmount: 0, dueAmount: 0, deposit: 0 };
  const room = selectedGuest.roomId as unknown as IRoom;
  const isProfileOnly = (status as any) === "PROFILE";

  const calculateNights = (reservation: IReservation) => {
    const arrival = new Date(reservation.stay.arrival);
    const departure = new Date(reservation.stay.departure);
    const timeDiff = departure.getTime() - arrival.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const nights = calculateNights(selectedGuest);
  const roomPrice = selectedGuest.rate?.roomPrice || 0;
  const subTotal = selectedGuest.rate?.subtotal || 0;
  const sstAmount = selectedGuest.rate?.sst || 0;
  const tourismTaxAmount = selectedGuest.rate?.tourismTax || 0;
  const totalRoomCharges = roomPrice * nights;
  const discountAmount = totalRoomCharges - subTotal;
  // const discountAmount =
  //   (selectedGuest.rate?.discount || 0) + totalRoomCharges - subTotal;
  const grandTotal = totalRoomCharges + sstAmount + tourismTaxAmount;

  const guestNameInitial = guest?.name
    ? guest.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "G";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="min-w-4xl p-0 overflow-hidden bg-background border-none shadow-2xl h-[95vh] flex flex-col">
        {/* Modern Header Section */}
        <div className="relative h-24 bg-primary/5 shrink-0 overflow-hidden border-b">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User size={80} />
          </div>
          <div className="absolute bottom-2 left-8">
            <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${guest?.name}&backgroundColor=00a1ff`}
              />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {guestNameInitial}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute bottom-4 left-36 flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {guest?.name}
              </DialogTitle>
              {getStatusBadge(status as RESERVATION_STATUS)}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              {room?.roomNo && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  <BedDouble size={14} /> Room {room.roomNo} • {room.roomType}
                </span>
              )}
              {isProfileOnly && (
                <span className="flex items-center gap-1.5">
                  <User size={14} /> Profile Record
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs Area */}
        <div className="flex-1 overflow-hidden px-6">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 shrink-0">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info size={16} /> Overview
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Fingerprint size={16} /> Identity
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard size={16} /> Billing
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stay Card */}
                  <Card className="border-none shadow-sm bg-muted/30">
                    <CardContent>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={14} /> Stay Timeline
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <DetailRow
                            icon={CalendarDays}
                            label="Check-In"
                            value={
                              stay.arrival
                                ? format(new Date(stay.arrival), "PPPP")
                                : "N/A"
                            }
                          />
                        </div>
                        <DetailRow
                          icon={CalendarDays}
                          label="Check-Out"
                          value={
                            stay.departure
                              ? format(new Date(stay.departure), "PPPP")
                              : "N/A"
                          }
                        />
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-4">
                          <DetailRow
                            icon={Users}
                            label="Occupants"
                            value={`${stay.adults} Adults, ${stay.children} Childs`}
                          />
                          <DetailRow
                            icon={Plane}
                            label="Booking Source"
                            value={selectedGuest.source || "N/A"}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Overview */}
                  <Card className="border-none shadow-sm bg-muted/30">
                    <CardContent>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Phone size={14} /> Primary Contact
                      </h4>
                      <div className="space-y-2">
                        <DetailRow
                          icon={Mail}
                          label="Email Address"
                          value={guest?.email}
                        />
                        <DetailRow
                          icon={Phone}
                          label="Phone Number"
                          value={guest?.phone}
                        />
                        <DetailRow
                          icon={Globe}
                          label="Country of Residence"
                          value={guest?.country}
                        />
                        <DetailRow
                          icon={MapPin}
                          label="Reference ID"
                          value={selectedGuest.refId}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-sm bg-primary/5">
                  <CardContent>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MessageSquare size={14} /> Internal Remarks
                    </h4>
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      {selectedGuest.remarks ||
                        "No special instructions or remarks provided for this guest."}
                    </p>
                  </CardContent>
                </Card>

                {groupReservations && groupReservations.length > 1 && (
                  <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent>
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BedDouble size={14} /> Linked Rooms (Group Booking)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groupReservations.map((res) => {
                          const isCurrent = res._id === selectedGuest._id;
                          const r = res.roomId as any;
                          return (
                            <div
                              key={res._id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg border text-xs",
                                isCurrent
                                  ? "bg-blue-100 border-blue-200"
                                  : "bg-white border-gray-100",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  Room {r?.roomNo}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  {r?.roomType}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4"
                              >
                                {res.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <Card className="border-none shadow-sm bg-muted/30">
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-4 border-b pb-2">
                            Guest Identity
                          </h4>
                          <div className="space-y-4">
                            <DetailRow
                              icon={Fingerprint}
                              label="Passport / IC Number"
                              value={guest?.passport}
                            />
                            <DetailRow
                              icon={User}
                              label="Full Legal Name"
                              value={guest?.name}
                            />
                            <DetailRow
                              icon={Globe}
                              label="Nationality"
                              value={guest?.country}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-4 border-b pb-2">
                            Technical Reference
                          </h4>
                          <div className="space-y-4">
                            <DetailRow
                              icon={Hash}
                              label="System Reservation ID"
                              value={selectedGuest._id}
                            />
                            <DetailRow
                              icon={Plane}
                              label="External Reference"
                              value={selectedGuest.refId || "N/A"}
                            />
                            <DetailRow
                              icon={Briefcase}
                              label="Guest Segment"
                              value={selectedGuest.source}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm bg-muted/30">
                    <CardContent>
                      <h4 className="text-sm font-bold text-foreground mb-4 border-b pb-2">
                        Financial Breakdown
                      </h4>
                      <div className="space-y-1">
                        <PaymentItem
                          label={`Room Charges (${nights} night${nights > 1 ? "s" : ""} x ${roomPrice})`}
                          amount={totalRoomCharges}
                        />
                        {(sstAmount || tourismTaxAmount) > 0 && (
                          <>
                            <PaymentItem
                              label="Tax & Service Charges"
                              amount={
                                (sstAmount || 0) + (tourismTaxAmount || 0)
                              }
                            />
                            <PaymentItem
                              label="Gross Charges"
                              amount={grandTotal}
                            />
                          </>
                        )}
                        <PaymentItem
                          label="Discounts & Adjustments"
                          amount={discountAmount}
                        />
                        <Separator className="my-2" />
                        <PaymentItem
                          label="Total Reservation Cost"
                          amount={subTotal}
                          isTotal
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-muted/30">
                    <CardContent>
                      <h4 className="text-sm font-bold text-foreground mb-4 border-b pb-2">
                        Transaction History
                      </h4>
                      <div className="space-y-1">
                        <PaymentItem
                          label="Amount Paid to Date"
                          amount={payment.paidAmount || 0}
                        />
                        {(payment.deposit ?? 0) > 0 && (
                          <PaymentItem
                            label="Security Deposit Held"
                            amount={payment.deposit || 0}
                          />
                        )}
                        <PaymentItem
                          label="Outstanding Balance"
                          amount={payment.dueAmount || 0}
                          isNegative={payment.dueAmount > 0}
                        />
                        <Separator className="my-2" />
                        <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-muted-foreground uppercase">
                          <CreditCard size={14} /> Method:{" "}
                          {payment.paymentMethod || "N/A"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Improved Actions Footer */}
        <DialogFooter className="p-6 shrink-0 bg-muted/50 border-t flex flex-row sm:justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
              Actions based on status: {status}
            </span>
          </div>
          <div className="flex gap-2">
            {!isProfileOnly && (
              <div className="flex gap-2">
                {status === RESERVATION_STATUS.CHECKED_IN ? (
                  <>
                    <StayOver
                      reservation={selectedGuest}
                      groupReservations={groupReservations}
                      onClose={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/5"
                    />
                    <MoveRoom
                      reservationId={selectedGuest._id!.toString()}
                      currentRoom={room as any}
                      onClose={() => setIsDialogOpen(false)}
                      variant="outline"
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
                      reservationId={selectedGuest._id!.toString()}
                      currentRoom={room as any}
                      onClose={() => setIsDialogOpen(false)}
                      variant="outline"
                    />
                    <CancelReservationButton
                      reservationId={selectedGuest._id!.toString()}
                      onClose={() => setIsDialogOpen(false)}
                    />
                  </>
                ) : null}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <DialogDescription className="sr-only">
        Detailed overview of guest profile, stay history and billing.
      </DialogDescription>
    </Dialog>
  );
}
