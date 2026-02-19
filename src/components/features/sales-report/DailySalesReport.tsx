"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Button } from "@/src/components/ui/button";
import { IPayment } from "@/src/types/payment.interface";

interface DailySalesReportProps {
  payments: IPayment[];
  reportDate: Date;
}

export function DailySalesReport({
  payments,
  reportDate,
}: DailySalesReportProps) {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    pageStyle: `
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          font-size: 10pt;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace !important;
        }
        @page {
          margin: 0;
          size: auto;
        }
        @page :footer { display: none; }
        @page :header { display: none; }
      }
    `,
    documentTitle: `Daily Sales Report - ${format(reportDate, "PPP")}`,
  });

  const totalSales = payments.reduce(
    (acc, payment) => acc + payment.paidAmount,
    0,
  );

  const categorizedByPaymentMethod = payments.reduce(
    (acc, payment) => {
      const { paymentMethod } = payment;
      if (!acc[paymentMethod]) {
        acc[paymentMethod] = {
          payments: [],
          total: 0,
        };
      }
      acc[paymentMethod].payments.push(payment);
      acc[paymentMethod].total += payment.paidAmount;
      return acc;
    },
    {} as Record<string, { payments: IPayment[]; total: number }>,
  );

  const categorizedByOta = payments.reduce(
    (acc, payment) => {
      let ota = "N/A";
      if (
        payment.guestId &&
        typeof payment.guestId === "object" &&
        "guest" in payment.guestId
      ) {
        ota = (payment.guestId as { guest: { otas: string } }).guest.otas;
      }

      if (!acc[ota]) {
        acc[ota] = {
          payments: [],
          total: 0,
        };
      }
      acc[ota].payments.push(payment);
      acc[ota].total += payment.paidAmount;
      return acc;
    },
    {} as Record<string, { payments: IPayment[]; total: number }>,
  );

  return (
    <div className="bg-gray-100">
      <div ref={contentRef} className="p-6 bg-white shadow-md rounded-none">
        <header className="flex justify-between items-center pb-3 border-b mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orkid Hills Hotel
            </h1>
            <p className="text-sm text-gray-600">Daily Sales Report</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">
              {format(reportDate, "PPP")}
            </p>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Sales Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">
                RM {totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {payments.length}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sales by OTA
            </h2>
            {Object.entries(categorizedByOta).map(
              ([ota, { payments: paymentList, total }]) => (
                <div key={ota} className="mb-4 border rounded-md">
                  <h3 className="text-base font-semibold capitalize text-gray-700 border-b px-3 py-2 bg-gray-50 rounded-t-md">
                    {ota}
                  </h3>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">
                          Guest
                        </th>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">
                          Room
                        </th>
                        <th className="text-right py-1 px-2 font-medium text-gray-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentList.map((payment) => (
                        <tr key={payment._id} className="border-t">
                          <td className="py-1 px-2">{payment.guestName}</td>
                          <td className="py-1 px-2">{payment.roomNo}</td>
                          <td className="text-right py-1 px-2">
                            {payment.paidAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-1 px-2">
                          Total
                        </td>
                        <td className="text-right py-1 px-2">
                          {total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ),
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sales by Payment Method
            </h2>
            {Object.entries(categorizedByPaymentMethod).map(
              ([method, { payments: paymentList, total }]) => (
                <div key={method} className="mb-4 border rounded-md">
                  <h3 className="text-base font-semibold capitalize text-gray-700 border-b px-3 py-2 bg-gray-50 rounded-t-md">
                    {method}
                  </h3>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">
                          Guest
                        </th>
                        <th className="text-left py-1 px-2 font-medium text-gray-600">
                          Room
                        </th>
                        <th className="text-right py-1 px-2 font-medium text-gray-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentList.map((payment) => (
                        <tr key={payment._id} className="border-t">
                          <td className="py-1 px-2">{payment.guestName}</td>
                          <td className="py-1 px-2">{payment.roomNo}</td>
                          <td className="text-right py-1 px-2">
                            {payment.paidAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-1 px-2">
                          Total
                        </td>
                        <td className="text-right py-1 px-2">
                          {total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ),
            )}
          </section>
        </div>

        <footer className="mt-6 pt-3 border-t text-right">
          <p className="text-sm text-gray-600 font-semibold">Grand Total</p>
          <p className="text-2xl font-bold text-gray-900">
            RM {totalSales.toFixed(2)}
          </p>
        </footer>
      </div>
      <div className="text-center mt-4 mb-4 print-button">
        <Button onClick={handlePrint} size="default">
          Print Report
        </Button>
      </div>
    </div>
  );
}
