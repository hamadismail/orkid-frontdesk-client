/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { IReservation } from "@/src/types/reservation.interface";
import { format } from "date-fns";
import { ReservationDialog } from "./ReservationDialog";
import { Input } from "@/src/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TableSkeleton from "@/src/shared/TableSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import ReservationInvoice from "@/src/shared/ReservationInvoice";
import { getAllReservations } from "@/src/services/reservation.service";
import { IReservationGroup } from "@/src/types/group.interface";
import { IGuest } from "@/src/types/guest.interface";
import { batchCheckIn } from "@/src/services/group.service";
import { toast } from "sonner";
import { RESERVATION_STATUS } from "@/src/types/enums";

export default function Reservation() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] =
    useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [selectedReservationForPrint, setSelectedReservationForPrint] =
    useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", "list", page, searchQuery],
    queryFn: () => getAllReservations({ 
      page, 
      search: searchQuery,
      status: RESERVATION_STATUS.RESERVED
    }),
  });

  const { mutate: performBatchCheckIn, isPending: isCheckingIn } = useMutation({
    mutationFn: (groupId: string) => batchCheckIn(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Group check-in completed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Group check-in failed");
    },
  });

  const allReservations = useMemo(() => {
    if (!data) return [];
    // If backend returns { data: [...], meta: {...} }
    if (data.data && Array.isArray(data.data)) return data.data;
    // If backend returns [...] directly
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const meta = data?.meta || { page: 1, total: 0, limit: 10 };
  const totalPages = Math.ceil(meta.total / (meta.limit || 10));

  const handleRowClick = (guest: any) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  const handlePrintClick = (reservation: any) => {
    setSelectedReservationForPrint(reservation);
    setIsInvoiceDialogOpen(true);
  };

  const handleNewReservationClick = () => {
    setIsNewReservationDialogOpen(true);
  };

  const closeNewReservationDialog = () => {
    setIsNewReservationDialogOpen(false);
  };

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

  const filteredGroups = useMemo(() => {
    return Object.entries(groupedReservations);
  }, [groupedReservations]);

  return (
    <div className="flex flex-col gap-4 h-full max-w-6xl mx-auto p-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Reservations</h2>
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by guest, room no. or reservation no."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Button onClick={handleNewReservationClick}>
          Create New Reservation
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reservation No</TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Departure Date</TableHead>
              <TableHead>OTA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No reservations found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map(([groupId, reservations]) => {
                const group = (reservations[0] as any)
                  .groupId as IReservationGroup;
                const isExpanded = expandedGroups[groupId];
                const isSingle = reservations.length === 1;
                const canGroupCheckIn =
                  !isSingle &&
                  reservations.some(
                    (r) =>
                      r.status === RESERVATION_STATUS.CONFIRMED ||
                      r.status === RESERVATION_STATUS.RESERVED,
                  );

                return (
                  <React.Fragment key={groupId}>
                    <TableRow
                      className="cursor-pointer font-medium bg-muted/20"
                      onClick={() =>
                        isSingle
                          ? handleRowClick(reservations[0])
                          : toggleGroup(groupId)
                      }
                    >
                      <TableCell className="flex items-center gap-2">
                        {!isSingle &&
                          (isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          ))}
                        {isSingle
                          ? reservations[0].confirmationNo
                          : group?.groupCode}
                      </TableCell>
                      <TableCell>
                        {isSingle
                          ? (reservations[0].guestId as unknown as IGuest).name
                          : group?.groupName}
                        {!isSingle && (
                          <Badge className="ml-2">
                            {reservations.length} Rooms
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservations[0].stay.arrival), "PPP")}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(reservations[0].stay.departure),
                          "PPP",
                        )}
                      </TableCell>
                      <TableCell>{reservations[0].source || "-"}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          {canGroupCheckIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => performBatchCheckIn(groupId)}
                              disabled={isCheckingIn}
                            >
                              {isCheckingIn ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CalendarCheck className="h-3 w-3" />
                              )}
                              Group Check-In
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              handlePrintClick(
                                isSingle ? reservations[0] : reservations,
                              )
                            }
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {!isSingle &&
                      isExpanded &&
                      reservations.map((res) => (
                        <TableRow
                          key={res._id?.toString()}
                          className="bg-muted/5 hover:bg-muted/10"
                          onClick={() => handleRowClick(res)}
                        >
                          <TableCell className="pl-10 text-xs font-normal">
                            {res.confirmationNo}
                          </TableCell>
                          <TableCell className="text-xs font-normal">
                            {(res.guestId as unknown as IGuest).name}
                          </TableCell>
                          <TableCell className="text-xs font-normal">
                            {format(new Date(res.stay.arrival), "PP")}
                          </TableCell>
                          <TableCell className="text-xs font-normal">
                            {format(new Date(res.stay.departure), "PP")}
                          </TableCell>
                          <TableCell className="text-xs font-normal">
                            {(res.roomId as any)?.roomNo} (
                            {(res.roomId as any)?.roomType})
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-end items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {res.status}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handlePrintClick(res)}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
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

      {selectedGuest && (
        <GuestDetailsDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedGuest={selectedGuest}
          groupReservations={
            groupedReservations[
              typeof selectedGuest.groupId === "object"
                ? selectedGuest.groupId._id
                : selectedGuest.groupId
            ]
          }
        />
      )}

      <ReservationDialog
        allReservations={allReservations}
        isOpen={isNewReservationDialogOpen}
        onClose={closeNewReservationDialog}
      />

      {selectedReservationForPrint && (
        <Dialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
        >
          <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Reservation Voucher</DialogTitle>
            </DialogHeader>
            <ReservationInvoice
              bookingInfo={selectedReservationForPrint}
              onConfirmBooking={() => {}}
              onBack={() => setIsInvoiceDialogOpen(false)}
              isPending={false}
            />
          </DialogContent>
          <DialogDescription className="sr-only">
            Reservation Voucher
          </DialogDescription>
        </Dialog>
      )}
    </div>
  );
}
