"use client";
import React from "react";
import { IBook } from "@/src/types/book.interface";
// import Image from "next/image";

interface GuestInvoiceProps {
  guest: IBook;
}

export const GuestInvoice = React.forwardRef<HTMLDivElement, GuestInvoiceProps>(
  ({ guest }, ref) => {
    if (!guest) {
      return null;
    }

    // Format currency
    const formatCurrency = (amount: number | undefined) => {
      if (!amount && amount !== 0) return "N/A";
      return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-MY", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
    };

    const calculateNights = () => {
      if (guest.stay.arrival && guest.stay.departure) {
        const diffTime = Math.abs(
          new Date(guest.stay.departure).getTime() -
            new Date(guest.stay.arrival).getTime(),
        );
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      }
      return 0;
    };

    const invoiceNumber = guest?._id?.toUpperCase() || "N/A";
    const issueDate = new Date();
    const subtotal = guest.payment.subtotal || 0;
    const discount = guest.payment.discount || 0;
    const deposit = guest.payment.deposit || 0;
    const paidAmount = guest.payment.paidAmount || 0;
    const dueAmount = guest.payment.dueAmount || 0;
    const grandTotal = subtotal - discount;

    return (
      <div ref={ref} className="print-container bg-white text-gray-900">
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
              background: white;
            }
            .print-container {
              margin: 0;
              padding: 0;
              width: 210mm;
              min-height: 297mm;
              background: white;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @page :first {
              margin-top: 0;
            }
            .no-print {
              display: none !important;
            }
          }

          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 2rem auto;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
              overflow: hidden;
            }
          }
        `}</style>

        {/* Invoice Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            {/* Company Info with Logo */}
            {/* <Image
              src="/img/ecoHotel.png"
              alt="Orkid Hills Hotel Logo"
              width={500}
              height={200}
              className="mx-auto w-1/2"
            /> */}
            <div>
              <div className="mb-4">
                {/* Replace with your actual logo */}
                <div className="w-48 h-12 bg-linear-to-r from-green-600 to-emerald-700 rounded flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-xl">
                    ORKID HILLS
                  </span>
                </div>
                <p className="text-emerald-700 font-medium">
                  Luxury Eco-Friendly Stays
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p>300, Jalan Pudu</p>
                <p>Pudu, 55100, Kuala Lumpur</p>
                <p>Malaysia</p>
                <p className="mt-1">Phone: +60 173004099, +60 178988418</p>
                <p>Email: orkidhills@gmail.com</p>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-right">
              <h1 className="text-4xl font-bold text-emerald-800 mb-2">
                INVOICE
              </h1>
              <div className="inline-block bg-emerald-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Invoice #</p>
                <p className="text-xl font-bold text-emerald-700">
                  {invoiceNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="p-8 grid grid-cols-2 gap-8 border-b border-gray-200">
          {/* Billed To */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Billed To
            </h2>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {guest.guest.name}
              </p>
              {guest.guest.country && (
                <p className="text-gray-600">{guest.guest.country}</p>
              )}
              {guest.guest.phone && (
                <p className="text-gray-600">{guest.guest.phone}</p>
              )}
              {guest.guest.passport && (
                <p className="text-gray-600">
                  <span className="font-medium">Passport:</span>{" "}
                  {guest.guest.passport}
                </p>
              )}
              {guest.guest.refId && (
                <p className="text-gray-600">
                  <span className="font-medium">Ref ID:</span>{" "}
                  {guest.guest.refId}
                </p>
              )}
              {guest.guest.otas && (
                <p className="text-gray-600">
                  <span className="font-medium">OTA:</span> {guest.guest.otas}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Invoice Details
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Issue:</span>
                <span className="font-semibold">{formatDate(issueDate)}</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-mono font-semibold">
                  {guest._id?.toUpperCase() || "N/A"}
                </span>
              </div> */}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">
                  {guest.payment.paymentMethod || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrival:</span>
                <span className="font-semibold">
                  {formatDate(new Date(guest.stay.arrival))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Departure:</span>
                <span className="font-semibold">
                  {formatDate(new Date(guest.stay.departure))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remarks:</span>
                <span className="font-semibold">
                  {guest.payment.remarks || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="text-left p-4 font-semibold text-gray-700 uppercase text-sm">
                    Description
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700 uppercase text-sm">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Room Charge */}
                <tr>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">Room Accommodation:</p>

                      <p className="text-sm text-gray-600">
                        {typeof guest?.roomId === "object" &&
                        "roomType" in guest?.roomId
                          ? guest.roomId.roomType
                          : "Standard Room"}{" "}
                        {!guest.isCheckOut &&
                          `• Check-in: ${formatDate(
                            new Date(guest.createdAt || new Date()),
                          )}`}{" "}
                        {guest.isCheckOut &&
                          `• Check-out: ${formatDate(
                            new Date(guest.updatedAt || new Date()),
                          )}`}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(guest.payment.roomPrice)}
                  </td>
                </tr>

                {/* Discount if applicable */}
                {discount > 0 && (
                  <tr>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">Discount</p>
                        <p className="text-sm text-green-600">
                          Special offer applied
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-green-600">
                      -{formatCurrency(discount)}
                    </td>
                  </tr>
                )}

                {/* Deposit if applicable */}
                {deposit > 0 && (
                  <tr>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">Advance Deposit</p>
                        <p className="text-sm text-gray-600">
                          Received on{" "}
                          {formatDate(new Date(guest.updatedAt || new Date()))}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-blue-600">
                      -{formatCurrency(deposit)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 ml-auto max-w-md">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({calculateNights()} nights):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-3">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-3">
                <span>Total Paid</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>

              {/* {deposit > 0 && (
                <div className="flex justify-between text-blue-600 border-t border-gray-300 pt-3">
                  <span>Less: Deposit Paid</span>
                  <span>-{formatCurrency(deposit)}</span>
                </div>
              )} */}

              <div className="flex justify-between text-2xl font-bold border-t-2 border-emerald-500 pt-4 text-emerald-700">
                <span>Amount Due</span>
                <span>{formatCurrency(dueAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="p-8 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Payment Instructions
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Bank Transfer: Maybank 5140-1234-5678</p>
                <p>• Payable to: Orkid Hills Hotel Sdn Bhd</p>
                <p>• Please include invoice number with payment</p>
                <p>• Payment due within 14 days</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Contact Information
              </h3>
              <div className="text-sm text-gray-600">
                <p>📞 +60 3-1234 5678</p>
                <p>📧 accounting@ecohotel.com</p>
                <p>🌐 www.ecohotel.com</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-emerald-700 font-semibold mb-2">
              Thank you for choosing Orkid Hills Hotel!
            </p>
            <p className="text-sm text-gray-600">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div> */}
      </div>
    );
  },
);

GuestInvoice.displayName = "GuestInvoice";
