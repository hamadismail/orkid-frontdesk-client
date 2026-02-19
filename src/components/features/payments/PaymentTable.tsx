"use client";
import { useState } from "react";
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
import { IBook } from "@/src/types/book.interface";
import TableSkeleton from "@/src/shared/TableSkeleton";
import { getAllPayments } from "@/src/services/payment.service";

function PaymentTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("due");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payments", page, search, filter],
    queryFn: () => getAllPayments(page, search, filter),
    // keepPreviousData: true
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outstanding Payments</h1>
          <p className="text-sm text-muted-foreground">
            Guests with pending due amounts
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
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
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter by due amount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Guests</SelectItem>
            <SelectItem value="due">With Due</SelectItem>
            <SelectItem value="no-due">No Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Room No.</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton
                rows={10}
                columns={8}
                widths={[
                  "w-[120px]",
                  "w-[120px]",
                  "w-[80px]",
                  "w-[80px]",
                  "w-[80px]",
                  "w-[80px]",
                  "w-[80px]",
                  "w-[80px]",
                  "w-[80px]",
                ]}
              />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-500">
                  Failed to load payments
                </TableCell>
              </TableRow>
            ) : data?.payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No outstanding payments found
                </TableCell>
              </TableRow>
            ) : (
              data?.payments?.map((guest: IBook) => (
                <TableRow key={guest._id}>
                  <TableCell className="font-medium">
                    {guest.guest.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {guest.guest.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {guest.guest.phone}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {(guest.roomId as { roomNo: string })?.roomNo}
                  </TableCell>
                  <TableCell>
                    {guest?.payment?.subtotal?.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    RM
                  </TableCell>
                  <TableCell>
                    {guest?.payment?.paidAmount?.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    RM
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        guest?.payment?.dueAmount > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {guest?.payment?.dueAmount?.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{" "}
                      RM
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${
                        guest.isCheckOut
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {guest.isCheckOut ? "CheckOut" : "CheckIn"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PaymentModal guest={guest} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {data?.totalPages || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1 || isLoading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(data?.totalPages || 1, page + 1))}
            disabled={page === data?.totalPages || isLoading || !data?.hasMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(data?.totalPages || 1)}
            disabled={page === data?.totalPages || isLoading || !data?.hasMore}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentTable;
