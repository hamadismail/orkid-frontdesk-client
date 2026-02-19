"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/src/components/ui/button";
import { GuestInvoice } from "@/src/shared/GuestInvoice";
import { IBook } from "@/src/types/book.interface";
import { Printer } from "lucide-react";

interface PrintInvoiceButtonProps {
  guest: IBook;
}

export function PrintInvoiceButton({ guest }: PrintInvoiceButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
  });

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
      </Button>
      <div style={{ display: "none" }}>
        <GuestInvoice ref={contentRef} guest={guest} />
      </div>
    </>
  );
}
