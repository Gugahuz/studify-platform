import { Skeleton } from "@/components/ui/skeleton"

export default function AssinaturaLoading() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      <Skeleton className="h-32 w-full mb-8" />

      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
