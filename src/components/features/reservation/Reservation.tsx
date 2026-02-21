"use client";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { GuestDetailsDialog } from "@/src/shared/GuestDetailsDialog";
import { IReservation } from "@/src/types/reservation.interface";
import { format } from "date-fns";
import { NewReservationDialog } from "./NewReservationDialog";
import { Input } from "@/src/components/ui/input";

import { useQuery } from "@tanstack/react-query";
import TableSkeleton from "@/src/shared/TableSkeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Printer } from "lucide-react";
import ReservationInvoice from "@/src/shared/ReservationInvoice";
import { getAllReservations } from "@/src/services/reservation.service";

export default function Reservation() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewReservationDialogOpen, setIsNewReservationDialogOpen] =
    useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<IReservation | null>(null);
  const [selectedReservationForPrint, setSelectedReservationForPrint] =
    useState<IReservation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reserve"],
    queryFn: () => getAllReservations(),
  });

  const allReservations = useMemo(() => data || [], [data]);

  const handleRowClick = (guest: IReservation) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  const handlePrintClick = (reservation: IReservation) => {
    setSelectedReservationForPrint(reservation);
    setIsInvoiceDialogOpen(true);
  };

  const handleNewReservationClick = () => {
    setIsNewReservationDialogOpen(true);
  };

  const closeNewReservationDialog = () => {
    setIsNewReservationDialogOpen(false);
  };

  const filteredReservations = useMemo(() => {
    if (!searchQuery) {
      return allReservations;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allReservations.filter(
      (reservation: IReservation) =>
        reservation.guest.name.toLowerCase().includes(lowerCaseQuery) ||
        reservation.guest.refId.toLowerCase().includes(lowerCaseQuery),
    );
  }, [allReservations, searchQuery]);

  return (
    <div className="flex flex-col gap-4 h-full max-w-6xl mx-auto p-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Reservations</h2>
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by guest name or reservation no."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton
                rows={10}
                columns={6}
                widths={[
                  "w-[100px]",
                  "w-[120px]",
                  "w-[120px]",
                  "w-[120px]",
                  "w-[120px]",
                  "w-[100px]",
                ]}
              />
            ) : (
              filteredReservations.map((reservation: IReservation) => (
                <TableRow
                  key={reservation._id}
                  onClick={() => handleRowClick(reservation)}
                  className="cursor-pointer"
                >
                  <TableCell>{reservation.guest.refId}</TableCell>
                  <TableCell>
                    {reservation.guest.name.length
                      ? reservation.guest.name.slice(0, 15) + "..."
                      : reservation.guest.name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(reservation.stay.arrival), "PPP")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(reservation.stay.departure), "PPP")}
                  </TableCell>
                  <TableCell>{reservation.guest.otas}</TableCell>
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePrintClick(reservation)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedGuest && (
        <GuestDetailsDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedGuest={selectedGuest}
        />
      )}

      <NewReservationDialog
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
              <DialogTitle>Reservation Invoice</DialogTitle>
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
