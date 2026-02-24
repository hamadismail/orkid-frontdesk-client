"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Search, Phone, Mail } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { IBook } from "@/src/types/book.interface";

type PreviousGuestSearchProps = {
  value: string;
  onValueChange: (value: string) => void;
  onGuestSelect: (guest: IBook) => void;
  selectedGuest?: IBook | null;
  onSelectedGuestChange?: (guest: IBook | null) => void;
  label?: string;
  placeholder?: string;
};

export function PreviousGuestSearch({
  value,
  onValueChange,
  onGuestSelect,
  selectedGuest,
  onSelectedGuestChange,
  label = "Find Previous Guest",
  placeholder = "Search by name, phone, or email...",
}: PreviousGuestSearchProps) {
  const [guestSearch, setGuestSearch] = useState("");
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGuestSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const { data: guestSuggestions = [], isLoading: isLoadingGuests } = useQuery<
    IBook[]
  >({
    queryKey: ["guest-search", guestSearch],
    queryFn: async () => {
      if (!guestSearch || guestSearch.length < 2) return [];
      const response = await axios.get(`/guests?search=${guestSearch}`);
      return response.data.data?.guests || [];
    },
    enabled: guestSearch.length >= 2,
  });

  const handleGuestSelect = (guest: IBook) => {
    onSelectedGuestChange?.(guest);
    onValueChange(guest.guest.name);
    onGuestSelect(guest);
    setShowGuestDropdown(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setShowGuestDropdown(value.length >= 2)}
          onChange={(e) => {
            const nextValue = e.target.value;
            onValueChange(nextValue);
            setShowGuestDropdown(nextValue.length >= 2);
            if (selectedGuest && nextValue !== selectedGuest.guest.name) {
              onSelectedGuestChange?.(null);
            }
          }}
          placeholder={placeholder}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />

        {showGuestDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg dark:bg-gray-900">
            {isLoadingGuests ? (
              <div className="p-4 text-center">
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              </div>
            ) : guestSuggestions.length > 0 ? (
              <div className="py-1">
                <div className="border-b bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Previous guests ({guestSuggestions.length})
                </div>
                {guestSuggestions.map((guest) => (
                  <button
                    key={guest._id}
                    onClick={() => handleGuestSelect(guest)}
                    className="w-full border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
                  >
                    <div className="font-medium">{guest.guest.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {guest.guest.phone}
                      {guest.guest.email && (
                        <>
                          <span>•</span>
                          <Mail className="h-3 w-3" />
                          {guest.guest.email}
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              value.length >= 2 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No previous guests found
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
