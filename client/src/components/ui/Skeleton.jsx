const shimmer = 'animate-pulse bg-surface-border/60 rounded-lg'

export function SkeletonLine({ className = '' }) {
  return <div className={`${shimmer} h-3 ${className}`} />
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`${shimmer} ${className}`} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <SkeletonBlock className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5 space-y-4">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-40" />
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 flex-1 rounded-xl" />
          <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
      <SkeletonBlock className="h-5 w-32" />
      <div className="space-y-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 4, header = true }) {
  return (
    <div className="space-y-6">
      {header && (
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-6 w-36" />
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    </div>
  )
}

export function PropertyGridSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-6 w-40" />
      <SkeletonBlock className="h-11 w-full rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <SkeletonBlock className="h-6 w-48" />
      </div>
      <div className="glass-card p-5 space-y-4">
        <SkeletonBlock className="h-40 w-full rounded-xl" />
        <SkeletonBlock className="h-5 w-2/3" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
      </div>
      <div className="glass-card p-5 space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <SkeletonBlock className="h-16 w-3/4 rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <SkeletonBlock className="h-10 w-1/2 rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <SkeletonBlock className="h-12 w-2/3 rounded-2xl rounded-bl-md" />
      </div>
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-6 w-28" />
      <div className="glass-card p-5 space-y-4">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-10 w-44" />
        <div className="flex gap-3">
          <SkeletonBlock className="h-12 flex-1 rounded-xl" />
          <SkeletonBlock className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
      <SkeletonBlock className="h-5 w-40" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-3 flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <SkeletonBlock key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <SkeletonBlock className="h-4 w-16" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-3 flex items-center gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
            <SkeletonBlock className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
