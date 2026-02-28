/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import Image from "next/image";
import { IReservation } from "../types/reservation.interface";
import { IGuest } from "../types/guest.interface";
import { Printer } from "lucide-react";

interface ReservationInvoiceProps {
  bookingInfo: any; // Can be single reservation object or array of reservations
  onConfirmBooking?: () => void;
  onBack?: () => void;
  isPending?: boolean;
}

export default function ReservationInvoice({
  bookingInfo,
  isPending,
}: ReservationInvoiceProps) {
  // const contentRef = useRef<HTMLDivElement>(null);

  // const handlePrint = useReactToPrint({
  //   contentRef,
  //   pageStyle: `
  //     @page { size: A4; margin: 1cm; }
  //     @media print { body { -webkit-print-color-adjust: exact; } }
  //   `,
  // });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  if (!bookingInfo) return null;

  // Normalize data: always work with an array
  const reservations: IReservation[] = Array.isArray(bookingInfo)
    ? bookingInfo
    : bookingInfo.reservations
      ? bookingInfo.reservations
      : [bookingInfo];

  const mainRes = reservations[0];
  const guest = mainRes.guestId as unknown as IGuest;
  const group = mainRes.groupId as any;

  const calculateNights = (res: IReservation) => {
    return Math.max(
      1,
      differenceInCalendarDays(
        new Date(res.stay.departure),
        new Date(res.stay.arrival),
      ),
    );
  };

  const totalRoomCharges = reservations.reduce((acc, res) => {
    return acc + calculateNights(res) * (res.rate?.roomPrice || 0);
  }, 0);

  const totalSST = reservations.reduce(
    (acc, res) => acc + (res.rate?.sst || 0),
    0,
  );
  const totalTTax = reservations.reduce(
    (acc, res) => acc + (res.rate?.tourismTax || 0),
    0,
  );
  const totalDiscount = reservations.reduce(
    (acc, res) => acc + (res.rate?.discount || 0),
    0,
  );
  const grandTotal = reservations.reduce(
    (acc, res) => acc + (res.rate?.subtotal || 0),
    0,
  );
  const totalPaid = reservations.reduce(
    (acc, res) => acc + (res.payment?.paidAmount || 0),
    0,
  );
  const totalDue = reservations.reduce(
    (acc, res) => acc + (res.payment?.dueAmount || 0),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto overflow-auto">
      <Card ref={invoiceRef} className="border-none shadow-none">
        <CardHeader className="text-center">
          <Image
            src="/img/ecoHotel.png"
            alt="Eco Hotel Logo"
            width={500}
            height={200}
            className="mx-auto w-1/2"
          />
          <Separator className="my-2 w-3/4 mx-auto" />
          <div className="text-xs text-muted-foreground">
            <p>179, Jalan Pudu, Pudu-55100 Kuala Lumpur, Malaysia</p>
            <p>Hotline: +601116962002, 0178988418</p>
            <p>Email: ecohotel.bb@gmail.com</p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 justify-items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Guest Details</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <div className="font-medium">Group Code:</div>
                <div>{group?.groupCode || mainRes.confirmationNo}</div>
                <div className="font-medium">Ref ID:</div>
                <div className="font-bold">{mainRes.refId || "-"}</div>
                <div className="font-medium">Source:</div>
                <div className="font-bold">{mainRes.source || "-"}</div>
                <div className="font-medium">Name:</div>
                <div className="font-bold uppercase">{guest?.name}</div>
                <div className="font-medium">Phone:</div>
                <div>{guest?.phone}</div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Stay Summary</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <div className="font-medium">Arrival:</div>
                <div>{format(new Date(mainRes.stay.arrival), "PPP")}</div>
                <div className="font-medium">Departure:</div>
                <div>{format(new Date(mainRes.stay.departure), "PPP")}</div>
                <div className="font-medium">Total Rooms:</div>
                <div className="font-bold">{reservations.length}</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-2 mb-4">
            <h2 className="text-lg font-bold inline-block border-b-2 pb-1 px-4 uppercase tracking-widest">
              Reservation Voucher
            </h2>
          </div>

          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted font-semibold border-b">
                  <th className="p-2 text-left">Room / Description</th>
                  <th className="p-2 text-center">Nights</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Total (RM)</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res, idx) => {
                  // Fallback if roomId is not populated
                  const room = typeof res.roomId === 'object' ? res.roomId : null;
                  const roomNo = (room as any)?.roomNo || "-";
                  const roomType = (room as any)?.roomType || "-";
                  
                  const nights = calculateNights(res);
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-2">
                        <div className="font-bold">
                          Room {roomNo}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          ID: {res.confirmationNo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {roomType} | Adults: {res.stay.adults}, Children: {res.stay.children}
                        </div>
                      </td>
                      <td className="p-2 text-center">{nights}</td>
                      <td className="p-2 text-right">
                        {res.rate.roomPrice.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {(nights * res.rate.roomPrice).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Room Charges Total:</span>
                <span>{totalRoomCharges.toFixed(2)}</span>
              </div>
              {totalSST > 0 && (
                <div className="flex justify-between">
                  <span>Total SST:</span>
                  <span>{totalSST.toFixed(2)}</span>
                </div>
              )}
              {totalTTax > 0 && (
                <div className="flex justify-between">
                  <span>Total Tourism Tax:</span>
                  <span>{totalTTax.toFixed(2)}</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discount:</span>
                  <span>-{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total:</span>
                <span>RM {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid:</span>
                <span>RM {totalPaid.toFixed(2)}</span>
              </div>
              <Separator className="h-1 bg-black" />
              <div className="flex justify-between font-black text-lg text-destructive">
                <span>Balance Due:</span>
                <span>RM {totalDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 text-[10px] mt-8 bg-muted/10">
            <h4 className="font-bold mb-2 uppercase border-b w-fit">
              Terms & Conditions
            </h4>
            <div className="grid grid-cols-1 gap-1 font-mono leading-tight">
              <p>
                • CHECK-OUT TIME: 12:00 PM. Late check-out is subject to room
                availability and extra charges.
              </p>
              <p>• All guests must present a valid ID/Passport upon arrival.</p>
              <p>• Smoking is strictly prohibited inside the rooms.</p>
              <p>
                • Any damage to hotel property will be charged to the guest.
              </p>
              <p>
                • I AGREE that my liability for this bill is not waived and I
                agree to be held personally liable in the event that the
                indicated person, company or association fails to pay for any
                part or full amount of these charges.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t mt-4 pt-4 text-[10px] text-muted-foreground">
          <p>Printed Date: {format(new Date(), "PPpp")}</p>
          <p>Thank you for choosing Eco Hotel!</p>
        </CardFooter>
      </Card>

      <div className="flex justify-end gap-4 mt-6 print:hidden">
        <Button onClick={handlePrint} disabled={isPending} className="min-w-36">
          <Printer className="mr-2 h-4 w-4" /> Print Voucher
        </Button>
      </div>
    </div>
  );
}
