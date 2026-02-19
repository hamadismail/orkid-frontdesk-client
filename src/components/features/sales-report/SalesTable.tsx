"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DailySalesReport } from "./DailySalesReport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { PaymentReceiptDialog } from "./PaymentReceiptDialog";
import { PAYMENT_METHOD } from "@/src/types/book.interface";
import { IPayment } from "@/src/types/payment.interface";
import TableSkeleton from "@/src/shared/TableSkeleton";
import { getSalesReportPayment } from "@/src/services/payment.service";

interface PaymentData {
  data: IPayment[];
  total: number;
  page: number;
  limit: number;
}

const columns: ColumnDef<IPayment>[] = [
  {
    accessorFn: (row) => {
      const guestName = row.guestName || "N/A";
      return `${
        guestName.length >= 15 ? guestName.slice(0, 15) + "..." : guestName
      }`;
    },
    header: "Guest Name",
  },
  {
    accessorKey: "roomNo",
    header: "Room No.",
  },
  {
    accessorKey: "createdAt",
    header: "Payment Date & Time",
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PPP p"),
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment Method",
  },
  {
    accessorKey: "paidAmount",
    header: "Paid Amount",
    cell: ({ row }) => `RM ${row.getValue("paidAmount")}`,
  },
];

export function SalesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<IPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<IPayment | null>(null);

  const { data = { data: [], total: 0, page: 1, limit: 10 }, isLoading } =
    useQuery<PaymentData>({
      queryKey: ["payments", page, search, date, paymentMethod],
      queryFn: () => getSalesReportPayment(page, search, date, paymentMethod),
    });

  const fetchReportData = async () => {
    if (date) {
      const { data } = await axios.get("/payments/sales-report", {
        params: { date: date?.toISOString(), limit: 1000 },
      });
      setReportData(data?.data?.data || []);
      setShowReport(true);
    }
  };

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / data.limit) : 0,
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };

  const handleRowClick = (payment: IPayment) => {
    setSelectedPayment(payment);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {date ? format(date, "PPP") : "Filter by Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
          <Select
            onValueChange={(value) =>
              setPaymentMethod(value === "all" ? undefined : value)
            }
            value={paymentMethod || "all"}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {Object.values(PAYMENT_METHOD).map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setDate(undefined);
              setPaymentMethod(undefined);
            }}
          >
            Clear Filters
          </Button>

          <Dialog open={showReport} onOpenChange={setShowReport}>
            <DialogTrigger asChild>
              <Button onClick={fetchReportData} disabled={!date}>
                Print Report
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="sr-only">
                  Daily Sales Report
                </DialogTitle>
              </DialogHeader>
              {date && (
                <DailySalesReport payments={reportData} reportDate={date} />
              )}
            </DialogContent>
            <DialogDescription className="sr-only">
              Sales Report
            </DialogDescription>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-background divide-y divide-gray-200">
            {isLoading ? (
              <TableSkeleton
                rows={10}
                columns={5}
                widths={[
                  "w-[120px]",
                  "w-[100px]",
                  "w-[120px]",
                  "w-[100px]",
                  "w-[100px]",
                ]}
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  className="cursor-pointer hover:bg-accent"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {data?.page} of {data ? Math.ceil(data.total / data.limit) : 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!data || data.page * data.limit >= data.total}
        >
          Next
        </Button>
      </div>
      {selectedPayment && (
        <PaymentReceiptDialog
          payment={selectedPayment}
          open={!!selectedPayment}
          onOpenChange={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
