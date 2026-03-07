/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "../components/ui/button";
import { useReactToPrint } from "react-to-print";
import { useEffect, useRef, useState } from "react";
import { IPaymentReceiptProps } from "../types/payment.interface";

export function PaymentInvoice({
  bookingInfo,
  onConfirmBooking,
  isBooking,
  printOnly,
  onAfterPrint,
}: IPaymentReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [printAttempt, setPrintAttempt] = useState(0);
  const [confirmedBookingInfo, setConfirmedBookingInfo] = useState<any>(null);

  const rawData = confirmedBookingInfo || bookingInfo;

  // Normalize data to ensure guest, stay, room, etc. are always present
  const invoiceData = (() => {
    if (!rawData) return null;

    // If it's already in the expected nested format
    if (rawData.guest && rawData.stay && rawData.room) {
      return rawData;
    }

    // If it's a flat IPayment object (from backend response)
    // We try to reconstruct the nested format
    const res = rawData.reservationId || {};
    const group = rawData.groupId || {};
    const groupReservations = rawData.groupReservations || [];
    const groupPayment = rawData.groupPayment || group.payment || {};

    return {
      guest: {
        name: rawData.guestName || res.guestId?.name || "Guest",
        phone: res.guestId?.phone || "N/A",
        source: res.source || group.source || rawData.source || "-",
        refId: res.refId || group.refId || rawData.refId || "-",
      },
      stay: {
        arrival: res.stay?.arrival || rawData.createdAt,
        departure: res.stay?.departure || rawData.createdAt,
      },
      room: {
        number: rawData.roomNo || res.roomId?.roomNo || "-",
        type: rawData.roomType || res.roomId?.roomType || "-",
      },
      groupReservations: groupReservations.map((gr: any) => ({
        roomNo: gr.roomId?.roomNo,
        roomType: gr.roomId?.roomType,
        arrival: gr.stay?.arrival,
        departure: gr.stay?.departure,
        guestName: gr.guestId?.name,
      })),
      payment: {
        paidAmount:
          rawData.amount ||
          rawData.payment?.paidAmount ||
          groupPayment.paidAmount ||
          0,
        deposit: groupPayment.deposit || rawData.payment?.deposit || 0,
        method:
          rawData.paymentMethod ||
          rawData.payment?.method ||
          groupPayment.paymentMethod ||
          "Cash",
        depositMethod:
          groupPayment.depositMethod ||
          rawData.payment?.depositMethod ||
          "Cash",
        remarks:
          rawData.remarks || rawData.payment?.remarks || group.remarks || "",
      },
      paymentDate: rawData.createdAt || rawData.paymentDate || new Date(),
      paymentId: rawData._id?.toString().toUpperCase() || "N/A",
    };
  })();

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,

    // pageStyle: `
    //   @page {
    //     size: A4;
    //     margin: 0;
    //   }
    //   @media print {
    //     body {
    //       -webkit-print-color-adjust: exact;
    //       font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    //     "Liberation Mono", "Courier New", monospace !important;
    //     }
    //     @page {
    //       margin: 0;
    //       size: auto;
    //     }
    //     @page :footer { display: none; }
    //     @page :header { display: none; }
    //   }
    // `,
    onAfterPrint: async () => {
      setIsPrinting(false);
      setPendingPrint(false);
      setPrintAttempt(0);
      await onAfterPrint?.();
    },
    onPrintError: () => {
      setIsPrinting(false);
      setPendingPrint(false);
      setPrintAttempt(0);
    },
  });

  useEffect(() => {
    if (!pendingPrint) return;

    if (printAttempt > 10) {
      console.error("Print failed: content was not ready in time");
      setIsPrinting(false);
      setPendingPrint(false);
      setPrintAttempt(0);
      return;
    }

    const timer = setTimeout(async () => {
      if (!invoiceRef.current) {
        setPrintAttempt((prev) => prev + 1);
        return;
      }

      try {
        handlePrint();
      } catch {
        setPrintAttempt((prev) => prev + 1);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pendingPrint, printAttempt, handlePrint]);

  const startPrintFlow = () => {
    setIsPrinting(true);
    setPrintAttempt(0);
    setPendingPrint(true);
  };

  const handleConfirmAndPrint = async () => {
    try {
      if (onConfirmBooking) {
        const backendBookingInfo = await onConfirmBooking();
        if (backendBookingInfo) {
          setConfirmedBookingInfo(backendBookingInfo);
        }
      }

      startPrintFlow();
    } catch (error) {
      console.error("Failed to confirm booking:", error);
      setIsPrinting(false);
      setPendingPrint(false);
      setPrintAttempt(0);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-MY");
  };

  const Receipt = ({ copyLabel }: { copyLabel: string }) => {
    if (!invoiceData) return null;

    return (
      <div className="border border-gray-300 p-3 mb-6 font-mono">
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Eco Hotel</h2>
            <p className="text-xs text-gray-500">
              179, Jalan Pudu, Pudu-55100 Kuala Lumpur, Malaysia
            </p>
            <p className="text-xs text-gray-500">
              <strong>Hotline:</strong> +601116962002, 0178988418
            </p>
            <p className="text-xs text-gray-500">
              <strong>E-mail:</strong> ecohotel.bb@gmail.com
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-semibold text-gray-700">
              Payment Receipt
            </h3>
            <p className="text-sm text-gray-500">{copyLabel}</p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Date:</strong>{" "}
              {new Date(invoiceData.paymentDate).toLocaleString("en-MY")}
            </p>
            <p className="text-xs text-gray-500">
              <strong>Receipt No:</strong> {invoiceData.paymentId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-1">
          <div>
            <p className="text-sm font-semibold text-gray-600">Guest Name</p>
            <p className="text-md font-semibold text-gray-800">
              {invoiceData.guest?.name || "Guest"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Room Details</p>
            {invoiceData.groupReservations &&
            invoiceData.groupReservations.length > 0 ? (
              <div className="text-xs font-semibold text-gray-800">
                {"Payment For - "}
                {invoiceData.groupReservations.map((gr: any, idx: number) => (
                  <span key={idx}>
                    {gr.roomNo}
                    {idx < invoiceData.groupReservations.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-md font-semibold text-gray-800">
                {invoiceData.room?.number} - {invoiceData.room?.type}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Source</p>
            <p className="text-md font-semibold text-gray-800">
              {invoiceData.guest?.source || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Ref ID</p>
            <p className="text-md font-semibold text-gray-800">
              {invoiceData.guest?.refId || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Arrival Date</p>
            <p className="text-md font-semibold text-gray-800">
              {formatDate(invoiceData.stay?.arrival)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">
              Departure Date
            </p>
            <p className="text-md font-semibold text-gray-800">
              {formatDate(invoiceData.stay?.departure)}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-1">
          <h4 className="font-semibold text-gray-700 mb-2">
            Payment Information
          </h4>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <p className="text-sm font-semibold text-gray-600">Amount Paid</p>
              <p className="text-md font-bold text-gray-800">
                RM {Number(invoiceData.payment?.paidAmount || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {invoiceData.payment?.method}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Deposit</p>
              <p className="text-md font-semibold text-gray-800">
                {invoiceData.payment?.deposit
                  ? `RM ${Number(invoiceData.payment.deposit).toFixed(2)}`
                  : "No Deposit"}
              </p>
              {invoiceData.payment?.deposit > 0 && (
                <p className="text-xs text-gray-500">
                  {invoiceData.payment.depositMethod}
                </p>
              )}
            </div>
          </div>
          {invoiceData.payment?.remarks && (
            <div className="mt-1">
              <p className="text-sm font-semibold text-gray-600">Remarks</p>
              <p className="text-sm text-gray-800">
                {invoiceData.payment.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 text-center text-xs text-gray-500 mt-8">
          <div>
            <p className="mb-1">___________________</p>
            <p>User: ShiftA</p>
          </div>
          <div>
            <p className="mb-1">___________________</p>
            <p>Guest Signature</p>
          </div>
          <div>
            <p className="mb-1">___________________</p>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full bg-gray-50">
      <div className="flex gap-4 mb-6 print:hidden">
        {printOnly ? (
          <Button onClick={startPrintFlow} size="lg">
            {isPrinting ? "Processing..." : "Print Receipt"}
          </Button>
        ) : (
          <Button
            onClick={handleConfirmAndPrint}
            disabled={isBooking || isPrinting}
            size="lg"
          >
            {isBooking || isPrinting
              ? "Processing..."
              : "Confirm & Print Receipt"}
          </Button>
        )}
      </div>

      <div
        ref={invoiceRef}
        className="bg-white text-black p-6 max-w-4xl w-full"
      >
        {invoiceData ? (
          <>
            <Receipt copyLabel="Hotel Copy" />
            <Receipt copyLabel="Guest Copy" />
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Loading receipt data...
          </div>
        )}
      </div>
    </div>
  );
}
