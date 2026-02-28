/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import PaymentModal from "@/src/components/features/payments/PaymentModal";
import { IReservation } from "@/src/types/reservation.interface";
import TableSkeleton from "@/src/shared/TableSkeleton";
import { getAllReservations } from "@/src/services/reservation.service";
import { IGuest } from "@/src/types/guest.interface";
import { RESERVATION_STATUS } from "@/src/types/enums";

function PaymentTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(RESERVATION_STATUS.CHECKED_IN);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reservations-payment", page, search, status],
    queryFn: () => getAllReservations({ page, search, status }),
  });

  const reservations = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta || { page: 1, total: 0, limit: 10 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Outstanding Payments</h1>
        <p className="text-sm text-muted-foreground">
          Manage guest balances and payments.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search guests..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RESERVATION_STATUS.CHECKED_IN}>
              Checked In
            </SelectItem>
            <SelectItem value={RESERVATION_STATUS.CHECKED_OUT}>
              Checked Out
            </SelectItem>
            <SelectItem value={RESERVATION_STATUS.CONFIRMED}>
              Confirmed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} columns={7} />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-500">
                  Error loading data
                </TableCell>
              </TableRow>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((res: IReservation) => {
                const guest = res.guestId as unknown as IGuest;
                const room = res.roomId as any;
                const isDue = res.payment.dueAmount > 0;
                return (
                  <TableRow key={res._id}>
                    <TableCell>
                      <div className="font-medium">{guest?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {guest?.phone}
                      </div>
                    </TableCell>
                    <TableCell>{room?.roomNo}</TableCell>
                    <TableCell>RM {res.rate.subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      RM {res.payment.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={
                        isDue ? "text-red-600 font-bold" : "text-green-600"
                      }
                    >
                      RM {res.payment.dueAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{res.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <PaymentModal guest={res} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentTable;
