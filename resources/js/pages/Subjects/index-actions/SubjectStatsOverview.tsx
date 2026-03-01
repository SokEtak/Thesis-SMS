import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, Info, Search, Sigma } from 'lucide-react';

interface SubjectStatsOverviewProps {
  totalSubjects: number;
  uniqueCodesOnPage: number;
  filteredRowsCount: number;
  hasActiveFilter: boolean;
  searchValue: string;
}

export default function SubjectStatsOverview({
  totalSubjects,
  uniqueCodesOnPage,
  filteredRowsCount,
  hasActiveFilter,
  searchValue,
}: SubjectStatsOverviewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-0 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Total Subjects</p>
              <p className="mt-1 text-2xl font-semibold">{totalSubjects}</p>
            </div>
            <span className="rounded-full border border-sky-200 bg-white p-2 text-sky-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              <Info className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Codes On Page</p>
              <p className="mt-1 text-2xl font-semibold">{uniqueCodesOnPage}</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-white p-2 text-emerald-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              <Sigma className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Matched Rows</p>
              <p className="mt-1 text-2xl font-semibold">{filteredRowsCount}</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white p-2 text-amber-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              <ArrowUpDown className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Filter Mode</p>
              <p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? 'Active' : 'Idle'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{searchValue.trim() || 'No keyword'}</p>
            </div>
            <span className="rounded-full border border-violet-200 bg-white p-2 text-violet-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              <Search className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
