import { Hotel } from "lucide-react";
import React from "react";

export default function LoadingSpiner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        {/* Animated spinner */}
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

        {/* Hotel icon that rotates opposite direction */}
        <Hotel className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin-reverse" />
      </div>

      <p className="text-lg font-medium text-muted-foreground">
        Loading rooms...
      </p>

      {/* Optional progress dots */}
      <div className="flex gap-1 mt-2">
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
