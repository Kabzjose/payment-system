interface SkeletonProps {
  className?: string;
}

function Bone({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function LoadingSkeleton({ variant }: { variant: "table" | "cards" | "detail" }) {
  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5 border border-[#1E2330] bg-[#111318]">
            <Bone className="h-3 w-24 mb-4" />
            <Bone className="h-7 w-32 mb-2" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Bone className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-48" />
              <Bone className="h-3 w-32" />
            </div>
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // detail
  return (
    <div className="space-y-4 p-5">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-8 w-32" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="h-6 w-20 rounded-full" />
      </div>
      <Bone className="h-px w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
