export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-hover ${className}`} />;
}

export function PortfolioSkeleton() {
  return (
    <div>
      {/* Filter bar placeholder */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <SkeletonBlock key={i} className="w-14 h-8" />
          ))}
        </div>
        <div className="flex gap-1.5">
          <SkeletonBlock className="w-8 h-8" />
          <SkeletonBlock className="w-8 h-8" />
          <SkeletonBlock className="w-20 h-8" />
        </div>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <SkeletonBlock key={i} className="h-20" />
            ))}
          </div>
          <SkeletonBlock className="h-56" />
        </div>
      </div>
    </div>
  );
}

export function StockDetailSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBlock className="w-8 h-8" />
        <div>
          <SkeletonBlock className="w-28 h-6 mb-1" />
          <SkeletonBlock className="w-16 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-32" />
        </div>
        <div className="flex flex-col gap-3">
          <SkeletonBlock className="w-24 h-5 mb-2" />
          {[1, 2, 3].map(i => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBlock className="w-8 h-8" />
        <SkeletonBlock className="w-28 h-6" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} className="w-20 h-8" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
