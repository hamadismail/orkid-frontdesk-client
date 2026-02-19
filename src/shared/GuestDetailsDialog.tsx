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
import { IBook } from "../types/book.interface";
import { IReservation } from "../types/reservation.interface";

import AmendStay from "../components/features/room-services/AmendStay";
import MoveReservationRoom from "../components/features/room-services/MoveReservationRoom";
import CancelReservationButton from "../components/features/room-services/CancelReservationButton";
import StayOver from "../components/features/room-services/StayOver";
import MoveRoom from "../components/features/room-services/MoveRoom";
import { IRoom } from "../types/room.interface";

interface GuestDetailsDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  selectedGuest: IBook | IReservation | null;
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
    {amount ? (
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

  const { guest } = selectedGuest;
  const hasStayInfo = "stay" in selectedGuest;
  const hasPaymentInfo = "payment" in selectedGuest;
  const payment = hasPaymentInfo ? selectedGuest.payment : null;

  const getCountry = () =>
    "country" in guest ? guest.country : guest.nationality;
  const getOta = () => ("otas" in guest ? guest.otas : guest.ota);
  const getRefId = () => ("refId" in guest ? guest.refId : guest.reservationNo);
  const getArrivalDate = () =>
    hasStayInfo ? selectedGuest.stay.arrival : selectedGuest.room.arrival;
  const getDepartureDate = () =>
    hasStayInfo ? selectedGuest.stay.departure : selectedGuest.room.departure;
  const getAdults = () =>
    hasStayInfo ? selectedGuest.stay.adults : selectedGuest.room.numOfGuest;
  const getRoomNumber = () => {
    if ("roomId" in selectedGuest && selectedGuest.roomId) {
      return (selectedGuest.roomId as { roomNo: string }).roomNo;
    }
    return "room" in selectedGuest ? selectedGuest.room.roomNo : "N/A";
  };
  const getRoomType = () => {
    if ("roomId" in selectedGuest && selectedGuest.roomId) {
      return (selectedGuest.roomId as { roomType: string }).roomType;
    }
    return "room" in selectedGuest ? selectedGuest.room.roomType : "N/A";
  };

  const guestNameInitial = guest.name
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
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${guest.name}`}
                alt={guest.name}
              />
              <AvatarFallback>{guestNameInitial}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {guest.name}
              </DialogTitle>
              <p className="text-base text-muted-foreground">
                {getRoomNumber() !== "N/A"
                  ? `Staying in Room ${getRoomNumber()} - ${getRoomType()}`
                  : "Reservation Details"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 px-6 pb-6 overflow-y-auto flex-1">
          {/* Left Column - Personal & Stay Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pl-7">
                <DetailItem icon={Mail} label="Email" value={guest.email} />
                <DetailItem icon={Phone} label="Phone" value={guest.phone} />
                <DetailItem icon={Globe} label="Country" value={getCountry()} />
                <DetailItem
                  icon={Fingerprint}
                  label="Passport"
                  value={guest.passport}
                />
                <DetailItem icon={Plane} label="OTA" value={getOta()} />

                <DetailItem
                  icon={Hash}
                  label="Reference ID"
                  value={getRefId()}
                />
              </div>
            </div>

            <Separator />

            {/* Stay Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Stay Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pl-7">
                <DetailItem
                  icon={CalendarDays}
                  label="Arrival"
                  value={format(new Date(getArrivalDate()), "PPP")}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Departure"
                  value={format(new Date(getDepartureDate()), "PPP")}
                />
                <DetailItem icon={Users} label="Adults" value={getAdults()} />
                {hasStayInfo && (
                  <DetailItem
                    icon={Users}
                    label="Children"
                    value={selectedGuest.stay.children}
                  />
                )}
                <DetailItem
                  icon={BedDouble}
                  label="Room"
                  value={getRoomNumber()}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Payment & Remarks */}
          <div className="space-y-6">
            {/* Payment Information */}
            {payment && "roomPrice" in payment && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Details
                </h3>
                <div className="space-y-1 rounded-lg border bg-card text-card-foreground shadow-sm p-2">
                  <PaymentRow label="Room Price" amount={payment.roomPrice} />
                  {/* <PaymentRow label="SST" amount={payment.sst} />
                  <PaymentRow label="Tourism Tax" amount={payment.tourismTax} /> */}
                  <Separator />
                  <PaymentRow
                    label="Discount"
                    amount={payment.discount}
                    className="text-destructive"
                  />
                  <PaymentRow
                    label="Subtotal"
                    amount={payment.subtotal}
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
                  <PaymentRow
                    label="Deposit"
                    amount={payment.deposit}
                    className="text-blue-600"
                  />
                  <Separator />
                  <PaymentRow
                    label="Payment Method"
                    value={payment.paymentMethod}
                  />
                </div>
              </div>
            )}

            {/* Remarks */}
            {payment && "remarks" in payment && payment.remarks && (
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
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 bg-muted/40 border-t">
          <div className="flex w-full gap-2">
            {"isCheckOut" in selectedGuest && !selectedGuest.isCheckOut && (
              <>
                <StayOver
                  room={selectedGuest?.roomId as IRoom}
                  onClose={() => setIsDialogOpen(false)}
                />
                <MoveRoom
                  room={selectedGuest?.roomId as IRoom}
                  onClose={() => setIsDialogOpen(false)}
                />
              </>
            )}
            {"reservationDate" in selectedGuest && (
              <>
                <AmendStay
                  reservation={selectedGuest as IReservation}
                  onClose={() => setIsDialogOpen(false)}
                />
                <MoveReservationRoom
                  reservation={selectedGuest as IReservation}
                  onClose={() => setIsDialogOpen(false)}
                />
                <CancelReservationButton
                  reservationId={selectedGuest._id!}
                  onClose={() => setIsDialogOpen(false)}
                />
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <DialogDescription className="sr-only">
        Guest Details Dialog
      </DialogDescription>
    </Dialog>
  );
}
