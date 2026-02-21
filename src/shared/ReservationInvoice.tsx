import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import Image from "next/image";
import { CircleCheck } from "lucide-react";
import { IReservation } from "../types/reservation.interface";

interface ReservationInvoiceProps {
  bookingInfo: IReservation;
  onConfirmBooking: () => void;
  onBack: () => void;
  isPending: boolean;
}

export default function ReservationInvoice({
  bookingInfo,
  isPending,
}: ReservationInvoiceProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    // content: () => invoiceRef.current,
    contentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        @page {
          margin: 0;
          size: auto;
        }
        @page :footer { display: none; }
        @page :header { display: none; }
      }
    `,
  });

  const handleConfirmAndPrint = () => {
    handlePrint();
  };

  const calculateNights = () => {
    const diffTime = Math.abs(
      new Date(bookingInfo.stay.departure).getTime() -
        new Date(bookingInfo.stay.arrival).getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const roomPrice = bookingInfo.payment.roomPrice || 0;
    const tourismTax = bookingInfo.payment.tourismTax || 0;
    const sst = bookingInfo.payment.sst || 0;

    ////
    const advancePayment = bookingInfo.payment.paidAmount || 0;
    const discount = bookingInfo.payment.discount || 0;

    const totalRoomCharge = roomPrice * calculateNights();

    const totalAmount =
      totalRoomCharge + tourismTax + sst - (discount + advancePayment);

    return totalAmount.toFixed(2) || 0;
  };

  return (
    <div className="max-w-4xl mx-auto overflow-auto">
      <Card ref={contentRef} className="border-none shadow-none">
        <CardHeader className="text-center">
          {/* <h1 className="text-2xl font-bold">Orkid Hills</h1> */}
          <Image
            src="/img/orkidhill.png"
            alt="Orkid Hills Logo"
            width={500}
            height={200}
            className="mx-auto w-1/2"
          />
          <Separator className="my-2 w-3/4 mx-auto" />
          <div className="text-xs text-muted-foreground">
            <p>300, Jalan Pudu, Pudu, 55100, Kuala Lumpur, Malaysia</p>
            <p>Hotline: +60 173004099, +60 178988418</p>
            <p>Email: orkidhills@gmail.com</p>
          </div>
        </CardHeader>

        <CardContent>
          {/* Guest and Booking Info */}
          <div className="grid grid-cols-2 justify-items-center">
            <div>
              <h2 className="text-lg font-semibold mb-2">Guest Details</h2>
              <div className="grid grid-cols-[auto_1fr] gap-2 text-sm">
                <div className="font-medium">Reservation No. / OTA:</div>
                <div>
                  {bookingInfo.guest.refId || bookingInfo.guest.otas || "-"}
                </div>

                <div className="font-medium">Name:</div>
                <div>{bookingInfo.guest.name}</div>

                <div className="font-medium">Phone:</div>
                <div>{bookingInfo.guest.phone}</div>

                <div className="font-medium">Email:</div>
                <div>{bookingInfo.guest.email || "-"}</div>

                {/* <div className="font-medium">Nationality:</div>
                <div>{bookingInfo.guest.country || "-"}</div> */}

                <div className="font-medium">Passport:</div>
                <div>{bookingInfo.guest.passport || "-"}</div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Booking Details</h2>
              <div className="grid grid-cols-[auto_1fr] gap-2 text-sm">
                <div className="font-medium">Room No:</div>
                <div>
                  {typeof bookingInfo.roomId === "string"
                    ? bookingInfo.roomId
                    : bookingInfo.roomId?.roomNo || "-"}
                </div>

                {/* <div className="font-medium">No. of Guests:</div>
                <div>{bookingInfo.room.numOfGuest || "-"}</div> */}

                <div className="font-medium">Arrival:</div>
                <div>{format(bookingInfo.stay.arrival, "PPp")}</div>

                <div className="font-medium">Departure:</div>
                <div>{format(bookingInfo.stay.departure, "PPp")}</div>

                <div className="font-medium">Nights:</div>
                <div>{calculateNights()}</div>
              </div>
            </div>
          </div>

          {/* Invoice Title */}
          <div className="text-center mt-2 mb-4">
            <h2 className="text-lg font-bold inline-block border-b-2 pb-1 px-4">
              Reservation Voucher
            </h2>
          </div>

          {/* Charges Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-muted p-2 font-semibold">
              <div>Description</div>
              <div className="text-right">Amount (RM)</div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t text-sm">
              <div>Room Charges ({calculateNights()} nights)</div>
              <div className="text-right">
                {calculateNights() * bookingInfo.payment.roomPrice || 0} RM
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t text-sm">
              <div>SST (8%)</div>
              <div className="text-right">
                {bookingInfo.payment.sst
                  ? bookingInfo.payment.sst.toFixed(2)
                  : 0}
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t text-sm">
              <div>Tourism Tax</div>
              <div className="text-right">
                {bookingInfo.payment.tourismTax
                  ? bookingInfo.payment.tourismTax.toFixed(2)
                  : 0}
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t text-sm">
              <div>FnF Discount</div>
              <div className="text-right text-destructive">
                -
                {bookingInfo.payment.discount
                  ? bookingInfo.payment.discount.toFixed(2)
                  : 0}
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t text-sm">
              <div>Advanced Payment</div>
              <div className="text-right">
                {bookingInfo.payment.paidAmount
                  ? bookingInfo.payment.paidAmount.toFixed(2)
                  : 0}
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 border-t font-semibold">
              <div>Due Amount</div>
              <div className="text-right">RM {calculateTotal()}</div>
            </div>
          </div>

          {/* <div className="my-4 grid grid-cols-2 gap-4 p-4 border rounded-lg">

            {bookingInfo.room.roomDetails && (
              <div className="border-r">
                <h3 className="font-medium mb-1">Room Details:</h3>
                <p className="text-sm">{bookingInfo.room.roomDetails}</p>
              </div>
            )}


            {bookingInfo.room.otherGuest && (
              <div>
                <h3 className="font-medium mb-1">Other Guests:</h3>
                <p className="text-sm">{bookingInfo.room.otherGuest}</p>
              </div>
            )}
          </div> */}

          {/* Terms and Conditions */}
          <div className="border rounded-lg p-4 text-xs mt-4">
            <h4 className="font-semibold mb-2">Terms & Conditions</h4>
            <div className="font-mono">
              <p>
                <span className="font-semibold">NOTICE TO GUESTS:</span> This
                property is privately owned and the management reserves the
                right to refuse service to anyone. Management will not be
                responsible for accidents or injury to guests or for loss of
                money, jewellery or valuables of any kind. Management will not
                be responsible for any item left in the room.
              </p>
              <p className="my-1">
                <span className="font-semibold">CHECKOUT TIME:</span> 12:00 PM
                SELF REGISTRATION ONLY
              </p>
              <p className="flex flex-col gap-1">
                <span>
                  <CircleCheck className="inline-flex w-4 text-green-700" /> I
                  AGREE that my liability for this bill is not waived and agree
                  to be held personally liable in the event that the indicated
                  person or company failed to pay for any part or full amount of
                  these charges including any missing/damaged items, etc.
                </span>
                <span>
                  <CircleCheck className="inline-flex w-4 text-green-700" /> I
                  agree that if an attorney is retained to collect these
                  charges, I will pay all reasonable attorneys fees and costs
                  incurred.
                </span>
                <span>
                  <CircleCheck className="inline-flex w-4 text-green-700" /> If
                  payment is by credit card you are authorized to charge my
                  account for all charges incurred, including any and all
                  damages/missing items, etc. I agree that the sole purpose of
                  renting this room is for my own residency only.
                </span>
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t text-xs">
          <div className="text-xs text-muted-foreground">
            <p>Invoice Date: {format(new Date(), "PPpp")}</p>
            {/* <p>Thank you for your reservation!</p> */}
          </div>
          {/* <Badge variant="outline" className="px-3 py-1">
            {bookingInfo.paymentDate}
          </Badge> */}
          <p className="text-muted-foreground">
            Thank you for your reservation!
          </p>
        </CardFooter>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          onClick={handleConfirmAndPrint}
          disabled={isPending}
        >
          Print Invoice
        </Button>
      </div>
    </div>
  );
}
