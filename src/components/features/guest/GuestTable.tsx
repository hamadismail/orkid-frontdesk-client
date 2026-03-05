/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState, useRef } from "react";
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
  Printer,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { IGuest } from "@/src/types/guest.interface";
import { IReservation } from "@/src/types/reservation.interface";
import { RESERVATION_STATUS } from "@/src/types/enums";
import TableSkeleton from "@/src/shared/TableSkeleton";
import { getAllReservations } from "@/src/services/reservation.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { GuestInvoice } from "@/src/shared/GuestInvoice";
import { useReactToPrint } from "react-to-print";
import { Badge } from "@/src/components/ui/badge";
import { format } from "date-fns";
import React from "react";
import PrintableTable from "@/src/shared/DepositReceipt";

export default function GuestTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDepositReportOpen, setIsDepositReportOpen] = useState(false);
  const [reservationForInvoice, setReservationForInvoice] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const handleClearFilters = () => {
    setSearch("");
    setArrivalDate("");
    setStatus("all");
    setSortBy("createdAt");
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reservations", "guest-view", page, search, status, sortBy, arrivalDate],
    queryFn: () => getAllReservations({
      page,
      search,
      status: status === "all" ? undefined : status,
      sortBy,
      sortOrder: "desc",
      arrival: arrivalDate || undefined,
    }),
  });

  const { data: checkedInReservations, isLoading: isLoadingDeposits } = useQuery({
    queryKey: ["reservations", "checked-in-report"],
    queryFn: () => getAllReservations({ status: RESERVATION_STATUS.CHECKED_IN, limit: 1000 }),
    enabled: isDepositReportOpen,
  });

  const allReservations = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.data && data.data.data && Array.isArray(data.data.data))
      return data.data.data;
    return [];
  }, [data]);

  // Group reservations by groupId
  const groupedReservations = useMemo(() => {
    const groups: Record<string, IReservation[]> = {};
    if (!Array.isArray(allReservations)) return groups;

    allReservations.forEach((res: any) => {
      const groupId =
        typeof res.groupId === "object" ? res.groupId._id : res.groupId;
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(res);
    });
    return groups;
  }, [allReservations]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const meta = data?.meta || { page: 1, total: 0, limit: 10 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  const handleViewGuest = (res: IReservation) => {
    setSelectedGuest(res);
    setIsDialogOpen(true);
  };

  const handlePrintClick = (e: React.MouseEvent, res: any) => {
    e.stopPropagation();
    setReservationForInvoice(res);
    setIsInvoiceDialogOpen(true);
  };

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  const depositReportRef = useRef<HTMLDivElement>(null);
  const handlePrintDepositReport = useReactToPrint({
    contentRef: depositReportRef,
  });

  const formatDate = (date: any) =>
    date ? format(new Date(date), "MMM d, HH:mm") : "-";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stays & Guest List</h1>
        <Button onClick={() => setIsDepositReportOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
          <Printer className="h-4 w-4" /> Deposit Report
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search guests or room no..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="relative w-48">
          <Input
            type="date"
            value={arrivalDate}
            onChange={(e) => {
              setArrivalDate(e.target.value);
              setPage(1);
            }}
            className="w-full"
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
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(RESERVATION_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(val) => {
            setSortBy(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest Check-In</SelectItem>
            <SelectItem value="checkedOutAt">Check-out Date</SelectItem>
          </SelectContent>
        </Select>

        {(search || arrivalDate || status !== "all" || sortBy !== "createdAt") && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-md border p-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Stay Duration</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Actual In/Out</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-500">
                  Error loading data
                </TableCell>
              </TableRow>
            ) : Object.keys(groupedReservations).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No stays found
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedReservations).map(
                ([groupId, reservations]) => {
                  const guest = (reservations[0] as any).guestId as IGuest;
                  const isExpanded = expandedGroups[groupId];
                  const isSingle = reservations.length === 1;

                  return (
                    <React.Fragment key={groupId}>
                      <TableRow
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() =>
                          isSingle
                            ? handleViewGuest(reservations[0])
                            : toggleGroup(groupId)
                        }
                      >
                        <TableCell>
                          {!isSingle &&
                            (isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            ))}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{guest?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {guest?.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(
                              new Date(reservations[0].stay.arrival),
                              "MMM d",
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(reservations[0].stay.departure),
                              "MMM d, yyyy",
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {reservations.length} Room
                            {reservations.length > 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[10px] leading-tight">
                            <span className="text-muted-foreground">In: {formatDate(reservations[0].createdAt)}</span>
                            <span>Out: {formatDate(reservations[0].checkedOutAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
                            {reservations[0].status === RESERVATION_STATUS.CANCELLED && (
                                <span className="text-destructive font-bold">Cxl: {formatDate(reservations[0].cancelledAt)}</span>
                            )}
                            <span className="italic">Mod: {formatDate(reservations[0].updatedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reservations[0].status ===
                              RESERVATION_STATUS.CHECKED_IN
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {reservations[0].status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) =>
                                handlePrintClick(
                                  e,
                                  isSingle ? reservations[0] : reservations,
                                )
                              }
                              title="Print Invoice"
                            >
                              <Printer className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {!isSingle &&
                        isExpanded &&
                        reservations.map((res) => (
                          <TableRow
                            key={res._id?.toString()}
                            className="bg-muted/30 hover:bg-muted/50 border-l-4 border-l-primary"
                            onClick={() => handleViewGuest(res)}
                          >
                            <TableCell></TableCell>
                            <TableCell className="pl-8 text-xs">
                              <div className="font-medium text-muted-foreground">
                                Confirmation: {res.confirmationNo}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {format(new Date(res.stay.arrival), "PP")} -{" "}
                              {format(new Date(res.stay.departure), "PP")}
                            </TableCell>
                            <TableCell className="text-xs font-bold">
                              Room {(res.roomId as any)?.roomNo} (
                              {(res.roomId as any)?.roomType})
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-[10px] leading-tight">
                                <span className="text-muted-foreground">In: {formatDate(res.createdAt)}</span>
                                <span>Out: {formatDate(res.checkedOutAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
                                {res.status === RESERVATION_STATUS.CANCELLED && (
                                    <span className="text-destructive font-bold">Cxl: {formatDate(res.cancelledAt)}</span>
                                )}
                                <span className="italic">Mod: {formatDate(res.updatedAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5"
                              >
                                {res.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handlePrintClick(e, res)}
                              >
                                <Printer className="h-3 w-3 mr-1" /> Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  );
                },
              )
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Guest Details Dialog */}
      {selectedGuest && (
        <GuestDetailsDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedGuest={selectedGuest}
        />
      )}

      {/* Print Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Guest Invoice</DialogTitle>
            <DialogDescription>
              Invoice for{" "}
              {Array.isArray(reservationForInvoice)
                ? (reservationForInvoice[0].guestId as any)?.name
                : (reservationForInvoice?.guestId as any)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <GuestInvoice ref={invoiceRef} guest={reservationForInvoice} />
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsInvoiceDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" /> Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Deposit Report Dialog */}
      <Dialog open={isDepositReportOpen} onOpenChange={setIsDepositReportOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Deposit Report</DialogTitle>
            <DialogDescription>
              Current deposits for all checked-in guests.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingDeposits ? (
              <div className="flex justify-center p-8">Loading deposits...</div>
            ) : (
              <PrintableTable ref={depositReportRef} deposits={checkedInReservations?.data || []} />
            )}
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDepositReportOpen(false)}
            >
              Close
            </Button>
            <Button onClick={() => handlePrintDepositReport()} disabled={isLoadingDeposits}>
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
