"use client";
import { Skeleton } from "../components/ui/skeleton";
import { TableCell, TableRow } from "../components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns: number;
  widths?: string[]; // optional individual widths for each column
}

export default function TableSkeleton({
  rows = 5,
  columns,
  widths = [],
}: TableSkeletonProps) {
  return (
    <>
      {Array(rows)
        .fill(0)
        .map((_, i) => (
          <TableRow key={i}>
            {Array(columns)
              .fill(0)
              .map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    className={`h-4 ${widths[colIndex] ?? "w-[100px]"}`}
                  />
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  );
}
