"use client";
import React from "react";
import { IReservation } from "@/src/types/reservation.interface";
import { IGuest } from "@/src/types/guest.interface";
import { differenceInCalendarDays } from "date-fns";

interface GuestInvoiceProps {
  guest: any; // Can be single reservation or array
}

export const GuestInvoice = React.forwardRef<HTMLDivElement, GuestInvoiceProps>(
  ({ guest }, ref) => {
    if (!guest) return null;

    // Normalize to array
    const reservations: IReservation[] = Array.isArray(guest) ? guest : [guest];
    const mainRes = reservations[0];
    const guestData = mainRes.guestId as unknown as IGuest;

    const formatCurrency = (amount: number | undefined) => {
      if (amount === undefined) return "N/A";
      return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
      }).format(amount);
    };

    const formatDate = (date: any) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    };

    const calculateNights = (res: IReservation) => {
      if (res.stay.arrival && res.stay.departure) {
        return Math.max(1, differenceInCalendarDays(new Date(res.stay.departure), new Date(res.stay.arrival)));
      }
      return 0;
    };

    const totalSubtotal = reservations.reduce((acc, res) => acc + (res.rate?.subtotal || 0), 0);
    const totalPaid = reservations.reduce((acc, res) => acc + (res.payment?.paidAmount || 0), 0);
    const totalDue = reservations.reduce((acc, res) => acc + (res.payment?.dueAmount || 0), 0);

    return (
      <div ref={ref} className="p-8 font-mono bg-white text-black min-h-[500px]">
        <div className="flex justify-between border-b-2 pb-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold">ECO HOTEL</h1>
                <p className="text-xs italic">Professional Hospitality Services</p>
                <p className="text-[10px]">179, Jalan Pudu, Kuala Lumpur</p>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-bold uppercase tracking-widest">Guest Invoice</h2>
                <p className="text-sm">Group/Conf: {mainRes.confirmationNo}</p>
                <p className="text-[10px]">{new Date().toLocaleString()}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b">Guest Information</h3>
                <p className="font-bold text-lg">{guestData?.name}</p>
                <p className="text-sm">{guestData?.phone}</p>
                <p className="text-sm">{guestData?.email}</p>
                <p className="text-sm">{guestData?.country}</p>
            </div>
            <div className="text-right">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b">Stay Details</h3>
                <p className="text-sm">Check-in: {formatDate(mainRes.stay.arrival)}</p>
                <p className="text-sm">Check-out: {formatDate(mainRes.stay.departure)}</p>
                <p className="text-sm font-bold mt-1">Total Rooms: {reservations.length}</p>
            </div>
        </div>

        <table className="w-full mb-8 border">
            <thead>
                <tr className="bg-gray-100 text-left text-xs uppercase">
                    <th className="p-2 border-b">Description</th>
                    <th className="p-2 border-b text-center">Nights</th>
                    <th className="p-2 border-b text-right">Amount</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                {reservations.map((res, idx) => {
                    const room = res.roomId as any;
                    return (
                        <tr key={idx} className="border-b">
                            <td className="p-2">
                                <div className="font-bold text-sm">Room {room?.roomNo} - {room?.roomType}</div>
                                <div className="text-[10px] text-gray-500">Rate: {formatCurrency(res.rate.roomPrice)} / night</div>
                                <div className="text-[10px] text-gray-500">Adults: {res.stay.adults}, Children: {res.stay.children}</div>
                            </td>
                            <td className="p-2 text-center">{calculateNights(res)}</td>
                            <td className="p-2 text-right font-medium">{formatCurrency(res.rate.subtotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
                <span>Gross Total:</span>
                <span>{formatCurrency(totalSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700 font-bold">
                <span>Total Paid:</span>
                <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-lg font-black border-t-2 pt-2 text-red-600 bg-red-50 px-2">
                <span>BALANCE DUE:</span>
                <span>{formatCurrency(totalDue)}</span>
            </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-20 text-center text-[10px] uppercase font-bold">
            <div>
                <div className="border-t border-black pt-1">Guest Signature</div>
            </div>
            <div>
                <div className="border-t border-black pt-1">Hotel Representative</div>
            </div>
        </div>
      </div>
    );
  }
);

GuestInvoice.displayName = "GuestInvoice";
