export function ScrollFeedSkeleton() {
  return (
    <div className="mb-4 bg-white dark:bg-navy-950 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-navy-800 animate-pulse">
      <div className="w-full bg-slate-200 dark:bg-navy-800" style={{ paddingTop: '56.25%' }} />
      <div className="px-4 pt-3 pb-4">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-12 bg-slate-200 dark:bg-navy-800 rounded-md" />
          <div className="h-5 w-24 bg-slate-200 dark:bg-navy-800 rounded-md" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-navy-800 rounded-xl w-4/5 mb-3" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-3/4" />
        </div>
        <div className="h-10 bg-slate-200 dark:bg-navy-800 rounded-2xl w-full" />
      </div>
    </div>
  );
}
