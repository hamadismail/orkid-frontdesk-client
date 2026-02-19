import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
}

export const StatCard = ({ title, value, icon, description }: StatCardProps) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
)

export const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-32" />
    </CardContent>
  </Card>
)
