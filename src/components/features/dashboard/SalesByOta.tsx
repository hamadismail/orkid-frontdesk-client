import { formatCurrency } from "@/src/utils/currency-formatter";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { SalesByMethod } from "./Dashboard";

export const SalesByOtaTable = ({
  salesByOta,
  isLoading,
}: {
  salesByOta?: Record<string, SalesByMethod>;
  isLoading: boolean;
}) => {
  const sortedData = Object.entries(salesByOta || {}).sort(
    ([, a], [, b]) => b.total - a.total,
  );

  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-semibold text-foreground/80">
            OTA / Source
          </TableHead>
          <TableHead className="font-semibold text-foreground/80">
            Transactions
          </TableHead>
          <TableHead className="text-right font-semibold text-foreground/80">
            Total Revenue
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28 ml-auto" />
              </TableCell>
            </TableRow>
          ))
        ) : sortedData.length > 0 ? (
          sortedData.map(([ota, stats]) => (
            <TableRow key={ota} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium text-foreground">
                {ota}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="px-2 py-1 bg-primary/5 rounded text-sm font-medium text-primary">
                  {stats.count.toLocaleString()}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold text-foreground">
                RM {formatCurrency(stats.total)}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground py-8"
            >
              No data available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
