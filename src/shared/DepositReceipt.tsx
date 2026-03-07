/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { IReservation } from "@/src/types/reservation.interface";
import { DEPOSIT_METHOD } from "@/src/types/enums";
import { IGuest } from "@/src/types/guest.interface";

const PrintableTable = React.forwardRef<
  HTMLDivElement,
  { deposits: IReservation[] | undefined }
>((props, ref) => {
  const currentDateTime = new Date().toLocaleString();

  // Group by groupId to avoid duplicates
  const groupedData = useMemo(() => {
    const groups: Record<string, IReservation> = {};
    (props.deposits || []).forEach((res) => {
      // Use groupId as key, or reservationId if no groupId exists (single booking)
      const groupObj = res.groupId as any;
      const gId = typeof groupObj === 'string' ? groupObj : groupObj?._id || res._id;
      
      if (!groups[gId]) {
        groups[gId] = res;
      }
    });
    return Object.values(groups).sort((a, b) => {
      const roomNoA = (a.roomId as any)?.roomNo || "";
      const roomNoB = (b.roomId as any)?.roomNo || "";
      return roomNoA.localeCompare(roomNoB);
    });
  }, [props.deposits]);

  const categorizedTotals = groupedData.reduce(
    (acc, res) => {
      const group = res.groupId as any;
      const payment = group?.payment || { deposit: 0, depositMethod: DEPOSIT_METHOD.CASH };
      const method = payment.depositMethod || DEPOSIT_METHOD.CASH;
      const amount = payment.deposit || 0;
      
      if (method === DEPOSIT_METHOD.CASH) acc.cash += amount;
      else if (method === DEPOSIT_METHOD.QR) acc.qr += amount;
      else acc.others += amount;
      return acc;
    },
    { cash: 0, qr: 0, others: 0 },
  );

  return (
    <div ref={ref} className="p-8 text-[10px] font-mono bg-white text-black">
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold uppercase tracking-widest">
          ECO HOTEL - Deposit Report
        </h1>
        <p>Generated: {currentDateTime}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-black hover:bg-transparent">
            <TableHead className="w-10 text-black">#</TableHead>
            <TableHead className="text-black">ROOM</TableHead>
            <TableHead className="text-black">GUEST</TableHead>
            <TableHead className="text-right text-black">DEPOSIT (RM)</TableHead>
            <TableHead className="text-black">METHOD</TableHead>
            <TableHead className="text-black">DATE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedData?.map((res, index) => {
            const guest = res.guestId as unknown as IGuest;
            const room = res.roomId as any;
            const group = res.groupId as any;
            const payment = group?.payment || { deposit: 0, depositMethod: DEPOSIT_METHOD.CASH };

            return (
              <TableRow key={res._id!.toString()} className="border-black hover:bg-transparent">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{room?.roomNo}</TableCell>
                <TableCell>{guest?.name?.slice(0, 20)}</TableCell>
                <TableCell className="text-right">
                  {payment.deposit?.toFixed(2)}
                </TableCell>
                <TableCell>
                  {payment.depositMethod || DEPOSIT_METHOD.CASH}
                </TableCell>
                <TableCell>
                  {res.createdAt
                    ? new Date(res.createdAt).toLocaleDateString()
                    : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-8 flex justify-end">
        <div className="w-64 space-y-1 border-t-2 border-black pt-2">
          <div className="flex justify-between">
            <span>CASH:</span>
            <span>RM {categorizedTotals.cash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>QR/BANK:</span>
            <span>RM {categorizedTotals.qr.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>OTHERS:</span>
            <span>RM {categorizedTotals.others.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>
              RM{" "}
              {(
                categorizedTotals.cash +
                categorizedTotals.qr +
                categorizedTotals.others
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-3 gap-8 text-center text-[8px] uppercase">
        <div>
          <p className="border-t border-black pt-1">Prepared By</p>
        </div>
        <div>
          <p className="border-t border-black pt-1">Verified By</p>
        </div>
        <div>
          <p className="border-t border-black pt-1">Authorized By</p>
        </div>
      </div>
    </div>
  );
});

PrintableTable.displayName = "PrintableTable";

export default PrintableTable;
