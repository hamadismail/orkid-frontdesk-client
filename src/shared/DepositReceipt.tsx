import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { DEPOSIT_METHOD, IBook } from "@/src/types/book.interface";

const PrintableTable = React.forwardRef<
  HTMLDivElement,
  { deposits: IBook[] | undefined }
>((props, ref) => {
  const currentDateTime = new Date().toLocaleString();

  const guestData = (props.deposits || []).sort((a, b) => {
    const roomNoA = (a.roomId as { roomNo?: string })?.roomNo;
    const roomNoB = (b.roomId as { roomNo?: string })?.roomNo;

    if (roomNoA && roomNoB) {
      return roomNoA.localeCompare(roomNoB);
    }
    if (roomNoA) return -1; // A comes first
    if (roomNoB) return 1; // B comes first
    return 0; // Maintain original order if both are undefined
  });

  // const totals = guestData.reduce((acc, deposit) => {
  //   return acc + (deposit.payment.deposit || 0);
  // }, 0);

  const categorizedTotals = guestData.reduce(
    (acc, deposit) => {
      const method = deposit.payment.depositMethod || DEPOSIT_METHOD.CASH;
      if (method === DEPOSIT_METHOD.CASH) {
        acc.cash += deposit.payment.deposit || 0;
      } else if (method === DEPOSIT_METHOD.OR) {
        acc.qr += deposit.payment.deposit || 0;
      } else {
        acc.others += deposit.payment.deposit || 0;
      }
      return acc;
    },
    { cash: 0, qr: 0, others: 0 }
  );

  return (
    <div ref={ref} className="p-4 text-xs">
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">Deposit Report</h1>
        <p>Report Date: {currentDateTime}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">No.</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Guest Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Guest Signature</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guestData?.map((deposit, index) => (
            <TableRow key={deposit._id ?? ""}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {(deposit.roomId as { roomNo?: string })?.roomNo}
              </TableCell>
              <TableCell className="text-left">
                {deposit.guest.name.slice(0, 10)}...
              </TableCell>
              <TableCell>{deposit.payment.deposit?.toFixed(2)}</TableCell>
              <TableCell>
                {deposit.payment.depositMethod || DEPOSIT_METHOD.CASH}
              </TableCell>
              <TableCell>
                {deposit.createdAt
                  ? new Date(deposit.createdAt).toLocaleDateString()
                  : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
                <div className="mt-4 flex justify-end">
              <div className="w-1/2">
                <div className="flex justify-between font-bold pt-2">
                  <span>Cash Total:</span>
                  <span>{categorizedTotals.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>QR/Bank Transfer Total:</span>
                  <span>{categorizedTotals.qr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Others Total:</span>
                  <span>{categorizedTotals.others.toFixed(2)}</span>
                </div>
                {/* <div className="flex justify-between font-bold pt-2">
                  <span>Grand Total:</span>
                  <span>{totals.toFixed(2)}</span>
                </div> */}
              </div>
            </div>      <div className="mt-20 flex justify-between text-xs">
        <div className="text-center">
          <p className="border-t pt-1">Prepared By</p>
        </div>
        <div className="text-center">
          <p className="border-t pt-1">Checked By</p>
        </div>
        <div className="text-center">
          <p className="border-t pt-1">Approved By</p>
        </div>
      </div>
    </div>
  );
});

PrintableTable.displayName = "PrintableTable";

export default PrintableTable;
