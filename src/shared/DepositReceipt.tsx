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
    const groups: Record<string, { main: IReservation; sub: IReservation[] }> = {};
    (props.deposits || []).forEach((res) => {
      // Use groupId as key, or reservationId if no groupId exists (single booking)
      const groupObj = res.groupId as any;
      const gId = typeof groupObj === 'string' ? groupObj : groupObj?._id || res._id;
      
      if (!groups[gId]) {
        groups[gId] = { main: res, sub: [] };
      }
      groups[gId].sub.push(res);
    });
    return Object.values(groups).sort((a, b) => {
      const roomNoA = (a.main.roomId as any)?.roomNo || "";
      const roomNoB = (b.main.roomId as any)?.roomNo || "";
      return roomNoA.localeCompare(roomNoB);
    });
  }, [props.deposits]);

  const categorizedTotals = groupedData.reduce(
    (acc, group) => {
      const res = group.main;
      const groupObj = res.groupId as any;
      const payment = groupObj?.payment || { deposit: 0, depositMethod: DEPOSIT_METHOD.CASH };
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
            <TableHead className="text-black">GUEST / ROOMS</TableHead>
            <TableHead className="text-right text-black">DEPOSIT (RM)</TableHead>
            <TableHead className="text-black">METHOD</TableHead>
            <TableHead className="text-black">DATE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedData?.map((group, index) => {
            const res = group.main;
            const guest = res.guestId as unknown as IGuest;
            const groupObj = res.groupId as any;
            const payment = groupObj?.payment || { deposit: 0, depositMethod: DEPOSIT_METHOD.CASH };

            return (
              <React.Fragment key={res._id!.toString()}>
                {/* Main Group Row */}
                <TableRow className="border-black bg-muted/20 hover:bg-transparent font-bold">
                  <TableCell className="py-2">{index + 1}</TableCell>
                  <TableCell className="py-2">
                    {guest?.name?.toUpperCase()} 
                    {group.sub.length > 1 && ` (Group: ${groupObj?.groupName || groupObj?.groupCode})`}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {payment.deposit?.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2">
                    {payment.depositMethod || DEPOSIT_METHOD.CASH}
                  </TableCell>
                  <TableCell className="py-2">
                    {res.createdAt
                      ? new Date(res.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
                {/* Sub-rows for each room */}
                {group.sub.map((subRes, subIndex) => {
                  const subRoom = subRes.roomId as any;
                  return (
                    <TableRow key={subRes._id!.toString()} className="border-black/20 hover:bg-transparent border-b last:border-b-0">
                      <TableCell className="py-1"></TableCell>
                      <TableCell className="py-1 pl-8 text-muted-foreground italic">
                        └ Room: {subRoom?.roomNo} ({subRoom?.roomType})
                      </TableCell>
                      <TableCell className="py-1"></TableCell>
                      <TableCell className="py-1"></TableCell>
                      <TableCell className="py-1"></TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
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
