"use client";

import { IPayment } from "@/src/types/payment.interface";
import { CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Skeleton } from "../../ui/skeleton";
import { format } from "date-fns";
import { formatCurrency } from "@/src/utils/currency-formatter";

export const RecentPaymentsTable = ({
  payments,
  isLoading,
}: {
  payments?: IPayment[];
  isLoading: boolean;
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest Name</TableHead>
          <TableHead>Room No</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (!payments || payments.length === 0) ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 5 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : payments?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No payments found</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          payments?.map((payment) => (
            <TableRow key={payment._id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{payment.guestName}</TableCell>
              <TableCell>{payment.roomNo}</TableCell>
              <TableCell>
                {payment.createdAt &&
                  format(new Date(payment.createdAt), "PPP p")}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {payment.paymentMethod}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold">
                RM {formatCurrency(payment.paidAmount)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
