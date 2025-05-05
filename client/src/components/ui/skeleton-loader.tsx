import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SkeletonProps {
  type?: "chart" | "list" | "form" | "card";
  title?: string;
  description?: string;
  itemCount?: number;
  height?: string;
}

export function SkeletonLoader({
  type = "chart",
  title = "Loading...",
  description = "Please wait while we fetch the data",
  itemCount = 3,
  height = "h-64",
}: SkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {type === "chart" && (
          <div className={`${height} relative w-full`}>
            <div className="skeleton w-full h-full rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {type === "list" && (
          <div className="space-y-3">
            {Array.from({ length: itemCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {type === "form" && (
          <div className="space-y-4">
            <div>
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-10 w-full rounded-md" />
            </div>
            <div>
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-10 w-full rounded-md" />
            </div>
            <div>
              <div className="skeleton h-4 w-28 mb-2" />
              <div className="skeleton h-24 w-full rounded-md" />
            </div>
            <div className="flex justify-end">
              <div className="skeleton h-10 w-28 rounded-md" />
            </div>
          </div>
        )}

        {type === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: itemCount }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
                <div className="skeleton h-3 w-2/3" />
                <div className="flex justify-between items-center mt-4">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="skeleton h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InlineSkeletonLoader({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded-md inline-block`} />;
}