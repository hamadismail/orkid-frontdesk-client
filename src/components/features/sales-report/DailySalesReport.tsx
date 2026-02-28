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
        body { -webkit-print-color-adjust: exact; font-size: 10pt; font-family: monospace; }
        @page { margin: 0; size: auto; }
      }
    `,
    documentTitle: `Daily Sales Report - ${format(reportDate, "PPP")}`,
  });

  const totalSales = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const categorizedByMethod = payments.reduce((acc, p) => {
      const method = p.paymentMethod || "Unknown";
      if (!acc[method]) acc[method] = { payments: [], total: 0 };
      acc[method].payments.push(p);
      acc[method].total += (p.amount || 0);
      return acc;
  }, {} as any);

  return (
    <div className="bg-gray-100">
      <div ref={contentRef} className="p-6 bg-white shadow-md rounded-none font-mono">
        <header className="flex justify-between items-center pb-3 border-b mb-4">
          <h1 className="text-2xl font-bold">Eco Hotel - Daily Sales</h1>
          <p className="font-semibold">{format(reportDate, "PPP")}</p>
        </header>

        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-md border">
              <p className="text-sm">Total Sales</p>
              <p className="text-xl font-bold">RM {totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border">
              <p className="text-sm">Transactions</p>
              <p className="text-xl font-bold">{payments.length}</p>
            </div>
          </div>
        </section>

        <section>
            <h2 className="text-lg font-bold mb-2">Breakdown by Method</h2>
            {Object.entries(categorizedByMethod).map(([method, data]: any) => (
                <div key={method} className="mb-4 border">
                    <div className="bg-muted p-2 font-bold flex justify-between">
                        <span>{method}</span>
                        <span>Total: RM {data.total.toFixed(2)}</span>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-1">Guest</th>
                                <th className="text-left p-1">Room</th>
                                <th className="text-right p-1">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.payments.map((p: IPayment) => (
                                <tr key={p._id} className="border-b">
                                    <td className="p-1">{p.guestName}</td>
                                    <td className="p-1">{p.roomNo}</td>
                                    <td className="text-right p-1">{p.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </section>
      </div>
      <div className="p-4 text-center">
          <Button onClick={handlePrint}>Print Report</Button>
      </div>
    </div>
  );
}
