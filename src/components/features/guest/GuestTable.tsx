"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  ArrowDownUp,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/src/components/ui/badge";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { useReactToPrint } from "react-to-print";
import PrintableTable from "@/src/shared/DepositReceipt";
import { IBook, OTAS } from "@/src/types/book.interface";
import TableSkeleton from "@/src/shared/TableSkeleton";
import { PrintInvoiceButton } from "./PrintInvoiceButton";
import axios from "axios";
import { getAllGuests } from "@/src/services/booking.service";

export default function GuestTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [otaFilter, setOtaFilter] = useState<string>("all");
  const [date, setDate] = useState<Date>();
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedGuest, setSelectedGuest] = useState<IBook | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const contentRef = useRef<HTMLDivElement>(null);
  const [depositsForPrinting, setDepositsForPrinting] = useState<
    IBook[] | undefined
  >([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingLoading, setIsPrintingLoading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "guests",
      page,
      search,
      statusFilter,
      otaFilter,
      date,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      getAllGuests(
        page,
        search,
        statusFilter,
        otaFilter,
        date?.toISOString(),
        sortBy,
        sortOrder,
      ),
  });

  const allGuests = useMemo(() => data || [], [data]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleViewGuest = (guest: IBook) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  const statusColors = {
    CheckedIn: "bg-green-100 text-green-800 border-green-300",
    CheckedOut: "bg-blue-100 text-blue-800 border-blue-300",
    Reserved: "bg-amber-100 text-amber-800 border-amber-300",
    Cancel: "bg-red-100 text-red-800 border-red-300",
  };
  const handlePrint = useReactToPrint({
    contentRef,
    onAfterPrint: () => setIsPrinting(false),
    pageStyle: `
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        @page {
          margin: 0;
          padding: 1cm;
          size: auto;
        }
        @page :footer { display: none; }
        @page :header { display: none; }
      }
    `,
  });

  const triggerPrint = async () => {
    setIsPrintingLoading(true);
    try {
      const res = await axios.get("/deposits");
      setDepositsForPrinting(res.data.data?.guests);
      setIsPrinting(true);
    } catch (error) {
      console.error("Error fetching deposits for printing:", error);
    } finally {
      setIsPrintingLoading(false);
    }
  };

  useEffect(() => {
    if (isPrinting) {
      handlePrint();
    }
  }, [isPrinting, handlePrint]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guest Management</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Guests */}
        <div className="relative flex-1">
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

        {/* Filter Guest */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />

          {/* Filter By Status */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="CheckedIn">Checked In</SelectItem>
              <SelectItem value="CheckedOut">Checked Out</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter By OTAs */}
          <Select
            value={otaFilter}
            onValueChange={(value) => {
              setOtaFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filter by OTA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OTAs</SelectItem>
              {Object.values(OTAS).map((ota) => (
                <SelectItem key={ota.toLowerCase()} value={ota}>
                  {ota}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter By Date */}
          <Input
            type="date"
            className="w-45"
            value={date ? format(date, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              setDate(e.target.value ? new Date(e.target.value) : undefined);
              setPage(1);
            }}
          />
        </div>

        {/* Print Button */}

        {isClient && (
          <Button
            className="cursor-pointer"
            onClick={triggerPrint}
            disabled={isPrintingLoading}
          >
            {isPrintingLoading ? "Preparing..." : "Deposit Report"}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        {isClient && (
          <div style={{ display: "none" }}>
            <PrintableTable ref={contentRef} deposits={depositsForPrinting} />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Deposit</TableHead>
              <TableHead>Room No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  CheckedIn
                  {sortBy === "createdAt" && <ArrowDownUp className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("updatedAt")}
              >
                <div className="flex items-center gap-2">
                  CheckedOut
                  {sortBy === "updatedAt" && <ArrowDownUp className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableSkeleton
                rows={10}
                columns={7}
                widths={[
                  "w-[100px]",
                  "w-[100px]",
                  "w-[100px]",
                  "w-[100px]",
                  "w-[120px]",
                  "w-[120px]",
                  "w-[50px]",
                ]}
              />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-500">
                  Failed to load guests
                </TableCell>
              </TableRow>
            ) : allGuests?.guests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No guests found
                </TableCell>
              </TableRow>
            ) : (
              allGuests?.guests?.map((guest: IBook) => (
                <TableRow key={guest._id}>
                  <TableCell
                    onClick={() => handleViewGuest(guest)}
                    className="font-medium cursor-pointer"
                  >
                    {guest.guest.name.length >= 15
                      ? guest.guest.name.slice(0, 15) + "..."
                      : guest.guest.name}
                  </TableCell>

                  <TableCell>{guest.payment.deposit || "-"}</TableCell>
                  <TableCell>
                    {(guest.roomId as { roomNo: string })?.roomNo}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${
                        statusColors[
                          guest.isCheckOut ? "CheckedOut" : "CheckedIn"
                        ] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {guest.isCheckOut ? "CheckedOut" : "CheckedIn"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {guest.createdAt
                      ? format(
                          new Date(guest.createdAt),
                          "MMM dd, yyyy, hh:mm a"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {guest.isCheckOut && guest.updatedAt ? format(
                          new Date(guest.updatedAt),
                          "MMM dd, yyyy, hh:mm a"
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <PrintInvoiceButton guest={guest} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {allGuests?.totalPages || 1}
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
            onClick={() =>
              setPage(Math.min(allGuests?.totalPages || 1, page + 1))
            }
            disabled={
              page === allGuests?.totalPages || isLoading || !allGuests?.hasMore
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(allGuests?.totalPages || 1)}
            disabled={
              page === allGuests?.totalPages || isLoading || !allGuests?.hasMore
            }
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <GuestDetailsDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedGuest={selectedGuest}
      />
    </div>
  );
}
